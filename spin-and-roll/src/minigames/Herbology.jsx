import { useEffect, useRef, useState } from 'react';

// Mandrake Repotting: tap Mandrakes back down before they scream. 3 screams and you fail.
const TOTAL = 15, SCREAMS = 3;

// A terracotta pot. Down: just leaves. Up: a grumpy Mandrake root. Scream: mouth wide open.
function Pot({ state }) {
  return (
    <svg viewBox="0 0 100 100" className="pot-svg" aria-hidden="true">
      <g className={`mandrake ${state}`}>
        <path d="M50 30 c-10 -14 -20 -12 -26 -6 c10 0 18 4 24 10 M50 30 c10 -14 20 -12 26 -6 c-10 0 -18 4 -24 10 M50 30 c-2 -14 2 -22 8 -26 c-2 8 -4 16 -6 26" fill="#5fa85a" stroke="#2f6b30" strokeWidth="1.5" />
        {state !== 'down' && (
          <g>
            <path d="M34 38 C32 56 40 70 50 72 C60 70 68 56 66 38 C60 32 40 32 34 38 Z" fill="#b98b5e" stroke="#6b4a2c" strokeWidth="1.5" />
            <path d="M40 46 l6 2 M60 46 l-6 2" stroke="#3b2414" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="43" cy="51" r="2" fill="#3b2414" /><circle cx="57" cy="51" r="2" fill="#3b2414" />
            {state === 'scream'
              ? <ellipse cx="50" cy="61" rx="6" ry="7" fill="#3b1414" />
              : <path d="M44 61 q6 -4 12 0" stroke="#3b2414" strokeWidth="2" fill="none" strokeLinecap="round" />}
          </g>
        )}
      </g>
      <path d="M22 62 H78 L72 96 H28 Z" fill="#c1653a" stroke="#7a3a1e" strokeWidth="1.5" />
      <rect x="18" y="56" width="64" height="12" rx="3" fill="#d27848" stroke="#7a3a1e" strokeWidth="1.5" />
      <ellipse cx="50" cy="58" rx="28" ry="3.5" fill="#4a3020" />
      {state === 'scream' && <path d="M14 20 l8 8 M86 20 l-8 8 M50 4 v8 M10 40 h8 M90 40 h-8" stroke="#ffd36a" strokeWidth="3" strokeLinecap="round" className="scream-lines" />}
    </svg>
  );
}

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
            <Pot state={s.up[i] ? 'up' : s.shout === i ? 'scream' : 'down'} />
          </button>
        ))}
      </div>
    </div>
  );
}
