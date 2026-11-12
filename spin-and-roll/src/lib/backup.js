import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebase';

// Saves everything a Game Master owns into one file: their games (with characters, owls, claims, lessons and
// so on), every player's account and trophies, and the GM's own notes. The local game server (the local folder)
// loads this file with "Import Game.bat". The busy feed of events is left out on purpose: it is only animation.

const SESSION_PARTS = ['characters', 'claims', 'owls', 'trades', 'answers', 'lessons', 'imposter', 'imposterVotes'];
const USER_PARTS = ['history', 'heroes', 'trophies'];

// Firestore timestamps become { __ts: milliseconds } so they survive as plain JSON.
function plain(v) {
  if (v instanceof Timestamp) return { __ts: v.toMillis() };
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
}

async function grab(path, out, onCount) {
  const snap = await getDocs(collection(db, ...path));
  snap.docs.forEach((d) => { out[[...path, d.id].join('/')] = plain(d.data()); });
  onCount?.(Object.keys(out).length);
  return snap.docs;
}

export async function exportEverything(gmUid, onCount) {
  const docs = {};
  const sessions = await getDocs(query(collection(db, 'sessions'), where('dmUid', '==', gmUid)));
  const people = new Set([gmUid]);
  for (const s of sessions.docs) {
    docs[`sessions/${s.id}`] = plain(s.data());
    (s.data().playerUids ?? []).forEach((u) => people.add(u));
    for (const part of SESSION_PARTS) await grab(['sessions', s.id, part], docs, onCount);
  }
  for (const uid of people) {
    const u = await getDoc(doc(db, 'users', uid));
    if (!u.exists()) continue;
    docs[`users/${uid}`] = plain(u.data());
    for (const part of USER_PARTS) await grab(['users', uid, part], docs, onCount);
  }
  // The GM's private notes and word lists.
  await grab(['users', gmUid, 'imposter'], docs, onCount);
  return { app: 'spin-and-roll', version: 1, exportedAt: Date.now(), gmUid, docs };
}

export function downloadJson(obj, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
