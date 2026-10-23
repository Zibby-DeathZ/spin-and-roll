import { useEffect, useState } from 'react';
import Art, { tokenArt } from './Art';
import Portrait from './Portrait';
import { statusIcons } from './Status';

const EXTS = ['jpg', 'png', 'webp'];
export const isMonster = (t) => !t.npc && t.kind !== 'chest' && t.kind !== 'item' && t.kind !== 'hazard';

// A location with its tokens and characters.
// Images: public/maps/<location id>.jpg (or .png / .webp).
// More than this many people (staff, students, ghosts) at once and they move off the picture into a
// strip along the top, so the room itself stays visible. Monsters, chests and items stay where they are.
const CROWD = 3;

export default function MapView({
  loc, tokens = {}, pcs = [], encounter, selected, onSelect, onMove, big = false, small = false, caption = true,
  doors = [], onDoor = null,
}) {
  const [ext, setExt] = useState(0);
  useEffect(() => setExt(0), [loc?.id]);
  if (!loc) {
    return <div className="mapview parchment"><p className="map-empty">No location chosen yet.</p></div>;
  }
  const all = Object.entries(tokens).filter(([, t]) => t.loc === loc.id);
  const people = all.filter(([, t]) => t.npc && !t.mimic);
  const crowded = !small && people.length > CROWD;
  // A person stays on the picture if they're mid-fight or selected; everyone else joins the strip.
  const fighting = new Set((encounter?.order ?? []).map((o) => o.id));
  const inStrip = crowded ? people.filter(([id]) => id !== selected && !fighting.has(id)) : [];
  const stripIds = new Set(inStrip.map(([id]) => id));
  const here = all.filter(([id]) => !stripIds.has(id));
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

      {!small && doors.map((d) => {
        const side = d.x > 72 ? 'left' : d.x < 28 ? 'right' : 'center';
        const up = d.y > 80;
        const Tag = onDoor ? 'button' : 'span';
        return (
          <Tag key={d.id} {...(onDoor ? { type: 'button', onClick: (e) => { e.stopPropagation(); onDoor(d); } } : {})}
            className={`door-pin label-${side} ${up ? 'label-up' : ''} ${onDoor ? 'clickable' : ''}`}
            style={{ left: `${d.x}%`, top: `${d.y}%` }} aria-label={`Way to ${d.name}`}>
            <span className="door-dot" aria-hidden="true">➜</span>
            <span className="door-label"><span aria-hidden="true">{d.icon}</span> {d.short ?? d.name}</span>
          </Tag>
        );
      })}

      {inStrip.length > 0 && (
        <div className="crowd-strip" aria-label="Also here">
          {inStrip.map(([id, t]) => (
            <button key={id} type="button" className={`crowd-person ${selected === id ? 'sel' : ''}`}
              onClick={pick(id)} tabIndex={onSelect ? 0 : -1} aria-label={t.name}>
              <Art path={tokenArt(t)} icon={t.icon} className="crowd-icon" />
              <span className="crowd-name">{t.name.replace(/^(Professor|Madam|Prefect) /, '')}</span>
            </button>
          ))}
        </div>
      )}

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
            {mon && t.status && Object.keys(t.status).length > 0 && <span className="token-status" aria-hidden="true">{statusIcons(t.status)}</span>}
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
            {p.status && Object.keys(p.status).length > 0 && <span className="token-status" aria-hidden="true">{statusIcons(p.status)}</span>}
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
