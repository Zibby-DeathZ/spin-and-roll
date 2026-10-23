// The GM's party sidebar: a card per student showing where they are and how they're doing,
// with quick ways to look at their room, put it on the TV, or move just them.
import { useState } from 'react';
import Portrait from './Portrait';
import HouseCrest from './HouseCrest';
import { statusIcons } from './Status';
import { levelFor } from '../lib/game';
import { lightsOut, locOf, movePlayers, showOnTV } from '../lib/world';

function Mini({ value, max, tone, label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span className={`pc-mini ${tone}`} title={`${label} ${value}/${max}`} aria-label={`${label} ${value} of ${max}`}>
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}

function Card({ sid, data, session, chars, c, view, onWatch }) {
  const [moving, setMoving] = useState(false);
  const where = locOf(session, c.uid);
  const place = data.locations?.find((l) => l.id === where);
  const onTV = where && where === session.state?.map?.loc;
  const watching = where && where === view;
  const together = (session.playerUids ?? []).filter((u) => u !== c.uid && chars[u] && locOf(session, u) === where).length;
  const turn = session.state?.encounter?.order?.[session.state.encounter.turn]?.id === c.uid;
  return (
    <li className={`pc-card house-${(c.house ?? 'unsorted').toLowerCase()} ${c.hp <= 0 ? 'ko' : ''} ${watching ? 'watching' : ''} ${turn ? 'turn' : ''}`}>
      <button type="button" className="pc-card-main" onClick={() => where && onWatch(where)} disabled={!where}
        title={where ? `Look at ${place?.name ?? where}` : 'Not placed on the map yet'}>
        <span className="pc-card-face">
          <Portrait family={c.family} name={c.firstName ?? c.name} className="pc-card-portrait" />
          <HouseCrest house={c.house} className="pc-card-crest" />
        </span>
        <span className="pc-card-info">
          <strong>{c.firstName ?? c.name}{onTV && <span className="pc-tag">on TV</span>}</strong>
          <span className="pc-card-sub">
            Lv {levelFor(c.xp)}{c.status && Object.keys(c.status).length ? ` ${statusIcons(c.status)}` : ''}{c.hp <= 0 ? ' · knocked out' : ''}
          </span>
          <Mini value={c.hp} max={c.maxHp} tone="hp" label="HP" />
          <Mini value={c.mana} max={c.maxMana} tone="mana" label="Mana" />
          <span className="pc-card-where">
            📍 {place ? `${place.name}` : 'Not placed'}
            {together > 0 && <span className="muted"> · with {together}</span>}
          </span>
        </span>
      </button>
      <span className="pc-card-actions">
        <button className="btn tiny" disabled={!where || onTV} onClick={() => showOnTV(sid, data, where)} title="Put their place on the TV">📺</button>
        <button className="btn tiny" onClick={() => setMoving(!moving)} aria-expanded={moving} title="Move just this student">🚶</button>
      </span>
      {moving && (
        <select className="pc-card-move" autoFocus defaultValue="" aria-label={`Move ${c.firstName ?? c.name} to`}
          onChange={(e) => {
            if (!e.target.value) return;
            movePlayers(sid, data, e.target.value, [c.uid], chars, false).catch(console.error);
            setMoving(false);
          }}>
          <option value="">Move {c.firstName ?? c.name} to…</option>
          {[...new Set(data.locations.map((l) => l.area))].map((area) => (
            <optgroup key={area} label={area}>
              {data.locations.filter((l) => l.area === area).map((l) => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
            </optgroup>
          ))}
        </select>
      )}
    </li>
  );
}

export default function PartyCards({ sid, data, session, chars, view, onWatch }) {
  const [busy, setBusy] = useState(false);
  const uids = (session.playerUids ?? []).filter((u) => chars[u]);
  const hasRooms = data.locations?.some((l) => l.id.endsWith('-common'));
  return (
    <div className="party-cards">
      {!uids.length && <p className="muted small">Students appear here once they’ve chosen a family.</p>}
      <ul>
        {uids.map((u) => <Card key={u} sid={sid} data={data} session={session} chars={chars} c={chars[u]} view={view} onWatch={onWatch} />)}
      </ul>
      {hasRooms && uids.length > 0 && (
        <button className="btn small lights-out" disabled={busy}
          onClick={() => confirm('Lights out? Every sorted student goes to their own common room.') &&
            (setBusy(true), lightsOut(sid, data, session, chars).catch(console.error).finally(() => setBusy(false)))}>
          🛏️ Lights out: everyone to bed
        </button>
      )}
      <p className="muted small">Tap a card to look at that student’s room without changing the TV.</p>
    </div>
  );
}
