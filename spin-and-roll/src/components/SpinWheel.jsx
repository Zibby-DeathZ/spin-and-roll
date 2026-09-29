import { useEffect, useRef, useState } from 'react';
import { applySpin, hideSpin, SPIN_MS, startSpin } from '../lib/game';

const COLORS = ['#E3B04B', '#4FB3A9', '#D0543F', '#8E7CC3'];

function polar(r, a) {
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
}

// A wheel that spins forward and lands on segment `idx` whenever spinId changes.
export function WheelView({ wheel, idx, spinId, size = 420, onLanded }) {
  const n = wheel.segments.length;
  const seg = 360 / n;
  const rot = useRef(0);
  const [angle, setAngle] = useState(0);
  const [landed, setLanded] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Slice i spans [i*seg, (i+1)*seg] measured clockwise from the top pointer.
    const target = 360 - (idx + 0.5) * seg;
    const base = rot.current - (rot.current % 360);
    const next = base + 360 * 6 + target + (Math.random() - 0.5) * seg * 0.6;
    rot.current = next;
    setLanded(false);
    setAngle(next);
    const t = setTimeout(() => { setLanded(true); onLanded?.(); }, reduce ? 50 : SPIN_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  const slices = wheel.segments.map((s, i) => {
    const a0 = (i * seg - 90) * (Math.PI / 180);
    const a1 = ((i + 1) * seg - 90) * (Math.PI / 180);
    const [x0, y0] = polar(96, a0);
    const [x1, y1] = polar(96, a1);
    const mid = (i + 0.5) * seg;
    const [tx, ty] = polar(60, (mid - 90) * (Math.PI / 180));
    const hit = landed && i === idx;
    return (
      <g key={i}>
        <path d={`M100 100 L${x0} ${y0} A96 96 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1} Z`}
          fill={COLORS[i % COLORS.length]} stroke="#17142A" strokeWidth="1.5" opacity={landed && !hit ? 0.45 : 1} />
        <text x={tx} y={ty} fill="#17142A" fontSize={s.label.length > 9 ? 7.5 : 9.5} fontWeight="700"
          fontFamily="Figtree, sans-serif" textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(${mid} ${tx} ${ty})`}>{s.label}</text>
      </g>
    );
  });

  return (
    <div className="spin-wrap">
      <svg width={size} height={size * 1.06} viewBox="0 -8 200 212" role="img" aria-label={`${wheel.name} wheel`}>
        <g style={{
          transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px',
          transition: reduce ? 'none' : `transform ${SPIN_MS}ms cubic-bezier(.12,.72,.14,1)`,
        }}>
          {slices}
          <circle cx="100" cy="100" r="96" fill="none" stroke="#ECE4D3" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="11" fill="#17142A" stroke="#ECE4D3" strokeWidth="2.5" />
        </g>
        <path d="M100 10 L108 -6 L92 -6 Z" fill="#ECE4D3" stroke="#17142A" strokeWidth="1" />
      </svg>
      <p className={`spin-result ${landed ? 'show' : ''}`} aria-live="polite">
        {landed ? wheel.segments[idx].text : `${wheel.icon} ${wheel.name}`}
      </p>
    </div>
  );
}

// ---------- TV ----------
export function TVSpin({ data, spin, name }) {
  const wheel = data.wheels[spin.wheelId];
  return (
    <div className="tv-spin">
      <h2>{wheel.icon} {wheel.name}{name ? `: ${name}` : ''}</h2>
      <WheelView wheel={wheel} idx={spin.idx} spinId={spin.id} size={Math.min(480, window.innerHeight * 0.55)} />
    </div>
  );
}

// ---------- GM ----------
export function GMSpin({ sid, data, session, chars }) {
  const ids = Object.keys(data.wheels);
  const [wheelId, setWheelId] = useState(ids[0]);
  const [uid, setUid] = useState('');
  const spin = session.state?.spin;
  const players = session.playerUids.filter((u) => chars[u]);

  // Apply the landed result once the wheel stops.
  useEffect(() => {
    if (!spin || spin.applied) return undefined;
    const wait = Math.max(0, spin.at + SPIN_MS + 300 - Date.now());
    const t = setTimeout(() => applySpin(sid, data, spin).catch(console.error), wait);
    return () => clearTimeout(t);
  }, [sid, data, spin]);

  const current = spin && data.wheels[spin.wheelId];
  const landed = spin?.applied;

  return (
    <section className="gm-spin">
      <h2>🎡 Wheels</h2>
      <div className="gm-give">
        <select value={wheelId} onChange={(e) => setWheelId(e.target.value)} aria-label="Wheel">
          {ids.map((id) => <option key={id} value={id}>{data.wheels[id].icon} {data.wheels[id].name}</option>)}
        </select>
        <select value={uid} onChange={(e) => setUid(e.target.value)} aria-label="Who spins">
          <option value="">Nobody (whole table)</option>
          {players.map((u) => <option key={u} value={u}>{chars[u].firstName ?? chars[u].name}</option>)}
        </select>
        <button className="btn small gold" onClick={() => startSpin(sid, data, wheelId, uid || null)}>Spin</button>
      </div>
      {current && (
        <div className="spin-status">
          <span>
            {current.icon} {current.name}
            {spin.uid && chars[spin.uid] ? ` for ${chars[spin.uid].firstName ?? chars[spin.uid].name}` : ''}:{' '}
            <strong>{landed ? current.segments[spin.idx].text : 'spinning…'}</strong>
          </span>
          <span className="actions">
            <button className="btn small" disabled={!landed}
              onClick={() => startSpin(sid, data, spin.wheelId, spin.uid)}>Re-spin (Felix)</button>
            {!spin.hidden && <button className="btn small ghost" onClick={() => hideSpin(sid)}>Hide from TV</button>}
          </span>
        </div>
      )}
      <p className="muted small">Effects in a result (HP, XP, points, items) apply to whoever spun once it lands.</p>
    </section>
  );
}
