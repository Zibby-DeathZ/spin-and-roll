import {
  addDoc, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot,
  query, serverTimestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { getCampaign } from '../campaigns';

// No 0/O or 1/I so codes are easy to read off the TV.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () =>
  Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export const OPEN = ['lobby', 'active'];

export async function createSession(campaignId, dmUid) {
  const ref = await addDoc(collection(db, 'sessions'), {
    campaignId,
    dmUid,
    code: makeCode(),
    status: 'lobby',
    playerUids: [],
    createdAt: serverTimestamp(),
    startedAt: null,
    endedAt: null,
  });
  return ref.id;
}

export async function joinSession(rawCode, uid) {
  const code = rawCode.toUpperCase().trim();
  const snap = await getDocs(query(collection(db, 'sessions'), where('code', '==', code)));
  const open = snap.docs.find((d) => OPEN.includes(d.data().status));
  if (!open) throw new Error('No open game uses that code. Check the code on the TV.');
  if (!open.data().playerUids.includes(uid)) {
    await updateDoc(open.ref, { playerUids: arrayUnion(uid) });
  }
  return open.id;
}

export const startSession = (sid) =>
  updateDoc(doc(db, 'sessions', sid), { status: 'active', startedAt: serverTimestamp() });

// Closes the game and writes the result + trophy onto every player's account.
export async function endSession(session, result) {
  const campaign = getCampaign(session.campaignId);
  const batch = writeBatch(db);
  batch.update(doc(db, 'sessions', session.id), { status: result, endedAt: serverTimestamp() });
  for (const uid of session.playerUids) {
    batch.set(doc(db, 'users', uid, 'history', session.id), {
      campaignId: session.campaignId,
      campaignTitle: campaign?.title ?? session.campaignId,
      result,
      endedAt: serverTimestamp(),
    });
    if (result === 'won' && campaign?.trophy) {
      batch.set(doc(db, 'users', uid, 'trophies', session.id), {
        campaignId: session.campaignId,
        ...campaign.trophy,
        awardedAt: serverTimestamp(),
      });
    }
  }
  await batch.commit();
}

// ---- Live hooks ----

export function useSession(sid) {
  const [session, setSession] = useState(undefined);
  useEffect(
    () => onSnapshot(doc(db, 'sessions', sid), (s) =>
      setSession(s.exists() ? { id: s.id, ...s.data() } : null)),
    [sid]
  );
  return session;
}

export function useQueryList(q, deps) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    if (!q) return undefined;
    return onSnapshot(q, (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return rows;
}

// Looks up display names for a list of player ids.
export function useProfiles(uids = []) {
  const [profiles, setProfiles] = useState({});
  const key = uids.join(',');
  useEffect(() => {
    let alive = true;
    Promise.all(uids.map((u) => getDoc(doc(db, 'users', u)))).then((snaps) => {
      if (!alive) return;
      setProfiles(Object.fromEntries(snaps.map((s) => [s.id, s.data()])));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return profiles;
}

export const byNewest = (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
