// The living castle: when time advances, everyone moves to where they should be,
// the block's monsters, items, chests and hazards appear, and passing monsters leave.
import { collection, doc, getDoc, getDocs, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { chestToken, hazardToken, itemToken } from './world';
import { doubleToken, trunkToken } from './mimic';
import { giveQuest } from './world';
import { sendOwl } from './owls';

const sessionRef = (sid) => doc(db, 'sessions', sid);

// '0-2' in the prologue, '3-Lunch' during the week.
export function slotKey(data, clk) {
  if (!clk || clk.day === 0) return `0-${clk?.block ?? 0}`;
  return `${clk.day}-${data.clock.blocks[clk.block]}`;
}
// A number that grows through the week, for "from … to …" ranges.
export function slotIndex(data, key) {
  const [d, b] = [Number(key.split('-')[0]), key.slice(key.indexOf('-') + 1)];
  if (d === 0) return Number(b);
  return 10 + (d - 1) * data.clock.blocks.length + data.clock.blocks.indexOf(b);
}
const clockIndex = (data, clk) => slotIndex(data, slotKey(data, clk));

export function npcLocAt(data, npcId, clk) {
  const r = data.routines?.[npcId];
  if (!r) return undefined;
  if (clk.day === 0) return r.prologue?.[clk.block] ?? null;
  const block = data.clock.blocks[clk.block];
  const over = r.days?.[clk.day];
  if (over && block in over) return over[block];
  return r.base?.[block] ?? null;
}

// Everyone at a location right now, according to the schedule.
export function whoIsWhere(data, clk) {
  const out = {};
  for (const id of Object.keys(data.routines ?? {})) {
    const loc = npcLocAt(data, id, clk);
    if (loc) (out[loc] ??= []).push(id);
  }
  return out;
}

// Quests someone could hand out right now (and that haven't been given yet).
export function offersNow(data, session) {
  const clk = session?.state?.clock ?? { day: 0, block: 0 };
  const idx = clockIndex(data, clk);
  const given = session?.state?.quests ?? {};
  return (data.offers ?? [])
    .filter((o) => !given[o.quest] && idx >= slotIndex(data, o.from) && idx <= slotIndex(data, o.to))
    .map((o) => ({ ...o, q: data.quests.find((x) => x.id === o.quest) }))
    .filter((o) => o.q);
}

// What a person can talk about today.
export function talkNow(data, npcId, clk) {
  const t = data.talk?.[npcId];
  if (!t) return null;
  const d = clk?.day ?? 0;
  return { ...t, topics: t.topics.filter((x) => d >= (x.from ?? 0) && d <= (x.to ?? 99)) };
}

function spawnToken(data, s) {
  const pos = { x: s.x ?? 30 + Math.random() * 40, y: s.y ?? 30 + Math.random() * 30 };
  let t;
  if (s.type === 'item') t = itemToken(data, s.item, s.loc);
  else if (s.type === 'chest') t = chestToken(data, s.chest, s.loc);
  else if (s.type === 'hazard') t = hazardToken(data, s.hazard, s.loc);
  else if (s.type === 'mimic') t = s.mimic === 'hungry-trunk' ? trunkToken(data, s.loc) : doubleToken(data, s.loc, s.copies ?? 'ghost');
  else if (s.type === 'npc') {
    const b = data.bestiary[s.npc];
    t = { kind: s.npc, name: s.name ?? b.name, icon: b.icon, npc: true, loc: s.loc };
  } else {
    const b = data.bestiary[s.kind];
    t = { kind: s.kind, loc: s.loc, icon: b.icon, name: b.name, npc: false, hp: b.hp, maxHp: b.hp, defence: b.defence, boss: !!b.boss };
  }
  return { ...t, ...pos, spawnId: s.id, transient: !!s.transient };
}

// Applies the schedule for the current clock. Safe to call more than once.
export async function applyWorld(sid, data, clkIn = null) {
  if (!data?.routines) return;
  const snap = await getDoc(sessionRef(sid));
  const st = snap.data()?.state ?? {};
  if (st.autoWorld === false) return;
  const clk = clkIn ?? st.clock ?? { day: 0, block: 0, dawn: 0 };
  const key = slotKey(data, clk);
  const tokens = st.tokens ?? {};
  const fighting = new Set((st.encounter?.order ?? []).map((o) => o.id));
  const upd = {};

  // 1. Passing monsters leave when the block changes (unless they're mid-fight or beaten).
  for (const [id, t] of Object.entries(tokens)) {
    if (t.transient && t.slot !== key && !fighting.has(id) && !(t.hp === 0)) upd[`state.tokens.${id}`] = deleteField();
  }

  // 2. People go where the schedule says.
  const here = whoIsWhere(data, clk);
  const placed = {};
  for (const npcId of Object.keys(data.routines)) {
    const loc = npcLocAt(data, npcId, clk);
    const entry = Object.entries(tokens).find(([, t]) => t.kind === npcId && !t.mimic && !t.spawnId);
    const id = entry?.[0] ?? `npc-${npcId}`;
    if (!loc) {
      if (entry && entry[1].loc !== '_away') upd[`state.tokens.${id}.loc`] = '_away';
      continue;
    }
    const i = (placed[loc] = (placed[loc] ?? -1) + 1);
    const slot = { x: 16 + (i % 5) * 17, y: 24 + Math.floor(i / 5) * 14 };
    if (entry && entry[1].loc === loc) continue; // already there: keep wherever the GM put them
    const b = data.bestiary[npcId];
    upd[`state.tokens.${id}`] = { ...(entry?.[1] ?? { kind: npcId, name: b.name, icon: b.icon, npc: true }), loc, ...slot };
  }
  void here;

  // 3. This block's appearances and removals (each happens once).
  const sch = data.schedule?.[key];
  const spawned = st.spawned ?? {};
  for (const rid of sch?.remove ?? []) {
    const hit = Object.entries(tokens).find(([, t]) => t.spawnId === rid);
    if (hit) upd[`state.tokens.${hit[0]}`] = deleteField();
    upd[`state.spawned.${rid}`] = true;
  }
  for (const s of sch?.spawn ?? []) {
    if (spawned[s.id]) continue;
    const t = spawnToken(data, s);
    if (s.transient) t.slot = key;
    upd[`state.tokens.sp-${s.id}`] = t;
    upd[`state.spawned.${s.id}`] = true;
  }

  if (Object.keys(upd).length) await updateDoc(sessionRef(sid), upd);
}

export const setAutoWorld = (sid, on) => updateDoc(sessionRef(sid), { 'state.autoWorld': on });


// ---------- Missed quests arrive by owl ----------
// Quests whose window closed without anyone taking them, and that haven't been owled yet.
export function missedOffers(data, session) {
  const clk = session?.state?.clock ?? { day: 0, block: 0 };
  const idx = clockIndex(data, clk);
  const given = session?.state?.quests ?? {};
  const owled = session?.state?.questOwls ?? {};
  return (data.offers ?? []).filter((o) => o.owl && !given[o.quest] && !owled[o.quest] && idx > slotIndex(data, o.to));
}
// Is this the last block a quest is on offer?
export const lastChance = (data, session, o) =>
  slotIndex(data, o.to) === clockIndex(data, session?.state?.clock ?? { day: 0, block: 0 });

export const setAutoOwls = (sid, on) => updateDoc(sessionRef(sid), { 'state.autoOwls': on });

// Sends an owl for every missed quest and gives it to the students it was written for.
export async function owlMissedQuests(sid, data, { force = false } = {}) {
  if (!data?.offers) return [];
  const snap = await getDoc(sessionRef(sid));
  const session = snap.data();
  if (!session || (!force && session.state?.autoOwls === false)) return [];
  const missed = missedOffers(data, session);
  if (!missed.length) return [];
  const chars = Object.fromEntries((await getDocs(collection(db, 'sessions', sid, 'characters'))).docs.map((d) => [d.id, d.data()]));
  const all = (session.playerUids ?? []).filter((u) => chars[u] && !chars[u].expelled);
  if (!all.length) return [];
  const sent = [];
  for (const o of missed) {
    let uids = all;
    if (o.owl.to === 'one') uids = [all[Math.floor(Math.random() * all.length)]];
    else if (o.owl.to?.startsWith('family:')) {
      const fam = all.filter((u) => chars[u].family === o.owl.to.slice(7));
      uids = fam.length ? fam : all;
    }
    // Mark first, so two quick clicks can't send it twice.
    await updateDoc(sessionRef(sid), { [`state.questOwls.${o.quest}`]: uids });
    const q = data.quests.find((x) => x.id === o.quest);
    for (const u of uids) await sendOwl(sid, u, o.owl.from, o.owl.text);
    if (q) await giveQuest(sid, data, o.quest, uids, { quiet: true });
    sent.push(o.quest);
  }
  return sent;
}
