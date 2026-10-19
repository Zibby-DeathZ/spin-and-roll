// The Marauder's Map: opened by voice on the holder's phone, shown live on the TV for 60 seconds, once per day.
// state.marauders = { open, by, at, ms, full, usedDawn, closedAt }
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../firebase';
import { clockOf, logEvent } from './game';

const sessionRef = (sid) => doc(db, 'sessions', sid);

// ---------- The words ----------
const norm = (t) => String(t ?? '').toLowerCase()
  .replace(/\bi'?m\b/g, 'i am').replace(/[’']/g, '').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// Close enough to count, so a slightly misheard phrase still works (about 80% the same).
export function saysPhrase(heard, phrase, need = 0.8) {
  const h = norm(heard), p = norm(phrase);
  if (!h || !p) return false;
  if (h.includes(p)) return true;
  // Compare against the stretch of what was heard that's closest in length to the phrase.
  const words = h.split(' '), want = p.split(' ').length;
  let best = 0;
  for (let len = Math.max(1, want - 2); len <= want + 2; len++) {
    for (let i = 0; i <= Math.max(0, words.length - len); i++) {
      const chunk = words.slice(i, i + len).join(' ');
      best = Math.max(best, 1 - lev(chunk, p) / Math.max(chunk.length, p.length));
    }
  }
  return best >= need;
}

// ---------- Who holds what ----------
export const mapItemIds = (data) => Object.values(data.marauders?.halves ?? {});
export const holdsMap = (data, c) => (c?.inventory ?? []).some((i) => mapItemIds(data).includes(i.id));
export const holdsBoth = (data, c) => mapItemIds(data).every((id) => (c?.inventory ?? []).some((i) => i.id === id));
// Which halves a reader can see: the left (Fenwick) half, the right half, or both.
export function halvesOf(data, c) {
  const h = data.marauders?.halves ?? {};
  const has = (id) => (c?.inventory ?? []).some((i) => i.id === id);
  return { left: has(h.left), right: has(h.right) };
}

// ---------- Opening and closing (players go through item_used events; see game.js) ----------
export function openState(data, session, uid, c) {
  const dawn = clockOf(session).dawn;
  return { open: true, by: uid, at: Date.now(), ms: data.marauders?.ms ?? 60000, halves: halvesOf(data, c), usedDawn: dawn };
}

export const sayOpen = (sid, uid, itemId) =>
  logEvent(sid, { type: 'item_used', actorUid: uid, processed: false, payload: { itemId, map: 'open' } });
export const sayClose = (sid, uid, itemId) =>
  logEvent(sid, { type: 'item_used', actorUid: uid, processed: false, payload: { itemId, map: 'close' } });

// GM: open it for the table without the words (doesn't use up the day), or close it.
export const gmOpenMap = (sid, data, which = 'both') => updateDoc(sessionRef(sid), {
  'state.marauders.open': true, 'state.marauders.by': null, 'state.marauders.at': Date.now(),
  'state.marauders.ms': data.marauders?.ms ?? 60000,
  'state.marauders.halves': { left: which !== 'right', right: which !== 'left' },
});
export const closeMap = (sid) => updateDoc(sessionRef(sid), { 'state.marauders.open': false, 'state.marauders.closedAt': Date.now() });
export const restMap = (sid) => updateDoc(sessionRef(sid), { 'state.marauders.usedDawn': null });

// GM screen: the ink fades when the time is up.
export function useMaraudersEngine(sid, session) {
  const m = session?.state?.marauders;
  useEffect(() => {
    if (!m?.open) return undefined;
    const t = setTimeout(() => closeMap(sid).catch(console.error), Math.max(0, (m.at ?? 0) + (m.ms ?? 60000) - Date.now()));
    return () => clearTimeout(t);
  }, [sid, m?.open, m?.at, m?.ms]);
}

// ---------- What the map shows ----------
// People, creatures and treasure, from the live tokens and the players' positions.
export function mapMarks(data, session, chars) {
  const cfg = data.marauders ?? {};
  const people = [], treasure = [];
  for (const [id, t] of Object.entries(session.state?.tokens ?? {})) {
    if (!t.loc || !cfg.layout?.[t.loc]) continue;
    if (t.mimic) {
      // The map never lies: a mimic shows by its true name.
      people.push({ id, loc: t.loc, name: data.mimics?.[t.mimic]?.name ?? t.name, kind: 'creature' });
    } else if (t.kind === 'chest') {
      if (!t.opened) treasure.push({ id, loc: t.loc, name: t.name ?? 'Chest' });
    } else if (t.kind === 'item') {
      treasure.push({ id, loc: t.loc, name: t.name ?? 'Something' });
    } else if (t.kind === 'hazard') {
      // not shown
    } else if (t.npc) {
      people.push({ id, loc: t.loc, name: cfg.smudged?.[t.kind] ?? t.name, kind: 'person', float: (cfg.floaters ?? []).includes(t.kind), smudged: !!cfg.smudged?.[t.kind] });
    } else if ((t.hp ?? 0) > 0) {
      people.push({ id, loc: t.loc, name: t.name, kind: 'creature' });
    }
  }
  for (const [uid, p] of Object.entries(session.state?.pcPos ?? {})) {
    const c = chars?.[uid];
    if (c && cfg.layout?.[p.loc]) people.push({ id: `pc:${uid}`, loc: p.loc, name: c.firstName ?? c.name, kind: 'student' });
  }
  return { people, treasure };
}

// Corridors between rooms on the map, from the locations' exits.
export function corridors(data) {
  const lay = data.marauders?.layout ?? {};
  const out = [];
  const seen = new Set();
  for (const l of data.locations ?? []) {
    for (const x of l.exits ?? []) {
      const k = [l.id, x].sort().join('|');
      if (lay[l.id] && lay[x] && !seen.has(k)) { seen.add(k); out.push([l.id, x]); }
    }
  }
  return out;
}

// The shortest way between two rooms along the corridors (room ids, both ends included).
export function route(data, from, to) {
  if (from === to) return [from];
  const adj = {};
  for (const [a, b] of corridors(data)) { (adj[a] ??= []).push(b); (adj[b] ??= []).push(a); }
  const prev = { [from]: null };
  const q = [from];
  while (q.length) {
    const n = q.shift();
    if (n === to) break;
    for (const x of adj[n] ?? []) if (!(x in prev)) { prev[x] = n; q.push(x); }
  }
  if (!(to in prev)) return [from, to];
  const path = [];
  for (let n = to; n != null; n = prev[n]) path.unshift(n);
  return path;
}
