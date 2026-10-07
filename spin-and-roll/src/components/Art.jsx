import { useEffect, useState } from 'react';

// Pictures for people, monsters, items, chests and hazards.
// Drop a file at public/art/<folder>/<id>.png (or .webp / .jpg) and it replaces the emoji everywhere.
// If there's no file, the emoji shows instead, so the game always works without art.
const EXTS = ['png', 'webp', 'jpg'];
const found = new Map(); // path -> extension, or null when there is no file

function probe(path) {
  if (found.has(path)) return Promise.resolve(found.get(path));
  const p = (async () => {
    for (const ext of EXTS) {
      const ok = await new Promise((res) => {
        const img = new Image();
        img.onload = () => res(true);
        img.onerror = () => res(false);
        img.src = `${import.meta.env.BASE_URL}art/${path}.${ext}`;
      });
      if (ok) return ext;
    }
    return null;
  })();
  found.set(path, p);
  p.then((ext) => found.set(path, ext));
  return p;
}

// Which picture a map token uses.
export function tokenArt(t) {
  if (!t) return null;
  if (t.revealed && t.mimic) return `mimics/${t.mimic}`;
  if (t.kind === 'chest') return `chests/${t.chest}`;
  if (t.kind === 'item') return `items/${t.item}`;
  if (t.kind === 'hazard') return `hazards/${t.hazard}`;
  return t.npc ? `people/${t.kind}` : `monsters/${t.kind}`;
}

// Which picture an inventory, equipment or shop entry uses.
export const itemArt = (id, slot) => (slot === 'wand' ? 'items/wand' : `items/${id}`);

export default function Art({ path, icon, className = '', as: Tag = 'span' }) {
  const cached = found.get(path);
  const [ext, setExt] = useState(typeof cached === 'string' || cached === null ? cached : undefined);
  useEffect(() => {
    let alive = true;
    if (!path) { setExt(null); return undefined; }
    const c = found.get(path);
    if (typeof c === 'string' || c === null) { setExt(c); return undefined; }
    probe(path).then((e) => alive && setExt(e));
    return () => { alive = false; };
  }, [path]);
  if (path && ext) {
    return (
      <Tag className={`${className} has-art`}>
        <img src={`${import.meta.env.BASE_URL}art/${path}.${ext}`} alt="" draggable={false} />
      </Tag>
    );
  }
  return <Tag className={className}>{icon}</Tag>;
}
