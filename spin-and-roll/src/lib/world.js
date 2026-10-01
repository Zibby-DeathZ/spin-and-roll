// Player positions, chests, items on the ground, and quests.
import { arrayUnion, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { adjust, awardPoints, giveItem, logEvent } from './game';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// Where each character is: state.pcPos[uid] = { loc, x, y }
export const locOf = (session, uid) => session?.state?.pcPos?.[uid]?.loc ?? null;

// Characters standing at a location, ready for MapView.
export function pcsAt(session, chars, loc) {
  const pos = session?.state?.pcPos ?? {};
  return Object.entries(pos)
    .filter(([uid, p]) => p.loc === loc && chars?.[uid])
    .map(([uid, p]) => ({ uid, x: p.x, y: p.y, name: chars[uid].firstName ?? chars[uid].name, family: chars[uid].family, house: chars[uid].house, hp: chars[uid].hp, maxHp: chars[uid].maxHp }));
}

// Places you can walk to from here. Paths go both ways; secret places stay
// hidden until the party has discovered them.
export function exitsOf(data, locId, discovered = []) {
  const ids = new Set();
  for (const l of data.locations ?? []) {
    if (l.id === locId) (l.exits ?? []).forEach((x) => ids.add(x));
    if ((l.exits ?? []).includes(locId)) ids.add(l.id);
  }
  return [...ids]
    .map((id) => data.locations.find((l) => l.id === id))
    .filter((l) => l && (!l.secret || discovered.includes(l.id)));
}

// Everything the players could choose to do at a location, for the TV and phones.
export function actionsAt(data, session, locId) {
  const loc = data.locations?.find((l) => l.id === locId);
  if (!loc) return { paths: [], things: [], extras: [] };
  const tokens = Object.values(session?.state?.tokens ?? {}).filter((t) => t.loc === locId);
  const things = [];
  for (const t of tokens) {
    if (t.kind === 'chest') { if (!t.opened) things.push({ icon: t.icon, text: `Open the ${t.name.toLowerCase()}` }); }
    else if (t.kind === 'item') things.push({ icon: t.icon, text: `Pick up the ${t.name}` });
    else if (t.npc) things.push({ icon: t.icon, text: `Talk to ${t.name}` });
    else if (t.hp > 0) things.push({ icon: '⚔️', text: `Fight the ${t.name}`, danger: true });
  }
  return {
    paths: exitsOf(data, locId, session?.state?.map?.discovered ?? []),
    things,
    extras: (loc.actions ?? []).map((a) => ({ icon: '✦', text: a })),
  };
}

export async function showOnTV(sid, data, locId) {
  const loc = data.locations.find((l) => l.id === locId);
  await updateDoc(sessionRef(sid), { 'state.map.loc': locId, 'state.map.discovered': arrayUnion(locId) });
  await logEvent(sid, { type: 'travel', payload: { name: loc.name, icon: loc.icon } });
}

// Moves some characters to a place, standing together near the bottom of the map.
export async function movePlayers(sid, data, locId, uids, chars, alsoShow = true) {
  if (!uids.length) return;
  const loc = data.locations.find((l) => l.id === locId);
  const upd = { 'state.map.discovered': arrayUnion(locId) };
  const start = 50 - ((uids.length - 1) * 9) / 2;
  uids.forEach((u, i) => { upd[`state.pcPos.${u}`] = { loc: locId, x: start + i * 9, y: 78 }; });
  if (alsoShow) upd['state.map.loc'] = locId;
  await updateDoc(sessionRef(sid), upd);
  const names = uids.map((u) => chars[u]?.firstName ?? chars[u]?.name ?? 'Someone');
  await logEvent(sid, { type: 'moved', payload: { names, name: loc.name, icon: loc.icon } });
}

// ---------- Chests and items on the ground ----------

export function rollChest(data, presetId) {
  const c = data.chests[presetId];
  const pool = [...c.loot];
  const items = [];
  for (let i = 0; i < c.picks && pool.length; i++) items.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return { gold: rand(c.gold[0], c.gold[1]), items };
}

export function chestToken(data, presetId, loc) {
  const c = data.chests[presetId];
  return {
    kind: 'chest', chest: presetId, loc, name: c.name, icon: c.icon, dc: c.dc, stat: c.stat,
    trap: c.trap ?? 0, contents: rollChest(data, presetId), opened: false, tried: [],
  };
}

export function itemToken(data, itemId, loc) {
  const it = data.items[itemId];
  return { kind: 'item', item: itemId, loc, name: it.name, icon: it.icon };
}

export const sendOpenChest = (sid, uid, payload) =>
  logEvent(sid, { type: 'open_chest', actorUid: uid, processed: false, payload });
export const sendPickup = (sid, uid, tokenId) =>
  logEvent(sid, { type: 'pickup', actorUid: uid, processed: false, payload: { tokenId } });

function addToInv(inv = [], item, qty = 1) {
  const next = inv.map((i) => ({ ...i }));
  const f = next.find((i) => i.id === item.id);
  if (f) f.qty += qty; else next.push({ ...item, qty });
  return next;
}

export async function applyOpenChest(sid, eid, data) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  await runTransaction(db, async (tx) => {
    const e = (await tx.get(eRef)).data();
    if (!e || e.processed) return;
    const sess = (await tx.get(sessionRef(sid))).data();
    const cSnap = await tx.get(charRef(sid, e.actorUid));
    const c = cSnap.data();
    const id = e.payload.tokenId;
    const t = sess?.state?.tokens?.[id];
    const here = sess?.state?.pcPos?.[e.actorUid]?.loc;
    if (!c || !t || t.kind !== 'chest' || t.opened || t.loc !== here || (t.tried ?? []).includes(e.actorUid)) {
      tx.update(eRef, { processed: true, failed: true });
      return;
    }
    const { nat, total } = e.payload;
    const ok = nat === 20 || (nat !== 1 && total >= t.dc);
    if (ok) {
      let inv = c.inventory ?? [];
      for (const it of t.contents.items) inv = addToInv(inv, { id: it, ...data.items[it] });
      tx.update(cSnap.ref, { inventory: inv, gold: c.gold + t.contents.gold });
      tx.update(sessionRef(sid), { [`state.tokens.${id}.opened`]: true, [`state.tokens.${id}.icon`]: '📭' });
    } else {
      tx.update(sessionRef(sid), { [`state.tokens.${id}.tried`]: [...(t.tried ?? []), e.actorUid] });
      if (t.trap) tx.update(cSnap.ref, { hp: Math.max(0, c.hp - t.trap) });
    }
    tx.update(eRef, {
      processed: true,
      payload: {
        ...e.payload, name: t.name, ok, dc: t.dc, trap: ok ? 0 : t.trap,
        gold: ok ? t.contents.gold : 0, items: ok ? t.contents.items.map((i) => data.items[i]?.name ?? i) : [],
      },
    });
  });
}

