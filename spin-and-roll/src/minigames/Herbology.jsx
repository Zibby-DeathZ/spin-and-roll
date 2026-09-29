import { useEffect, useRef, useState } from 'react';

// Mandrake Repotting: tap Mandrakes back down before they scream. 3 screams and you fail.
const TOTAL = 15, SCREAMS = 3;

export default function Herbology({ diff, onFinish }) {
  const life = [1250, 950, 750][diff - 1];
  const gap = [650, 500, 380][diff - 1];
  const g = useRef({ up: {}, spawned: 0, saved: 0, screams: 0, nextSpawn: Date.now() + 600, over: false, shout: null });
  const [, render] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      const s = g.current;
      if (s.over) return;
      const now = Date.now();
      // Spawn
      if (s.spawned < TOTAL && now >= s.nextSpawn) {
        const free = [...Array(9).keys()].filter((i) => !s.up[i]);
        if (free.length) {
          s.up[free[Math.floor(Math.random() * free.length)]] = now + life;
          s.spawned++;
        }
        s.nextSpawn = now + gap + Math.random() * gap;
      }
      // Screams
      for (const [pot, exp] of Object.entries(s.up)) {
        if (exp <= now) { delete s.up[pot]; s.screams++; s.shout = Number(pot); s.shoutUntil = now + 400; }
      }
      if (s.shout !== null && now > s.shoutUntil) s.shout = null;
      // End
      if (s.screams >= SCREAMS) { s.over = true; onFinish(false, `${s.saved}/${TOTAL} repotted`); }
      else if (s.spawned >= TOTAL && !Object.keys(s.up).length) { s.over = true; onFinish(true, `${s.saved}/${TOTAL} repotted`); }
      render((x) => x + 1);
    }, 50);
    return () => clearInterval(t);
  }, [life, gap, onFinish]);

  const tap = (i) => {
    const s = g.current;
    if (!s.up[i] || s.over) return;
    delete s.up[i];
    s.saved++;
    render((x) => x + 1);
  };

  const s = g.current;
  return (
    <div className="mg">
      <p className="mg-status">Repotted {s.saved}. Screams {s.screams} / {SCREAMS}</p>
      <div className="pots">
        {[...Array(9).keys()].map((i) => (
          <button key={i} className={`pot ${s.up[i] ? 'up' : ''} ${s.shout === i ? 'scream' : ''}`} onClick={() => tap(i)}
            aria-label={s.up[i] ? 'Mandrake! Tap it' : 'Empty pot'}>
            <span>{s.up[i] ? '🌱😠' : s.shout === i ? '😱' : '🪴'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
