import {
  addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query,
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

// Bonuses from everything equipped (wand, robes, familiar, books…).
export function bonuses(c) {
  const t = { stats: {}, defence: 0, spellPower: 0 };
  for (const eq of Object.values(c?.equipment ?? {})) {
    const b = eq?.bonus ?? {};
    for (const [k, v] of Object.entries(b.stats ?? {})) t.stats[k] = (t.stats[k] ?? 0) + v;
    t.defence += b.defence ?? 0;
    t.spellPower += b.spellPower ?? 0;
  }
  return t;
}
export const statOf = (c, k) => (c.stats?.[k] ?? 10) + (bonuses(c).stats[k] ?? 0);
export const defenceOf = (c) => 10 + mod(statOf(c, 'dex')) + bonuses(c).defence;

export function bonusText(b = {}) {
  const parts = Object.entries(b.stats ?? {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`);
  if (b.defence) parts.push(`+${b.defence} Defence`);
  if (b.maxHp) parts.push(`+${b.maxHp} max HP`);
  if (b.maxMana) parts.push(`+${b.maxMana} max mana`);
  if (b.spellPower) parts.push(`+${b.spellPower} spell damage`);
  return parts.join(', ');
}

// Resolves a shop entry into something displayable/buyable.
export function shopEntry(data, id) {
  for (const shop of data.shops ?? []) {
    const e = shop.stock.find((x) => x.id === id);
    if (!e) continue;
    if (e.item) return { ...data.items[e.item], ...e, shop: shop.name };
    return { ...e, shop: shop.name };
  }
  return null;
}

// Puts an item in a slot, adjusting max HP / mana for the swap.
function equip(c, slot, item) {
  const old = c.equipment?.[slot];
  const dHp = (item.bonus?.maxHp ?? 0) - (old?.bonus?.maxHp ?? 0);
  const dMana = (item.bonus?.maxMana ?? 0) - (old?.bonus?.maxMana ?? 0);
  const maxHp = c.maxHp + dHp;
  const maxMana = c.maxMana + dMana;
  return {
    equipment: { ...(c.equipment ?? {}), [slot]: item },
    maxHp, hp: clamp(c.hp + Math.max(dHp, 0), 0, maxHp),
    maxMana, mana: clamp(c.mana + Math.max(dMana, 0), 0, maxMana),
  };
}

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

export function useClaims(sid) {
  const [claims, setClaims] = useState({});
  useEffect(() => onSnapshot(col(sid, 'claims'), (snap) =>
    setClaims(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])))), [sid]);
  return claims;
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

export async function openVault(sid, uid, data) {
  let fam, amount;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    const c = snap.data();
    if (!c || c.vaultOpened) return;
    fam = data.families?.find((f) => f.id === c.family);
    amount = fam?.vault ?? 0;
    tx.update(snap.ref, { gold: c.gold + amount, vaultOpened: true });
  });
  if (fam) await logEvent(sid, { type: 'vault', targetUid: uid, payload: { family: fam.name, amount } });
}

export async function assignWand(sid, uid, data, woodId, coreId) {
  const wood = data.wandWoods.find((w) => w.id === woodId);
  const core = data.wandCores.find((w) => w.id === coreId);
  const statsB = { ...(wood.bonus.stats ?? {}) };
  const wand = {
    id: `${wood.id}-${core.id}`,
    name: `${wood.name} wand, ${core.name} core`,
    icon: '🪄',
    bonus: { ...core.bonus, stats: statsB },
    desc: `${wood.desc}. ${core.desc}.`,
  };
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    const c = snap.data();
    const upd = equip(c, 'wand', wand);
    const firstWand = !c.equipment?.wand;
    tx.update(snap.ref, { ...upd, gold: firstWand ? Math.max(0, c.gold - data.wandPrice) : c.gold });
  });
  await logEvent(sid, { type: 'wand_chosen', targetUid: uid, payload: { name: wand.name } });
}

export async function setShopOpen(sid, open) {
  await updateDoc(doc(db, 'sessions', sid), { 'state.shopOpen': open });
  await logEvent(sid, { type: open ? 'shop_open' : 'shop_closed' });
}

// ---------- Player actions ----------

// Claiming a family locks it: the doc id is the family id, so only one
// claim can exist. The GM screen then builds the character.
export const claimFamily = (sid, uid, familyId, firstName) =>
  setDoc(doc(db, 'sessions', sid, 'claims', familyId), { uid, firstName, createdAt: serverTimestamp() });

export const useAbility = (sid, uid, ability) =>
  logEvent(sid, { type: 'ability_used', actorUid: uid, payload: { name: ability.name, icon: ability.icon } });

export const buy = (sid, uid, itemId) =>
  logEvent(sid, { type: 'purchase', actorUid: uid, processed: false, payload: { itemId } });

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

function buildCharacter(data, fam, firstName) {
  const d = structuredClone(data.defaults);
  const maxHp = d.maxHp + mod(fam.stats.con) * 2;
  const maxMana = d.maxMana + mod(fam.stats.int) * 2;
  return {
    ...d,
    stats: { ...fam.stats },
    hp: maxHp, maxHp, mana: maxMana, maxMana,
    family: fam.id, familyName: fam.name, firstName,
    name: `${firstName} ${fam.name}`,
    vaultOpened: false,
    inventory: [],
    createdAt: serverTimestamp(),
  };
}

async function processClaim(sid, familyId, data) {
  const cRef = doc(db, 'sessions', sid, 'claims', familyId);
  let created = null;
  let reject = false;
  await runTransaction(db, async (tx) => {
    const claim = await tx.get(cRef);
    if (!claim.exists() || claim.data().status) return;
    const { uid, firstName } = claim.data();
    const existing = await tx.get(charRef(sid, uid));
    const fam = data.families?.find((f) => f.id === familyId);
    if (existing.exists() || !fam) { reject = true; return; }
    tx.set(charRef(sid, uid), buildCharacter(data, fam, String(firstName).slice(0, 20)));
    tx.update(cRef, { status: 'ok' });
    created = uid;
  });
  if (reject) await deleteDoc(cRef); // frees the family again
  if (created) await logEvent(sid, { type: 'character_created', targetUid: created });
}

async function applyPurchase(sid, eid, data) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  await runTransaction(db, async (tx) => {
    const eSnap = await tx.get(eRef);
    const e = eSnap.data();
    if (!e || e.processed) return;
    const sSnap = await tx.get(doc(db, 'sessions', sid));
    const cSnap = await tx.get(charRef(sid, e.actorUid));
    const c = cSnap.data();
    const entry = shopEntry(data, e.payload.itemId);
    const fail = (reason) => tx.update(eRef, { processed: true, failed: true, payload: { ...e.payload, reason } });
    if (!sSnap.data()?.state?.shopOpen) return fail('Shops are closed');
    if (!c || !entry) return fail('Unknown item');
    if (c.gold < entry.price) return fail('Not enough gold');
    if (entry.slot && c.equipment?.[entry.slot]?.id === entry.id) return fail('Already owned');
    let upd;
    if (entry.slot) {
      upd = equip(c, entry.slot, { id: entry.id, name: entry.name, icon: entry.icon, bonus: entry.bonus ?? {}, desc: entry.desc });
    } else {
      const base = data.items[entry.item];
      upd = { inventory: addItems(c.inventory, { id: entry.item, ...base }, 1) };
    }
    tx.update(cSnap.ref, { ...upd, gold: c.gold - entry.price });
    tx.update(eRef, { processed: true, payload: { ...e.payload, name: entry.name, icon: entry.icon, price: entry.price } });
  });
}

export function useGameEngine(sid, data) {
  useEffect(() => {
    if (!data) return undefined; // wait until we know which campaign this is
    const busy = new Set();
    const run = (id, fn) => {
      if (busy.has(id)) return;
      busy.add(id);
      fn().catch(console.error).finally(() => busy.delete(id));
    };
    const stopTrades = onSnapshot(query(col(sid, 'trades'), where('status', '==', 'accepted')),
      (snap) => snap.docs.forEach((d) => run(d.id, () => executeTrade(sid, d.id))));
    const stopEvents = onSnapshot(query(col(sid, 'events'), where('processed', '==', false)),
      (snap) => snap.docs.forEach((d) => run(d.id, () =>
        d.data().type === 'purchase' ? applyPurchase(sid, d.id, data) : applyItemUse(sid, d.id))));
    const stopClaims = onSnapshot(col(sid, 'claims'),
      (snap) => snap.docs.filter((d) => !d.data().status)
        .forEach((d) => run(`claim-${d.id}`, () => processClaim(sid, d.id, data))));
    return () => { stopTrades(); stopEvents(); stopClaims(); };
  }, [sid, data]);
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
    case 'character_created': return { icon: '📜', text: `${target} has entered the story`, tone: 'gold' };
    case 'vault': return { icon: '🏦', text: `${target} opened the ${e.payload.family} vault: ${e.payload.amount} Galleons`, tone: 'gold', big: true };
    case 'wand_chosen': return { icon: '🪄', text: `The wand chooses ${target}: ${e.payload.name}`, tone: 'gold', big: true };
    case 'purchase': return e.failed ? null : { icon: e.payload.icon, text: `${actor} bought ${e.payload.name}`, tone: 'teal' };
    case 'ability_used': return { icon: e.payload.icon, text: `${actor} uses ${e.payload.name}!`, tone: 'violet', big: true };
    case 'shop_open': return { icon: '🛍️', text: 'Diagon Alley is open for shopping', tone: 'gold', big: true };
    case 'shop_closed': return { icon: '🔒', text: 'The shops are closed', tone: 'muted' };
    default: return null;
  }
}
