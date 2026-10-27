// Games a person has hidden from their own dashboard. Stored on their profile
// (users/{uid}.hidden), so nothing is deleted: history, trophies and the game itself stay safe,
// and anything hidden can be brought back with "Show hidden".
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const hideGame = (uid, sid) => updateDoc(doc(db, 'users', uid), { hidden: arrayUnion(sid) });
export const unhideGame = (uid, sid) => updateDoc(doc(db, 'users', uid), { hidden: arrayRemove(sid) });
export const hiddenSet = (profile) => new Set(profile?.hidden ?? []);
