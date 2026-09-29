// Map, tokens, fights and attacks.
import { arrayUnion, deleteField, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { adjust, bonuses, defenceOf, logEvent, mod, startSpin, statOf } from './game';
import { rollD20, rollDice } from './dice';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);

// Always available, even without spells.
export const STRIKE = {
  id: 'strike', name: 'Improvised attack', icon: '👊', mana: 0, hit: 'str', attack: true,
  dice: { count: 1, die: 4 }, damage: true, basic: true, desc: 'Punch, kick or throw something. No wand needed.',
};

// Spell stats come from the campaign file, so balance changes reach existing characters.
export const spellDef = (data, sp) => (sp ? { ...sp, ...(data.spells?.[sp.id] ?? {}), id: sp.id } : null);

// ---------- Map ----------

export async function travel(sid, data, locId) {
  const loc = data.locations.find((l) => l.id === locId);
  await updateDoc(sessionRef(sid), { 'state.map.loc': locId, 'state.map.discovered': arrayUnion(locId) });
  await logEvent(sid, { type: 'travel', payload: { name: loc.name, icon: loc.icon } });
}

export async function addToken(sid, data, kind, loc, existing = {}) {
  const b = data.bestiary[kind];
  const same = Object.values(existing).filter((t) => t.kind === kind && t.loc === loc).length;
  const id = `${kind}-${Date.now().toString(36)}`;
  const token = {
    kind, loc, icon: b.icon,
    name: same ? `${b.name} ${same + 1}` : b.name,
    x: 25 + Math.random() * 50, y: 30 + Math.random() * 35,
    npc: !!b.npc,
    ...(b.npc ? {} : { hp: b.hp, maxHp: b.hp, defence: b.defence, boss: !!b.boss }),
  };
  await updateDoc(sessionRef(sid), { [`state.tokens.${id}`]: token });
  return id;
}
export const moveToken = (sid, id, x, y) => {
  const base = id.startsWith('pc:') ? `state.pcPos.${id.slice(3)}` : `state.tokens.${id}`;
  return updateDoc(sessionRef(sid), { [`${base}.x`]: x, [`${base}.y`]: y });
};

// Places a prepared token (chest or item) built by world.js.
export async function placeToken(sid, token) {
  const id = `${token.kind}-${Date.now().toString(36)}`;
  await updateDoc(sessionRef(sid), { [`state.tokens.${id}`]: { x: 30 + Math.random() * 40, y: 30 + Math.random() * 30, ...token } });
  return id;
}
export const removeToken = (sid, id) => updateDoc(sessionRef(sid), { [`state.tokens.${id}`]: deleteField() });
export const setTokenHp = (sid, id, hp) => updateDoc(sessionRef(sid), { [`state.tokens.${id}.hp`]: hp });

// ---------- Fights ----------

export async function startFight(sid, data, session, chars) {
  const loc = session.state?.map?.loc;
  const tokens = session.state?.tokens ?? {};
  const mons = Object.entries(tokens).filter(([, t]) => t.loc === loc && t.hp > 0 && !t.npc && t.kind !== 'chest' && t.kind !== 'item');
  const pos = session.state?.pcPos ?? {};
  const anyPlaced = Object.keys(pos).length > 0;
  const present = (u) => (anyPlaced ? pos[u]?.loc === loc : true);
  const order = [
    ...session.playerUids.filter((u) => chars[u] && present(u)).map((u) => ({
      kind: 'pc', id: u, name: chars[u].firstName ?? chars[u].name,
      init: rollD20().nat + mod(statOf(chars[u], 'dex')),
    })),
    ...mons.map(([id, t]) => ({ kind: 'mon', id, name: t.name, init: rollD20().nat + (data.bestiary[t.kind]?.init ?? 0) })),
  ].sort((a, b) => b.init - a.init);
  await updateDoc(sessionRef(sid), {
    'state.encounter': { order, turn: 0, round: 1, loc, monsters: mons.map(([id]) => id) },
  });
  await logEvent(sid, { type: 'fight_start', payload: { order: order.map((o) => `${o.name} ${o.init}`) } });
}

export async function nextTurn(sid, session) {
  const enc = session.state.encounter;
  const tokens = session.state.tokens ?? {};
  const alive = (o) => o.kind === 'pc' || (tokens[o.id]?.hp ?? 0) > 0;
  let { turn, round } = enc;
  for (let i = 0; i < enc.order.length; i++) {
    turn++;
    if (turn >= enc.order.length) { turn = 0; round++; }
    if (alive(enc.order[turn])) break;
  }
  await updateDoc(sessionRef(sid), { 'state.encounter.turn': turn, 'state.encounter.round': round });
}

export async function endFight(sid, data, session) {
  const enc = session.state.encounter;
  const tokens = session.state.tokens ?? {};
  const beaten = enc.monsters.filter((id) => (tokens[id]?.hp ?? 0) <= 0);
  const xp = beaten.reduce((sum, id) => sum + (data.bestiary[tokens[id]?.kind]?.xp ?? 0), 0);
  const upd = { 'state.encounter': deleteField() };
  beaten.forEach((id) => { upd[`state.tokens.${id}`] = deleteField(); });
  await updateDoc(sessionRef(sid), upd);
  await logEvent(sid, { type: 'fight_end', payload: { xp, beaten: beaten.length } });
  if (xp) {
    for (const o of enc.order.filter((x) => x.kind === 'pc')) await adjust(sid, o.id, 'xp', xp);
  }
}

