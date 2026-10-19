import { useEffect, useRef, useState } from 'react';
import Art, { useArtUrl } from './Art';
import {
  closePuzzle, edgeKey, flipTorches, GLYPH, initialState, isSolved, lettersIn, markSolved, PIECE_NAME, rotMask, runeFor,
  runeStepOk, setPuzzle, startPuzzle, stairsConnected,
} from '../lib/puzzles';

const FILES = 'abcdefgh';
const KIND_LABEL = { poison: '☠️ Poison', sleep: '💤 Sleep', back: '↩️ Way back', forward: '🔥 Way forward' };
const COLOURS = { green: '#3fae6a', red: '#d8453a', blue: '#5a8fe0', gold: '#e3b04b', purple: '#8e7cc3', clear: '#d9e6ee' };

// Faint background stars for the star chart (fixed, so they don't jump about).
const BG_STARS = Array.from({ length: 70 }, (_, i) => [((i * 37) % 100) + ((i * 13) % 7) / 7, ((i * 53) % 80) + ((i * 7) % 5) / 5, 0.12 + ((i * 11) % 5) * 0.05]);

// A torch in an iron bracket. Lit: a flickering flame. Dark: a wisp of smoke.
function Torch({ on }) {
  return (
    <svg viewBox="0 0 60 80" className="torch-svg" aria-hidden="true">
      <path d="M22 44 h16 l-4 30 h-8 z" fill="#5a3a22" stroke="#2a1a0e" strokeWidth="1.5" />
      <path d="M18 46 h24 M20 58 h20" stroke="#3a3440" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 74 v6" stroke="#3a3440" strokeWidth="4" />
      {on ? (
        <g className="flame">
          <path d="M30 6 C40 18 42 28 38 36 C36 42 24 42 22 36 C18 28 22 18 30 6 Z" fill="#ff9a2e" />
          <path d="M30 16 C36 24 36 31 33 36 C31 39 27 39 26 36 C24 31 25 24 30 16 Z" fill="#ffd36a" />
          <path d="M30 26 C32 30 32 34 30 37 C28 34 28 30 30 26 Z" fill="#fff6d6" />
        </g>
      ) : (
        <path className="smoke" d="M30 40 q-5 -8 0 -16 q5 -8 0 -16" fill="none" stroke="#8a8494" strokeWidth="2" strokeLinecap="round" opacity=".5" />
      )}
    </svg>
  );
}

// Three stone rings, one inside the other, each carved with symbols. The top one sits under the arrow.
// The lock's symbols can be pictures too: public/art/puzzles/lock-<name>.png
const LOCK_SYMBOLS = { '🌙': 'moon', '🦉': 'owl', '🐍': 'serpent', '⭐': 'star', '🗝️': 'key', '🦁': 'lion', '🦡': 'badger', '☀️': 'sun', '🦅': 'eagle' };
const LOCK_NAMES = Object.values(LOCK_SYMBOLS);
function useLockArt() {
  const urls = [
    useArtUrl('puzzles/lock-moon'), useArtUrl('puzzles/lock-owl'), useArtUrl('puzzles/lock-serpent'),
    useArtUrl('puzzles/lock-star'), useArtUrl('puzzles/lock-key'), useArtUrl('puzzles/lock-lion'),
    useArtUrl('puzzles/lock-badger'), useArtUrl('puzzles/lock-sun'), useArtUrl('puzzles/lock-eagle'),
  ]; // same order as LOCK_NAMES
  return Object.fromEntries(Object.entries(LOCK_SYMBOLS).map(([sym, n]) => [sym, urls[LOCK_NAMES.indexOf(n)]]));
}

