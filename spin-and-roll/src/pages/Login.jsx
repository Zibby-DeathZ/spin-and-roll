import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signInWithGoogle, useAuth } from '../auth/AuthProvider';
import Wheel from '../components/Wheel';

// The front gate: the first thing players see when they type the link.
// A night sky over a castle on a crag, embers rising, and the wheel and the die as the crest.

// A d20 seen face-on: a hexagon with its inner triangle and spokes.
function D20({ size = 64 }) {
  const hex = [[50, 4], [90, 27], [90, 73], [50, 96], [10, 73], [10, 27]];
  const tri = [[50, 22], [78, 68], [22, 68]];
  const pts = (a) => a.map((p) => p.join(',')).join(' ');
  return (
    <svg className="gate-d20" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="d20g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d98a" /><stop offset=".55" stopColor="#e3b04b" /><stop offset="1" stopColor="#9a6b12" />
        </linearGradient>
      </defs>
      <polygon points={pts(hex)} fill="url(#d20g)" stroke="#fff3cf" strokeWidth="2" strokeLinejoin="round" />
      <polygon points={pts(tri)} fill="rgba(255,255,255,.18)" stroke="#5a3d0a" strokeWidth="1.6" strokeLinejoin="round" />
      {[[50, 4, 50, 22], [90, 27, 78, 68], [90, 27, 50, 22], [10, 27, 50, 22], [10, 27, 22, 68], [90, 73, 78, 68], [10, 73, 22, 68], [50, 96, 78, 68], [50, 96, 22, 68]]
        .map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#5a3d0a" strokeWidth="1.3" opacity=".75" />)}
      <text x="50" y="57" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="700" fontSize="21" fill="#3a2706">20</text>
    </svg>
  );
}

// The skyline: mountains, a castle on a crag, and a forest edge. Original silhouettes.
function Skyline() {
  return (
    <svg className="gate-skyline" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path className="gate-far" d="M0 300 L90 220 L170 270 L260 180 L350 255 L430 205 L520 260 L600 230 L690 280 L780 200 L880 265 L960 215 L1060 270 L1130 235 L1200 260 L1200 400 L0 400 Z" />
      <g className="gate-castle">
        <path d="M640 310 L700 250 L760 240 L840 255 L900 300 L940 400 L600 400 Z" />
        {/* keep and towers */}
        <rect x="712" y="150" width="70" height="110" />
        <path d="M708 150 L747 98 L786 150 Z" />
        <rect x="690" y="185" width="26" height="80" /><path d="M686 185 L703 150 L720 185 Z" />
        <rect x="780" y="170" width="30" height="90" /><path d="M776 170 L795 128 L814 170 Z" />
        <rect x="815" y="205" width="22" height="60" /><path d="M811 205 L826 178 L841 205 Z" />
        <rect x="738" y="60" width="18" height="95" /><path d="M733 62 L747 22 L761 62 Z" />
        {/* lit windows */}
        {[[742, 175], [756, 175], [742, 205], [700, 205], [790, 195], [823, 222], [745, 85], [756, 230]].map(([x, y], i) => (
          <rect key={i} className="gate-window" x={x} y={y} width="5" height="9" rx="2.5" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
      </g>
      <path className="gate-near" d="M0 340 C80 320 140 345 220 330 S360 300 430 335 S560 350 610 340 L640 400 L0 400 Z" />
      <path className="gate-trees" d="M0 400 L0 350 L14 318 L28 350 L38 330 L52 300 L66 342 L78 322 L92 352 L108 312 L124 352 L136 336 L150 360 L164 328 L178 362 L196 340 L210 368 L230 400 Z
        M1200 400 L1200 340 L1186 306 L1172 344 L1160 324 L1146 296 L1132 340 L1118 318 L1104 350 L1090 314 L1074 354 L1060 332 L1046 362 L1030 330 L1016 366 L996 346 L980 372 L960 400 Z" />
    </svg>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  // Stars and embers are placed once, at random.
  const stars = useMemo(() => Array.from({ length: 90 }, () => ({
    left: Math.random() * 100, top: Math.random() * 62, size: Math.random() < 0.12 ? 3 : Math.random() < 0.5 ? 2 : 1,
    delay: Math.random() * 6, dur: 2.5 + Math.random() * 4,
  })), []);
  const embers = useMemo(() => Array.from({ length: 26 }, () => ({
    left: Math.random() * 100, delay: Math.random() * 12, dur: 9 + Math.random() * 9, drift: (Math.random() - 0.5) * 120, size: 2 + Math.random() * 3,
  })), []);

  if (!loading && user) return <Navigate to="/" replace />;

  const go = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Allow pop-ups for this site and try again.');
      }
    }
  };

  return (
    <main className="gate">
      <div className="gate-sky" aria-hidden="true">
        <div className="gate-moon" />
        {stars.map((s, i) => (
          <span key={i} className="gate-star" style={{
            left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size,
            animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s`,
          }} />
        ))}
        <span className="gate-shooting" />
      </div>
      <Skyline />
      <div className="gate-mist" aria-hidden="true" />
      <div className="gate-embers" aria-hidden="true">
        {embers.map((e, i) => (
          <span key={i} style={{
            left: `${e.left}%`, width: e.size, height: e.size, animationDelay: `${e.delay}s`,
            animationDuration: `${e.dur}s`, '--drift': `${e.drift}px`,
          }} />
        ))}
      </div>

      <div className="gate-content">
        <div className="gate-crest">
          <div className="gate-halo" />
          <Wheel size={150} />
          <D20 size={66} />
        </div>
        <p className="gate-kicker">A tabletop of wheels, dice and stories</p>
        <div className="gate-title-wrap">
          <h1 className="gate-title">Spin <span>&amp;</span> Roll</h1>
          <p className="gate-credit">crafted by Zibby</p>
        </div>
        <p className="gate-tagline">Gather your party. Spin the wheel. Roll the dice.</p>

        <section className="gate-card">
          <p className="gate-card-lead">A tale awaits, traveller.</p>
          <button className="gate-btn" onClick={go}>
            <span aria-hidden="true">⚔</span> Enter the realm
          </button>
          <p className="gate-small">Sign in with Google to join your party’s table.</p>
          {error && <p className="error">{error}</p>}
        </section>

        <ul className="gate-features">
          <li>Campaigns</li><li>Characters</li><li>Trophies</li>
        </ul>
      </div>
    </main>
  );
}
