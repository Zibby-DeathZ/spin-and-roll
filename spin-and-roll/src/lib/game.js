import {
  addDoc, collection, deleteDoc, deleteField, doc, getDocs, increment, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { applyAttack } from './combat';
import { applyOpenChest, applyPickup, sendToDetention } from './world';

// ---------- Rules of the game ----------

export const STATS = [
  ['str', 'Strength'], ['dex', 'Dexterity'], ['con', 'Constitution'],
  ['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma'],
];
// XP needed for each level, all the way to level 35 (Year 7).
// Level n → n+1 costs 50 × (n + 1): 100, 150, 200… so Year 1 is 0, 100, 250, 450, 700.
export const XP_LEVELS = (() => {
  const t = [0];
  for (let n = 1; n < 35; n++) t.push(t[n - 1] + 50 * (n + 1));
  return t;
})();
export const levelFor = (xp = 0) => XP_LEVELS.filter((t) => xp >= t).length;
export const xpForLevel = (lvl) => XP_LEVELS[Math.max(0, lvl - 1)] ?? 0;
// Highest XP allowed under a level cap (Year 1 caps at level 5, so 999 XP).
export const xpCap = (cap) => (cap && XP_LEVELS[cap] ? XP_LEVELS[cap] - 1 : Infinity);
export const nextLevelAt = (xp = 0, cap = Infinity) =>
  (levelFor(xp) >= cap ? null : XP_LEVELS.find((t) => t > xp) ?? null);
export const LEVEL_HP = 4;
export const LEVEL_MANA = 2;

// Applies XP with the year's cap and the level-up bonuses. Returns the fields to update.
export function gainXp(c, amount) {
  const before = c.xp ?? 0;
  const after = Math.max(0, Math.min(xpCap(c.levelCap), before + amount));
  const gained = levelFor(after) - levelFor(before);
  const upd = { xp: after };
  if (gained > 0) {
    upd.maxHp = c.maxHp + LEVEL_HP * gained;
    upd.hp = Math.min(upd.maxHp, c.hp + LEVEL_HP * gained);
    upd.maxMana = c.maxMana + LEVEL_MANA * gained;
    upd.mana = Math.min(upd.maxMana, c.mana + LEVEL_MANA * gained);
  }
  return { upd, before, after };
}
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
    if (field === 'xp') {
      const g = gainXp(c, delta);
      after = g.after;
      tx.update(charRef(sid, uid), g.upd);
      return;
    }
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
export const claimFamily = (sid, uid, familyId, firstName, carry = false) =>
  setDoc(doc(db, 'sessions', sid, 'claims', familyId), { uid, firstName, carry, createdAt: serverTimestamp() });

export const useAbility = (sid, uid, ability) =>
  logEvent(sid, { type: 'ability_used', actorUid: uid, processed: false, payload: { name: ability.name, icon: ability.icon } });

export const castSpell = (sid, uid, spellId, extra = {}) =>
  logEvent(sid, { type: 'spell_cast', actorUid: uid, processed: false, payload: { spellId, ...extra } });

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


// ---------- The clock ----------

export const clockOf = (session) => session?.state?.clock ?? { day: 0, block: 0, dawn: 0 };

export function clockInfo(data, clk) {
  if (!data.clock) return null;
  if (clk.day === 0) {
    const stage = data.clock.prologue[clk.block];
    return { prologue: true, blockName: stage, label: `Prologue: ${stage}`, key: `0-${clk.block}` };
  }
  const blockName = data.clock.blocks[clk.block];
  const slot = data.timetable?.[clk.day]?.[blockName] ?? null;
  const cls = slot?.class ? data.classes[slot.class] : null;
  return {
    prologue: false, blockName, slot, cls,
    label: `Day ${clk.day} of ${data.clock.days}, ${blockName}`,
    key: `${clk.day}-${blockName}`,
    last: clk.day === data.clock.days && clk.block === data.clock.blocks.length - 1,
  };
}

export function lessonName(data, lesson) {
  if (!lesson) return '';
  if (lesson.type === 'spell') return data.spells[lesson.spell]?.name ?? lesson.spell;
  return lesson.name ?? '';
}

// Sleeping restores everyone: the DnD "long rest".
async function restEveryone(sid) {
  const snap = await getDocs(col(sid, 'characters'));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { hp: d.data().maxHp, mana: d.data().maxMana }));
  await batch.commit();
}

