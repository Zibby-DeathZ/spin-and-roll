// The opening cutscene and "main event" phone lock.
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const sessionRef = (sid) => doc(db, 'sessions', sid);

// Seconds for the timed opening: studio ident, then the title card, then the closed book.
export const IDENT_MS = 8000;
export const TITLE_MS = 8500;

// stage: 'opening' (timed ident → title → closed book, then GM turns pages)
//        'choose'  (families on the book; phones unlocked to pick)
//        'closing' (book closes, then the game begins) · 'done'
export const startIntro = (sid) =>
  updateDoc(sessionRef(sid), { 'state.intro': { stage: 'opening', page: 0, at: Date.now() } });
export const introPage = (sid, page) => updateDoc(sessionRef(sid), { 'state.intro.page': page });
export const introStage = (sid, stage) =>
  updateDoc(sessionRef(sid), { 'state.intro.stage': stage, 'state.intro.at': Date.now() });
// Jumps past the video / ident / title to the closed book (and stops the video replaying).
export const skipToBook = (sid) =>
  updateDoc(sessionRef(sid), { 'state.intro.at': Date.now() - IDENT_MS - TITLE_MS - 1, 'state.intro.skipped': true });
// Skips the whole opening and lets players choose their families straight away.
export const skipIntro = (sid) =>
  updateDoc(sessionRef(sid), { 'state.intro': { stage: 'done', page: 0, at: Date.now(), skipped: true } });
export const setLock = (sid, on) => updateDoc(sessionRef(sid), { 'state.lock': on });
export const setMusicState = (sid, music) => updateDoc(sessionRef(sid), { 'state.music': music });

export function introActive(session) {
  const st = session?.state?.intro;
  return !!st && st.stage !== 'done';
}

// Families can only be chosen once the book reaches its family page (or the intro is over or skipped).
// A campaign without an intro lets players choose straight away.
export function canChooseFamily(session, data) {
  if (!data?.intro) return true;
  const stage = session?.state?.intro?.stage;
  return stage === 'choose' || stage === 'done';
}

// Phones are locked whenever everyone should be looking at the TV.
export function mainEvent(session) {
  const s = session?.state ?? {};
  if (s.lock) return true;
  const intro = s.intro;
  if (intro && (intro.stage === 'opening' || intro.stage === 'closing')) return true;
  if (s.puzzle && !s.puzzle.solved) return true;
  if (s.show) return true;
  return false;
}
