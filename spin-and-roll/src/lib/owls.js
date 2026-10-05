// Owl Post: private letters from the GM to one player.
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { logEvent } from './game';

const owls = (sid) => collection(db, 'sessions', sid, 'owls');

export async function sendOwl(sid, toUid, from, text) {
  await addDoc(owls(sid), { toUid, from: from || 'An unknown hand', text, read: false, createdAt: serverTimestamp() });
  await logEvent(sid, { type: 'owl', targetUid: toUid }); // the TV only learns that an owl came
}

export const markRead = (sid, id) => updateDoc(doc(db, 'sessions', sid, 'owls', id), { read: true });

// A player sees only their own letters (the database rules enforce this too).
export function useMyOwls(sid, uid) {
  const [list, setList] = useState([]);
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(query(owls(sid), where('toUid', '==', uid)), (s) =>
      setList(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))));
  }, [sid, uid]);
  return list;
}

// The GM sees everything they've sent.
export function useAllOwls(sid) {
  const [list, setList] = useState([]);
  useEffect(() => onSnapshot(owls(sid), (s) =>
    setList(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)))), [sid]);
  return list;
}
