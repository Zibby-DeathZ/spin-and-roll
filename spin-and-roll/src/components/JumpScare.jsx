import { useEffect, useRef, useState } from 'react';
import { play } from '../lib/sound';

const SCARE_MS = 2600;

// A drawn monster maw: glowing eyes over a mouth full of jagged teeth.
function Maw({ small = false }) {
  const top = Array.from({ length: 9 }, (_, i) => {
    const x = 30 + i * 30;
    return `${x - 15},62 ${x},${i % 2 ? 108 : 122} ${x + 15},62`;
  });
  const bottom = Array.from({ length: 8 }, (_, i) => {
    const x = 45 + i * 30;
    return `${x - 15},198 ${x},${i % 2 ? 150 : 140} ${x + 15},198`;
  });
  return (
    <svg className={`maw ${small ? 'small' : ''}`} viewBox="0 0 300 230" aria-hidden="true">
      <defs>
        <radialGradient id="throat" cx=".5" cy=".55" r=".6"><stop offset="0" stopColor="#1a0000" /><stop offset=".7" stopColor="#5a0505" /><stop offset="1" stopColor="#a01010" /></radialGradient>
        <radialGradient id="eye" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff6b0" /><stop offset=".4" stopColor="#ffcc00" /><stop offset="1" stopColor="#ff2200" /></radialGradient>
      </defs>
      <ellipse cx="80" cy="22" rx="22" ry="13" fill="url(#eye)" className="maw-eye" />
      <ellipse cx="220" cy="22" rx="22" ry="13" fill="url(#eye)" className="maw-eye" />
      <ellipse cx="150" cy="130" rx="140" ry="78" fill="url(#throat)" stroke="#3a0000" strokeWidth="6" />
      <ellipse cx="150" cy="178" rx="52" ry="18" fill="#c0303a" opacity=".85" />
      {top.map((pts, i) => <polygon key={`t${i}`} points={pts} fill="#f4ecd6" stroke="#8a7a5a" strokeWidth="1.5" />)}
      {bottom.map((pts, i) => <polygon key={`b${i}`} points={pts} fill="#efe4c8" stroke="#8a7a5a" strokeWidth="1.5" />)}
    </svg>
  );
}

// Plays once per scare: on the TV a lunging mouth and a scream; on phones a buzz and a red flash.
export default function JumpScare({ scare, phone = false }) {
  const seen = useRef(null);
  const [show, setShow] = useState(false);
  const [vidOk, setVidOk] = useState(true);
  const videoPlaying = useRef(false);

  useEffect(() => {
    if (!scare?.id || seen.current === scare.id) return undefined;
    seen.current = scare.id;
    if (Date.now() - scare.at > 6000) return undefined; // old news (page reloaded later)
    setShow(true);
    setVidOk(true);
    videoPlaying.current = false;
    if (phone) { try { navigator.vibrate?.([300, 80, 300, 80, 600]); } catch { /* not supported */ } }
    else if (!document.querySelector('.scare-video')) setTimeout(() => play('scream'), 250);
    // The drawn scare lasts SCARE_MS; a custom video plays to its end.
    const t = setTimeout(() => { if (!videoPlaying.current) setShow(false); }, SCARE_MS);
    return () => clearTimeout(t);
  }, [scare?.id, scare?.at, phone]);

  if (!show) return null;
  if (phone) {
    return (
      <div className="scare phone-scare" aria-live="assertive">
        <Maw small />
        <p>IT’S A MIMIC!</p>
      </div>
    );
  }
  if (vidOk) {
    return (
      <div className="scare video" aria-live="assertive">
        <video className="scare-video" src={`${import.meta.env.BASE_URL}video/jumpscare.mp4`} autoPlay playsInline
          onPlay={() => { videoPlaying.current = true; }}
          onEnded={() => setShow(false)}
          onError={() => { setVidOk(false); play('scream'); }} />
      </div>
    );
  }
  return (
    <div className="scare" aria-live="assertive">
      <div className="scare-teeth top" /><div className="scare-teeth bottom" />
      <Maw />
      <p className="scare-text">IT’S A MIMIC!</p>
      <p className="scare-name">{scare.icon} {scare.name}</p>
    </div>
  );
}