export async function moveClock(sid, data, clk, dir) {
  let { day, block, dawn } = clk;
  const P = data.clock.prologue.length, B = data.clock.blocks.length;
  let newDawn = false;
  if (dir > 0) {
    if (day === 0) { if (block < P - 1) block++; else { day = 1; block = 0; dawn++; newDawn = true; } }
    else if (block < B - 1) block++;
    else if (day < data.clock.days) { day++; block = 0; dawn++; newDawn = true; }
    else return;
  } else {
    if (day === 0) { if (block > 0) block--; else return; }
    else if (block > 0) block--;
    else if (day === 1) { day = 0; block = P - 1; }
    else { day--; block = B - 1; }
  }
  const next = { day, block, dawn };
  await updateDoc(doc(db, 'sessions', sid), { 'state.clock': next });
  if (newDawn) await restEveryone(sid);
  if (dir > 0) {
    const info = clockInfo(data, next);
    await logEvent(sid, {
      type: 'time',
      payload: { label: info.label, cls: info.cls?.name ?? null, prof: info.cls?.professor ?? null, dawn: newDawn },
    });
  }
}

export async function turnBackTime(sid, clk) {
  await updateDoc(doc(db, 'sessions', sid), {
    'state.clock': { day: 1, block: 0, dawn: clk.dawn + 1 },
    'state.timeTurnerUsed': true,
    'state.taught': deleteField(),
  });
  await restEveryone(sid);
  await logEvent(sid, { type: 'time_turner' });
}

// Gives one student what a lesson teaches, plus class XP.
export async function teachLesson(sid, data, uid, lesson) {
  const xpGain = data.clock?.xpPerClass ?? 10;
  let before = 0, after = 0, name = null;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    const c = snap.data();
    if (!c) return;
    name = c.firstName ?? c.name;
    const g = gainXp(c, xpGain);
    before = g.before; after = g.after;
    const upd = { ...g.upd };
    if (lesson.type === 'spell' && !(c.spells ?? []).some((x) => x.id === lesson.spell)) {
      upd.spells = [...(c.spells ?? []), { id: lesson.spell, ...data.spells[lesson.spell] }];
    }
    if (lesson.type === 'item') {
      upd.inventory = addItems(c.inventory, { id: lesson.item, ...data.items[lesson.item] }, lesson.qty ?? 1);
    }
    if (lesson.type === 'perk' && !(c.perks ?? []).includes(lesson.perk)) {
      upd.perks = [...(c.perks ?? []), lesson.perk];
    }
    tx.update(snap.ref, upd);
  });
  if (levelFor(after) > levelFor(before)) {
    await logEvent(sid, { type: 'level_up', targetUid: uid, payload: { level: levelFor(after) } });
  }
  return name;
}

// Teaches the current lesson to everyone ticked, without a minigame.
export async function holdClass(sid, data, clk, uids) {
  const info = clockInfo(data, clk);
  const lesson = info?.slot?.lesson;
  if (!lesson) return;
  const names = [];
  for (const uid of uids) {
    const n = await teachLesson(sid, data, uid, lesson);
    if (n) names.push(n);
  }
  await updateDoc(doc(db, 'sessions', sid), { [`state.taught.${taughtKey(info)}`]: true });
  await logEvent(sid, {
    type: 'class_held',
    payload: { names, cls: info.cls.name, lesson: lessonName(data, lesson), xp: data.clock.xpPerClass ?? 10 },
  });
}
export const taughtKey = (info) => info?.key?.replace(' ', '_');


// ---------- Wheels ----------

export const SPIN_MS = 5200; // how long the TV wheel spins before landing

export async function startSpin(sid, data, wheelId, uid = null) {
  const wheel = data.wheels?.[wheelId];
  if (!wheel) return;
  const idx = Math.floor(Math.random() * wheel.segments.length);
  await updateDoc(doc(db, 'sessions', sid), {
    'state.spin': { wheelId, uid, idx, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now(), applied: false },
  });
}

export const hideSpin = (sid) => updateDoc(doc(db, 'sessions', sid), { 'state.spin.hidden': true });

