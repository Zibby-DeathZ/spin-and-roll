// The GM's session notes: player requests, rewards owed, diary entries, ideas.
// Kept on the GM's own account in a folder only the GM can read (the database rules already
// allow it: users/{gm}/imposter/* is GM-only), one document per game, so players can never see them.
import { deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const notesRef = (gmUid, sid) => doc(db, 'users', gmUid, 'imposter', `notes_${sid}`);

export const NOTE_KINDS = [
  ['request', '🙋', 'Request', 'Something a player asked for or wants to do'],
  ['reward', '🎁', 'Reward owed', 'Something you promised or want to give'],
  ['diary', '📔', 'Diary', 'What a student wrote in their diary'],
  ['note', '📝', 'Note', 'Anything that happened worth remembering'],
  ['idea', '💡', 'Idea', 'A plan or a twist for later'],
];
export const kindInfo = (k) => NOTE_KINDS.find((x) => x[0] === k) ?? NOTE_KINDS[3];

export function useNotes(gmUid, sid) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!gmUid || !sid) return undefined;
    return onSnapshot(notesRef(gmUid, sid), (s) => setState(s.exists() ? s.data() : { night: 1, entries: {} }), () => setState({ night: 1, entries: {}, error: true }));
  }, [gmUid, sid]);
  return state;
}

export async function addNote(gmUid, sid, note) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(notesRef(gmUid, sid), { entries: { [id]: { ...note, done: false, at: Date.now() } } }, { merge: true });
  return id;
}
export const setNote = (gmUid, sid, id, patch) => updateDoc(notesRef(gmUid, sid),
  Object.fromEntries(Object.entries(patch).map(([k, v]) => [`entries.${id}.${k}`, v])));
export const removeNote = (gmUid, sid, id) => updateDoc(notesRef(gmUid, sid), { [`entries.${id}`]: deleteField() });
export const setNight = (gmUid, sid, night) => setDoc(notesRef(gmUid, sid), { night }, { merge: true });

// The notes as plain text, grouped by night and then by student, to paste to Claude (or keep).
export function notesAsText({ title, notes, nameOf }) {
  const list = Object.entries(notes?.entries ?? {}).map(([id, n]) => ({ id, ...n })).sort((a, b) => a.at - b.at);
  const nights = [...new Set(list.map((n) => n.night ?? 1))].sort((a, b) => a - b);
  const lines = [`# ${title}: GM session notes`, ''];
  for (const night of nights) {
    lines.push(`## Session ${night}`, '');
    const here = list.filter((n) => (n.night ?? 1) === night);
    const who = [...new Set(here.map((n) => n.uid ?? ''))];
    for (const u of who) {
      lines.push(`### ${u ? nameOf(u) : 'Everyone / the game'}`);
      for (const n of here.filter((x) => (x.uid ?? '') === u)) {
        const [, icon, label] = kindInfo(n.kind);
        lines.push(`- ${n.done ? '[done] ' : ''}${icon} ${label}${n.when ? ` (${n.when})` : ''}: ${n.text.replace(/\n+/g, ' ')}`);
      }
      lines.push('');
    }
  }
  if (!list.length) lines.push('No notes yet.');
  return lines.join('\n');
}
