import { useEffect, useRef, useState } from 'react';

// Wand Motion: watch the pattern, repeat it. Grows each round.
const DIRS = [['up', '↑'], ['right', '→'], ['down', '↓'], ['left', '←']];
const target = (d) => [5, 6, 8][d - 1];

export default function Charms({ diff, onFinish }) {
  const [seq, setSeq] = useState(() => Array.from({ length: 3 }, () => Math.floor(Math.random() * 4)));
  const [phase, setPhase] = useState('show'); // show | input
  const [lit, setLit] = useState(null);
  const [pos, setPos] = useState(0);
  const speed = [650, 520, 420][diff - 1];
  const timers = useRef([]);

  useEffect(() => {
    if (phase !== 'show') return undefined;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    seq.forEach((d, i) => {
      timers.current.push(setTimeout(() => setLit(d), 400 + i * speed));
      timers.current.push(setTimeout(() => setLit(null), 400 + i * speed + speed * 0.65));
    });
    timers.current.push(setTimeout(() => { setPhase('input'); setPos(0); }, 400 + seq.length * speed));
    return () => timers.current.forEach(clearTimeout);
  }, [phase, seq, speed]);

  const press = (d) => {
    if (phase !== 'input') return;
    setLit(d);
    setTimeout(() => setLit(null), 150);
    if (d !== seq[pos]) { onFinish(false, `${seq.length - 1} moves`); return; }
    if (pos + 1 === seq.length) {
      if (seq.length >= target(diff)) { onFinish(true, `${seq.length} moves`); return; }
      setTimeout(() => { setSeq((s) => [...s, Math.floor(Math.random() * 4)]); setPhase('show'); }, 450);
    } else setPos(pos + 1);
  };

  return (
    <div className="mg">
      <p className="mg-status">
        {phase === 'show' ? 'Watch Professor Flitwick’s wand…' : 'Your turn! Repeat the motion'}
        <span className="muted"> {seq.length} / {target(diff)}</span>
      </p>
      <div className="dpad">
        {DIRS.map(([id, glyph], i) => (
          <button key={id} className={`dpad-${id} ${lit === i ? 'lit' : ''}`} disabled={phase !== 'input'}
            onClick={() => press(i)} aria-label={id}>{glyph}</button>
        ))}
        <span className="dpad-core" aria-hidden="true">🪄</span>
      </div>
    </div>
  );
}
