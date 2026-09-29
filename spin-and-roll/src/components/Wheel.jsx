// The group's signature: the fortune wheel. Spins once when the app loads.
const COLORS = ['#E3B04B', '#4FB3A9', '#D0543F', '#8E7CC3'];

export default function Wheel({ size = 120, spin = true }) {
  const n = 8;
  const r = 48;
  const slices = Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const p = (a) => `${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)}`;
    return <path key={i} d={`M50 50 L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z`} fill={COLORS[i % 4]} />;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 108" aria-hidden="true" className="wheel">
      <g className={spin ? 'wheel-spin' : undefined}>
        {slices}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#ECE4D3" strokeWidth="2" />
        <circle cx="50" cy="50" r="7" fill="#17142A" stroke="#ECE4D3" strokeWidth="2" />
      </g>
      <path d="M50 0 L56 9 L44 9 Z" fill="#ECE4D3" />
    </svg>
  );
}
