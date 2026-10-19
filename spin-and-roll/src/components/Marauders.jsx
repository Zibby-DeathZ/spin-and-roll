// The Marauder's Map: the castle in ink, with everyone's footsteps walking about, live.
// MaraudersMap draws it; TVMarauders shows it on the TV; PlayerMapScreen listens for the words; GMMarauders controls it.
import { useEffect, useMemo, useRef, useState } from 'react';
import { clockOf } from '../lib/game';
import { closeMap, corridors, gmOpenMap, halvesOf, mapMarks, restMap, route, sayClose, sayOpen, saysPhrase } from '../lib/marauders';

const INK = '#4a2c17', BLOOD = '#7a1f12';
const DEF_W = 130, DEF_H = 70;

const box = (lay, id) => {
  const [x, y, w = DEF_W, h = DEF_H] = lay[id];
  return { x, y, w, h };
};

// Split a room name over two lines if it's long.
function wrap(name, max = 15) {
  const n0 = name.replace(/^The /, '');
  const n = n0.charAt(0).toUpperCase() + n0.slice(1);
  if (n.length <= max) return [n];
  const words = n.split(' ');
  let a = '';
  while (words.length && (a + ' ' + words[0]).trim().length <= max) a = `${a} ${words.shift()}`.trim();
  return a ? [a, words.join(' ')] : [n];
}

// A small stable number from a string, for each walker's own path.
const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

// The torn edge down the middle of the sheet.
function tornEdge(split, H) {
  const pts = [];
  for (let y = 0, i = 0; y <= H; y += 18, i++) pts.push([split + ((i * 37) % 23) - 11, Math.min(y, H)]);
  return pts;
}

// ---------- Footsteps ----------
// Each person walks a little loop in their room. When they change rooms, they walk the corridors to get there.
function useWalkers(data, people, live) {
  const lay = data.marauders.layout;
  const walkers = useRef(new Map());
  const latest = useRef(people);
  latest.current = people;
  const [, tick] = useState(0);

  useEffect(() => {
    if (!live) return undefined;
    let last = performance.now();
    const step = () => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      const list = latest.current;
      const byRoom = {};
      list.forEach((p) => { (byRoom[p.loc] ??= []).push(p.id); });
      const seen = new Set();
      for (const p of list) {
        seen.add(p.id);
        const b = box(lay, p.loc);
        const mates = byRoom[p.loc].sort();
        const idx = mates.indexOf(p.id);
        const f = 0.4 + 0.6 * (((idx % 4) + 1) / 4);
        const rx = (b.w / 2 - 16) * f, ry = Math.max(6, (b.h / 2 - 22) * f);
        const cx = b.x, cy = b.y + 8;
        let w = walkers.current.get(p.id);
        if (!w) {
          const ph = (hash(p.id) % 628) / 100 + (idx * 2 * Math.PI) / mates.length;
          w = { loc: p.loc, ang: ph, dir: hash(p.id) % 2 ? 1 : -1, x: cx + rx * Math.cos(ph), y: cy + ry * Math.sin(ph), prints: [], acc: 0, side: 1, path: null, head: 0 };
          walkers.current.set(p.id, w);
        }
        let nx, ny;
        if (w.loc !== p.loc && !w.path) {
          // Walk the corridors to the new room.
          w.path = route(data, w.loc, p.loc).slice(1).map((id) => ({ x: box(lay, id).x, y: box(lay, id).y + 8 }));
          w.loc = p.loc;
        }
        if (w.path?.length) {
          const t = w.path[0];
          const dx = t.x - w.x, dy = t.y - w.y, d = Math.hypot(dx, dy);
          const go = 120 * dt;
          if (d <= go) { nx = t.x; ny = t.y; w.path.shift(); if (!w.path.length) w.path = null; } else { nx = w.x + (dx / d) * go; ny = w.y + (dy / d) * go; }
        } else {
          w.path = null;
          w.ang += w.dir * (22 / Math.max(10, (rx + ry) / 2)) * dt;
          nx = cx + rx * Math.cos(w.ang);
          ny = cy + ry * Math.sin(w.ang);
        }
        const moved = Math.hypot(nx - w.x, ny - w.y);
        if (moved > 0.01) w.head = Math.atan2(ny - w.y, nx - w.x);
        w.x = nx; w.y = ny;
        if (!p.float) {
          w.acc += moved;
          if (w.acc >= 11) {
            w.acc = 0;
            w.side = -w.side;
            const px = -Math.sin(w.head) * 3.2 * w.side, py = Math.cos(w.head) * 3.2 * w.side;
            w.prints.push({ x: w.x + px, y: w.y + py, a: (w.head * 180) / Math.PI + 90, t: now });
            if (w.prints.length > 8) w.prints.shift();
          }
        }
      }
      for (const id of [...walkers.current.keys()]) if (!seen.has(id)) walkers.current.delete(id);
      tick((n) => (n + 1) % 1e6);
    };
    const i = setInterval(step, 80);
    return () => clearInterval(i);
  }, [live, data, lay]);

  return walkers.current;
}

