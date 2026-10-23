// The end-of-day ceremony on the TV: the day's house race in hourglasses, the House of the Day
// with its perk, then the award cards. Also used for the GM's "Tonight's awards" (no race).
import { useEffect, useMemo, useState } from 'react';
import HouseCrest, { HOUSE_STYLE } from './HouseCrest';
import { perkById } from '../lib/houses';
import { play } from '../lib/sound';
import { standingsOf } from '../lib/world';

// Steps through the ceremony: 0 race, 1 House of the Day, 2 awards.
function useStage(key, hasRace) {
  const [stage, setStage] = useState(hasRace ? 0 : 2);
  useEffect(() => {
    if (!hasRace) { setStage(2); return undefined; }
    setStage(0);
    const a = setTimeout(() => setStage(1), 4200);
    const b = setTimeout(() => setStage(2), 13000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [key, hasRace]);
  return [stage, setStage];
}

function CountUp({ to, ms = 2600, delay = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const t = setTimeout(() => {
      const step = (now) => {
        start ??= now;
        const k = Math.min(1, (now - start) / ms);
        setN(Math.round(to * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [to, ms, delay]);
  return <>{n}</>;
}

// A house hourglass: gems pour from the top bulb into the bottom one.
function Hourglass({ house, pts, top, win, i }) {
  const s = HOUSE_STYLE[house.toLowerCase()] ?? { field2: '#888', field: '#555', metal: '#e3b04b' };
  const f = top > 0 ? Math.max(0, pts) / top : 0;
  const id = `hg-${house}`;
  return (
    <div className={`hg ${win ? 'win' : ''}`} style={{ '--i': i, '--f': f, '--left': 1 - f * 0.85 }}>
      <svg viewBox="0 0 120 230" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-top`}><path d="M24 24 H96 C96 66 66 92 62 112 H58 C54 92 24 66 24 24 Z" /></clipPath>
          <clipPath id={`${id}-bot`}><path d="M58 118 H62 C66 138 96 164 96 206 H24 C24 164 54 138 58 118 Z" /></clipPath>
          <linearGradient id={`${id}-sand`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={s.field2} /><stop offset="1" stopColor={s.field} />
          </linearGradient>
          <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".3" stopColor="#fff" stopOpacity=".04" />
            <stop offset=".75" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}-top)`}><rect className="hg-top" x="20" y="22" width="80" height="92" fill={`url(#${id}-sand)`} /></g>
        <g clipPath={`url(#${id}-bot)`}><rect className="hg-bot" x="20" y={206 - 88 * f} width="80" height={88 * f + 2} fill={`url(#${id}-sand)`} /></g>
        <line className="hg-stream" x1="60" y1="108" x2="60" y2="204" stroke={s.field2} strokeWidth="2.5" strokeDasharray="3 4" />
        <path d="M24 24 H96 C96 66 66 92 62 115 C66 138 96 164 96 206 H24 C24 164 54 138 58 115 C54 92 24 66 24 24 Z"
          fill={`url(#${id}-glass)`} stroke="#f6e7c4" strokeOpacity=".55" strokeWidth="1.5" />
        <rect x="10" y="10" width="100" height="14" rx="4" fill="#c99a3d" stroke="#6b4a14" />
        <rect x="10" y="206" width="100" height="14" rx="4" fill="#c99a3d" stroke="#6b4a14" />
        <rect x="14" y="24" width="5" height="182" fill="#a77b2a" /><rect x="101" y="24" width="5" height="182" fill="#a77b2a" />
      </svg>
      <HouseCrest house={house} className="hg-crest" />
      <strong className="hg-pts">+<CountUp to={pts} delay={300 + i * 150} /></strong>
      <span className="hg-name">{house}</span>
    </div>
  );
}

// Gold motes drifting upwards, and a few floating candles.
function Motes() {
  const motes = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    left: (i * 37) % 100, delay: (i * 0.53) % 9, dur: 7 + ((i * 13) % 7), size: 2 + (i % 4),
  })), []);
  // Candles float to either side of the title, never across it.
  const candles = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    left: i < 5 ? 3 + i * 5.5 + ((i * 7) % 3) : 70 + (i - 5) * 5.8 + ((i * 7) % 3), top: 3 + ((i * 17) % 16), delay: (i * 0.7) % 4, h: 26 + ((i * 11) % 18),
  })), []);
  return (
    <div className="cer-air" aria-hidden="true">
      {candles.map((c, i) => (
        <span key={`c${i}`} className="cer-candle" style={{ left: `${c.left}%`, top: `${c.top}%`, animationDelay: `${c.delay}s`, '--h': `${c.h}px` }}>
          <i className="flame" />
        </span>
      ))}
      {motes.map((m, i) => (
        <span key={i} className="cer-mote" style={{ left: `${m.left}%`, width: m.size, height: m.size, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
      ))}
    </div>
  );
}

function HouseOfDay({ leaders, perk }) {
  return (
    <div className="hod-reveal">
      <p className="cer-kicker">The House of the Day</p>
      <div className="hod-crests">
        {leaders.map((h) => (
          <div key={h} className={`hod-crest-wrap house-${h.toLowerCase()}`}>
            <span className="hod-rays" />
            <HouseCrest house={h} className="hod-crest" />
          </div>
        ))}
      </div>
      <h2 className="hod-name">{leaders.join(' & ')}</h2>
      {perk && (
        <div className="perk-card">
          <span className="perk-seal">{perk.icon}</span>
          <span className="perk-text"><strong>{perk.name}</strong><span>{perk.text}</span></span>
        </div>
      )}
    </div>
  );
}

function AwardCards({ awards }) {
  if (!awards.length) return <p className="cer-empty">A quiet day. The castle is saving its surprises…</p>;
  return (
    <div className="cer-awards">
      {awards.map((a, i) => (
        <div key={a.title} className="cer-award" style={{ '--i': i }}>
          <span className="cer-medal">{a.icon}</span>
          <span className="cer-title">{a.title}</span>
          <span className="cer-who">{a.name}</span>
          <span className="cer-val">{a.value} {a.unit}</span>
        </div>
      ))}
    </div>
  );
}

export default function AwardsCeremony({ show, inline = false }) {
  const day = show.kind === 'day';
  const standings = standingsOf(show);
  const leaders = show.leaders ?? [];
  const hasRace = day && standings.length > 0;
  const [stage, setStage] = useStage(show.at ?? show.awards?.length, hasRace);
  const perk = perkById(show.perk);
  const top = Math.max(1, ...standings.map(([, p]) => p));
  useEffect(() => { if (stage === 1 && leaders.length) play('sparkle'); }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const winHouse = leaders[0]?.toLowerCase();
  return (
    <div className={`day-cer ${inline ? 'inline' : ''} ${stage >= 1 && winHouse ? `glow-${winHouse}` : ''}`} role="region" aria-label="Awards ceremony">
      <Motes />
      <header className="cer-head">
        <p className="cer-eyebrow">{day ? 'The candles burn low over the Great Hall' : 'Before you go to bed'}</p>
        <h1 className="cer-title-main">{day ? (show.day ? `The End of Day ${show.day}` : 'The End of the Day') : 'Tonight’s Awards'}</h1>
      </header>

      {hasRace && stage < 2 && (
        <div className={`cer-race ${stage === 1 ? 'with-hod' : ''}`}>
          <div className="hg-row">
            {standings.map(([h, p], i) => <Hourglass key={h} house={h} pts={p} top={top} win={stage === 1 && leaders.includes(h)} i={i} />)}
          </div>
          {stage === 1 && (leaders.length
            ? <HouseOfDay leaders={leaders} perk={perk} />
            : <p className="cer-empty">No house earned a point today. Nobody takes the day.</p>)}
        </div>
      )}

      {stage === 2 && (
        <>
          {day && leaders.length > 0 && perk && (
            <p className="cer-hod-line"><HouseCrest house={leaders[0]} className="cer-mini-crest" /> {leaders.join(' & ')} {leaders.length > 1 ? 'share' : 'hold'} the day: {perk.icon} {perk.name}</p>
          )}
          <AwardCards awards={show.awards ?? []} />
        </>
      )}

      {hasRace && (
        <nav className="cer-dots" aria-label="Ceremony steps">
          {['House race', 'House of the Day', 'Awards'].map((l, i) => (
            <button key={l} className={stage === i ? 'on' : ''} aria-label={l} onClick={() => setStage(i)} />
          ))}
        </nav>
      )}
    </div>
  );
}
