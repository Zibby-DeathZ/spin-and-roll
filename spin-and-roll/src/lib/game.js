import {
  addDoc, collection, doc, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

// ---------- Rules of the game ----------

export const STATS = [
  ['str', 'Strength'], ['dex', 'Dexterity'], ['con', 'Constitution'],
  ['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma'],
];
export const XP_LEVELS = [0, 100, 250, 450, 700]; // levels 1–5
export const levelFor = (xp = 0) => XP_LEVELS.filter((t) => xp >= t).length;
export const nextLevelAt = (xp = 0) => XP_LEVELS.find((t) => t > xp) ?? null;
export const mod = (score) => Math.floor((score - 10) / 2);
export const fmtMod = (m) => (m >= 0 ? `+${m}` : `${m}`);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);
const col = (sid, name) => collection(db, 'sessions', sid, name);

// ---------- Live data ----------

export function useCharacters(sid) {
  const [chars, setChars] = useState(null);
  useEffect(() => onSnapshot(col(sid, 'characters'), (snap) =>
    setChars(Object.fromEntries(snap.docs.map((d) => [d.id, { uid: d.id, ...d.data() }])))), [sid]);
  return chars;
}

export function useTrades(sid) {
  const [trades, setTrades] = useState([]);
  useEffect(() => onSnapshot(col(sid, 'trades'), (snap) =>
    setTrades(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)))), [sid]);
  return trades;
}

export function useEvents(sid, max = 15) {
  const [events, setEvents] = useState([]);
  useEffect(() => onSnapshot(
    query(col(sid, 'events'), orderBy('createdAt', 'desc'), limit(max)),
    (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  ), [sid, max]);
  return events;
}

export const logEvent = (sid, event) =>
  addDoc(col(sid, 'events'), { processed: true, payload: {}, ...event, createdAt: serverTimestamp() });

// ---------- Inventory helpers ----------

function addItems(inv = [], item, qty) {
  const next = inv.map((i) => ({ ...i }));
  const found = next.find((i) => i.id === item.id);
  if (found) found.qty += qty;
  else next.push({ ...item, qty });
  return next;
}

function takeItems(inv = [], id, qty) {
  const next = inv.map((i) => ({ ...i }));
  const found = next.find((i) => i.id === id);
  if (!found || found.qty < qty) throw new Error('Item no longer in bag');
  found.qty -= qty;
  const { qty: _q, ...item } = found;
  return [next.filter((i) => i.qty > 0), item];
}

function moveItems(fromInv, toInv, list = []) {
  let from = fromInv, to = toInv;
  for (const { id, qty } of list) {
    let item;
    [from, item] = takeItems(from, id, qty);
    to = addItems(to, item, qty);
  }
  return [from, to];
}

// ---------- DM actions ----------

export const createCharacter = (sid, uid, data, name) =>
  setDoc(charRef(sid, uid), { ...structuredClone(data.defaults), name, inventory: [], createdAt: serverTimestamp() });

export const setField = (sid, uid, field, value) => updateDoc(charRef(sid, uid), { [field]: value });

// Changes hp / mana / xp / gold safely, and tells the TV about it.
export async function adjust(sid, uid, field, delta) {
  let before, after;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    const c = snap.data();
    before = c[field] ?? 0;
    const max = field === 'hp' ? c.maxHp : field === 'mana' ? c.maxMana : Infinity;
    after = clamp(before + delta, 0, max);
    tx.update(charRef(sid, uid), { [field]: after });
  });
  if (after === before) return;
  await logEvent(sid, { type: field, targetUid: uid, payload: { delta: after - before, value: after } });
  if (field === 'xp' && levelFor(after) > levelFor(before)) {
    await logEvent(sid, { type: 'level_up', targetUid: uid, payload: { level: levelFor(after) } });
  }
}

export const setStat = (sid, uid, key, value) =>
  updateDoc(charRef(sid, uid), { [`stats.${key}`]: clamp(value, 1, 20) });

export async function giveItem(sid, uid, item, qty = 1) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    tx.update(charRef(sid, uid), { inventory: addItems(snap.data().inventory, item, qty) });
  });
  await logEvent(sid, { type: 'item_given', targetUid: uid, payload: { name: item.name, icon: item.icon, qty } });
}

// ---------- Player actions ----------

// The GM screen applies the effect, so players can't edit their own HP.
export const consumeItem = (sid, uid, itemId) =>
  logEvent(sid, { type: 'item_used', actorUid: uid, processed: false, payload: { itemId } });

export async function offerTrade(sid, fromUid, toUid, offer, request) {
  await addDoc(col(sid, 'trades'), {
    fromUid, toUid, offer, request, status: 'pending', createdAt: serverTimestamp(),
  });
  const gift = !request.items.length && !request.gold;
  await logEvent(sid, { type: gift ? 'gift_offered' : 'trade_offered', actorUid: fromUid, targetUid: toUid });
}

export async function respondTrade(sid, trade, accept) {
  await updateDoc(doc(db, 'sessions', sid, 'trades', trade.id), {
    status: accept ? 'accepted' : 'declined', respondedAt: serverTimestamp(),
  });
  if (!accept) await logEvent(sid, { type: 'trade_declined', actorUid: trade.toUid, targetUid: trade.fromUid });
}

export const cancelTrade = (sid, trade) =>
  updateDoc(doc(db, 'sessions', sid, 'trades', trade.id), { status: 'cancelled', respondedAt: serverTimestamp() });