function RingDial({ rings, pos }) {
  const R = [168, 118, 68];
  const dial = useArtUrl('puzzles/lock-dial');
  const symArt = useLockArt();
  return (
    <svg viewBox="0 0 400 400" className="ring-dial" role="img" aria-label="The turning lock">
      <defs>
        <radialGradient id="ring-stone" cx="45%" cy="40%" r="70%"><stop offset="0" stopColor="#5a5468" /><stop offset="1" stopColor="#2a2636" /></radialGradient>
        {/* Each ring is a band cut from the dial picture, so the carving turns with the ring. */}
        {R.map((r, i) => (
          <mask key={i} id={`ring-band-${i}`}>
            <circle cx="200" cy="200" r={r + 24} fill="white" /><circle cx="200" cy="200" r={r - 24} fill="black" />
          </mask>
        ))}
      </defs>
      {dial && <circle cx="200" cy="200" r="196" fill="#16131f" />}
      {rings.map((ring, r) => {
        const n = ring.length;
        const rot = -(pos[r] * 360) / n;
        return (
          <g key={r}>
            {dial
              ? (
                <g mask={`url(#ring-band-${r})`}>
                  <image href={dial} x="4" y="4" width="392" height="392"
                    style={{ transform: `rotate(${rot}deg)`, transformOrigin: '200px 200px', transition: 'transform .6s cubic-bezier(.3, 1.3, .5, 1)' }} />
                </g>
              )
              : <circle cx="200" cy="200" r={R[r] + 24} fill="url(#ring-stone)" stroke="#16131f" strokeWidth="3" />}
            {dial && <circle cx="200" cy="200" r={R[r] + 24} fill="none" stroke="#16131f" strokeWidth="3" />}
            <circle cx="200" cy="200" r={R[r] - 24} fill="none" stroke="#16131f" strokeWidth="3" />
            <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: '200px 200px', transition: 'transform .6s cubic-bezier(.3, 1.3, .5, 1)' }}>
              {ring.map((sym, k) => {
                const a = ((k * 360) / n - 90) * (Math.PI / 180);
                const x = 200 + R[r] * Math.cos(a), y = 200 + R[r] * Math.sin(a);
                return (
                  <g key={k} style={{ transform: `rotate(${-rot}deg)`, transformOrigin: `${x}px ${y}px`, transition: 'transform .6s cubic-bezier(.3, 1.3, .5, 1)' }}>
                    {symArt[sym]
                      ? <image href={symArt[sym]} x={x - (r === 2 ? 23 : 27)} y={y - (r === 2 ? 23 : 27)} width={r === 2 ? 46 : 54} height={r === 2 ? 46 : 54}
                        opacity={k === pos[r] ? 1 : 0.75} className={k === pos[r] ? 'sym-on' : ''} />
                      : <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={r === 2 ? 30 : 34} opacity={k === pos[r] ? 1 : 0.55}>{sym}</text>}
                  </g>
                );
              })}
            </g>
          </g>
        );
      })}
      {dial ? (
        <>
          <clipPath id="ring-core"><circle cx="200" cy="200" r="40" /></clipPath>
          <image href={dial} x="4" y="4" width="392" height="392" clipPath="url(#ring-core)" />
          <circle cx="200" cy="200" r="40" fill="none" stroke="#16131f" strokeWidth="3" />
        </>
      ) : (
        <>
          <circle cx="200" cy="200" r="40" fill="#1a1724" stroke="#a9813e" strokeWidth="3" />
          <path d="M200 182 a8 8 0 1 1 -0.1 0 M196 196 h8 l3 22 h-14 z" fill="#a9813e" />
        </>
      )}
      <path d="M186 6 h28 l-14 22 z" fill="#e3b04b" stroke="#6b4a1a" strokeWidth="2" />
    </svg>
  );
}