// Called by the GM screen once the wheel has landed. Applies the effect exactly once.
export async function applySpin(sid, data, spin) {
  const sRef = doc(db, 'sessions', sid);
  let claimed = false;
  await runTransaction(db, async (tx) => {
    const cur = (await tx.get(sRef)).data()?.state?.spin;
    if (!cur || cur.id !== spin.id || cur.applied) return;
    tx.update(sRef, { 'state.spin.applied': true });
    claimed = true;
  });
  if (!claimed) return;
  const wheel = data.wheels[spin.wheelId];
  const seg = wheel.segments[spin.idx];
  await logEvent(sid, { type: 'wheel', targetUid: spin.uid, payload: { wheel: wheel.name, icon: wheel.icon, text: seg.text } });
  const fx = seg.effect ?? {};
  if (!spin.uid) return;
  for (const f of ['hp', 'mana', 'xp', 'gold']) if (fx[f]) await adjust(sid, spin.uid, f, fx[f]);
  if (fx.detention) await sendToDetention(sid, data, spin.uid);
  if (fx.expel) {
    await updateDoc(charRef(sid, spin.uid), { expelled: true });
    await logEvent(sid, { type: 'expelled', targetUid: spin.uid });
  }
  if (fx.item && data.items[fx.item]) await giveItem(sid, spin.uid, { id: fx.item, ...data.items[fx.item] }, 1);
  if (fx.points) {
    const c = (await getDocs(query(col(sid, 'characters')))).docs.find((d) => d.id === spin.uid)?.data();
    if (c?.house) await awardPoints(sid, spin.uid, c.house, fx.points);
  }
}

// ---------- GM spell teaching ----------

export async function teachSpell(sid, uid, spell, announce = false) {
  let name = null;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    const c = snap.data();
    if (!c) return;
    const spells = (c.spells ?? []).filter((x) => x.id !== spell.id);
    tx.update(snap.ref, { spells: [...spells, spell] });
    name = c.firstName ?? c.name;
  });
  if (announce && name) await logEvent(sid, { type: 'spell_learned', targetUid: uid, payload: { name: spell.name, icon: spell.icon, form: spell.form ?? null } });
}

export async function forgetSpell(sid, uid, spellId) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    const c = snap.data();
    if (!c) return;
    tx.update(snap.ref, { spells: (c.spells ?? []).filter((x) => x.id !== spellId) });
  });
}

// ---------- Ceremonies: Sorting Hat and Ollivanders ----------

export function useAnswers(sid) {
  const [answers, setAnswers] = useState({});
  useEffect(() => onSnapshot(col(sid, 'answers'), (snap) =>
    setAnswers(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])))), [sid]);
  return answers;
}
export const answerKey = (quizId, uid) => `${quizId}_${uid}`;

// Player saves their answers so far (one per question, in order).
export const saveAnswers = (sid, uid, quizId, picks, wish = null) =>
  setDoc(doc(db, 'sessions', sid, 'answers', answerKey(quizId, uid)),
    { uid, quiz: quizId, picks, wish, updatedAt: serverTimestamp() });

// Tallies answers into scores, e.g. { Gryffindor: 3, Ravenclaw: 2 }.
export function scoreQuiz(quiz, picks = []) {
  const s = { house: {}, wood: {}, core: {} };
  picks.forEach((optIdx, qIdx) => {
    const opt = quiz.questions[qIdx]?.options[optIdx];
    for (const k of ['house', 'wood', 'core']) if (opt?.[k]) s[k][opt[k]] = (s[k][opt[k]] ?? 0) + 1;
  });
  return s;
}
const top = (scores) => Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

// The Hat's verdict: best score, unless the wish is within one point.
export function hatVerdict(quiz, answer) {
  const { house } = scoreQuiz(quiz, answer?.picks);
  const best = top(house);
  const wish = answer?.wish;
  if (wish && quiz.wish.options.slice(0, 4).includes(wish) && (house[wish] ?? 0) >= (house[best] ?? 0) - 1) {
    return { house: wish, listened: wish !== best, scores: house };
  }
  return { house: best, listened: false, scores: house };
}
export function wandVerdict(quiz, answer) {
  const s = scoreQuiz(quiz, answer?.picks);
  return { wood: top(s.wood), core: top(s.core), scores: s };
}

export async function startQuiz(sid, quizId, uid) {
  await deleteDoc(doc(db, 'sessions', sid, 'answers', answerKey(quizId, uid))).catch(() => {});
  await updateDoc(doc(db, 'sessions', sid), { 'state.quiz': { id: quizId, uid } });
  await logEvent(sid, { type: 'quiz_started', targetUid: uid, payload: { quiz: quizId } });
}
export const endQuiz = (sid) => updateDoc(doc(db, 'sessions', sid), { 'state.quiz': deleteField() });

export async function sortInto(sid, uid, house) {
  await updateDoc(charRef(sid, uid), { house });
  await endQuiz(sid);
  await logEvent(sid, { type: 'sorted', targetUid: uid, payload: { house } });
}