export async function applyPickup(sid, eid, data) {
  const eRef = doc(db, 'sessions', sid, 'events', eid);
  await runTransaction(db, async (tx) => {
    const e = (await tx.get(eRef)).data();
    if (!e || e.processed) return;
    const sess = (await tx.get(sessionRef(sid))).data();
    const cSnap = await tx.get(charRef(sid, e.actorUid));
    const id = e.payload.tokenId;
    const t = sess?.state?.tokens?.[id];
    const here = sess?.state?.pcPos?.[e.actorUid]?.loc;
    if (!cSnap.exists() || !t || t.kind !== 'item' || t.loc !== here) {
      tx.update(eRef, { processed: true, failed: true });
      return;
    }
    const inv = addToInv(cSnap.data().inventory, { id: t.item, ...data.items[t.item] });
    tx.update(cSnap.ref, { inventory: inv });
    const tokens = { ...sess.state.tokens };
    delete tokens[id];
    tx.update(sessionRef(sid), { 'state.tokens': tokens });
    tx.update(eRef, { processed: true, payload: { ...e.payload, name: t.name, icon: t.icon } });
  });
}

// ---------- Quests: state.quests[id] = { status, uids, done: [objective index…] } ----------

export async function giveQuest(sid, data, qid, uids) {
  const q = data.quests.find((x) => x.id === qid);
  await updateDoc(sessionRef(sid), { [`state.quests.${qid}`]: { status: 'active', uids, done: [] } });
  await logEvent(sid, { type: 'quest_new', payload: { title: q.title, icon: q.icon, giver: q.giver } });
}