function Footprint({ x, y, a, o, color }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`} opacity={o} fill={color}>
      <ellipse cx="0" cy="-1.6" rx="2.3" ry="3.4" />
      <ellipse cx="0" cy="3.4" rx="1.7" ry="1.9" />
    </g>
  );
}

// ---------- The map ----------
export function MaraudersMap({ data, session, chars, halves = { left: true, right: true }, showSecrets = false, fade = 1, closing = false, live = true, className = '' }) {
  const cfg = data.marauders;
  const [W, H0] = cfg.size;
  const H = H0 + 40;
  const lay = cfg.layout;
  const discovered = new Set(session.state?.map?.discovered ?? []);
  const locs = useMemo(() => Object.fromEntries((data.locations ?? []).map((l) => [l.id, l])), [data]);
  const whole = halves.left && halves.right;
  const visible = (id) => lay[id] && (showSecrets || !locs[id]?.secret || discovered.has(id) || (whole && (cfg.revealsWhenWhole ?? []).includes(id)));
  const marks = mapMarks(data, session, chars);
  const people = marks.people.filter((p) => visible(p.loc));
  const walkers = useWalkers(data, people, live);
  const now = performance.now();
  const edge = tornEdge(cfg.split, H);
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const both = halves.left && halves.right;
  const clip = both ? null : halves.left
    ? [[0, 0], ...edge, [0, H]] : [[W, 0], ...edge, [W, H]];
  const centre = both ? [W / 2, H / 2] : halves.left ? [cfg.split / 2, H / 2] : [(W + cfg.split) / 2, H / 2];
  const treasureBy = {};
  marks.treasure.filter((t) => visible(t.loc)).forEach((t) => { (treasureBy[t.loc] ??= []).push(t); });

  return (
    <svg className={`marauders ${className}`} viewBox={both ? `0 0 ${W} ${H}` : halves.left ? `0 0 ${cfg.split + 16} ${H}` : `${cfg.split - 16} 0 ${W - cfg.split + 16} ${H}`}
      role="img" aria-label="The Marauder’s Map">
      <defs>
        <radialGradient id={`parch-${uid}`} cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor="#f3e6c6" /><stop offset=".7" stopColor="#e2cc9c" /><stop offset="1" stopColor="#c9a86c" />
        </radialGradient>
        <filter id={`grain-${uid}`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .1  0 0 0 .09 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
        {clip && <clipPath id={`torn-${uid}`}><polygon points={clip.map((p) => p.join(',')).join(' ')} /></clipPath>}
        <mask id={`ink-${uid}`}>
          <rect width={W} height={H} fill="black" />
          {/* Ink blooms out from the middle when it opens, and drains away when it closes (CSS animates r). */}
          <circle key={closing ? 'c' : 'o'} cx={centre[0]} cy={centre[1]} r={closing ? 0 : 1300} fill="white" className={closing ? 'mm-drain' : 'mm-bloom'} />
        </mask>
      </defs>
      <g clipPath={clip ? `url(#torn-${uid})` : undefined}>
        <rect width={W} height={H} rx="10" fill={`url(#parch-${uid})`} />
        <rect width={W} height={H} rx="10" filter={`url(#grain-${uid})`} fill="#000" />
        <g mask={`url(#ink-${uid})`} opacity={fade} className="mm-ink">
          {/* Corridors */}
          {corridors(data).filter(([a, b]) => visible(a) && visible(b)).map(([a, b]) => {
            const p = box(lay, a), q = box(lay, b);
            const mx = (p.x + q.x) / 2 + ((hash(a + b) % 30) - 15), my = (p.y + q.y) / 2 + ((hash(b + a) % 30) - 15);
            return <path key={a + b} d={`M${p.x},${p.y} Q${mx},${my} ${q.x},${q.y}`} fill="none" stroke={INK} strokeWidth="1.3" strokeDasharray="7 5" opacity=".55" />;
          })}
          {/* Rooms */}
          {Object.keys(lay).filter(visible).map((id) => {
            const b = box(lay, id);
            const name = wrap(locs[id]?.name ?? id);
            const outdoor = ['black-lake', 'forbidden-forest', 'quidditch-pitch'].includes(id);
            return (
              <g key={id}>
                {outdoor ? (
                  <ellipse cx={b.x} cy={b.y} rx={b.w / 2} ry={b.h / 2} fill="#f3e6c6" fillOpacity=".55" stroke={INK} strokeWidth="1.5" strokeDasharray={id === 'forbidden-forest' ? '2 3' : undefined} />
                ) : (
                  <>
                    <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx="3" fill="#f3e6c6" fillOpacity=".6" stroke={INK} strokeWidth="1.7" />
                    <rect x={b.x - b.w / 2 + 4} y={b.y - b.h / 2 + 4} width={b.w - 8} height={b.h - 8} rx="2" fill="none" stroke={INK} strokeWidth=".6" />
                  </>
                )}
                {id === 'black-lake' && [0, 1, 2].map((k) => <path key={k} d={`M${b.x - 40 + k * 10},${b.y + 8 + k * 7} q8,-5 16,0 t16,0 t16,0`} fill="none" stroke={INK} strokeWidth=".7" opacity=".6" />)}
                {id === 'forbidden-forest' && [-48, -22, 4, 30, 54].map((dx, k) => <path key={k} d={`M${b.x + dx - 6},${b.y + 26 - (k % 2) * 6} l6,-13 l6,13 z`} fill="none" stroke={INK} strokeWidth=".8" opacity=".6" />)}
                <text x={b.x} y={b.y - b.h / 2 + 17} className="mm-room" textAnchor="middle" fill={INK}>
                  {name.map((ln, i) => <tspan key={i} x={b.x} dy={i ? 14 : 0}>{ln}</tspan>)}
                </text>
              </g>
            );
          })}
          {/* Treasure */}
          {Object.entries(treasureBy).map(([loc, list]) => {
            const b = box(lay, loc);
            return list.slice(0, 3).map((t, i) => {
              const x = b.x - b.w / 2 + 12, y = b.y + b.h / 2 - 12 - i * 13;
              return (
                <g key={t.id} className="mm-treasure">
                  <rect x={x} y={y - 6} width="11" height="8" fill="none" stroke={BLOOD} strokeWidth="1.1" />
                  <path d={`M${x},${y - 3} h11`} stroke={BLOOD} strokeWidth=".8" />
                  <text x={x + 14} y={y + 1} fill={BLOOD} className="mm-tag">{t.name}</text>
                </g>
              );
            });
          })}
          {/* Footsteps and names */}
          {people.map((p) => {
            const w = walkers.get(p.id);
            if (!w) return null;
            // Stagger the names of people sharing a room so they don't sit on top of each other.
            const mates = people.filter((x) => x.loc === p.loc).map((x) => x.id).sort();
            const lift = (mates.indexOf(p.id) % 3) * 12;
            const color = p.kind === 'creature' ? BLOOD : INK;
            return (
              <g key={p.id}>
                {w.prints.map((f, i) => <Footprint key={i} {...f} o={Math.max(0, 1 - (now - f.t) / 2600)} color={color} />)}
                <g transform={`translate(${w.x + 6} ${w.y - 9 - lift + 12 + (p.float ? Math.sin(now / 400 + hash(p.id)) * 2 : 0)})`}>
                  <text className={`mm-name ${p.kind} ${p.smudged ? 'smudged' : ''}`} fill={color} stroke="#f3e6c6" strokeWidth="3" paintOrder="stroke">{p.name}</text>
                </g>
              </g>
            );
          })}
          {/* Title */}
          <text x={W / 2} y={H - 14} textAnchor="middle" className="mm-title" fill={INK}>THE MARAUDER’S MAP</text>
        </g>
      </g>
      {/* The torn edge, or the tape where the halves are joined */}
      <polyline points={edge.map((p) => p.join(',')).join(' ')} fill="none" stroke={both ? '#b8955c' : '#8a6a3d'} strokeWidth={both ? 1.2 : 2} strokeDasharray={both ? '3 3' : undefined} />
    </svg>
  );
}