// ---------- House points ----------

export async function awardPoints(sid, uid, house, delta, reason = '') {
  if (!house || house === 'Unsorted') return;
  await updateDoc(doc(db, 'sessions', sid), { [`state.housePoints.${house}`]: increment(delta) });
  await logEvent(sid, { type: 'points', targetUid: uid, payload: { house, delta, reason: reason.trim() || null } });
}

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

async function applyItemUse(sid, eid, data) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  let wheel = null, actor = null;
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
    wheel = item.wheel ?? null;
    actor = e.actorUid;
  });
  if (wheel && data?.wheels?.[wheel]) await startSpin(sid, data, wheel, actor);
}

function buildCharacter(data, fam, firstName) {
  const d = structuredClone(data.defaults);
  const floor = data.levelFloor ?? 1; // later years start new students at a higher level
  const maxHp = d.maxHp + mod(fam.stats.con) * 2 + LEVEL_HP * (floor - 1);
  const maxMana = d.maxMana + mod(fam.stats.int) * 2 + LEVEL_MANA * (floor - 1);
  return {
    ...d,
    stats: { ...fam.stats },
    hp: maxHp, maxHp, mana: maxMana, maxMana,
    family: fam.id, familyName: fam.name, firstName,
    name: `${firstName} ${fam.name}`,
    xp: xpForLevel(data.levelFloor ?? 1), levelCap: data.levelCap ?? null,
    vaultOpened: false,
    spells: (fam.startSpells ?? []).filter((id) => data.spells?.[id]).map((id) => ({ id, ...data.spells[id] })),
    perks: [],
    inventory: (fam.startItems ?? []).filter((id) => data.items[id]).map((id) => ({ id, ...data.items[id], qty: 1 })),
    createdAt: serverTimestamp(),
  };
}

function continuedCharacter(data, hero) {
  const d = structuredClone(data.defaults);
  const floorXp = xpForLevel(data.levelFloor ?? 1);
  return {
    ...d, ...hero,
    xp: Math.max(hero.xp ?? 0, floorXp), levelCap: data.levelCap ?? null,
    hp: hero.maxHp, mana: hero.maxMana, vaultOpened: true, continued: true, createdAt: serverTimestamp(),
  };
}

