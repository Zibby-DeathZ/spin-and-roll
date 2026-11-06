import { useEffect, useRef, useState } from 'react';
import { logEvent } from '../lib/game';
import { setPuzzle } from '../lib/puzzles';
import { SR } from './Marauders';
import {
  DIRS, housesUnited, inCentre, mapFor, move, near, startOf, watcherHome, watcherStep,
} from '../lib/maze';
import { audioReady, play, startDrone, stopDrone, unlockAudio } from '../lib/sound';

// The Mirror in the Dark (Day 1, Free time). The tall mirror in the Library drops the party into a pitch-black
// maze. Each house has one paper map, drawn long ago by a student of that house (Props Book, T9); every phone
// starts on its house's YOU and walks with arrows. A watcher drifts through the dark. When all the houses stand
// together in the centre, a pedestal lights with a riddle, and the phones quietly start listening: whoever says
// "Lumos" floods the TV and every phone with light. Held against the bright TV, the four maps show the way out
// (and a great painted eye). Nobody is told that speaking works.

// What speech recognition tends to hear when someone says "Lumos".
export const saidLumos = (alts) => alts.some((t) => /\b(lumos|lumus|lumous|loomos|loomis|lumo|lu ?moss?|lou ?moss?|loo ?moss?)\b/i.test(t));

const HOUSE_ICON = { Gryffindor: '🦁', Hufflepuff: '🦡', Ravenclaw: '🦅', Slytherin: '🐍' };

// ---------- TV ----------
export function DarkMazeTV({ p, st, names }) {
  const who = (m) => Object.entries(m ?? {}).filter(([, on]) => on).map(([u]) => names[u] ?? 'Someone');
  const out = who(st.out);
  const centre = Object.entries(st.pos ?? {}).filter(([u, pos]) => inCentre(p.maze, pos) && !st.out?.[u]).map(([u]) => names[u] ?? 'Someone');
  // The dark hums. The sound stops when the maze ends.
  useEffect(() => {
    if (!st.solved) startDrone();
    return () => stopDrone();
  }, [st.solved]);

  if (st.solved) {
    return (
      <div className="dark-tv dark-tv-out">
        <p className="dark-tv-title">{p.icon} The way out</p>
        <p className="dark-tv-sub">Grey daylight, and the smell of old books. You step out of the mirror.</p>
      </div>
    );
  }
  if (st.lumos || st.lightbox) {
    return (
      <div className="dark-tv dark-tv-lightbox">
        <p className="dark-tv-hint">{out.length ? `Out: ${out.join(', ')}` : ''}</p>
      </div>
    );
  }
  return (
    <div className={`dark-tv ${st.riddle ? 'pedestal-lit' : ''}`}>
      {st.riddle ? (
        <div className="pedestal">
          <div className="pedestal-glow" />
          <p className="pedestal-riddle">{p.riddle.map((l) => <span key={l}>{l}</span>)}</p>
        </div>
      ) : (
        <>
          <p className="dark-tv-title">{p.title}</p>
          <p className="dark-tv-sub">You can’t see your own hand.</p>
        </>
      )}
      {centre.length > 0 && !st.riddle && <p className="dark-tv-progress"><span>At the centre: {centre.join(', ')}</span></p>}
    </div>
  );
}

// ---------- Phone ----------
async function torchOn() {
  const md = window.navigator.mediaDevices;
  if (!md?.getUserMedia) throw new Error('no camera');
  const stream = await md.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
  const track = stream.getVideoTracks()[0];
  if (!track?.getCapabilities?.().torch) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('no torch');
  }
  await track.applyConstraints({ advanced: [{ torch: true }] });
  return stream;
}

// Listens quietly while `active`, restarting when the browser stops. Never says it is listening.
function useHiddenEar(active, onLumos) {
  const rec = useRef(null);
  const want = useRef(false);
  const cb = useRef(onLumos);
  cb.current = onLumos;
  const [on, setOn] = useState(false);
  const begin = () => {
    if (!SR || rec.current) return;
    try {
      const r = new SR();
      r.lang = 'en-GB'; r.interimResults = true; r.maxAlternatives = 3; r.continuous = true;
      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (saidLumos([...e.results[i]].map((a) => a.transcript))) { cb.current(); return; }
        }
      };
      r.onerror = () => {};
      r.onend = () => {
        rec.current = null;
        setOn(false);
        if (want.current) setTimeout(begin, 300); // carry on listening (may need a touch again on some phones)
      };
      rec.current = r;
      r.start();
      setOn(true);
    } catch { rec.current = null; }
  };
  useEffect(() => {
    want.current = active;
    if (active) begin();
    else { try { rec.current?.abort(); } catch { /* ignore */ } rec.current = null; }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { want.current = false; try { rec.current?.abort(); } catch { /* ignore */ } }, []);
  return { on, begin };
}

