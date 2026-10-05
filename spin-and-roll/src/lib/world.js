// Player positions, chests, items on the ground, and quests.
import { arrayUnion, collection, deleteField, doc, getDoc, getDocs, runTransaction, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { adjust, awardPoints, giveItem, logEvent } from './game';
import { springMimic } from './mimic';

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
    else if (t.kind === 'hazard') { if (!t.used) things.push({ icon: t.icon, text: t.action, hazard: true }); }
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
  let sprung = null;
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
    if (t.mimic) {
      tx.update(eRef, { processed: true, payload: { ...e.payload, mimic: true } });
      sprung = { id, uid: e.actorUid };
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
  if (sprung) await springMimic(sid, data, sprung.id, sprung.uid);
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

// ---------- Hazards ----------
export function hazardToken(data, id, loc) {
  const h = data.hazards[id];
  return { kind: 'hazard', hazard: id, loc, name: h.name, icon: h.icon, action: h.action, desc: h.desc, used: false };
}

export async function triggerHazard(sid, data, session, tokenId, chars) {
  const t = session.state.tokens[tokenId];
  const fx = data.hazards[t.hazard].effect;
  const tokens = session.state.tokens;
  const upd = { [`state.tokens.${tokenId}.used`]: true, [`state.tokens.${tokenId}.icon`]: '✔️' };
  for (const [id, m] of Object.entries(tokens)) {
    if (m.loc !== t.loc || m.npc || m.kind === 'chest' || m.kind === 'item' || m.kind === 'hazard' || !(m.hp > 0)) continue;
    let hp = m.hp;
    if (fx.killKind && m.kind === fx.killKind) hp = 0;
    if (fx.bossDamage && m.boss) hp -= fx.bossDamage;
    if (fx.damageAll) hp -= fx.damageAll;
    if (hp !== m.hp) upd[`state.tokens.${id}.hp`] = Math.max(0, hp);
    if (fx.bossDefence && m.boss) upd[`state.tokens.${id}.defence`] = m.defence + fx.bossDefence;
  }
  await updateDoc(sessionRef(sid), upd);
  if (fx.heal) {
    const here = Object.entries(session.state.pcPos ?? {}).filter(([, p]) => p.loc === t.loc).map(([u]) => u);
    for (const u of here) if (chars[u]) await adjust(sid, u, 'hp', fx.heal);
  }
  await logEvent(sid, { type: 'hazard', payload: { icon: data.hazards[t.hazard].icon, action: t.action, desc: t.desc } });
}

// ---------- Detention ----------
export async function sendToDetention(sid, data, uid) {
  const d = data.detention;
  if (!d) return;
  const session = (await getDoc(sessionRef(sid))).data();
  const c = (await getDoc(charRef(sid, uid))).data();
  if (!c) return;
  const chars = { [uid]: c };
  await professorTo(sid, data, session, d.npc, d.loc);
  await movePlayers(sid, data, d.loc, [uid], chars, false);
  const q = session.state?.quests?.[d.quest];
  if (d.quest && !q) {
    await updateDoc(sessionRef(sid), { [`state.quests.${d.quest}`]: { status: 'active', uids: [uid], done: [] } });
    const quest = data.quests?.find((x) => x.id === d.quest);
    if (quest) await logEvent(sid, { type: 'quest_new', payload: { title: quest.title, icon: quest.icon, giver: quest.giver } });
  } else if (q && q.status === 'active' && !q.uids.includes(uid)) {
    await updateDoc(sessionRef(sid), { [`state.quests.${d.quest}.uids`]: [...q.uids, uid] });
  }
  const loc = data.locations.find((l) => l.id === d.loc);
  await logEvent(sid, { type: 'detention', targetUid: uid, payload: { place: loc?.name ?? d.loc, npc: data.bestiary[d.npc]?.name ?? 'Filch' } });
}

// ---------- TV shows: suspect board, awards, House Cup ----------
export const setShow = (sid, show) => updateDoc(sessionRef(sid), { 'state.show': show ?? deleteField() });
export const pinClue = (sid, clueId, suspectId) =>
  updateDoc(sessionRef(sid), { [`state.board.pinned.${clueId}`]: suspectId ?? deleteField() });
export const setSuspectMark = (sid, suspectId, mark) =>
  updateDoc(sessionRef(sid), { [`state.board.marks.${suspectId}`]: mark ?? deleteField() });

// Works out the night's awards from everything that happened.
export async function computeAwards(sid, chars) {
  const snap = await getDocs(collection(db, 'sessions', sid, 'events'));
  const tally = {};
  const add = (key, uid, n = 1) => { if (!uid || !chars[uid]) return; (tally[key] ??= {}); tally[key][uid] = (tally[key][uid] ?? 0) + n; };
  snap.docs.forEach((d) => {
    const e = d.data();
    if (e.failed) return;
    const p = e.payload ?? {};
    if (e.type === 'attack') {
      add('damage', e.actorUid, p.dmg ?? 0);
      if (p.nat === 20) add('nat20', e.actorUid);
      if (p.nat === 1) add('nat1', e.actorUid);
    }
    if (e.type === 'roll' && Array.isArray(p.rolls) && String(p.label ?? '').startsWith('d20')) {
      const kept = p.total - (p.mod ?? 0);
      if (kept === 20) add('nat20', e.actorUid);
      if (kept === 1) add('nat1', e.actorUid);
    }
    if (e.type === 'open_chest') { if (p.nat === 20) add('nat20', e.actorUid); if (p.nat === 1) add('nat1', e.actorUid); if (p.ok) add('chests', e.actorUid); }
    if (e.type === 'monster_attack' && p.hit) add('tank', e.targetUid, p.dmg ?? 0);
    if (e.type === 'points' && p.delta > 0) add('points', e.targetUid, p.delta);
    if (e.type === 'lesson_passed') add('lessons', e.targetUid);
    if (e.type === 'spell_cast' || e.type === 'attack') add('spells', e.actorUid);
  });
  const DEFS = [
    ['damage', '⚔️', 'Heaviest Hitter', 'damage dealt'],
    ['tank', '🛡️', 'Unbreakable', 'damage taken'],
    ['points', '⏳', 'Point Machine', 'house points earned'],
    ['nat20', '🍀', 'Luckiest Wand', 'natural 20s'],
    ['nat1', '💀', 'Glorious Disaster', 'natural 1s'],
    ['lessons', '🎓', 'Top of the Class', 'lessons mastered'],
    ['chests', '🧰', 'Treasure Hunter', 'chests opened'],
    ['spells', '🪄', 'Wand Never Rests', 'spells and attacks'],
  ];
  return DEFS.map(([key, icon, title, unit]) => {
    const row = Object.entries(tally[key] ?? {}).sort((a, b) => b[1] - a[1])[0];
    if (!row || row[1] <= 0) return null;
    return { icon, title, unit, uid: row[0], name: chars[row[0]].firstName ?? chars[row[0]].name, value: row[1] };
  }).filter(Boolean);
}

// The House Cup: shown on the TV, and recorded as a trophy for every student in the winning house.
export async function houseCup(sid, session, chars) {
  const pts = session.state?.housePoints ?? {};
  const standings = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'].map((h) => [h, pts[h] ?? 0]).sort((a, b) => b[1] - a[1]);
  const winner = standings[0][0];
  const winners = Object.values(chars).filter((c) => c.house === winner);
  const batch = writeBatch(db);
  winners.forEach((c) => {
    batch.set(doc(db, 'users', c.uid, 'trophies', `${sid}-housecup`), {
      campaignId: session.campaignId, title: `House Cup: ${winner}`, icon: '🏆', awardedAt: new Date(),
    });
  });
  await batch.commit();
  await setShow(sid, { type: 'housecup', standings, winner, names: winners.map((c) => c.firstName ?? c.name) });
}
