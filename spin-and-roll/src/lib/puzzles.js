// TV puzzles. The state lives on the session so the TV mirrors the GM board live.
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logEvent } from './game';

const sessionRef = (sid) => doc(db, 'sessions', sid);

// ---- Chess helpers ----
export function fenToBoard(fen) {
  const board = {};
  fen.split(' ')[0].split('/').forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else { board[`${'abcdefgh'[f]}${8 - r}`] = { p: ch }; f++; }
    }
  });
  return board;
}
export const GLYPH = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
export const PIECE_NAME = { k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn' };

// ---- Cipher helpers: a fixed letter → rune substitution ----
const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚬᚭ';
const ORDER = 'QWXZJKVBPYGFMUCLDRHSNIOATE';
export const runeFor = (ch) => (/[A-Z]/.test(ch) ? RUNES[ORDER.indexOf(ch)] : ch);
export const lettersIn = (msg) => [...new Set(msg.replace(/[^A-Z]/g, '').split(''))].sort();

// ---- Torches ----
export function flipTorches(lit, size, i) {
  const r = Math.floor(i / size), c = i % size;
  const next = [...lit];
  for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < size && cc >= 0 && cc < size) next[rr * size + cc] ^= 1;
  }
  return next;
}

export function initialState(p) {
  switch (p.type) {
    case 'chess': return { board: fenToBoard(p.fen), last: null };
    case 'torches': return { lit: [...p.start] };
    case 'rings': return { pos: p.rings.map(() => 0) };
    case 'bottles': return { revealed: [] };
    case 'cipher': return { revealed: [...(p.given ?? [])] };
    default: return {};
  }
}

// Has the puzzle been solved, judging by its live state?
export function isSolved(p, st) {
  if (!st) return false;
  switch (p.type) {
    case 'torches': return st.lit.every((x) => x === 1);
    case 'rings': return p.rings.every((ring, i) => ring[st.pos[i]] === p.answer[i]);
    case 'bottles': return st.revealed.some((i) => p.bottles[i].kind === 'forward');
    case 'cipher': return lettersIn(p.message).every((l) => st.revealed.includes(l));
    default: return false; // chess: the GM judges
  }
}

export async function startPuzzle(sid, p) {
  await updateDoc(sessionRef(sid), { 'state.puzzle': { id: p.id, solved: false, ...initialState(p) } });
  await logEvent(sid, { type: 'puzzle_start', payload: { title: p.title, icon: p.icon } });
}
export const setPuzzle = (sid, patch) =>
  updateDoc(sessionRef(sid), Object.fromEntries(Object.entries(patch).map(([k, v]) => [`state.puzzle.${k}`, v])));
export async function markSolved(sid, p) {
  await updateDoc(sessionRef(sid), { 'state.puzzle.solved': true });
  await logEvent(sid, { type: 'puzzle_solved', payload: { title: p.title, icon: p.icon } });
}
export const closePuzzle = (sid) => updateDoc(sessionRef(sid), { 'state.puzzle': deleteField() });
