import { useEffect, useRef, useState } from 'react';

// Stir Timing: tap when the needle is in the green zone. 5 stirs, 4 hits to pass.
const STIRS = 5, NEED = 4;

// The cauldron: the brew turns from murky to bright green as the perfect stirs add up.
const BREW = ['#5b4a3a', '#5b6a3a', '#4f8a42', '#3faa55', '#47d27a', '#7cf0a0'];
function Cauldron({ hits, stir, flash }) {
  const bad = stir - hits;
  const brew = bad ? '#7a4a6a' : BREW[Math.min(hits, BREW.length - 1)];
  return (
    <svg className={`cauldron ${flash ?? ''}`} viewBox="0 0 200 170" aria-hidden="true">
      <defs>
        <radialGradient id="cauldron-iron" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#4a4658" /><stop offset="1" stopColor="#141220" /></radialGradient>
      </defs>
      <g className="steam">{[60, 100, 140].map((x, i) => <path key={x} d={`M${x} 40 q-10 -14 0 -26 q10 -12 0 -24`} style={{ animationDelay: `${i * 0.6}s` }} />)}</g>
      <path d="M40 66 L52 150 L148 150 L160 66 Z" fill="url(#cauldron-iron)" />
      <path d="M36 150 l-8 16 M164 150 l8 16 M100 150 v16" stroke="#141220" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="100" cy="66" rx="64" ry="14" fill={brew} className="brew" />
      <g className="bubbles" fill={brew}>
        {[70, 92, 112, 130].map((x, i) => <circle key={x} cx={x} cy="66" r={3 + (i % 2) * 2} style={{ animationDelay: `${i * 0.35}s` }} />)}
      </g>
      <ellipse cx="100" cy="66" rx="66" ry="15" fill="none" stroke="#2b2838" strokeWidth="6" />
      <path d="M58 92 q-6 24 2 48" stroke="#fff" strokeOpacity=".12" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="40" y="150" width="120" height="6" rx="3" fill="#e2783a" opacity=".6" className="fire" />
    </svg>
  );
}

export default function Potions({ diff, onFinish }) {
  const width = [22, 16, 11][diff - 1];
  const newZone = () => 8 + Math.random() * (84 - width);
  const [zone, setZone] = useState(newZone);
  const [, render] = useState(0);
  const [stir, setStir] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState(null);
  const pos = useRef(0);
  const dir = useRef(1);
  const speed = useRef([0.9, 1.15, 1.4][diff - 1]);

  useEffect(() => {
    let raf, last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 16.7; last = t;
      let n = pos.current + dir.current * speed.current * dt;
      if (n >= 100) { n = 100; dir.current = -1; }
      if (n <= 0) { n = 0; dir.current = 1; }
      pos.current = n;
      render((x) => x + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tap = () => {
    const p = pos.current;
    const ok = p >= zone && p <= zone + width;
    const h = hits + (ok ? 1 : 0);
    const s = stir + 1;
    setFlash(ok ? 'good' : 'bad');
    setTimeout(() => setFlash(null), 300);
    setHits(h); setStir(s);
    if (s - h > STIRS - NEED) { onFinish(false, `${h}/${s} stirs`); return; }
    if (s === STIRS) { onFinish(h >= NEED, `${h}/${STIRS} stirs`); return; }
    speed.current *= 1.12;
    setZone(newZone());
  };

  return (
    <div className="mg">
      <p className="mg-status">Stir {Math.min(stir + 1, STIRS)} of {STIRS}. Perfect stirs: {hits} (need {NEED})</p>
      <div className={`stirbar ${flash ?? ''}`}>
        <span className="stir-ticks" aria-hidden="true" />
        <span className="stir-zone" style={{ left: `${zone}%`, width: `${width}%` }} />
        <span className="stir-needle" style={{ left: `${pos.current}%` }}><span>🥄</span></span>
      </div>
      <Cauldron hits={hits} stir={stir} flash={flash} />
      <button className="btn gold big" onClick={tap}>Stir!</button>
    </div>
  );
}
