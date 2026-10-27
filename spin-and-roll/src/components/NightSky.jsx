import { useMemo } from 'react';

// A quiet starry backdrop for the dashboards (a calmer cousin of the front gate).
export default function NightSky() {
  const stars = useMemo(() => Array.from({ length: 60 }, () => ({
    left: Math.random() * 100, top: Math.random() * 100, size: Math.random() < 0.15 ? 2 : 1,
    delay: Math.random() * 6, dur: 3 + Math.random() * 4,
  })), []);
  return (
    <div className="night-sky" aria-hidden="true">
      {stars.map((s, i) => (
        <span key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />
      ))}
    </div>
  );
}
