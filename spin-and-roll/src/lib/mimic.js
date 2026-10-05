// Mimics: disguised tokens that spring a jump scare, then fight with their own tricks.
import { collection, doc, getDoc, getDocs, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logEvent } from './game';
import { rollD20, rollDice } from './dice';
import { startFight } from './combat';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// ---------- Placing ----------
export function trunkToken(data, loc) {
  const m = data.mimics['hungry-trunk'];
  const c = data.chests[m.looksLike];
  // Looks exactly like an ordinary locked chest to the players.
  return { kind: 'chest', chest: m.looksLike, loc, name: c.name, icon: c.icon, dc: c.dc, stat: c.stat, trap: 0,
    contents: { gold: 0, items: [] }, opened: false, tried: [], mimic: 'hungry-trunk' };
}
export function doubleToken(data, loc, personId) {
  const b = data.bestiary[personId];
  return { kind: personId, name: b.name, icon: b.icon, npc: true, loc, mimic: 'painted-double' };
}

// ---------- The reveal ----------
export async function springMimic(sid, data, tokenId, byUid = null) {
  let mimicId = null;
  let victim = null;
  await runTransaction(db, async (tx) => {
    const sess = (await tx.get(sessionRef(sid))).data();
    const t = sess?.state?.tokens?.[tokenId];
    if (!t?.mimic || t.revealed) return;
    const m = data.mimics[t.mimic];
    mimicId = t.mimic;
    victim = byUid;
    tx.update(sessionRef(sid), {
      [`state.tokens.${tokenId}`]: {
        kind: `mimic-${t.mimic}`, mimic: t.mimic, revealed: true, loc: t.loc, x: t.x, y: t.y,
        name: m.name, icon: m.icon, npc: false, hp: m.hp, maxHp: m.hp, defence: m.defence,
        belly: [], scale: 1, hoard: rand(m.hoard[0], m.hoard[1]), disguise: t.name,
      },
      'state.scare': { id: `${tokenId}-${Date.now()}`, at: Date.now(), name: m.name, icon: m.icon },
    });
  });
  if (!mimicId) return;
  await logEvent(sid, { type: 'mimic', targetUid: victim, payload: { name: data.mimics[mimicId].name, icon: data.mimics[mimicId].icon } });
  // Start the fight at once, with the mimic striking first (a Sinclair can't be surprised).
  const sess = (await getDoc(sessionRef(sid))).data();
  const snap = await getDocs(collection(db, 'sessions', sid, 'characters'));
  const chars = Object.fromEntries(snap.docs.map((d) => [d.id, { uid: d.id, ...d.data() }]));
  if (!sess.state?.encounter) {
    const session = { id: sid, ...sess };
    const t = sess.state.tokens[tokenId];
    await updateDoc(sessionRef(sid), { 'state.map.loc': t.loc });
    session.state.map = { ...(session.state.map ?? {}), loc: t.loc };
    await startFight(sid, data, session, chars, { surprise: tokenId });
  }
}

// ---------- The Hungry Trunk swallows ----------
// Called by monsterAttack after a hit. Returns a description for the event, or null.
export async function trunkSwallow(sid, data, tokenId, targetUid) {
  let out = null;
  await runTransaction(db, async (tx) => {
    const sess = (await tx.get(sessionRef(sid))).data();
    const cSnap = await tx.get(charRef(sid, targetUid));
    const t = sess?.state?.tokens?.[tokenId];
    const c = cSnap.data();
    if (!t || !c) return;
    const edible = (c.inventory ?? []).filter((i) => !(data.unswallowable ?? []).includes(i.id));
    if (!edible.length) return;
    const pick = edible[Math.floor(Math.random() * edible.length)];
    const inv = c.inventory.map((i) => ({ ...i })).map((i) => (i.id === pick.id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0);
    const heal = pick.effect?.hp ?? 0;
    const maxHp = t.maxHp + 5;
    const hp = Math.min(maxHp, t.hp + 5 + heal);
    const { qty: _q, ...item } = pick;
    tx.update(cSnap.ref, { inventory: inv });
    tx.update(sessionRef(sid), {
      [`state.tokens.${tokenId}.belly`]: [...(t.belly ?? []), item],
      [`state.tokens.${tokenId}.maxHp`]: maxHp,
      [`state.tokens.${tokenId}.hp`]: hp,
      [`state.tokens.${tokenId}.scale`]: Math.min(2.4, (t.scale ?? 1) + 0.2),
    });
    out = { item: pick.name, itemIcon: pick.icon, heal, count: (t.belly ?? []).length + 1 };
  });
  return out;
}

// Extra bite for a well-fed trunk.
export const trunkBonus = (t) => ((t.belly ?? []).length >= 3 ? rollDice({ count: 1, die: 6 }).total : 0);

// ---------- The Painted Double mirrors ----------
export function mirrorAttack(t, targetDefence) {
  const d20 = rollD20();
  const total = d20.nat + 4;
  const hit = d20.nat === 20 || (d20.nat !== 1 && total >= targetDefence);
  return { nat: d20.nat, total, hit, dmg: hit ? t.lastSpell.dmg : 0 };
}

// When a mimic is beaten it spits out what it swallowed, plus its hoard.
export function mimicRemains(data, t) {
  const out = {};
  (t.belly ?? []).forEach((it, i) => {
    out[`spat-${i}-${Date.now().toString(36)}`] = {
      kind: 'item', item: it.id, loc: t.loc, name: it.name, icon: it.icon,
      x: Math.max(5, Math.min(95, t.x + (i % 3 - 1) * 9)), y: Math.max(5, Math.min(90, t.y + 8 + Math.floor(i / 3) * 8)),
    };
  });
  if (t.hoard) {
    out[`hoard-${Date.now().toString(36)}`] = {
      kind: 'chest', chest: 'small-chest', loc: t.loc, name: `${data.mimics[t.mimic].name}’s hoard`, icon: '💰',
      dc: 1, stat: 'dex', trap: 0, contents: { gold: t.hoard, items: [] }, opened: false, tried: [], x: t.x, y: t.y,
    };
  }
  return out;
}
