import { useEffect, useState } from 'react';

const EXTS = ['jpg', 'png', 'webp'];

// A family portrait from public/portraits/<family>.jpg, or the first initial if there isn't one.
export default function Portrait({ family, name = '?', className = '' }) {
  const [ext, setExt] = useState(0);
  useEffect(() => setExt(0), [family]);
  const src = family && ext < EXTS.length ? `${import.meta.env.BASE_URL}portraits/${family}.${EXTS[ext]}` : null;
  return (
    <span className={`portrait ${className}`}>
      {src ? <img src={src} alt="" onError={() => setExt((n) => n + 1)} draggable={false} />
        : <span className="portrait-initial">{name.slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}