// Glass bottles in four shapes, with coloured liquid and a cork.
function Bottle({ shape, colour }) {
  const body = {
    tall: 'M24 30 v-14 h12 v14 c8 6 10 12 10 22 v58 c0 6 -4 8 -16 8 c-12 0 -16 -2 -16 -8 v-58 c0 -10 2 -16 10 -22 z',
    small: 'M24 62 v-10 h12 v10 c10 4 14 12 14 22 v20 c0 8 -6 14 -20 14 c-14 0 -20 -6 -20 -14 v-20 c0 -10 4 -18 14 -22 z',
    round: 'M24 50 v-20 h12 v20 c14 4 24 16 24 32 c0 20 -14 36 -30 36 c-16 0 -30 -16 -30 -36 c0 -16 10 -28 24 -32 z',
    tiny: 'M26 84 v-8 h8 v8 c6 3 8 8 8 14 v10 c0 6 -4 10 -12 10 c-8 0 -12 -4 -12 -10 v-10 c0 -6 2 -11 8 -14 z',
  }[shape] ?? '';
  const level = { tall: 52, small: 80, round: 72, tiny: 96 }[shape] ?? 70;
  const cork = { tall: 8, small: 44, round: 22, tiny: 70 }[shape] ?? 20;
  const id = `liq-${shape}-${colour.slice(1)}`;
  return (
    <svg viewBox="0 0 60 122" className={`bottle-svg ${shape}`} aria-hidden="true">
      <defs><clipPath id={id}><path d={body} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x="0" y={level} width="60" height="80" fill={colour} />
        <rect x="0" y={level} width="60" height="4" fill="#fff" opacity=".35" />
      </g>
      <path d={body} fill="rgb(220 235 245 / .12)" stroke="rgb(236 228 211 / .85)" strokeWidth="2" />
      <path d="M16 70 q-2 16 2 30" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x={shape === 'tiny' ? 25 : 23} y={cork} width={shape === 'tiny' ? 10 : 14} height="10" rx="2" fill="#a9784a" stroke="#5a3a22" />
    </svg>
  );
}

