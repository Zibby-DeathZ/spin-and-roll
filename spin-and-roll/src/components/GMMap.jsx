import { useState } from 'react';
import MapView, { isMonster } from './MapView';
import { defenceOf } from '../lib/game';
import {
  addToken, endFight, monsterAttack, moveToken, nextTurn, placeToken, removeToken, setTokenHp, startFight,
} from '../lib/combat';
import { chestToken, itemToken, locOf, movePlayers, pcsAt, showOnTV } from '../lib/world';

export default function GMMap({ sid, data, session, chars }) {
  const map = session.state?.map ?? {};
  const tokens = session.state?.tokens ?? {};
  const enc = session.state?.encounter;
  const [locPick, setLocPick] = useState(map.loc ?? data.locations[0].id);
  const [add, setAdd] = useState(`mon:${Object.keys(data.bestiary)[0]}`);
  const [sel, setSel] = useState(null);
  const [target, setTarget] = useState('');
  const players = session.playerUids.filter((u) => chars[u]);
  const [who, setWho] = useState(null); // null = everyone
  const movers = who ?? players;
  const loc = data.locations.find((l) => l.id === map.loc);
  const areas = [...new Set(data.locations.map((l) => l.area))];
  const pcs = pcsAt(session, chars, map.loc);
  const t = sel && !sel.startsWith('pc:') ? tokens[sel] : null;
  const selPc = sel?.startsWith('pc:') ? chars[sel.slice(3)] : null;
  const here = players.filter((u) => locOf(session, u) === map.loc);
  const monstersHere = Object.values(tokens).filter((x) => x.loc === map.loc && isMonster(x) && x.hp > 0).length;
  const current = enc?.order?.[enc.turn];
  const placeName = (id) => data.locations.find((l) => l.id === id)?.name ?? 'not placed';

  const doAdd = async () => {
    const [type, id] = add.split(':');
    let newId;
    if (type === 'chest') newId = await placeToken(sid, chestToken(data, id, loc.id));
    else if (type === 'item') newId = await placeToken(sid, itemToken(data, id, loc.id));
    else newId = await addToken(sid, data, id, loc.id, tokens);
    setSel(newId);
  };

  return (
    <section className="gm-map">
      <div className="gm-give">
        <select value={locPick} onChange={(e) => setLocPick(e.target.value)} aria-label="Location">
          {areas.map((a) => (
            <optgroup key={a} label={a}>
              {data.locations.filter((l) => l.area === a).map((l) => (
                <option key={l.id} value={l.id}>{l.icon} {l.name}{map.discovered?.includes(l.id) ? '' : ' (new)'}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button className="btn small" disabled={locPick === map.loc} onClick={() => { setSel(null); showOnTV(sid, data, locPick); }}>
          Show on TV
        </button>
      </div>

      <div className="movers">
        <span className="muted small">Move:</span>
        {players.map((u) => (
          <label key={u} className={movers.includes(u) ? 'on' : ''}>
            <input type="checkbox" checked={movers.includes(u)}
              onChange={() => setWho(movers.includes(u) ? movers.filter((x) => x !== u) : [...movers, u])} />
            {chars[u].firstName ?? chars[u].name}
            <span className="muted small"> ({placeName(locOf(session, u))})</span>
          </label>
        ))}
        <button className="btn small gold" disabled={!movers.length}
          onClick={() => { setSel(null); movePlayers(sid, data, locPick, movers, chars, true); }}>
          Move to {data.locations.find((l) => l.id === locPick)?.name}
        </button>
      </div>

      <MapView loc={loc} tokens={tokens} pcs={pcs} encounter={enc} selected={sel}
        onSelect={(id) => setSel(sel === id ? null : id)}
        onMove={(x, y) => sel && moveToken(sid, sel, x, y)} />
      <p className="muted small">Tap a token or character to select it, then tap the map to move it.</p>

      {loc && (
        <div className="gm-give">
          <select value={add} onChange={(e) => setAdd(e.target.value)} aria-label="Add to map">
            <optgroup label="Monsters">
              {Object.entries(data.bestiary).filter(([, b]) => !b.npc).map(([id, b]) => (
                <option key={id} value={`mon:${id}`}>{b.icon} {b.name} ({b.hp} HP)</option>
              ))}
            </optgroup>
            <optgroup label="People">
              {Object.entries(data.bestiary).filter(([, b]) => b.npc).map(([id, b]) => (
                <option key={id} value={`mon:${id}`}>{b.icon} {b.name}</option>
              ))}
            </optgroup>
            {data.chests && (
              <optgroup label="Chests">
                {Object.entries(data.chests).map(([id, c]) => (
                  <option key={id} value={`chest:${id}`}>{c.icon} {c.name} (lock {c.dc})</option>
                ))}
              </optgroup>
            )}
            <optgroup label="Items on the ground">
              {Object.entries(data.items).map(([id, it]) => <option key={id} value={`item:${id}`}>{it.icon} {it.name}</option>)}
            </optgroup>
          </select>
          <button className="btn small" onClick={doAdd}>Add here</button>
        </div>
      )}

      {selPc && (
        <div className="token-panel">
          <strong>{selPc.name}</strong>
          <span className="muted small">{selPc.hp}/{selPc.maxHp} HP, Defence {defenceOf(selPc)}. Move them with the map, or to another place above.</span>
        </div>
      )}

      {t && (
        <div className="token-panel">
          <strong>{t.icon} {t.name}</strong>
          {t.kind === 'chest' && (
            <span className="muted small">
              {' '}Lock {t.dc} ({t.stat.toUpperCase()}){t.trap ? `, cursed (${t.trap} dmg)` : ''}.{' '}
              {t.opened ? 'Opened.' : `Holds ${t.contents.gold} Galleons${t.contents.items.length ? ` and ${t.contents.items.map((i) => data.items[i]?.name).join(', ')}` : ''}.`}
              {(t.tried ?? []).length > 0 && ` Failed: ${t.tried.map((u) => chars[u]?.firstName ?? '?').join(', ')}.`}
            </span>
          )}
          {t.kind === 'item' && <span className="muted small"> Waiting to be picked up.</span>}
          {isMonster(t) && (
            <>
              <span className="muted small"> {t.hp}/{t.maxHp} HP, Defence {t.defence}{data.bestiary[t.kind]?.note ? `. ${data.bestiary[t.kind].note}` : ''}</span>
              <span className="nudges">
                {[-5, -1, 1, 5].map((n) => (
                  <button key={n} className={`nudge ${n < 0 ? 'neg' : 'pos'}`}
                    onClick={() => setTokenHp(sid, sel, Math.max(0, Math.min(t.maxHp, t.hp + n)))}>{n > 0 ? `+${n}` : n}</button>
                ))}
              </span>
              <div className="gm-give">
                <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Attack whom">
                  <option value="">Attack whom?</option>
                  {here.map((u) => (
                    <option key={u} value={u}>{chars[u].firstName ?? chars[u].name} (Defence {defenceOf(chars[u])}, {chars[u].hp} HP)</option>
                  ))}
                </select>
                <button className="btn small ember" disabled={!target || t.hp <= 0} onClick={() => monsterAttack(sid, data, sel, target)}>Attack</button>
              </div>
            </>
          )}
          <button className="btn small ghost" onClick={() => { removeToken(sid, sel); setSel(null); }}>Remove</button>
        </div>
      )}

      <div className="fight-bar">
        {!enc ? (
          <button className="btn small ember" disabled={!monstersHere} onClick={() => startFight(sid, data, session, chars)}>
            ⚔️ Start fight ({monstersHere} {monstersHere === 1 ? 'enemy' : 'enemies'}, {here.length} {here.length === 1 ? 'student' : 'students'} here)
          </button>
        ) : (
          <>
            <span>Round {enc.round}: <strong>{current?.name}’s turn</strong></span>
            <ol className="turn-order">
              {enc.order.map((o, i) => (
                <li key={o.id} className={`${i === enc.turn ? 'on' : ''} ${o.kind === 'mon' && (tokens[o.id]?.hp ?? 0) <= 0 ? 'out' : ''}`}>
                  {o.name} <span className="muted">{o.init}</span>
                </li>
              ))}
            </ol>
            {current?.kind === 'mon' && <button className="btn small" onClick={() => setSel(current.id)}>Select {current.name}</button>}
            <button className="btn small gold" onClick={() => nextTurn(sid, session)}>Next turn ▶</button>
            <button className="btn small ghost" onClick={() => endFight(sid, data, session)}>End fight and share XP</button>
          </>
        )}
      </div>
    </section>
  );
}