// ---------- TV ----------
// Counts from the moment this screen saw it open, so clocks don't need to match.
function useOpenTimer(m) {
  const seen = useRef({ key: null, t: 0 });
  const [, tick] = useState(0);
  const key = m?.open ? `o${m.at}` : m?.closedAt ? `c${m.closedAt}` : null;
  if (key && seen.current.key !== key) seen.current = { key, t: performance.now() };
  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(i);
  }, []);
  return key ? performance.now() - seen.current.t : Infinity;
}

// The ink stays strong, then fades over the last 12 seconds.
const fadeFor = (ms, total) => (ms < total - 12000 ? 1 : Math.max(0.15, (total - ms) / 12000));

export function TVMarauders({ data, session, chars }) {
  const m = session.state?.marauders;
  const t = useOpenTimer(m);
  const wasOpen = useRef(false);
  if (m?.open) wasOpen.current = true;
  if (!data.marauders || !m) return null;
  const closing = !m.open && wasOpen.current && t < 1800;
  if (!m.open && !closing) return null;
  const who = m.by ? chars[m.by]?.firstName ?? chars[m.by]?.name : null;
  return (
    <div className="tv-marauders" role="dialog" aria-label="The Marauder’s Map">
      <MaraudersMap data={data} session={session} chars={chars} halves={m.halves ?? { left: true }} closing={closing}
        fade={m.open ? fadeFor(t, m.ms ?? 60000) : 1} className="big" />
      <p className="tv-marauders-cap">{closing ? 'Mischief managed.' : `${who ? `${who}’s map. ` : ''}The ink is fading…`}</p>
    </div>
  );
}

