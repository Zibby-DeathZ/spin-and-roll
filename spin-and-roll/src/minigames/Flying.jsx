import { useEffect, useRef, useState } from 'react';

// Broom Dodge: switch lanes to dodge obstacles for 20 seconds. 3 crashes and you fail.
const LANES = 3, TIME = 20, CRASHES = 3;
const THINGS = ['🌳', '🦅', '🏰', '⛈️', '🦇'];

export default function Flying({ diff, onFinish }) {
  const spawnMs = [950, 720, 540][diff - 1];
  const fall = [1.3, 1.7, 2.1][diff - 1];
  const g = useRef({ lane: 1, obs: [], crashes: 0, start: Date.now(), nextSpawn: Date.now() + 500, over: false });
  const [, render] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const s = g.current;
      if (s.over) return;
      const now = Date.now();
      if (now >= s.nextSpawn) {
        s.obs.push({ id: Math.random(), lane: Math.floor(Math.random() * LANES), y: -10, icon: THINGS[Math.floor(Math.random() * THINGS.length)] });
        s.nextSpawn = now + spawnMs;
      }
      s.obs = s.obs.filter((o) => o.y < 110);
      for (const o of s.obs) {
        o.y += fall;
        if (!o.hit && o.y >= 78 && o.y <= 92 && o.lane === s.lane) { o.hit = true; s.crashes++; }
      }
      const left = TIME - Math.floor((now - s.start) / 1000);
      if (s.crashes >= CRASHES) { s.over = true; onFinish(false, `Crashed after ${TIME - left}s`); }
      else if (left <= 0) { s.over = true; onFinish(true, `${CRASHES - s.crashes} lives left`); }
      render((x) => x + 1);
    }, 30);
    return () => clearInterval(t);
  }, [spawnMs, fall, onFinish]);

  const move = (d) => { g.current.lane = Math.max(0, Math.min(LANES - 1, g.current.lane + d)); render((x) => x + 1); };
  const s = g.current;
  const left = Math.max(0, TIME - Math.floor((Date.now() - s.start) / 1000));

  return (
    <div className="mg">
      <p className="mg-status">⏱ {left}s. Crashes {s.crashes} / {CRASHES}</p>
      <div className="sky">
        {s.obs.map((o) => (
          <span key={o.id} className={`ob ${o.hit ? 'hit' : ''}`} style={{ left: `${(o.lane + 0.5) * (100 / LANES)}%`, top: `${o.y}%` }}>{o.icon}</span>
        ))}
        <span className="broom" style={{ left: `${(s.lane + 0.5) * (100 / LANES)}%` }}>🧹</span>
      </div>
      <div className="duel-btns two">
        <button className="btn big" onClick={() => move(-1)} aria-label="Left">◀</button>
        <button className="btn big" onClick={() => move(1)} aria-label="Right">▶</button>
      </div>
    </div>
  );
}