const DPAD = [['up', '▲', 'North'], ['left', '◀', 'West'], ['right', '▶', 'East'], ['down', '▼', 'South']];
const SAY = {
  step: (d) => `You step ${d}.`,
  bump: () => 'Thud. A wall.',
  centre: () => 'The walls fall away into a round room. In the middle, something cold and stone, about waist high.',
  thrown: () => 'You step into nothing. The dark spins, and you land back where you started, cold to the bone.',
  caught: () => 'Something cold closes round you. The dark spins, and you land back where you started.',
  out: () => 'Grey daylight. You are out.',
};

const keyOf = (sid, uid, run, mapIdx) => `maze:${sid}:${uid}:${run}:${mapIdx}`;
function loadPos(k) {
  try { return JSON.parse(window.localStorage.getItem(k) ?? 'null'); } catch { return null; }
}
function savePos(k, v) {
  try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: the GM screen has it */ }
}

export function DarkMazePhone({ sid, uid, p, st, house }) {
  const maze = p.maze;
  const mapIdx = mapFor(maze, st, uid, house);
  const has = mapIdx != null;
  const k = keyOf(sid, uid, st.run ?? 0, mapIdx);
  const [entered, setEntered] = useState(false);
  const [said, setSaid] = useState('');
  const [torch, setTorch] = useState('off'); // off | on | none
  const [me, setMe] = useState(null);
  const stream = useRef(null);
  const wake = useRef(null);
  const lastNear = useRef(false);
  const safeUntil = useRef(0); // a few seconds' grace after being caught or thrown back

  // Where am I? This phone's memory first, then the GM screen's copy, then my map's YOU.
  const here = me?.k === k ? me : has ? (() => {
    const saved = loadPos(k);
    const server = st.pos?.[uid];
    const pos = saved?.pos ?? (server ? [server[0], server[1]] : startOf(maze, mapIdx));
    return { k, pos, centre: saved?.centre ?? !!st.centre?.[uid], out: saved?.out ?? !!st.out?.[uid] };
  })() : null;
  const atPedestal = !!here && st.riddle && inCentre(maze, here.pos);
  const lit = !!st.lumos;

  const send = (state, kind) => logEvent(sid, {
    type: 'maze_move', actorUid: uid, processed: false,
    payload: { pos: state.pos, centre: state.centre, out: state.out, kind },
  }).catch(console.error);
  const commit = (state, kind, line) => {
    if (kind === 'caught' || kind === 'thrown') safeUntil.current = Date.now() + 8000;
    setMe(state);
    savePos(k, state);
    setSaid(line);
    send(state, kind);
  };

  // The pedestal listens. Lumos only works here, and only once the riddle is showing.
  const spoke = useRef(false);
  const ear = useHiddenEar(atPedestal && !lit, () => {
    if (spoke.current) return;
    spoke.current = true;
    logEvent(sid, { type: 'lumos', actorUid: uid, processed: false, payload: { on: true, maze: true } }).catch(console.error);
  });

  const go = (dir) => {
    if (!here || here.out) return;
    if (!audioReady()) unlockAudio().catch(() => {});
    if (atPedestal && !ear.on && !lit) ear.begin(); // a touch lets the phone listen again if it stopped
    const next = move(maze, mapIdx, here, dir);
    let state = { k, pos: next.pos ?? here.pos, centre: next.centre ?? here.centre, out: !!next.out };
    let kind = next.event;
    let line = SAY[kind](DIRS[dir].word);
    if (next.door === 'false') line = kind === 'thrown' ? `The EXIT was bricked up. ${SAY.thrown()}` : 'The EXIT is bricked up. Solid stone.';
    // Walking into the watcher.
    if (kind !== 'thrown' && kind !== 'out' && Date.now() > safeUntil.current && st.watcher && near(state.pos, st.watcher, 0) && !inCentre(maze, state.pos)) {
      state = { k, pos: startOf(maze, mapIdx), centre: false, out: false };
      kind = 'caught';
      line = SAY.caught();
    }
    if (kind === 'bump') { play('bump'); window.navigator.vibrate?.(60); }
    if (kind === 'thrown' || kind === 'caught') { play('caught'); window.navigator.vibrate?.([120, 60, 220]); }
    if (kind === 'centre') play('chime');
    commit(state, kind, line);
  };

  // The watcher moves on the GM screen. If it lands on me, I'm thrown back; if it is close, I can hear it.
  const w = st.watcher;
  useEffect(() => {
    if (!here || here.out || !w || inCentre(maze, here.pos) || Date.now() < safeUntil.current) { lastNear.current = false; return; }
    if (near(here.pos, w, 0)) {
      const state = { k, pos: startOf(maze, mapIdx), centre: false, out: false };
      play('caught');
      window.navigator.vibrate?.([120, 60, 220]);
      commit(state, 'caught', SAY.caught());
      return;
    }
    const close = near(here.pos, w, 2);
    if (close) {
      play('heartbeat');
      window.navigator.vibrate?.([40, 120, 40]);
      if (!lastNear.current) setSaid('Something is breathing, very close. Cold air on the back of your neck.');
    } else if (lastNear.current) setSaid('The breathing fades away.');
    lastNear.current = close;
  }, [w?.[0], w?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  // Light: keep the screen awake while it is a lamp.
  useEffect(() => {
    if (!lit) return undefined;
    play('lumos');
    window.navigator.wakeLock?.request('screen').then((x) => { wake.current = x; }).catch(() => {});
    return () => { wake.current?.release?.().catch(() => {}); };
  }, [lit]);
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  // Arrow keys work too (handy on a laptop).
  useEffect(() => {
    const onKey = (e) => {
      const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (dir) { e.preventDefault(); go(dir); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const lightTorch = async () => {
    try { stream.current = await torchOn(); setTorch('on'); } catch { setTorch('none'); }
  };

  if (!entered) {
    return (
      <div className="dark-phone" role="dialog" aria-label="The mirror">
        <p className="dark-phone-title">The glass ripples…</p>
        <p className="dark-phone-sub">…and swallows you whole.</p>
        <button className="dark-mic" onClick={() => {
          unlockAudio().catch(() => {});
          setEntered(true);
          if (here) send(here, 'enter'); // so the GM screen (and the pedestal) know where I am
        }}>
          <span aria-hidden="true">👁️</span>Open your eyes
        </button>
      </div>
    );
  }
  if (here?.out) {
    return (
      <div className="dark-phone out" role="dialog" aria-label="You are out of the maze">
        <p className="dark-phone-title">You are out.</p>
        <p className="dark-phone-sub">Grey daylight, and the smell of old books. Wait for the others.</p>
      </div>
    );
  }
  if (!has) {
    return (
      <div className="dark-phone" role="dialog" aria-label="It is pitch black">
        <p className="dark-phone-title">It is pitch black.</p>
        <p className="dark-phone-sub">Cold stone underfoot. Somewhere, the others are breathing. Wait: someone is pressing a folded map into your hand…</p>
      </div>
    );
  }

  const houseName = maze.houses[mapIdx];
  return (
    <div className={`dark-phone ${lit ? 'lit' : ''}`} role="dialog" aria-label={lit ? 'The maze is full of light' : 'It is pitch black'}
      onPointerDown={() => { if (atPedestal && !ear.on && !lit) ear.begin(); }}>
      {lit && <div className="lumos-glow" />}
      <div className="maze-stage">
        {!lit && <p className="dark-phone-title">{atPedestal ? 'The pedestal' : 'It is pitch black.'}</p>}
        <p className="maze-map">{HOUSE_ICON[houseName]} The {houseName} map{here.centre && !inCentre(maze, here.pos) ? ' · past the centre: one wrong step and you go back' : ''}</p>
        {atPedestal && !lit && (
          <div className="pedestal-phone">
            <p className="pedestal-riddle">{p.riddle.map((l) => <span key={l}>{l}</span>)}</p>
          </div>
        )}
        {lit && <p className="maze-lit-line">Light pours from everywhere at once. Hold your map up to the light.</p>}
        <p className="maze-said" aria-live="polite">{said || 'You are standing on the star marked YOU. Feel your way with the arrows.'}</p>
        <div className="maze-pad" role="group" aria-label="Walk">
          {DPAD.map(([dir, glyph, label]) => (
            <button key={dir} className={`maze-btn maze-${dir}`} onClick={() => go(dir)} aria-label={label}>{glyph}</button>
          ))}
        </div>
        {lit && torch === 'off' && <button className="btn small" onClick={lightTorch}>🔦 Brighter: use the torch too</button>}
        {lit && torch === 'none' && <p className="small">This phone won’t let the page use its torch. Turn the screen brightness right up.</p>}
      </div>
    </div>
  );
}

// ---------- GM screen engine: the watcher and the pedestal ----------
// Runs on the GM screen while the maze is up (whichever tab is open).
export function useMazeEngine(sid, data, session, chars) {
  const pz = session?.state?.puzzle;
  const def = pz && data?.puzzles?.find((x) => x.id === pz.id);
  const live = !!def && def.type === 'darkmaze' && !pz.solved;
  const ref = useRef({});
  ref.current = { pz, def, chars, session };

  // The pedestal: lights when every house in the maze has someone in the centre room.
  useEffect(() => {
    if (!live || pz.riddle) return;
    const mapOf = Object.fromEntries((session.playerUids ?? []).filter((u) => chars?.[u])
      .map((u) => [u, mapFor(def.maze, pz, u, chars[u].house)]));
    if (housesUnited(def.maze, pz, mapOf)) {
      setPuzzle(sid, { riddle: true })
        .then(() => logEvent(sid, { type: 'maze_riddle', payload: {} }))
        .catch(console.error);
    }
  }, [live, pz?.pos, pz?.riddle]); // eslint-disable-line react-hooks/exhaustive-deps

  // The watcher: one step every few seconds (slower once the light is lit).
  const slow = !!pz?.lumos;
  const on = live && pz.watcherOn !== false;
  useEffect(() => {
    if (!on) return undefined;
    let last = null;
    const tick = () => {
      const { pz: cur, def: d } = ref.current;
      if (!cur || !d || cur.solved || cur.watcherOn === false) return;
      const at = cur.watcher ? [cur.watcher[0], cur.watcher[1]] : watcherHome(d.maze);
      const targets = Object.entries(cur.pos ?? {})
        .filter(([u, pos]) => !cur.out?.[u] && !inCentre(d.maze, pos)).map(([, pos]) => [pos[0], pos[1]]);
      const next = cur.watcher ? watcherStep(d.maze, at, targets, last) : at;
      last = at;
      setPuzzle(sid, { watcher: next }).catch(console.error);
    };
    tick();
    const id = setInterval(tick, slow ? 4200 : 2600);
    return () => clearInterval(id);
  }, [sid, on, slow]);
}

// ---------- GM: the maze key ----------
export function MazeKey({ maze, people = [], watcher = null }) {
  const n = maze.n;
  const cs = 10;
  const W = n * cs;
  const ln = (w) => {
    const [kk, r, c] = w;
    return kk === 'h'
      ? <line key={w.join()} x1={c * cs} y1={(r + 1) * cs} x2={(c + 1) * cs} y2={(r + 1) * cs} />
      : <line key={w.join()} x1={(c + 1) * cs} y1={r * cs} x2={(c + 1) * cs} y2={(r + 1) * cs} />;
  };
  const mid = ([r, c]) => [c * cs + cs / 2, r * cs + cs / 2];
  const path = [[7, 7], ...maze.truePath].map(mid).map((pt) => pt.join(',')).join(' ');
  const [ex, ey] = mid(maze.exit);
  return (
    <svg className="maze-key" viewBox={`-8 -8 ${W + 16} ${W + 16}`} role="img" aria-label="The real maze, with the way out">
      <rect x="0" y="0" width={W} height={W} className="mk-floor" />
      <rect x={6 * cs} y={6 * cs} width={3 * cs} height={3 * cs} className="mk-centre" />
      <polyline points={path} className="mk-path" />
      <g className="mk-walls">{maze.walls.map(ln)}</g>
      {maze.falseDoors.map((d) => {
        const [x, y] = mid(d);
        return <text key={d.join()} x={x} y={y + 3} className="mk-false">✕</text>;
      })}
      <text x={ex} y={ey + 3} className="mk-out">OUT</text>
      {maze.starts.map((s, i) => {
        const [x, y] = mid(s);
        return <g key={i}><circle cx={x} cy={y} r="4.4" className="mk-start" /><text x={x} y={y + 2} className="mk-num">{(maze.houses?.[i] ?? '?')[0]}</text></g>;
      })}
      {watcher && (() => {
        const [x, y] = mid(watcher);
        return <g className="mk-watcher"><circle cx={x} cy={y} r="4.2" /><text x={x} y={y + 1.8}>👁</text></g>;
      })()}
      {people.map(({ uid, name, pos }, i) => {
        const [x, y] = mid(pos);
        const off = (i % 3) - 1; // nudge people sharing a square apart a little
        return (
          <g key={uid} className="mk-person">
            <circle cx={x + off * 2} cy={y + off * 2} r="3.6" />
            <text x={x + off * 2} y={y + off * 2 + 1.5}>{name.slice(0, 2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DarkMazeGM({ sid, p, st, chars, players, onSet }) {
  const maze = p.maze;
  const people = players.map((u) => {
    const idx = mapFor(maze, st, u, chars[u].house);
    if (idx == null) return null;
    const pos = st.pos?.[u] ?? maze.starts[idx];
    return { uid: u, name: chars[u].firstName ?? chars[u].name, pos: [pos[0], pos[1]] };
  }).filter(Boolean);
  const lightIt = () => {
    onSet({ lumos: true, lightbox: true });
    logEvent(sid, { type: 'lumos', payload: { on: true, maze: true, gm: true } }).catch(console.error);
  };
  return (
    <div className="dark-gm">
      <div className="maze-assign">
        {players.map((u) => {
          const c = chars[u];
          const auto = maze.houses.indexOf(c.house);
          const cur = st.maps?.[u];
          return (
            <label key={u} className="maze-assign-row">
              <span className="maze-assign-name">{c.firstName ?? c.name}</span>
              <select value={cur ?? ''} onChange={(e) => onSet({ [`maps.${u}`]: e.target.value === '' ? null : Number(e.target.value) })}>
                <option value="">{auto >= 0 ? `${maze.houses[auto]} map (their house)` : 'No map yet'}</option>
                {maze.houses.map((h, i) => <option key={h} value={i}>{h} map</option>)}
              </select>
              <span className="small muted">
                {st.out?.[u] ? '★ out' : st.pos?.[u] && inCentre(maze, st.pos[u]) ? '◎ at the centre' : st.centre?.[u] ? 'past the centre' : 'walking'}
              </span>
            </label>
          );
        })}
      </div>
      <p className="muted small">Hand each house its map. Phones start on their house’s YOU (change it here for anyone without a house). Walls are real. Past the centre, one bump throws them back (1d4). The watcher drifts through the dark: if it reaches someone, they go back to their start (1d4). It can’t enter the centre.</p>
      <div className="dark-gm-row">
        <span className={`tag ${st.riddle ? 'tag-green' : ''}`}>{st.riddle ? '🕯️ Pedestal lit: the riddle is showing' : 'Pedestal: waiting for every house at the centre'}</span>
        <span className={`tag ${st.lumos ? 'tag-green' : ''}`}>{st.lumos ? '✨ Lumos! Lit' : 'Dark'}</span>
      </div>
      <div className="actions">
        {!st.riddle && <button className="btn small" onClick={() => { onSet({ riddle: true }); logEvent(sid, { type: 'maze_riddle', payload: {} }).catch(console.error); }}>🕯️ Light the pedestal now</button>}
        {st.riddle && !st.lumos && <button className="btn small gold" onClick={lightIt}>✨ They said it: light everything (if a phone didn’t hear)</button>}
        <label className="announce">
          <input type="checkbox" checked={st.watcherOn !== false} onChange={(e) => onSet({ watcherOn: e.target.checked })} />
          👁️ The watcher is loose
        </label>
      </div>
      <p className="muted small"><b>The riddle:</b> {p.riddle.join(' ')} <b>Answer:</b> darkness, so they say <i>Lumos</i>. The phones at the pedestal are listening, but nothing tells them so.</p>
      <MazeKey maze={maze} people={people} watcher={st.watcher} />
      <p className="muted small">Gold: the only way out. ✕: the bricked-up EXITs. Letters: where each house starts. 👁: the watcher. Initials: the players.</p>
    </div>
  );
}
