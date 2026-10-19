// Status effects (Bleed, Stunned, Silenced…) and Corruption, stored live in the game.
//   monsters:   state.tokens.{id}.status = { bleed: { turns: 3 } }
//   characters: sessions/{sid}/characters/{uid}.status, and .corruption (0–10, carries into the next year)
import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { rollD20, rollDice } from './dice';
import { addStatus, corruptionAfter, removeStatuses, tickStatus } from './spellbook';
import { defenceOf, logEvent, mod, statOf } from './game';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);
const rollTotal = (dd) => rollDice(dd).total;

// who: { kind: 'mon', id } or { kind: 'pc', id: uid }
export async function giveStatus(sid, data, who, key, turns) {
  const defs = data.statusEffects ?? {};
  if (who.kind === 'mon') {
    const t = (await getDoc(sessionRef(sid))).data()?.state?.tokens?.[who.id];
    if (!t) return;
    await updateDoc(sessionRef(sid), { [`state.tokens.${who.id}.status`]: addStatus(t.status, key, turns, defs) });
  } else {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(charRef(sid, who.id));
      if (snap.exists()) tx.update(snap.ref, { status: addStatus(snap.data().status, key, turns, defs) });
    });
  }
}

export async function clearStatus(sid, who, key) {
  if (who.kind === 'mon') {
    const t = (await getDoc(sessionRef(sid))).data()?.state?.tokens?.[who.id];
    if (t) await updateDoc(sessionRef(sid), { [`state.tokens.${who.id}.status`]: removeStatuses(t.status, [key]) });
  } else {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(charRef(sid, who.id));
      if (snap.exists()) tx.update(snap.ref, { status: removeStatuses(snap.data().status, [key]) });
    });
  }
}

// Called by nextTurn when someone's turn begins: damage over time, lost turns, effects wearing off.
export async function tickTurn(sid, data, who, name) {
  const defs = data.statusEffects ?? {};
  let out = null;
  if (who.kind === 'mon') {
    const t = (await getDoc(sessionRef(sid))).data()?.state?.tokens?.[who.id];
    if (!t?.status || !Object.keys(t.status).length) return null;
    out = tickStatus(t.status, defs, rollTotal);
    const hp = Math.max(0, t.hp - out.damage);
    await updateDoc(sessionRef(sid), { [`state.tokens.${who.id}.status`]: out.next, [`state.tokens.${who.id}.hp`]: hp });
    out.ko = out.damage > 0 && hp === 0;
  } else {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(charRef(sid, who.id));
      const c = snap.data();
      if (!c?.status || !Object.keys(c.status).length) return;
      out = tickStatus(c.status, defs, rollTotal);
      const hp = Math.max(0, c.hp - out.damage);
      tx.update(snap.ref, { status: out.next, hp });
      out.ko = out.damage > 0 && hp === 0;
    });
  }
  if (out && (out.damage || out.skip || out.expired.length)) {
    await logEvent(sid, { type: 'status_tick', payload: { name, damage: out.damage, skip: out.skip, expired: out.expired, ko: out.ko } });
  }
  return out;
}

// ---------- Corruption ----------

export async function adjustCorruption(sid, data, uid, delta) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    if (!snap.exists()) return;
    tx.update(snap.ref, { corruption: corruptionAfter(snap.data().corruption ?? 0, delta, data.corruption) });
  });
}

// ---------- Villain spells (cast by the GM from a monster's panel) ----------

export async function villainCast(sid, data, tokenId, spellId, targetUid) {
  const sp = data.villainSpells?.[spellId];
  if (!sp || sp.bossOnly) return;
  const sess = (await getDoc(sessionRef(sid))).data();
  const token = sess?.state?.tokens?.[tokenId];
  const c = (await getDoc(charRef(sid, targetUid))).data();
  if (!token || !c) return;
  const b = token.mimic ? data.mimics?.[token.mimic] : data.bestiary[token.kind];
  const defence = defenceOf(c);
  const d20 = rollD20(token.status?.fear ? 'dis' : 'normal');
  const total = d20.nat + (b?.atk ?? 0);
  const hit = d20.nat === 20 || (d20.nat !== 1 && total >= defence);
  const payload = { name: token.name, icon: sp.icon, spell: sp.name, nat: d20.nat, total, defence, hit };
  if (hit && spellId === 'imperio') {
    // The target fights it off with d20 + WIS against the curse's DC.
    const dc = 15;
    const r = rollD20().nat;
    const resist = r + mod(statOf(c, 'wis'));
    Object.assign(payload, { resist, dc, resisted: resist >= dc });
    if (!payload.resisted) await giveStatus(sid, data, { kind: 'pc', id: targetUid }, 'imperio', 1);
  } else if (hit) {
    for (const a of sp.applies ?? []) {
      await giveStatus(sid, data, { kind: 'pc', id: targetUid }, a.status, a.held ? null : a.turns);
    }
  }
  await logEvent(sid, { type: 'villain_spell', targetUid, payload });
}
