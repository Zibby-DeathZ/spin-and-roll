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

// ---- Moving staircases: tile openings as bits N=1 E=2 S=4 W=8, turned clockwise ----
export const rotMask = (m, r) => { let x = m; for (let i = 0; i < ((r % 4) + 4) % 4; i++) x = ((x << 1) | (x >> 3)) & 15; return x; };
export function stairsConnected(p, rots) {
  const n = p.size;
  const open = (r, c) => rotMask(p.tiles[r * n + c][0], rots[r * n + c]);
  if (!(open(0, 0) & 8)) return false;
  const seen = new Set(['0,0']);
  const stack = [[0, 0]];
  const opp = { 1: 4, 4: 1, 2: 8, 8: 2 };
  while (stack.length) {
    const [r, c] = stack.pop();
    const m = open(r, c);
    if (r === n - 1 && c === n - 1 && m & 2) return true;
    for (const [d, dr, dc] of [[1, -1, 0], [4, 1, 0], [2, 0, 1], [8, 0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (m & d && rr >= 0 && rr < n && cc >= 0 && cc < n && !seen.has(`${rr},${cc}`) && open(rr, cc) & opp[d]) {
        seen.add(`${rr},${cc}`); stack.push([rr, cc]);
      }
    }
  }
  return false;
}

// ---- Constellation: lines stored as "a-b" with a < b ----
export const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// ---- Rune floor: is this tile a safe next step? ----
export function runeStepOk(p, path, idx) {
  const cols = p.grid[0].length;
  const r = Math.floor(idx / cols), c = idx % cols;
  const letter = p.grid[r][c];
  const want = p.word[path.length % p.word.length];
  if (!path.length) return r === p.grid.length - 1 && letter === want;
  const last = path[path.length - 1];
  const lr = Math.floor(last / cols), lc = last % cols;
  const adjacent = (r === lr - 1 && c === lc) || (r === lr && Math.abs(c - lc) === 1);
  return adjacent && !path.includes(idx) && letter === want;
}

export function initialState(p) {
  switch (p.type) {
    case 'chess': return { board: fenToBoard(p.fen), last: null };
    case 'torches': return { lit: [...p.start] };
    case 'rings': return { pos: p.rings.map(() => 0) };
    case 'bottles': return { revealed: [] };
    case 'cipher': return { revealed: [...(p.given ?? [])] };
    case 'constellation': return { lines: [] };
    case 'stairs': return { rots: p.tiles.map((t) => t[1]) };
    case 'slider': return { tiles: [...p.start] };
    case 'runefloor': return { path: [], trapped: null };
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
    case 'constellation': {
      const want = new Set(p.answer.map(([a, b]) => edgeKey(a, b)));
      return st.lines.length === want.size && st.lines.every((l) => want.has(l));
    }
    case 'stairs': return stairsConnected(p, st.rots);
    case 'slider': return st.tiles.every((t, i) => t === (i === 8 ? 0 : i + 1));
    case 'runefloor': return st.path.length > 0 && Math.floor(st.path[st.path.length - 1] / p.grid[0].length) === 0;
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
