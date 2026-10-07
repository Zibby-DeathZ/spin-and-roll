import { useEffect, useState } from 'react';
import Art, { tokenArt } from './Art';
import Portrait from './Portrait';

const EXTS = ['jpg', 'png', 'webp'];
export const isMonster = (t) => !t.npc && t.kind !== 'chest' && t.kind !== 'item' && t.kind !== 'hazard';

// A location with its tokens and characters.
// Images: public/maps/<location id>.jpg (or .png / .webp).
export default function MapView({ loc, tokens = {}, pcs = [], encounter, selected, onSelect, onMove, big = false, small = false, caption = true }) {
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
  const pick = (id) => (e) => { e.stopPropagation(); onSelect?.(id); };

  return (
    <div className={`mapview ${src ? '' : 'parchment'} ${big ? 'big' : ''} ${small ? 'small' : ''} ${onMove ? 'editable' : ''}`} onClick={click}>
      {src && <img src={src} alt="" onError={() => setExt((n) => n + 1)} draggable={false} />}
      {!src && <span className="map-watermark" aria-hidden="true">{loc.icon}</span>}

      {here.map(([id, t]) => {
        const mon = isMonster(t);
        const down = mon && t.hp <= 0;
        const cls = t.kind === 'chest' ? `chest ${t.opened ? 'opened' : ''}` : t.kind === 'item' ? 'item' : t.kind === 'hazard' ? `hazard ${t.used ? 'opened' : ''}` : t.npc ? 'npc' : 'mon';
        return (
          <button key={id} type="button"
            className={`token ${cls} ${down ? 'down' : ''} ${selected === id ? 'sel' : ''} ${current?.id === id ? 'turn' : ''}`}
            style={{ left: `${t.x}%`, top: `${t.y}%`, ...(t.scale ? { transform: `translate(-50%, -50%) scale(${t.scale})` } : {}) }}
            onClick={pick(id)} aria-label={t.name} tabIndex={onSelect ? 0 : -1}>
            <Art path={tokenArt(t)} icon={t.icon} className={`token-icon ${t.revealed ? 'mimic-icon' : ''}`} />
            {!small && <span className="token-name">{t.name}</span>}
            {mon && <span className="token-hp"><span style={{ width: `${Math.max(0, (t.hp / t.maxHp) * 100)}%` }} /></span>}
          </button>
        );
      })}

      {pcs.map((p) => {
        const id = `pc:${p.uid}`;
        return (
          <button key={id} type="button"
            className={`token pc house-${(p.house ?? 'unsorted').toLowerCase()} ${p.hp <= 0 ? 'down' : ''} ${selected === id ? 'sel' : ''} ${current?.id === p.uid ? 'turn' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={pick(id)} aria-label={p.name} tabIndex={onSelect ? 0 : -1}>
            <Portrait family={p.family} name={p.name} className="token-icon" />
            {!small && <span className="token-name">{p.name}</span>}
            <span className="token-hp pc-hp"><span style={{ width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%` }} /></span>
          </button>
        );
      })}

      {!small && caption && (
        <div className="map-caption">
          <strong>{loc.icon} {loc.name}</strong>
          <span>{loc.desc}</span>
        </div>
      )}
    </div>
  );
}
