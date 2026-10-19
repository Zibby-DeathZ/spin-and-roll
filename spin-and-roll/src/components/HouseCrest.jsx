// House crests: original heraldic shields drawn in SVG, one beast per house.
// Drop a picture at public/art/houses/<house>.png (or .webp / .jpg) and it replaces the drawn one everywhere.
import Art from './Art';

export const HOUSE_STYLE = {
  gryffindor: { field: '#7a1212', field2: '#a0201b', metal: '#d9a83a', ink: '#5a0b0b' },
  slytherin: { field: '#16432a', field2: '#1f5c39', metal: '#c9ced3', ink: '#0c2617' },
  ravenclaw: { field: '#13234f', field2: '#1c3170', metal: '#c08f55', ink: '#0a1430' },
  hufflepuff: { field: '#e2b33a', field2: '#efc75a', metal: '#2b2620', ink: '#2b2620' },
};

const SHIELD = 'M10 8 H90 V56 C90 86 72 102 50 113 C28 102 10 86 10 56 Z';
const INNER = 'M17 15 H83 V56 C83 81 68 95 50 105 C32 95 17 81 17 56 Z';

// A lion's head: a shaggy mane, a pale face with a broad muzzle.
function Lion({ c }) {
  const R = [27, 20, 25, 19, 28, 21, 24, 19];
  const pts = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
    const r = R[i % R.length];
    return `${50 + r * Math.cos(a)},${62 + r * 1.05 * Math.sin(a)}`;
  }).join(' ');
  return (
    <g>
      <polygon points={pts} fill={c.metal} stroke={c.ink} strokeWidth=".8" strokeLinejoin="round" />
      <circle cx="39" cy="47" r="4" fill="#f3d37a" stroke={c.ink} strokeWidth="1" />
      <circle cx="61" cy="47" r="4" fill="#f3d37a" stroke={c.ink} strokeWidth="1" />
      <path d="M50 46 C61 46 64 54 63 62 C62 72 57 78 50 79 C43 78 38 72 37 62 C36 54 39 46 50 46 Z" fill="#f3d37a" stroke={c.ink} strokeWidth="1.1" />
      <path d="M41 55 l7 2.5 M59 55 l-7 2.5" stroke={c.ink} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="45" cy="59" r="1.4" fill={c.ink} /><circle cx="55" cy="59" r="1.4" fill={c.ink} />
      <path d="M46 64 h8 l-4 4.5 z" fill={c.ink} />
      <path d="M50 68.5 v2.5 M50 71 q-4 3.5 -7 0.5 M50 71 q4 3.5 7 0.5" stroke={c.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

// A serpent coiled into an S, head raised, tongue out.
function Serpent({ c }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M62 33 C40 27 31 42 42 50 C55 58 68 64 57 79 C49 89 34 86 34 77" stroke={c.metal} strokeWidth="8" />
      <path d="M62 33 C40 27 31 42 42 50 C55 58 68 64 57 79 C49 89 34 86 34 77" stroke={c.field} strokeWidth="2" strokeDasharray="1 5" />
      <ellipse cx="64" cy="33" rx="7.5" ry="5.5" fill={c.metal} />
      <circle cx="66" cy="31.5" r="1.4" fill={c.field} />
      <path d="M71 34 l6 1 m-6 -1 l6 -2" stroke={c.metal} strokeWidth="1.3" />
    </g>
  );
}

// An eagle displayed: wings spread, head turned.
function Eagle({ c }) {
  const wing = '48,52 22,34 25,42 17,44 26,50 19,55 29,58 22,63 33,64 46,63';
  return (
    <g fill={c.metal}>
      <polygon points={wing} />
      <polygon points={wing} transform="translate(100 0) scale(-1 1)" />
      <ellipse cx="50" cy="60" rx="7.5" ry="13" />
      <circle cx="50" cy="40" r="6.5" />
      <path d="M55 39 l6 2 l-6 2 z" />
      <circle cx="51.5" cy="38.5" r="1.3" fill={c.field} />
      <polygon points="43,70 50,86 57,70 53,74 50,70 47,74" />
      <path d="M44 72 l-4 8 M56 72 l4 8" stroke={c.metal} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

// A badger's head: pale face, dark stripes over the eyes.
function Badger({ c }) {
  return (
    <g>
      <circle cx="35" cy="40" r="5.5" fill={c.metal} /><circle cx="65" cy="40" r="5.5" fill={c.metal} />
      <path d="M30 46 C30 36 40 32 50 32 C60 32 70 36 70 46 C70 62 60 78 50 86 C40 78 30 62 30 46 Z" fill="#f4ecd8" stroke={c.metal} strokeWidth="1.5" />
      <path d="M37 38 C40 50 43 62 47 80 L44 80 C39 64 34 52 33 41 Z" fill={c.metal} />
      <path d="M63 38 C60 50 57 62 53 80 L56 80 C61 64 66 52 67 41 Z" fill={c.metal} />
      <circle cx="41.5" cy="54" r="1.8" fill="#f4ecd8" /><circle cx="58.5" cy="54" r="1.8" fill="#f4ecd8" />
      <ellipse cx="50" cy="83" rx="4" ry="3" fill={c.metal} />
    </g>
  );
}

const BEAST = { gryffindor: Lion, slytherin: Serpent, ravenclaw: Eagle, hufflepuff: Badger };

export function CrestSVG({ house, title }) {
  const id = String(house ?? '').toLowerCase();
  const c = HOUSE_STYLE[id];
  if (!c) return null;
  const B = BEAST[id];
  const g = `crest-${id}`;
  return (
    <svg viewBox="0 0 100 120" className="crest-svg" role="img" aria-label={title ?? `${house} crest`}>
      <defs>
        <linearGradient id={`${g}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.field2} /><stop offset="1" stopColor={c.field} />
        </linearGradient>
        <linearGradient id={`${g}-m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={SHIELD} fill={c.metal} />
      <path d={SHIELD} fill={`url(#${g}-m)`} />
      <path d={INNER} fill={`url(#${g}-f)`} />
      <path d={INNER} fill="none" stroke={c.ink} strokeWidth="1" opacity=".5" />
      <B c={c} />
    </svg>
  );
}

export default function HouseCrest({ house, className = '' }) {
  const id = String(house ?? '').toLowerCase();
  if (!HOUSE_STYLE[id]) return null;
  return <Art path={`houses/${id}`} icon={<CrestSVG house={house} />} className={`crest ${className}`} />;
}