// ---------- Phone ----------
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function useListener(onHeard) {
  const [state, setState] = useState('idle'); // idle | listening | error
  const [interim, setInterim] = useState('');
  const [err, setErr] = useState('');
  const rec = useRef(null);
  const start = () => {
    if (!SR) { setErr('This phone can’t listen. Type the words instead.'); setState('error'); return; }
    try {
      const r = new SR();
      r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 3; r.continuous = false;
      r.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        setInterim(res[0].transcript);
        if (res.isFinal) onHeard([...res].map((a) => a.transcript));
      };
      r.onerror = (e) => {
        setErr(e.error === 'not-allowed' ? 'Microphone blocked. Allow it in your browser, or type the words.' : e.error === 'no-speech' ? 'The parchment heard nothing. Try again.' : 'The parchment couldn’t hear you. Try again, or type the words.');
        setState('error');
      };
      r.onend = () => setState((s) => (s === 'listening' ? 'idle' : s));
      rec.current = r;
      setInterim(''); setErr(''); setState('listening');
      r.start();
    } catch {
      setErr('The parchment couldn’t hear you. Type the words instead.'); setState('error');
    }
  };
  useEffect(() => () => { try { rec.current?.abort(); } catch { /* ignore */ } }, []);
  return { state, interim, err, start, setInterim };
}

