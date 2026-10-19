// Status effects and Corruption, shown on the GM screen, the TV and phones.
import { useState } from 'react';
import { STATUS_ICONS, activeThresholds, statusList } from '../lib/spellbook';
import { adjustCorruption, clearStatus, giveStatus, villainCast } from '../lib/status';

const turnsText = (t) => (t == null ? 'until lifted' : `${t} ${t === 1 ? 'turn' : 'turns'}`);

export function StatusChips({ map, defs, small = false }) {
  const list = statusList(map, defs);
  if (!list.length) return null;
  return (
    <span className={`status-chips ${small ? 'small' : ''}`}>
      {list.map((s) => (
        <span key={s.key} className="status-chip" title={`${s.name}, ${turnsText(s.turns)}`}>
          <span aria-hidden="true">{s.icon}</span>{small ? <span className="sr-only">{s.name}</span> : ` ${s.name} (${turnsText(s.turns)})`}
        </span>
      ))}
    </span>
  );
}

// Just the icons, for map tokens and turn lists.
export const statusIcons = (map) => Object.keys(map ?? {}).map((k) => STATUS_ICONS[k] ?? '✴️').join('');

// GM: add or remove a status by hand.
export function StatusEditor({ sid, data, who, map }) {
  const defs = data.statusEffects ?? {};
  const [key, setKey] = useState('');
  const list = statusList(map, defs);
  if (!Object.keys(defs).length) return null;
  return (
    <div className="status-edit">
      {list.map((s) => (
        <button key={s.key} className="status-chip removable" onClick={() => clearStatus(sid, who, s.key)} title="Remove">
          {s.icon} {s.name} <span className="muted">({turnsText(s.turns)})</span> ✕
        </button>
      ))}
      <select value={key} onChange={(e) => setKey(e.target.value)} aria-label="Add a status effect">
        <option value="">Add a status…</option>
        {Object.entries(defs).map(([k, d]) => <option key={k} value={k}>{STATUS_ICONS[k] ?? '✴️'} {d.name ?? k}</option>)}
      </select>
      <button className="btn small" disabled={!key} onClick={() => { giveStatus(sid, data, who, key); setKey(''); }}>Add</button>
    </div>
  );
}

// Corruption 0–10 with what it's doing to the character right now.
export function Corruption({ c, data, sid = null }) {
  const rules = data.corruption;
  if (!rules) return null;
  const v = c.corruption ?? 0;
  if (!sid && !v) return null; // players only see it once dark magic has touched them
  const max = rules.max ?? 10;
  const on = activeThresholds(v, rules);
  const next = (rules.thresholds ?? []).find((t) => v < t.at);
  return (
    <div className="corruption">
      <div className="corruption-head">
        <span className="gm-label">☠️ Corruption {v}/{max}</span>
        <span className="corruption-pips" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => <i key={i} className={`${i < v ? 'on' : ''} ${(rules.thresholds ?? []).some((t) => t.at === i + 1) ? 'mark' : ''}`} />)}
        </span>
        {sid && (
          <span className="nudges">
            <button className="nudge pos" title="A good deed or light magic" onClick={() => adjustCorruption(sid, data, c.uid, -1)}>−1</button>
            <button className="nudge neg" onClick={() => adjustCorruption(sid, data, c.uid, 1)}>+1</button>
          </span>
        )}
      </div>
      {on.length > 0 && <ul className="corruption-effects">{on.map((t) => <li key={t.at}>{t.effect}</li>)}</ul>}
      {sid && next && <p className="muted small">At {next.at}: {next.effect}</p>}
    </div>
  );
}

// GM: a monster or boss casts one of the villain spells (Crucio, Imperio). Avada Kedavra is cutscene-only.
export function VillainCast({ sid, data, tokenId, here, chars }) {
  const spells = Object.entries(data.villainSpells ?? {});
  const [sp, setSp] = useState('');
  const [target, setTarget] = useState('');
  if (!spells.length) return null;
  const pick = data.villainSpells[sp];
  return (
    <details className="villain-cast">
      <summary>🐍 Villain spell</summary>
      <span className="gm-give">
        <select value={sp} onChange={(e) => setSp(e.target.value)} aria-label="Villain spell">
          <option value="">Which curse?</option>
          {spells.map(([id, s]) => <option key={id} value={id} disabled={s.bossOnly}>{s.icon} {s.name}{s.bossOnly ? ' (cutscene only)' : ''}</option>)}
        </select>
        <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Cast on whom">
          <option value="">On whom?</option>
          {here.map((u) => <option key={u} value={u}>{chars[u].firstName ?? chars[u].name}</option>)}
        </select>
        <button className="btn small ember" disabled={!sp || !target || pick?.bossOnly}
          onClick={() => { villainCast(sid, data, tokenId, sp, target); setTarget(''); }}>Cast</button>
      </span>
      {pick && <p className="muted small">{pick.desc}</p>}
    </details>
  );
}
