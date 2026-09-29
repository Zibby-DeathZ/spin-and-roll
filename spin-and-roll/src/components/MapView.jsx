import { useEffect, useState } from 'react';

const EXTS = ['jpg', 'png', 'webp'];

// A location with its tokens. Drop images in public/maps/<location id>.jpg (or .png/.webp).
export default function MapView({ loc, tokens = {}, encounter, selected, onSelect, onMove, big = false }) {
  const [ext, setExt] = useState(0);
  useEffect(() => setExt(0), [loc?.id]);
  if (!loc) {
    return <div className="mapview parchment"><p className="map-empty">No location chosen yet.</p></div>;
  }
  const here = Object.entries(tokens).filter(([, t]) => t.loc === loc.id);
  const current = encounter?.order?.[encounter.turn];
  const src = ext < EXTS.length ? `${import.meta.env.BASE_URL}maps/${loc.id}.${EXTS[ext]}` : null;

  const click = (e) => {
    if (!onMove || !selected) return;
    const r = e.currentTarget.getBoundingClientRect();
    onMove(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <div className={`mapview ${src ? '' : 'parchment'} ${big ? 'big' : ''} ${onMove ? 'editable' : ''}`} onClick={click}>
      {src && <img src={src} alt="" onError={() => setExt((n) => n + 1)} draggable={false} />}
      {!src && <span className="map-watermark" aria-hidden="true">{loc.icon}</span>}
      {here.map(([id, t]) => {
        const down = !t.npc && t.hp <= 0;
        return (
          <button key={id} type="button"
            className={`token ${t.npc ? 'npc' : 'mon'} ${down ? 'down' : ''} ${selected === id ? 'sel' : ''} ${current?.id === id ? 'turn' : ''}`}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            onClick={(e) => { e.stopPropagation(); onSelect?.(id); }}
            aria-label={t.name} tabIndex={onSelect ? 0 : -1}>
            <span className="token-icon">{t.icon}</span>
            <span className="token-name">{t.name}</span>
            {!t.npc && (
              <span className="token-hp"><span style={{ width: `${Math.max(0, (t.hp / t.maxHp) * 100)}%` }} /></span>
            )}
          </button>
        );
      })}
      <div className="map-caption">
        <strong>{loc.icon} {loc.name}</strong>
        <span>{loc.desc}</span>
      </div>
    </div>
  );
}
