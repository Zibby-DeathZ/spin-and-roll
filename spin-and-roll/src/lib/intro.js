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
export const skipToBook = (sid) =>
  updateDoc(sessionRef(sid), { 'state.intro.at': Date.now() - IDENT_MS - TITLE_MS - 1 });
export const setLock = (sid, on) => updateDoc(sessionRef(sid), { 'state.lock': on });
export const setMusicState = (sid, music) => updateDoc(sessionRef(sid), { 'state.music': music });

export function introActive(session) {
  const st = session?.state?.intro;
  return !!st && st.stage !== 'done';
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