async function processClaim(sid, familyId, data) {
  const cRef = doc(db, 'sessions', sid, 'claims', familyId);
  let created = null;
  let reject = false;
  await runTransaction(db, async (tx) => {
    const claim = await tx.get(cRef);
    if (!claim.exists() || claim.data().status) return;
    const { uid, firstName, carry } = claim.data();
    const existing = await tx.get(charRef(sid, uid));
    const fam = data.families?.find((f) => f.id === familyId);
    if (existing.exists() || !fam) { reject = true; return; }
    const heroSnap = carry && data.series ? await tx.get(doc(db, 'users', uid, 'heroes', data.series)) : null;
    const hero = heroSnap?.exists() ? heroSnap.data() : null;
    tx.set(charRef(sid, uid), hero && hero.family === familyId
      ? continuedCharacter(data, hero)
      : buildCharacter(data, fam, String(firstName).slice(0, 20)));
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

async function applyCast(sid, eid, data) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  await runTransaction(db, async (tx) => {
    const e = (await tx.get(eRef)).data();
    if (!e || e.processed) return;
    const cSnap = await tx.get(charRef(sid, e.actorUid));
    const c = cSnap.data();
    const own = c?.spells?.find((x) => x.id === e.payload.spellId);
    const spell = own ? { ...own, ...(data?.spells?.[own.id] ?? {}) } : null;
    if (!spell || c.mana < spell.mana) {
      tx.update(eRef, { processed: true, failed: true });
      return;
    }
    tx.update(cSnap.ref, { mana: c.mana - spell.mana });
    tx.update(eRef, { processed: true, payload: { ...e.payload, name: spell.name, icon: spell.icon } });
  });
}

async function applyAbility(sid, eid) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  await runTransaction(db, async (tx) => {
    const e = (await tx.get(eRef)).data();
    if (!e || e.processed) return;
    const sSnap = await tx.get(doc(db, 'sessions', sid));
    const cSnap = await tx.get(charRef(sid, e.actorUid));
    const dawn = clockOf(sSnap.data()).dawn;
    if (!cSnap.exists() || cSnap.data().abilityDawn === dawn) {
      tx.update(eRef, { processed: true, failed: true });
      return;
    }
    tx.update(cSnap.ref, { abilityDawn: dawn });
    tx.update(eRef, { processed: true });
  });
}

const HANDLERS = {
  purchase: (sid, id, data) => applyPurchase(sid, id, data),
  spell_cast: (sid, id, data) => applyCast(sid, id, data),
  ability_used: (sid, id) => applyAbility(sid, id),
  item_used: (sid, id, data) => applyItemUse(sid, id, data),
  attack: (sid, id, data) => applyAttack(sid, id, data),
  open_chest: (sid, id, data) => applyOpenChest(sid, id, data),
  pickup: (sid, id, data) => applyPickup(sid, id, data),
};

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
      (snap) => snap.docs.forEach((d) => {
        const handler = HANDLERS[d.data().type];
        if (handler) run(d.id, () => handler(sid, d.id, data));
      }));
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
    case 'time': return e.payload.cls
      ? { icon: '🕰️', text: `${e.payload.label}: ${e.payload.cls} with ${e.payload.prof}`, tone: 'gold', big: true }
      : { icon: e.payload.dawn ? '🌅' : '🕰️', text: e.payload.dawn ? `${e.payload.label}. Everyone wakes up rested.` : e.payload.label, tone: 'gold', big: true };
    case 'lesson_start': return { icon: '🔔', text: `Class begins: ${e.payload.cls} with ${e.payload.prof}. Today: ${e.payload.lesson}`, tone: 'gold', big: true };
    case 'lesson_passed': return { icon: '🎓', text: `${target} mastered ${e.payload.lesson}!`, tone: 'teal', big: true };
    case 'lesson_failed': return { icon: '😬', text: `${target} couldn’t get ${e.payload.lesson} right today`, tone: 'ember' };
    case 'spell_learned': return { icon: e.payload.icon, text: `${target} knows ${e.payload.name}${e.payload.form ? ` (a ${e.payload.form})` : ''}!`, tone: 'violet', big: true };
    case 'wheel': return { icon: e.payload.icon, text: `${e.targetUid ? `${target}: ` : ''}${e.payload.text}`, tone: 'gold' };
    case 'time_turner': return { icon: '⌛', text: 'The Time-Turner spins… It’s Day 1 again. Then it cracks.', tone: 'violet', big: true };
    case 'class_held': return { icon: '🎓', text: `${e.payload.names.join(', ')} learned ${e.payload.lesson} in ${e.payload.cls}`, tone: 'teal' };
    case 'spell_cast': return e.failed ? null
      : { icon: e.payload.icon, text: `${actor} casts ${e.payload.name}!${e.payload.rolled != null ? ` Rolled ${e.payload.rolled} ${e.payload.rollLabel ?? ''}` : ''}`, tone: 'violet', big: true };
    case 'attack': {
      if (e.failed) return null;
      const p = e.payload;
      if (p.forbidden) {
        return { icon: '💚', text: `A flash of green light…${p.hit ? ` ${p.targetName} falls.` : ' It misses.'}`, tone: 'house-slytherin', big: true };
      }
      const crit = p.nat === 20 ? ' Natural 20!' : p.nat === 1 ? ' Natural 1!' : '';
      return {
        icon: p.icon,
        text: `${actor} → ${p.targetName}: ${p.name}, ${p.hitTotal} vs Defence ${p.defence}.${crit} ${p.hit ? (p.dmg ? `Hit for ${p.dmg}!` : 'Hit!') : 'Miss.'}${p.defeated ? ` ${p.targetName} is down!` : ''}`,
        tone: p.hit ? 'gold' : 'muted', big: true,
      };
    }
    case 'monster_attack': {
      const p = e.payload;
      if (p.disarmed) return { icon: p.icon, text: `${p.name} reaches for its weapon… it’s been disarmed! Miss.`, tone: 'muted', big: true };
      const mirror = p.mirror ? ` casts ${p.mirror} back at` : ' →';
      const ate = p.swallowed ? ` It swallows ${target}’s ${p.swallowed}${p.heal ? ` and heals ${p.heal}` : ''}, and grows!` : '';
      return {
        icon: p.icon,
        text: `${p.name}${mirror} ${target}: ${p.total} vs Defence ${p.defence}. ${p.hit ? `Hit for ${p.dmg}!` : 'Miss.'}${ate}${p.ko ? ` ${target} is knocked out!` : ''}`,
        tone: p.hit ? 'ember' : 'muted', big: true,
      };
    }
    case 'roll': {
      const p = e.payload;
      const detail = `${p.rolls.join(p.mode === 'normal' ? ' + ' : ' / ')}${p.mod ? ` ${p.mod > 0 ? '+' : '−'} ${Math.abs(p.mod)}` : ''}`;
      return { icon: '🎲', text: `${actor} rolled ${p.label}: ${p.total} (${detail})`, tone: 'gold' };
    }
    case 'hazard': return { icon: e.payload.icon, text: `${e.payload.action}! ${e.payload.desc}`, tone: 'ember', big: true };
    case 'detention': return { icon: '🔦', text: `${target} has detention with ${e.payload.npc} in the ${e.payload.place}`, tone: 'ember', big: true };
    case 'moved': return { icon: e.payload.icon, text: `${e.payload.names.join(', ')} → ${e.payload.name}`, tone: 'gold' };
    case 'owl': return { icon: '🦉', text: `An owl swoops in with a sealed letter for ${target}…`, tone: 'violet', big: true };
    case 'mimic': return { icon: e.payload.icon, text: `IT’S A MIMIC! ${e.payload.name}!`, tone: 'ember', big: true };
    case 'open_chest': {
      if (e.failed || e.payload?.mimic) return null;
      const p = e.payload;
      if (p.ok) {
        const loot = [...(p.gold ? [`${p.gold} Galleons`] : []), ...p.items].join(', ');
        return { icon: '🧰', text: `${actor} opened the ${p.name} (${p.total} vs ${p.dc}): ${loot || 'it was empty'}!`, tone: 'gold', big: true };
      }
      return { icon: '🔒', text: `${actor} couldn’t open the ${p.name} (${p.total} vs ${p.dc})${p.trap ? `. A curse bites for ${p.trap} damage!` : ''}`, tone: 'ember', big: true };
    }
    case 'pickup': return e.failed ? null : { icon: e.payload.icon, text: `${actor} picked up ${e.payload.name}`, tone: 'teal' };
    case 'quest_new': return { icon: e.payload.icon, text: `New quest from ${e.payload.giver}: ${e.payload.title}`, tone: 'gold', big: true };
    case 'quest_done': return { icon: '🏅', text: `Quest complete: ${e.payload.title}!`, tone: 'teal', big: true };
    case 'travel': return { icon: '📍', text: e.payload.name, tone: 'gold', big: true };
    case 'fight_start': return { icon: '⚔️', text: `Roll for initiative! ${e.payload.order.join(', ')}`, tone: 'ember', big: true };
    case 'fight_end': return { icon: '🏁', text: `The fight is over.${e.payload.xp ? ` Everyone gains ${e.payload.xp} XP.` : ''}`, tone: 'gold', big: true };
    case 'expelled': return { icon: '📜', text: `${target} has been EXPELLED from Hogwarts!`, tone: 'ember', big: true };
    case 'ability_used': return e.failed ? null : { icon: e.payload.icon, text: `${actor} uses ${e.payload.name}!`, tone: 'violet', big: true };
    case 'quiz_started': return e.payload.quiz === 'sorting'
      ? { icon: '🎩', text: `${target}, step forward. The Sorting Hat awaits`, tone: 'gold' }
      : { icon: '🪄', text: `Mr Ollivander studies ${target} carefully…`, tone: 'gold' };
    case 'sorted': return { icon: '🎩', text: `${target}… ${e.payload.house.toUpperCase()}!`, tone: `house-${e.payload.house.toLowerCase()}`, big: true };
    case 'points': {
      const why = e.payload.reason ? ` ${e.payload.reason}` : '';
      return e.payload.delta > 0
        ? { icon: '⏳', text: `${e.payload.delta} points to ${e.payload.house}! ${target}${why}`, tone: `house-${e.payload.house.toLowerCase()}`, big: true }
        : { icon: '⏳', text: `${-e.payload.delta} points from ${e.payload.house}. ${target}${why}`, tone: 'ember', big: true };
    }
    case 'puzzle_start': return { icon: e.payload.icon, text: `A puzzle! ${e.payload.title}. Look at the TV`, tone: 'violet', big: true };
    case 'puzzle_solved': return { icon: '✨', text: `Solved: ${e.payload.title}!`, tone: 'teal', big: true };
    case 'shop_open': return { icon: '🛍️', text: 'Diagon Alley is open for shopping', tone: 'gold', big: true };
    case 'shop_closed': return { icon: '🔒', text: 'The shops are closed', tone: 'muted' };
    default: return null;
  }
}