// ---------- One view, used big on the TV and interactive on the GM board ----------
export function PuzzleView({ p, st, gm = false, onAct, sel }) {
  if (!st) return null;
  if (p.type === 'chess') {
    return <Chess p={p} st={st} gm={gm} onAct={onAct} sel={sel} />;
  }
  if (p.type === 'torches') {
    return (
      <div className="torches" style={{ gridTemplateColumns: `repeat(${p.size}, 1fr)` }}>
        {st.lit.map((on, i) => (
          <button key={i} type="button" disabled={!gm} className={`torch ${on ? 'on' : ''}`} onClick={() => onAct?.(i)}
            aria-label={`Torch ${Math.floor(i / p.size) + 1}-${(i % p.size) + 1} ${on ? 'lit' : 'dark'}`}>
            <Torch on={on} />
          </button>
        ))}
      </div>
    );
  }
  if (p.type === 'rings') {
    return (
      <div className="rings">
        <RingDial rings={p.rings} pos={st.pos} />
        {gm && p.rings.map((ring, r) => {
          const n = ring.length;
          const view = [-2, -1, 0, 1, 2].map((d) => ring[(st.pos[r] + d + n) % n]);
          return (
            <div key={r} className="ring-row">
              {gm && <button className="btn small" onClick={() => onAct?.(r, -1)} aria-label="Turn left">◀</button>}
              <div className="ring-strip">
                {view.map((sym, k) => <span key={k} className={k === 2 ? 'centre' : ''}>{sym}</span>)}
              </div>
              {gm && <button className="btn small" onClick={() => onAct?.(r, 1)} aria-label="Turn right">▶</button>}
            </div>
          );
        })}
      </div>
    );
  }
  if (p.type === 'bottles') {
    return (
      <div className="bottles-wrap">
        <div className="bottles">
          {p.bottles.map((b, i) => {
            const shown = st.revealed.includes(i);
            return (
              <button key={i} type="button" disabled={!gm || shown} className={`bottle ${b.shape} ${shown ? `shown ${b.kind}` : ''}`} onClick={() => onAct?.(i)}>
                <Art path={`puzzles/bottle-${i + 1}`} icon={<Bottle shape={b.shape} colour={COLOURS[b.colour]} />} className={`bottle-art ${b.shape}`} />
                <span className="bottle-num">{i + 1}</span>
                {shown && <span className="bottle-kind">{KIND_LABEL[b.kind]}</span>}
              </button>
            );
          })}
        </div>
        <ol className="clues">{p.clues.map((c) => <li key={c}>{c}</li>)}</ol>
      </div>
    );
  }
  if (p.type === 'cipher') {
    return (
      <div className="cipher">
        {p.message.split(' ').map((word, w) => (
          <span key={w} className="cipher-word">
            {word.split('').map((ch, k) => (
              <span key={k} className="cipher-ch">
                <span className="rune">{runeFor(ch)}</span>
                <span className="plain">{st.revealed.includes(ch) ? ch : ''}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    );
  }
  if (p.type === 'constellation') {
    const byN = Object.fromEntries(p.stars.map((s) => [s.n, s]));
    return (
      <svg className="sky-svg" viewBox="0 0 100 80" role="img" aria-label="Star chart">
        <defs>
          <radialGradient id="nebula" cx="60%" cy="45%" r="60%"><stop offset="0" stopColor="#6a3f8a" stopOpacity=".35" /><stop offset="1" stopColor="#0e0c1c" stopOpacity="0" /></radialGradient>
          <filter id="star-glow"><feGaussianBlur stdDeviation=".6" /></filter>
        </defs>
        <rect width="100" height="80" fill="url(#nebula)" />
        {BG_STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" className="bg-star" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />)}
        {st.lines.map((k) => {
          const [a, b] = k.split('-').map(Number);
          return <line key={`g${k}`} x1={byN[a].x} y1={byN[a].y} x2={byN[b].x} y2={byN[b].y} stroke="#e3b04b" strokeWidth="1.6" strokeLinecap="round" opacity=".45" filter="url(#star-glow)" />;
        })}
        {st.lines.map((k) => {
          const [a, b] = k.split('-').map(Number);
          return <line key={k} x1={byN[a].x} y1={byN[a].y} x2={byN[b].x} y2={byN[b].y} stroke="#e3b04b" strokeWidth=".6" strokeLinecap="round" />;
        })}
        {p.stars.map((s) => (
          <g key={s.n} onClick={() => gm && onAct?.(s.n)} style={{ cursor: gm ? 'pointer' : 'default' }}>
            <circle cx={s.x} cy={s.y} r={s.r / 9} fill="#fff7dc" className={sel === s.n ? 'star sel' : 'star'} />
            <circle cx={s.x} cy={s.y} r={s.r / 4.5} fill="rgba(255,240,200,.08)" />
            <text x={s.x} y={s.y + s.r / 9 + 4} textAnchor="middle" fontSize="3.2" fill="#a69fbe" fontWeight="700">{s.n}</text>
          </g>
        ))}
      </svg>
    );
  }
  if (p.type === 'stairs') {
    return <Stairs p={p} st={st} gm={gm} onAct={onAct} />;
  }
  if (p.type === 'stairs-view') {
    const { stairArt } = p;
    const done = stairsConnected(p, st.rots);
    return (
      <div className="stairs-wrap">
        <span className="stairs-in" aria-hidden="true">➡️</span>
        <div className="stairs" style={{ gridTemplateColumns: `repeat(${p.size}, 1fr)` }}>
          {p.tiles.map(([base], i) => {
            const m = rotMask(base, st.rots[i]);
            const tile = stairTile(m);
            return (
              <button key={i} type="button" disabled={!gm} className={`stair ${done ? 'lit' : ''} ${stairArt[tile.type] ? 'has-art' : ''}`} onClick={() => onAct?.(i)}
                aria-label={`Staircase ${Math.floor(i / p.size) + 1}-${(i % p.size) + 1}`}>
                {stairArt[tile.type] && <img src={stairArt[tile.type]} alt="" style={{ transform: `rotate(${tile.turn * 90}deg)` }} draggable={false} />}
                <span className="hub" />
                {m & 1 ? <span className="arm n" /> : null}{m & 2 ? <span className="arm e" /> : null}
                {m & 4 ? <span className="arm s" /> : null}{m & 8 ? <span className="arm w" /> : null}
              </button>
            );
          })}
        </div>
        <span className="stairs-out" aria-hidden="true">🚪</span>
      </div>
    );
  }
  if (p.type === 'slider') {
    return (
      <div className="slider">
        {st.tiles.map((t, i) => (
          <button key={i} type="button" disabled={!gm || t === 0} className={`slide ${t === 0 ? 'gap' : ''}`} onClick={() => onAct?.(i)}
            style={t ? { '--sx': `${((t - 1) % 3) * 50}%`, '--sy': `${Math.floor((t - 1) / 3) * 50}%`, backgroundImage: `url(${import.meta.env.BASE_URL}puzzles/portrait.jpg)` } : undefined}>
            {t ? <span className="slide-n">{t}</span> : ''}
          </button>
        ))}
      </div>
    );
  }
  if (p.type === 'runefloor') {
    const cols = p.grid[0].length;
    return (
      <div className="runefloor-wrap">
        <p className="runeword">{p.word.split('').map((l) => runeFor(l)).join(' ')}</p>
        <div className="runefloor" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {p.grid.join('').split('').map((l, i) => (
            <button key={i} type="button" disabled={!gm} onClick={() => onAct?.(i)}
              className={`rtile ${st.path.includes(i) ? 'stepped' : ''} ${st.trapped === i ? 'trap' : ''} ${st.path[st.path.length - 1] === i ? 'here' : ''}`}>
              {runeFor(l)}
            </button>
          ))}
        </div>
        <p className="muted small">Start on the bottom row. The top row is the far door.</p>
      </div>
    );
  }
  return null;
}

// ---------- Pictures for the puzzles (optional: public/art/puzzles/…) ----------
const PIECE_FILE = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };

function Chess({ p, st, gm, onAct, sel }) {
  const light = useArtUrl('puzzles/chess-light');
  const dark = useArtUrl('puzzles/chess-dark');
  return (
    <div className="chess-wrap">
      <div className="chess">
        {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => FILES.split('').map((f, fi) => {
          const sq = `${f}${rank}`;
          const pc = st.board[sq];
          const isDark = (fi + rank) % 2 === 1;
          const tex = isDark ? dark : light;
          const white = pc && pc.p === pc.p.toUpperCase();
          return (
            <button key={sq} type="button" disabled={!gm}
              className={`sq ${isDark ? 'dark' : 'light'} ${sel === sq ? 'sel' : ''} ${st.last?.to === sq ? 'last' : ''}`}
              style={tex ? { backgroundImage: `url(${tex})`, backgroundSize: '800% 800%', backgroundPosition: `${(fi / 7) * 100}% ${((8 - rank) / 7) * 100}%` } : undefined}
              onClick={() => onAct?.(sq)} aria-label={`${sq}${pc ? ` ${PIECE_NAME[pc.p.toLowerCase()]}` : ''}`}>
              {fi === 0 && <span className="rank-l">{rank}</span>}
              {rank === 1 && <span className="file-l">{f}</span>}
              {pc && (
                <Art path={`puzzles/chess-${white ? 'white' : 'black'}-${PIECE_FILE[pc.p.toLowerCase()]}`}
                  icon={GLYPH[pc.p]} className={`pc ${white ? 'w' : 'b'}`} />
              )}
              {pc?.label && <span className="pc-label">{pc.label}</span>}
            </button>
          );
        }))}
      </div>
      {st.last && <p className="puzzle-note">Last move: {st.last.text}</p>}
    </div>
  );
}

// Which picture a staircase tile uses, and how far to turn it (quarter turns clockwise).
// Pictures are drawn as: straight = top to bottom, corner = top to right, tee = top, right and bottom.
const STAIR_BASE = { straight: 5, corner: 3, tee: 7, cross: 15 };
function stairTile(mask) {
  for (const [type, base] of Object.entries(STAIR_BASE)) {
    for (let turn = 0; turn < 4; turn++) if (rotMask(base, turn) === mask) return { type, turn };
  }
  return { type: null, turn: 0 };
}

function Stairs({ p, st, gm, onAct }) {
  const stairArt = {
    straight: useArtUrl('puzzles/stairs-straight'),
    corner: useArtUrl('puzzles/stairs-corner'),
    tee: useArtUrl('puzzles/stairs-tee'),
    cross: useArtUrl('puzzles/stairs-cross'),
  };
  return <PuzzleView p={{ ...p, type: 'stairs-view', stairArt }} st={st} gm={gm} onAct={onAct} />;
}

// ---------- TV ----------
export function TVPuzzle({ p, st }) {
  return (
    <div className={`tv-puzzle ${st.solved ? 'solved' : ''}`}>
      <h2>{p.icon} {p.title}</h2>
      <p className="puzzle-intro">{p.intro}</p>
      <PuzzleView p={p} st={st} />
      {st.solved && <p className="puzzle-solved">✨ Solved! ✨</p>}
    </div>
  );
}

// ---------- GM ----------
function ActivePuzzle({ sid, p, st, chars, players }) {
  const [sel, setSel] = useState(null);
  const announced = useRef(false);

  useEffect(() => {
    if (!st.solved && !announced.current && isSolved(p, st)) { announced.current = true; markSolved(sid, p); }
  }, [sid, p, st]);

  const act = (...args) => {
    if (p.type === 'chess') {
      const sq = args[0];
      if (!sel) { if (st.board[sq]) setSel(sq); return; }
      if (sq === sel) { setSel(null); return; }
      const board = { ...st.board };
      const moving = board[sel];
      const took = board[sq];
      board[sq] = moving; delete board[sel];
      const text = `${PIECE_NAME[moving.p.toLowerCase()]} ${sel} → ${sq}${took ? `, takes ${PIECE_NAME[took.p.toLowerCase()].toLowerCase()}` : ''}`;
      setPuzzle(sid, { board, last: { from: sel, to: sq, text } });
      setSel(null);
    }
    if (p.type === 'torches') setPuzzle(sid, { lit: flipTorches(st.lit, p.size, args[0]) });
    if (p.type === 'rings') {
      const [r, d] = args;
      const pos = [...st.pos];
      pos[r] = (pos[r] + d + p.rings[r].length) % p.rings[r].length;
      setPuzzle(sid, { pos });
    }
    if (p.type === 'bottles') setPuzzle(sid, { revealed: [...st.revealed, args[0]] });
    if (p.type === 'constellation') {
      const n = args[0];
      if (sel == null) { setSel(n); return; }
      if (sel === n) { setSel(null); return; }
      const k = edgeKey(sel, n);
      setPuzzle(sid, { lines: st.lines.includes(k) ? st.lines.filter((x) => x !== k) : [...st.lines, k] });
      setSel(null);
    }
    if (p.type === 'stairs') {
      const rots = [...st.rots]; rots[args[0]] = (rots[args[0]] + 1) % 4;
      setPuzzle(sid, { rots });
    }
    if (p.type === 'slider') {
      const i = args[0], gap = st.tiles.indexOf(0);
      const near = (Math.abs(i - gap) === 3) || (Math.abs(i - gap) === 1 && Math.floor(i / 3) === Math.floor(gap / 3));
      if (!near) return;
      const tiles = [...st.tiles]; tiles[gap] = tiles[i]; tiles[i] = 0;
      setPuzzle(sid, { tiles });
    }
    if (p.type === 'runefloor') {
      const i = args[0];
      if (runeStepOk(p, st.path, i)) setPuzzle(sid, { path: [...st.path, i], trapped: null });
      else setPuzzle(sid, { path: [], trapped: i });
    }
  };

  const label = (name) => {
    if (!sel || !st.board[sel]) return;
    setPuzzle(sid, { board: { ...st.board, [sel]: { ...st.board[sel], label: name || null } } });
  };

  return (
    <div className="gm-puzzle">
      <div className="party-head">
        <h2>{p.icon} {p.title}{st.solved ? ' ✓' : ''}</h2>
        <span className="actions">
          <button className="btn small ghost" onClick={() => { announced.current = false; setSel(null); setPuzzle(sid, { ...initialState(p), solved: false }); }}>Reset</button>
          {!st.solved && <button className="btn small teal" onClick={() => { announced.current = true; markSolved(sid, p); }}>Mark solved</button>}
          <button className="btn small" onClick={() => closePuzzle(sid)}>Close (back to map)</button>
        </span>
      </div>
      <p className="muted small">
        {p.type === 'chess' && (sel ? `Selected ${sel}. Tap a square to move it there, or tap it again to cancel.` : 'Tap a piece, then the square it moves to. Captures happen automatically.')}
        {p.type === 'torches' && 'Tap the torch the players name. Its neighbours flip too.'}
        {p.type === 'rings' && 'Turn the ring the players ask for.'}
        {p.type === 'bottles' && 'When a player drinks, tap that bottle to reveal it on the TV. Apply poison or sleep yourself.'}
        {p.type === 'cipher' && 'When the players guess a rune correctly, reveal that letter everywhere.'}
        {p.type === 'constellation' && (sel != null ? `Star ${sel} selected. Tap the star to join it to (tap a line’s two stars again to remove it).` : 'Tap one star, then another, to draw a line between them.')}
        {p.type === 'stairs' && 'Tap a piece to turn it a quarter clockwise. The path glows when it connects.'}
        {p.type === 'slider' && 'Tap a piece next to the gap to slide it in.'}
        {p.type === 'runefloor' && 'Tap the tile the walker steps on. A wrong step springs the trap and sends them back to the start (apply damage yourself).'}
      </p>
      <PuzzleView p={p} st={st} gm onAct={act} sel={sel} />
      {p.type === 'chess' && sel && st.board[sel] && (
        <div className="gm-give">
          <span className="small">Who is this piece?</span>
          <select value={st.board[sel].label ?? ''} onChange={(e) => label(e.target.value)} aria-label="Player on this piece">
            <option value="">Nobody</option>
            {players.map((u) => <option key={u} value={chars[u].firstName ?? chars[u].name}>{chars[u].firstName ?? chars[u].name}</option>)}
          </select>
        </div>
      )}
      {p.type === 'cipher' && (
        <div className="cipher-keys">
          {lettersIn(p.message).map((l) => (
            <button key={l} className={`btn small ${st.revealed.includes(l) ? 'teal' : ''}`}
              onClick={() => setPuzzle(sid, { revealed: st.revealed.includes(l) ? st.revealed.filter((x) => x !== l) : [...st.revealed, l] })}>
              {runeFor(l)} = {l}
            </button>
          ))}
        </div>
      )}
      <details className="solution">
        <summary>Show the solution (GM only)</summary>
        <p>{p.type === 'torches' ? `Tap these torches (row, column): ${p.solution.map(([r, c]) => `${r + 1}-${c + 1}`).join(', ')}. Any order works.` : p.solution}</p>
      </details>
    </div>
  );
}

export function GMPuzzles({ sid, data, session, chars }) {
  const st = session.state?.puzzle;
  const active = st && data.puzzles.find((p) => p.id === st.id);
  const players = session.playerUids.filter((u) => chars[u]);
  return (
    <section className="gm-puzzles">
      {active ? (
        <ActivePuzzle sid={sid} p={active} st={st} chars={chars} players={players} />
      ) : (
        <>
          <p className="muted">Puzzles show on the TV only. Players talk it through and tell you what to do; you make the moves here.</p>
          <div className="puzzle-list">
            {data.puzzles.map((p) => (
              <div key={p.id} className="quest-card">
                <strong>{p.icon} {p.title}</strong>
                <p className="small muted">{p.intro}</p>
                <button className="btn small gold" onClick={() => startPuzzle(sid, p)}>Put it on the TV</button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
