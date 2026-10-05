import { useEffect, useRef, useState } from 'react';
import {
  closePuzzle, edgeKey, flipTorches, GLYPH, initialState, isSolved, lettersIn, markSolved, PIECE_NAME, rotMask, runeFor,
  runeStepOk, setPuzzle, startPuzzle, stairsConnected,
} from '../lib/puzzles';

const FILES = 'abcdefgh';
const KIND_LABEL = { poison: '☠️ Poison', sleep: '💤 Sleep', back: '↩️ Way back', forward: '🔥 Way forward' };
const COLOURS = { green: '#3fae6a', red: '#d8453a', blue: '#5a8fe0', gold: '#e3b04b', purple: '#8e7cc3', clear: '#d9e6ee' };

// ---------- One view, used big on the TV and interactive on the GM board ----------
export function PuzzleView({ p, st, gm = false, onAct, sel }) {
  if (!st) return null;
  if (p.type === 'chess') {
    return (
      <div className="chess-wrap">
        <div className="chess">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => FILES.split('').map((f, fi) => {
            const sq = `${f}${rank}`;
            const pc = st.board[sq];
            return (
              <button key={sq} type="button" disabled={!gm}
                className={`sq ${(fi + rank) % 2 ? 'dark' : 'light'} ${sel === sq ? 'sel' : ''} ${st.last?.to === sq ? 'last' : ''}`}
                onClick={() => onAct?.(sq)} aria-label={`${sq}${pc ? ` ${PIECE_NAME[pc.p.toLowerCase()]}` : ''}`}>
                {fi === 0 && <span className="rank-l">{rank}</span>}
                {rank === 1 && <span className="file-l">{f}</span>}
                {pc && <span className={`pc ${pc.p === pc.p.toUpperCase() ? 'w' : 'b'}`}>{GLYPH[pc.p]}</span>}
                {pc?.label && <span className="pc-label">{pc.label}</span>}
              </button>
            );
          }))}
        </div>
        {st.last && <p className="puzzle-note">Last move: {st.last.text}</p>}
      </div>
    );
  }
  if (p.type === 'torches') {
    return (
      <div className="torches" style={{ gridTemplateColumns: `repeat(${p.size}, 1fr)` }}>
        {st.lit.map((on, i) => (
          <button key={i} type="button" disabled={!gm} className={`torch ${on ? 'on' : ''}`} onClick={() => onAct?.(i)}
            aria-label={`Torch ${Math.floor(i / p.size) + 1}-${(i % p.size) + 1} ${on ? 'lit' : 'dark'}`}>
            {on ? '🔥' : '🕯️'}
          </button>
        ))}
      </div>
    );
  }
  if (p.type === 'rings') {
    return (
      <div className="rings">
        <div className="ring-arrow" aria-hidden="true">▼</div>
        {p.rings.map((ring, r) => {
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
                <span className="bottle-glass" style={{ '--liquid': COLOURS[b.colour] }} />
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
    const done = stairsConnected(p, st.rots);
    return (
      <div className="stairs-wrap">
        <span className="stairs-in" aria-hidden="true">➡️</span>
        <div className="stairs" style={{ gridTemplateColumns: `repeat(${p.size}, 1fr)` }}>
          {p.tiles.map(([base], i) => {
            const m = rotMask(base, st.rots[i]);
            return (
              <button key={i} type="button" disabled={!gm} className={`stair ${done ? 'lit' : ''}`} onClick={() => onAct?.(i)}
                aria-label={`Staircase ${Math.floor(i / p.size) + 1}-${(i % p.size) + 1}`}>
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
