// Owl Post: private letters from the GM to one player.
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { adjust, giveItem, logEvent } from './game';

const owls = (sid) => collection(db, 'sessions', sid, 'owls');

// parcel (optional): { items: [{ id, name, icon, qty, note?, kind?, effect? }], gold }
// Whatever is tied to the owl's leg goes straight into the student's bag, quietly: the TV only sees an owl.
export async function sendOwl(sid, toUid, from, text, parcel = null) {
  const items = (parcel?.items ?? []).filter((i) => i.name && i.qty > 0);
  const gold = Math.max(0, Math.round(parcel?.gold ?? 0));
  const has = items.length > 0 || gold > 0;
  for (const it of items) {
    const { qty, ...item } = it;
    await giveItem(sid, toUid, item, qty, { quiet: true });
  }
  if (gold) await adjust(sid, toUid, 'gold', gold, { quiet: true });
  await addDoc(owls(sid), {
    toUid, from: from || 'An unknown hand', text, read: false, createdAt: serverTimestamp(),
    ...(has ? { parcel: { items: items.map(({ id, name, icon, qty }) => ({ id, name, icon, qty })), gold } } : {}),
  });
  await logEvent(sid, { type: 'owl', targetUid: toUid }); // the TV only learns that an owl came
}

// "🧪 Sleeping Draught ×2, 🪙 5 Galleons"
export const parcelText = (p, currency = 'Galleons') => [
  ...(p?.items ?? []).map((i) => `${i.icon ?? '🎁'} ${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`),
  ...(p?.gold ? [`🪙 ${p.gold} ${currency}`] : []),
].join(', ');

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
