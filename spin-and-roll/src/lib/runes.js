// The rune notebook. The party's confirmed letters live on the session (state.runes.known) so every
// phone shows them in ink; each player's own guesses are pencilled in on their phone only.
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { logEvent } from './game';

const sessionRef = (sid) => doc(db, 'sessions', sid);
export const knownRunes = (session) => session?.state?.runes?.known ?? [];

// Adds letters to everyone's notebook and tells the TV which ones are new.
export async function learnRunes(sid, letters, source = null, quiet = false) {
  const want = [...new Set(letters.map((l) => String(l).toUpperCase()).filter((l) => /^[A-Z]$/.test(l)))];
  if (!want.length) return [];
  const known = knownRunes((await getDoc(sessionRef(sid))).data());
  const fresh = want.filter((l) => !known.includes(l));
  if (!fresh.length) return [];
  await updateDoc(sessionRef(sid), { 'state.runes.known': arrayUnion(...fresh) });
  if (!quiet) await logEvent(sid, { type: 'runes_learned', payload: { letters: fresh.sort(), source } });
  return fresh;
}

export const forgetRune = (sid, letter) => updateDoc(sessionRef(sid), { 'state.runes.known': arrayRemove(letter) });
export const clearRunes = (sid) => updateDoc(sessionRef(sid), { 'state.runes.known': [] });

// Letters a clue teaches when its runes are worked out (rune tablets, diary pages, the torn map edge).
export function lettersOfClue(def) {
  const r = def?.read;
  if (!r) return [];
  const text = [...(r.pages ?? []), ...(r.words ?? []).map((w) => w.word)].join(' ');
  return [...new Set(text.replace(/[^A-Z]/g, '').split(''))].sort();
}

// A player's pencilled guesses: rune → letter, kept on this phone only.
export function usePencil(sid, uid) {
  const key = `runes:${sid}:${uid}`;
  const [map, setMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(map)); } catch { /* storage blocked: guesses last until reload */ }
  }, [key, map]);
  const pencil = (rune, letter) => setMap((m) => {
    const next = { ...m };
    if (letter) next[rune] = letter; else delete next[rune];
    return next;
  });
  return [map, pencil];
}
