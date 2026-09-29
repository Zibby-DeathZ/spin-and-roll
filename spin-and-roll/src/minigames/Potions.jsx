import { useEffect, useRef, useState } from 'react';

// Stir Timing: tap when the needle is in the green zone. 5 stirs, 4 hits to pass.
const STIRS = 5, NEED = 4;

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
        <span className="stir-zone" style={{ left: `${zone}%`, width: `${width}%` }} />
        <span className="stir-needle" style={{ left: `${pos.current}%` }} />
      </div>
      <p className="mg-cauldron" aria-hidden="true">🫕</p>
      <button className="btn gold big" onClick={tap}>Stir!</button>
    </div>
  );
}
