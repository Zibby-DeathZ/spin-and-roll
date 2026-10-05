// Characters saved to player profiles, so they can carry into the next year of a series.
import { collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { levelFor } from './game';

// What carries over. Live, per-game things (HP, positions, once-a-day uses) are left behind.
const KEEP = ['name', 'firstName', 'family', 'familyName', 'house', 'xp', 'stats', 'maxHp', 'maxMana', 'gold',
  'equipment', 'inventory', 'spells', 'perks', 'expelled'];

export async function saveHeroes(sid, session, data) {
  if (!data?.series) return 0;
  const snap = await getDocs(collection(db, 'sessions', sid, 'characters'));
  const batch = writeBatch(db);
  let n = 0;
  snap.docs.forEach((d) => {
    const c = d.data();
    if (!session.playerUids.includes(d.id)) return;
    const hero = Object.fromEntries(KEEP.filter((k) => c[k] !== undefined).map((k) => [k, c[k]]));
    batch.set(doc(db, 'users', d.id, 'heroes', data.series), {
      ...hero, level: levelFor(c.xp), series: data.series, seriesName: data.seriesName ?? data.series,
      year: data.year ?? 1, campaignId: session.campaignId, sessionId: sid, savedAt: serverTimestamp(),
    });
    n++;
  });
  await batch.commit();
  return n;
}

export function useHeroes(uid) {
  const [heroes, setHeroes] = useState([]);
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(collection(db, 'users', uid, 'heroes'), (s) => setHeroes(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [uid]);
  return heroes;
}

export async function loadHero(uid, series) {
  const s = await getDoc(doc(db, 'users', uid, 'heroes', series));
  return s.exists() ? s.data() : null;
}
