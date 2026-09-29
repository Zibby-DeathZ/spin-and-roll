import { useState } from 'react';
import MapView from './MapView';
import { defenceOf } from '../lib/game';
import {
  addToken, endFight, monsterAttack, moveToken, nextTurn, removeToken, setTokenHp, startFight, travel,
} from '../lib/combat';

export default function GMMap({ sid, data, session, chars }) {
  const map = session.state?.map ?? {};
  const tokens = session.state?.tokens ?? {};
  const enc = session.state?.encounter;
  const [locPick, setLocPick] = useState(map.loc ?? data.locations[0].id);
  const [kind, setKind] = useState(Object.keys(data.bestiary)[0]);
  const [sel, setSel] = useState(null);
  const [target, setTarget] = useState('');
  const loc = data.locations.find((l) => l.id === map.loc);
  const t = sel && tokens[sel];
  const areas = [...new Set(data.locations.map((l) => l.area))];
  const players = session.playerUids.filter((u) => chars[u]);
  const monstersHere = Object.values(tokens).filter((x) => x.loc === map.loc && !x.npc && x.hp > 0).length;
  const current = enc?.order?.[enc.turn];

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
        <button className="btn small gold" disabled={locPick === map.loc} onClick={() => { setSel(null); travel(sid, data, locPick); }}>
          Go there
        </button>
      </div>

      <MapView loc={loc} tokens={tokens} encounter={enc} selected={sel}
        onSelect={(id) => setSel(sel === id ? null : id)}
        onMove={(x, y) => sel && moveToken(sid, sel, x, y)} />
      <p className="muted small">Tap a token to select it, then tap the map to move it.</p>

      {loc && (
        <div className="gm-give">
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Add to map">
            <optgroup label="Monsters">
              {Object.entries(data.bestiary).filter(([, b]) => !b.npc).map(([id, b]) => (
                <option key={id} value={id}>{b.icon} {b.name} ({b.hp} HP)</option>
              ))}
            </optgroup>
            <optgroup label="People">
              {Object.entries(data.bestiary).filter(([, b]) => b.npc).map(([id, b]) => (
                <option key={id} value={id}>{b.icon} {b.name}</option>
              ))}
            </optgroup>
          </select>
          <button className="btn small" onClick={async () => setSel(await addToken(sid, data, kind, loc.id, tokens))}>Add here</button>
        </div>
      )}

      {t && (
        <div className="token-panel">
          <strong>{t.icon} {t.name}</strong>
          {!t.npc && (
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
                  {players.map((u) => <option key={u} value={u}>{chars[u].firstName ?? chars[u].name} (Defence {defenceOf(chars[u])}, {chars[u].hp} HP)</option>)}
                </select>
                <button className="btn small ember" disabled={!target || t.hp <= 0} onClick={() => monsterAttack(sid, data, sel, target)}>
                  Attack
                </button>
              </div>
            </>
          )}
          <button className="btn small ghost" onClick={() => { removeToken(sid, sel); setSel(null); }}>Remove</button>
        </div>
      )}

      <div className="fight-bar">
        {!enc ? (
          <button className="btn small ember" disabled={!monstersHere} onClick={() => startFight(sid, data, session, chars)}>
            ⚔️ Start fight ({monstersHere} {monstersHere === 1 ? 'enemy' : 'enemies'} here)
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
            {current?.kind === 'mon' && (
              <button className="btn small" onClick={() => setSel(current.id)}>Select {current.name}</button>
            )}
            <button className="btn small gold" onClick={() => nextTurn(sid, session)}>Next turn ▶</button>
            <button className="btn small ghost" onClick={() => endFight(sid, data, session)}>End fight and share XP</button>
          </>
        )}
      </div>
    </section>
  );
}