export async function toggleObjective(sid, qid, qs, idx) {
  const done = qs.done.includes(idx) ? qs.done.filter((i) => i !== idx) : [...qs.done, idx];
  await updateDoc(sessionRef(sid), { [`state.quests.${qid}.done`]: done });
}

export async function completeQuest(sid, data, qid, qs, chars) {
  const q = data.quests.find((x) => x.id === qid);
  const r = q.reward ?? {};
  await updateDoc(sessionRef(sid), { [`state.quests.${qid}.status`]: 'done', [`state.quests.${qid}.done`]: q.objectives.map((_, i) => i) });
  await logEvent(sid, { type: 'quest_done', payload: { title: q.title, icon: q.icon } });
  for (const uid of qs.uids) {
    if (r.xp) await adjust(sid, uid, 'xp', r.xp);
    if (r.gold) await adjust(sid, uid, 'gold', r.gold);
    for (const it of r.items ?? []) await giveItem(sid, uid, { id: it, ...data.items[it] }, 1);
    if (r.points && chars[uid]?.house) await awardPoints(sid, uid, chars[uid].house, r.points);
  }
}

export const failQuest = (sid, qid) => updateDoc(sessionRef(sid), { [`state.quests.${qid}.status`]: 'failed' });

export function rewardText(data, r = {}) {
  const parts = [];
  if (r.xp) parts.push(`${r.xp} XP`);
  if (r.gold) parts.push(`${r.gold} ${data.currency.name}`);
  if (r.points) parts.push(`${r.points} house points`);
  for (const it of r.items ?? []) parts.push(data.items[it]?.name ?? it);
  return parts.join(', ');
}

// ---------- Staff ----------
// Puts every member of staff in their own room, creating their token if needed.
export async function placeStaff(sid, data, session) {
  const tokens = session.state?.tokens ?? {};
  const upd = {};
  const perRoom = {};
  for (const [npc, room] of Object.entries(data.staff ?? {})) {
    const b = data.bestiary[npc];
    if (!b) continue;
    const n = (perRoom[room] = (perRoom[room] ?? 0) + 1);
    const pos = { loc: room, x: 50 + (n - 1) * 12, y: 30 };
    const existing = Object.entries(tokens).find(([, t]) => t.kind === npc);
    if (existing) {
      upd[`state.tokens.${existing[0]}.loc`] = room;
      upd[`state.tokens.${existing[0]}.x`] = pos.x;
      upd[`state.tokens.${existing[0]}.y`] = pos.y;
    } else {
      upd[`state.tokens.staff-${npc}`] = { kind: npc, name: b.name, icon: b.icon, npc: true, ...pos };
    }
  }
  await updateDoc(sessionRef(sid), upd);
}

// Makes sure a class's professor is standing in its classroom.
export async function professorTo(sid, data, session, npc, room) {
  const b = data.bestiary[npc];
  if (!b) return;
  const tokens = session.state?.tokens ?? {};
  const existing = Object.entries(tokens).find(([, t]) => t.kind === npc);
  const id = existing ? existing[0] : `staff-${npc}`;
  await updateDoc(sessionRef(sid), {
    [`state.tokens.${id}`]: { ...(existing?.[1] ?? { kind: npc, name: b.name, icon: b.icon, npc: true }), loc: room, x: 50, y: 28 },
  });
}