export function PlayerMapScreen({ sid, c, data, session, chars, onClose }) {
  const cfg = data.marauders;
  const m = session.state?.marauders ?? {};
  const mine = m.open && m.by === c.uid;
  const othersOpen = m.open && m.by !== c.uid;
  const resting = !m.open && m.usedDawn === clockOf(session).dawn;
  const itemId = (c.inventory ?? []).find((i) => Object.values(cfg.halves).includes(i.id))?.id;
  const [reply, setReply] = useState('');
  const [typed, setTyped] = useState('');
  const [sent, setSent] = useState(false);
  const t = useOpenTimer(m);

  const heard = (alts) => {
    if (mine) {
      if (alts.some((a) => saysPhrase(a, cfg.close, 0.7))) sayClose(sid, c.uid, itemId);
      else setReply('The map waits for the closing words.');
      return;
    }
    if (alts.some((a) => saysPhrase(a, cfg.password))) {
      setSent(true); setReply('');
      sayOpen(sid, c.uid, itemId);
    } else setReply(cfg.insults[Math.floor(Math.random() * cfg.insults.length)]);
  };
  const ear = useListener(heard);

  return (
    <main className="mm-phone">
      <button className="linkish mm-back" onClick={onClose}>← Put the map away</button>
      {mine ? (
        <>
          <MaraudersMap data={data} session={session} chars={chars} halves={m.halves} fade={fadeFor(t, m.ms ?? 60000)} />
          <p className="muted small">It’s open on the TV. The ink is fading.</p>
          <button className="btn gold big" disabled={ear.state === 'listening'} onClick={ear.start}>
            {ear.state === 'listening' ? '🎙️ Listening…' : '🎙️ Say the closing words'}
          </button>
          <button className="btn ghost" onClick={() => sayClose(sid, c.uid, itemId)}>Just fold it up</button>
        </>
      ) : (
        <div className="mm-blank">
          <h1>{data.items[itemId]?.name ?? 'The map'}</h1>
          <p className="mm-hint">
            {othersOpen ? 'The map is already open on the TV.'
              : resting ? 'The parchment is blank. The ink needs a night’s rest before it will wake again.'
                : sent ? 'Ink is spreading across the parchment… look at the TV!'
                  : 'Touch your wand to the parchment and say the words out loud.'}
          </p>
          {!othersOpen && !resting && !sent && (
            <>
              <button className="btn gold big" disabled={ear.state === 'listening'} onClick={ear.start}>
                {ear.state === 'listening' ? '🎙️ Listening…' : '🎙️ Speak to the map'}
              </button>
              {ear.interim && <p className="mm-said">“{ear.interim}”</p>}
              {reply && <p className="mm-reply">{reply}</p>}
              {ear.err && <p className="warn small">{ear.err}</p>}
              <details className="mm-type" open={ear.state === 'error' || !SR}>
                <summary>Can’t use the microphone?</summary>
                <form onSubmit={(e) => { e.preventDefault(); heard([typed]); setTyped(''); }}>
                  <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Say it out loud, then type it" aria-label="The words" />
                  <button className="btn small">Speak</button>
                </form>
              </details>
            </>
          )}
        </div>
      )}
    </main>
  );
}

// ---------- GM ----------
export function GMMarauders({ sid, data, session, chars }) {
  const [peek, setPeek] = useState(false);
  if (!data.marauders) return null;
  const m = session.state?.marauders ?? {};
  const holders = session.playerUids.filter((u) => chars[u] && Object.values(halvesOf(data, chars[u])).some(Boolean));
  const usedToday = m.usedDawn === clockOf(session).dawn;
  const name = (u) => chars[u]?.firstName ?? chars[u]?.name;
  return (
    <div className="mm-gm">
      <p className="small">
        {m.open ? <strong>Open on the TV{m.by ? ` (${name(m.by)})` : ''}. </strong> : usedToday ? 'Used today; it rests until dawn. ' : 'Closed. '}
        {holders.length ? `Held by ${holders.map((u) => `${name(u)} (${Object.entries(halvesOf(data, chars[u])).filter(([, v]) => v).map(([k]) => k).join(' + ')})`).join(', ')}.` : 'Nobody holds a half right now.'}
      </p>
      <div className="actions">
        {m.open
          ? <button className="btn small" onClick={() => closeMap(sid)}>Close it</button>
          : (
            <>
              <button className="btn small" onClick={() => gmOpenMap(sid, data, 'left')}>Show the Fenwick half</button>
              <button className="btn small" onClick={() => gmOpenMap(sid, data, 'both')}>Show the whole map</button>
            </>
          )}
        {usedToday && !m.open && <button className="btn small ghost" onClick={() => restMap(sid)}>Let it wake again today</button>}
      </div>
      <label className="announce small">
        <input type="checkbox" checked={peek} onChange={(e) => setPeek(e.target.checked)} /> Peek at the whole map (only you see this)
      </label>
      {peek && <MaraudersMap data={data} session={session} chars={chars} showSecrets />}
    </div>
  );
}