// GM rolls for a monster against a player's Defence.
export async function monsterAttack(sid, data, tokenId, targetUid) {
  let result = null;
  await runTransaction(db, async (tx) => {
    const sess = (await tx.get(sessionRef(sid))).data();
    const cSnap = await tx.get(charRef(sid, targetUid));
    const token = sess?.state?.tokens?.[tokenId];
    const c = cSnap.data();
    if (!token || !c) return;
    const b = data.bestiary[token.kind];
    const d20 = rollD20();
    const total = d20.nat + (b.atk ?? 0);
    const defence = defenceOf(c);
    const disarmed = !!token.disarmed;
    const hit = !disarmed && (d20.nat === 20 || (d20.nat !== 1 && total >= defence));
    const dmg = hit ? rollDice(b.dmg).total : 0;
    const hp = Math.max(0, c.hp - dmg);
    if (hit) tx.update(cSnap.ref, { hp });
    if (disarmed) tx.update(sessionRef(sid), { [`state.tokens.${tokenId}.disarmed`]: deleteField() });
    result = { name: token.name, icon: token.icon, nat: d20.nat, total, defence, hit, dmg, ko: hit && hp === 0, disarmed };
  });
  if (result) await logEvent(sid, { type: 'monster_attack', targetUid, payload: result });
}

// ---------- Player attacks (carried out by the GM screen) ----------

export async function applyAttack(sid, eid, data) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  let forbidden = false, actor = null;
  await runTransaction(db, async (tx) => {
    const e = (await tx.get(eRef)).data();
    if (!e || e.processed) return;
    const sess = (await tx.get(sessionRef(sid))).data();
    const aSnap = await tx.get(charRef(sid, e.actorUid));
    const p = e.payload;
    const tSnap = p.targetKind === 'pc' ? await tx.get(charRef(sid, p.targetId)) : null;
    const a = aSnap.data();
    const tgt = tSnap?.data();
    const token = p.targetKind === 'mon' ? sess?.state?.tokens?.[p.targetId] : null;
    const spell = p.spellId === 'strike' ? STRIKE : spellDef(data, a?.spells?.find((x) => x.id === p.spellId));
    if (!a || !spell || (!tgt && !token) || a.mana < (spell.mana ?? 0)) {
      tx.update(eRef, { processed: true, failed: true });
      return;
    }
    const defence = token ? token.defence : defenceOf(tgt);
    const hit = p.nat === 20 || (p.nat !== 1 && p.hitTotal >= defence);
    let dmg = 0;
    if (hit && spell.kill) dmg = token ? (token.boss ? 20 : token.hp) : tgt.hp;
    else if (hit && spell.damage) dmg = Math.max(0, Number(p.dmgTotal) || 0);
    let defeated = false;
    if (token) {
      const hp = Math.max(0, token.hp - dmg);
      defeated = hp === 0;
      const upd = { [`state.tokens.${p.targetId}.hp`]: hp };
      if (hit && spell.id === 'expelliarmus') upd[`state.tokens.${p.targetId}.disarmed`] = true;
      tx.update(sessionRef(sid), upd);
    } else if (dmg) {
      const hp = Math.max(0, tgt.hp - dmg);
      defeated = hp === 0;
      tx.update(tSnap.ref, { hp });
    }
    if (spell.mana) tx.update(aSnap.ref, { mana: a.mana - spell.mana });
    tx.update(eRef, {
      processed: true,
      payload: {
        ...p, name: spell.name, icon: spell.icon, targetName: token ? token.name : tgt.name,
        defence, hit, dmg, defeated, forbidden: !!spell.forbidden,
      },
    });
    forbidden = !!spell.forbidden;
    actor = e.actorUid;
  });
  if (forbidden) await startSpin(sid, data, 'unforgivable', actor);
}

// ---------- Player requests ----------

export const sendAttack = (sid, uid, payload) =>
  logEvent(sid, { type: 'attack', actorUid: uid, processed: false, payload });

export const sendRoll = (sid, uid, payload) =>
  logEvent(sid, { type: 'roll', actorUid: uid, payload });

// ---------- The forbidden curse ----------

export async function teachForbidden(sid, data, uid) {
  await runTransaction(db, async (tx) => {
    const sess = (await tx.get(sessionRef(sid))).data();
    const cSnap = await tx.get(charRef(sid, uid));
    if (sess?.state?.forbiddenLearner) return; // only ever one
    const spells = cSnap.data().spells ?? [];
    tx.update(cSnap.ref, { spells: [...spells, { id: 'avada-kedavra', ...data.spells['avada-kedavra'] }] });
    tx.update(sessionRef(sid), { 'state.forbiddenLearner': uid });
  });
}

export const setExpelled = (sid, uid, expelled) => updateDoc(charRef(sid, uid), { expelled });

export const damageBonus = (c, spell) => (spell.basic ? 0 : bonuses(c).spellPower);
