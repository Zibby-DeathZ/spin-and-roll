// The Painted Double: an Imposter-style party game.
// Everyone in the round gets the same secret word on their phone, except one player (the Double),
// who only gets a hint. Players take turns saying one word about it, then vote on who the Double is.
//
// Secrecy: each player's card lives in sessions/{sid}/imposter/{uid}, which only that player and the
// DM can read. The shared session state only says what stage the round is at, and only reveals the
// Double and the word at the end.
import { arrayUnion, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const cardRef = (sid, uid) => doc(db, 'sessions', sid, 'imposter', uid);
const votesCol = (sid) => collection(db, 'sessions', sid, 'imposterVotes');

// ---------- The DM's word list (kept on the DM's account, so it carries over between games) ----------
const bankRef = (uid, campaignId) => doc(db, 'users', uid, 'imposter', campaignId);

export function useWordBank(uid, campaignId) {
  const [words, setWords] = useState(null);
  useEffect(() => {
    if (!uid || !campaignId) return undefined;
    return onSnapshot(bankRef(uid, campaignId), (s) => setWords(s.exists() ? (s.data().words ?? []) : []), () => setWords([]));
  }, [uid, campaignId]);
  return words;
}

export const saveWordBank = (uid, campaignId, words) =>
  setDoc(bankRef(uid, campaignId), { words, updatedAt: serverTimestamp() });

export const newWordId = () => Math.random().toString(36).slice(2, 9);

// "word | hint" per line → entries. Lines without a hint are skipped (every word needs one).
export function parseWordLines(text) {
  const out = [];
  const skipped = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const i = line.indexOf('|');
    const word = (i >= 0 ? line.slice(0, i) : line).trim();
    const hint = (i >= 0 ? line.slice(i + 1) : '').trim();
    if (word && hint) out.push({ id: newWordId(), word, hint });
    else skipped.push(line);
  }
  return { words: out, skipped };
}

// ---------- A round ----------
export async function startRound(sid, { uids, entry, doubleUid }) {
  const round = Date.now().toString(36);
  const starter = uids[Math.floor(Math.random() * uids.length)];
  const batch = writeBatch(db);
  for (const u of uids) {
    batch.set(cardRef(sid, u), u === doubleUid
      ? { round, role: 'double', hint: entry.hint }
      : { round, role: 'word', word: entry.word });
  }
  batch.update(sessionRef(sid), {
    'state.imposter': { round, stage: 'clues', uids, starter, voted: [], wordId: entry.id, at: Date.now() },
  });
  await batch.commit();
}

export const setStage = (sid, stage) => updateDoc(sessionRef(sid), { 'state.imposter.stage': stage, 'state.imposter.at': Date.now() });

// Who got the most votes. A tie means nobody is caught.
export function tally(votes, uids) {
  const counts = Object.fromEntries(uids.map((u) => [u, 0]));
  for (const v of votes) if (v.vote in counts) counts[v.vote] += 1;
  const top = Math.max(0, ...Object.values(counts));
  const leaders = Object.keys(counts).filter((u) => counts[u] === top && top > 0);
  return { counts, accused: leaders.length === 1 ? leaders[0] : null };
}

export async function reveal(sid, im, votes, doubleUid) {
  const { counts, accused } = tally(votes, im.uids);
  const caught = accused === doubleUid;
  await updateDoc(sessionRef(sid), {
    'state.imposter.stage': caught ? 'guess' : 'done',
    'state.imposter.doubleUid': doubleUid,
    'state.imposter.counts': counts,
    'state.imposter.accused': accused,
    'state.imposter.result': caught ? null : 'escaped',
    'state.imposter.at': Date.now(),
  });
}

// After being caught, the Double gets one guess at the word. Right = they steal the win.
export const finishGuess = (sid, guessedRight) => updateDoc(sessionRef(sid), {
  'state.imposter.stage': 'done',
  'state.imposter.result': guessedRight ? 'stolen' : 'caught',
  'state.imposter.at': Date.now(),
});

// The word only goes into the shared state once the round is over.
export const showWord = (sid, word) => updateDoc(sessionRef(sid), { 'state.imposter.word': word });

export async function endRound(sid, im) {
  if (im?.uids) await Promise.all(im.uids.map((u) => deleteDoc(cardRef(sid, u)).catch(() => {})));
  const old = await getDocs(votesCol(sid));
  await Promise.all(old.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
  // Remember which words have been played this game, so random picks don't repeat.
  const upd = { 'state.imposter': null };
  if (im?.wordId) upd['state.imposterUsed'] = arrayUnion(im.wordId);
  await updateDoc(sessionRef(sid), upd);
}

export const resetUsed = (sid) => updateDoc(sessionRef(sid), { 'state.imposterUsed': [] });

// ---------- Players ----------
export function useMyCard(sid, uid, round) {
  const [card, setCard] = useState(null);
  useEffect(() => {
    if (!uid || !round) { setCard(null); return undefined; }
    return onSnapshot(cardRef(sid, uid), (s) => setCard(s.exists() ? s.data() : null), () => setCard(null));
  }, [sid, uid, round]);
  return card?.round === round ? card : null;
}

export const castVote = (sid, round, uid, vote) =>
  setDoc(doc(db, 'sessions', sid, 'imposterVotes', `${round}_${uid}`), { round, uid, vote, at: Date.now() });

// ---------- GM ----------
export function useRoundCards(sid, round) {
  const [cards, setCards] = useState({});
  useEffect(() => {
    if (!round) { setCards({}); return undefined; }
    return onSnapshot(query(collection(db, 'sessions', sid, 'imposter'), where('round', '==', round)),
      (s) => setCards(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))), () => setCards({}));
  }, [sid, round]);
  return cards;
}

export function useVotes(sid, round) {
  const [votes, setVotes] = useState([]);
  useEffect(() => {
    if (!round) { setVotes([]); return undefined; }
    return onSnapshot(query(votesCol(sid), where('round', '==', round)),
      (s) => setVotes(s.docs.map((d) => d.data())), () => setVotes([]));
  }, [sid, round]);
  return votes;
}

// Runs on the GM screen: tells the TV who has voted (never who they voted for).
export function useImposterEngine(sid, session) {
  const im = session?.state?.imposter;
  const votes = useVotes(sid, im?.stage === 'vote' ? im.round : null);
  const last = useRef('');
  useEffect(() => {
    if (!im || im.stage !== 'vote') return;
    const voted = [...new Set(votes.map((v) => v.uid))].filter((u) => im.uids.includes(u)).sort();
    const key = voted.join(',');
    if (key === last.current || key === [...(im.voted ?? [])].sort().join(',')) { last.current = key; return; }
    last.current = key;
    updateDoc(sessionRef(sid), { 'state.imposter.voted': voted }).catch(console.error);
  }, [sid, im, votes]);
}