// ---------- GM screen engine ----------
// While the GM screen is open it carries out accepted trades and item uses.

async function executeTrade(sid, tid) {
  const tRef = doc(db, 'sessions', sid, 'trades', tid);
  let outcome = null;
  let t;
  await runTransaction(db, async (tx) => {
    const tSnap = await tx.get(tRef);
    if (!tSnap.exists() || tSnap.data().status !== 'accepted') return;
    t = tSnap.data();
    const aSnap = await tx.get(charRef(sid, t.fromUid));
    const bSnap = await tx.get(charRef(sid, t.toUid));
    try {
      if (!aSnap.exists() || !bSnap.exists()) throw new Error('Character missing');
      const A = aSnap.data(), B = bSnap.data();
      const give = t.offer.gold || 0, get = t.request.gold || 0;
      if (A.gold < give || B.gold < get) throw new Error('Not enough gold');
      let aInv, bInv;
      [aInv, bInv] = moveItems(A.inventory, B.inventory, t.offer.items);
      [bInv, aInv] = moveItems(bInv, aInv, t.request.items);
      tx.update(aSnap.ref, { inventory: aInv, gold: A.gold - give + get });
      tx.update(bSnap.ref, { inventory: bInv, gold: B.gold - get + give });
      tx.update(tRef, { status: 'done', doneAt: serverTimestamp() });
      outcome = 'trade_done';
    } catch (e) {
      tx.update(tRef, { status: 'failed', reason: e.message });
      outcome = 'trade_failed';
    }
  });
  if (outcome) await logEvent(sid, { type: outcome, actorUid: t.fromUid, targetUid: t.toUid });
}

async function applyItemUse(sid, eid) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  await runTransaction(db, async (tx) => {
    const eSnap = await tx.get(eRef);
    const e = eSnap.data();
    if (!e || e.processed) return;
    const cSnap = await tx.get(charRef(sid, e.actorUid));
    const c = cSnap.data();
    const item = c?.inventory?.find((i) => i.id === e.payload.itemId);
    if (!item) {
      tx.update(eRef, { processed: true, failed: true });
      return;
    }
    const [inv] = takeItems(c.inventory, item.id, 1);
    const fx = item.effect ?? {};
    tx.update(cSnap.ref, {
      inventory: inv,
      hp: clamp(c.hp + (fx.hp ?? 0), 0, c.maxHp),
      mana: clamp(c.mana + (fx.mana ?? 0), 0, c.maxMana),
    });
    tx.update(eRef, {
      processed: true,
      payload: { ...e.payload, name: item.name, icon: item.icon, effect: fx, note: item.note ?? null },
    });
  });
}

export function useGameEngine(sid) {
  useEffect(() => {
    const busy = new Set();
    const run = (id, fn) => {
      if (busy.has(id)) return;
      busy.add(id);
      fn().catch(console.error).finally(() => busy.delete(id));
    };
    const stopTrades = onSnapshot(query(col(sid, 'trades'), where('status', '==', 'accepted')),
      (snap) => snap.docs.forEach((d) => run(d.id, () => executeTrade(sid, d.id))));
    const stopEvents = onSnapshot(query(col(sid, 'events'), where('processed', '==', false)),
      (snap) => snap.docs.forEach((d) => run(d.id, () => applyItemUse(sid, d.id))));
    return () => { stopTrades(); stopEvents(); };
  }, [sid]);
}

// ---------- Describing events for the TV and GM feed ----------

export function describe(e, nameOf) {
  const actor = nameOf(e.actorUid), target = nameOf(e.targetUid);
  const d = e.payload?.delta ?? 0;
  switch (e.type) {
    case 'hp': return d < 0
      ? { icon: '💥', text: `${target} took ${-d} damage`, tone: 'ember' }
      : { icon: '❤️', text: `${target} healed ${d} HP`, tone: 'teal' };
    case 'mana': return { icon: '🔮', text: `${target} ${d < 0 ? 'used' : 'regained'} ${Math.abs(d)} mana`, tone: 'violet' };
    case 'xp': return { icon: '⭐', text: `${target} earned ${d} XP`, tone: 'gold' };
    case 'gold': return { icon: '🪙', text: `${target} ${d < 0 ? 'spent' : 'got'} ${Math.abs(d)} gold`, tone: 'gold' };
    case 'level_up': return { icon: '🎉', text: `${target} reached level ${e.payload.level}!`, tone: 'gold', big: true };
    case 'item_given': return { icon: e.payload.icon, text: `${target} received ${e.payload.name}${e.payload.qty > 1 ? ` ×${e.payload.qty}` : ''}`, tone: 'teal' };
    case 'item_used': return e.failed ? null
      : { icon: e.payload.icon, text: `${actor} used ${e.payload.name}${e.payload.note ? ` (${e.payload.note})` : ''}`, tone: 'violet' };
    case 'trade_offered': return { icon: '🤝', text: `${actor} offered ${target} a trade`, tone: 'muted' };
    case 'gift_offered': return { icon: '🎁', text: `${actor} is sending ${target} a gift`, tone: 'muted' };
    case 'trade_done': return { icon: '🤝', text: `${actor} and ${target} traded`, tone: 'teal' };
    case 'trade_declined': return { icon: '✋', text: `${actor} turned down ${target}'s trade`, tone: 'ember' };
    case 'trade_failed': return { icon: '⚠️', text: `Trade between ${actor} and ${target} fell through`, tone: 'ember' };
    default: return null;
  }
}
