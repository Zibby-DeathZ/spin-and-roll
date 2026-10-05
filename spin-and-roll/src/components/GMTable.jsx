import { useState } from 'react';
import MapView, { isMonster } from './MapView';
import { defenceOf } from '../lib/game';
import {
  addToken, endFight, monsterAttack, moveToken, nextTurn, placeToken, removeToken, setTokenHp, startFight,
} from '../lib/combat';
import { doubleToken, springMimic, trunkToken } from '../lib/mimic';
import { chestToken, hazardToken, itemToken, locOf, movePlayers, pcsAt, placeStaff, showOnTV, triggerHazard } from '../lib/world';

const KINDS = [['monsters', '👹 Monsters'], ['people', '🧑 People'], ['chests', '🧰 Chests'], ['items', '✨ Items'], ['hazards', '🔥 Hazards'], ['mimics', '👄 Mimics']];

function Box({ title, children, open: startOpen = true }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="gm-box">
      <button className="gm-box-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span><span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="gm-box-body">{children}</div>}
    </div>
  );
}

export default function GMTable({ sid, data, session, chars }) {
  const map = session.state?.map ?? {};
  const tokens = session.state?.tokens ?? {};
  const enc = session.state?.encounter;
  const players = session.playerUids.filter((u) => chars[u]);
  const [locPick, setLocPick] = useState(map.loc ?? data.locations[0].id);
  const [who, setWho] = useState(null);
  const [kind, setKind] = useState('monsters');
  const [sel, setSel] = useState(null);
  const [target, setTarget] = useState('');
  const [copyWho, setCopyWho] = useState('flitwick');
  const movers = who ?? players;
  const loc = data.locations.find((l) => l.id === map.loc);
  const areas = [...new Set(data.locations.map((l) => l.area))];
  const t = sel && !sel.startsWith('pc:') ? tokens[sel] : null;
  const selPc = sel?.startsWith('pc:') ? chars[sel.slice(3)] : null;
  const here = players.filter((u) => locOf(session, u) === map.loc);
  const monstersHere = Object.values(tokens).filter((x) => x.loc === map.loc && isMonster(x) && x.hp > 0).length;
  const current = enc?.order?.[enc.turn];
  const placeName = (id) => data.locations.find((l) => l.id === id)?.name ?? 'not placed';
  const name = (u) => chars[u]?.firstName ?? chars[u]?.name;

  const place = async (type, id) => {
    let newId;
    if (type === 'chests') newId = await placeToken(sid, chestToken(data, id, loc.id));
    else if (type === 'items') newId = await placeToken(sid, itemToken(data, id, loc.id));
    else if (type === 'hazards') newId = await placeToken(sid, hazardToken(data, id, loc.id));
    else if (type === 'mimics') newId = await placeToken(sid, id === 'hungry-trunk' ? trunkToken(data, loc.id) : doubleToken(data, loc.id, copyWho));
    else newId = await addToken(sid, data, id, loc.id, tokens);
    setSel(newId);
  };

  const catalogue = {
    monsters: Object.entries(data.bestiary).filter(([, b]) => !b.npc).map(([id, b]) => [id, b.icon, b.name, `${b.hp} HP`]),
    people: Object.entries(data.bestiary).filter(([, b]) => b.npc).map(([id, b]) => [id, b.icon, b.name, '']),
    chests: Object.entries(data.chests ?? {}).map(([id, c]) => [id, c.icon, c.name, `lock ${c.dc}`]),
    items: Object.entries(data.items).map(([id, it]) => [id, it.icon, it.name, '']),
    hazards: Object.entries(data.hazards ?? {}).map(([id, h]) => [id, h.icon, h.name, '']),
    mimics: Object.entries(data.mimics ?? {}).map(([id, m]) => [id, m.icon, m.name, id === 'hungry-trunk' ? 'looks like a Locked chest' : 'copies a person']),
  };

  return (
    <div className="gm-table">
      <div className="gm-table-map">
        <MapView loc={loc} tokens={tokens} pcs={pcsAt(session, chars, map.loc)} encounter={enc} selected={sel}
          onSelect={(id) => setSel(sel === id ? null : id)} onMove={(x, y) => sel && moveToken(sid, sel, x, y)} />
        <p className="muted small">
          {sel ? 'Tap anywhere on the map to move the selected token.' : 'Tap a token or character to select it.'}
        </p>

        {(t || selPc) && (
          <div className="token-panel">
            {selPc && (
              <span><strong>{selPc.name}</strong> <span className="muted small">{selPc.hp}/{selPc.maxHp} HP, Defence {defenceOf(selPc)}</span></span>
            )}
            {t && <strong>{t.icon} {t.name}</strong>}
            {t?.mimic && !t.revealed && (
              <>
                <span className="tag tag-warn">Secretly {data.mimics[t.mimic].name}</span>
                <button className="btn small ember" onClick={() => springMimic(sid, data, sel)}>😱 Spring the mimic</button>
              </>
            )}
            {t?.revealed && (
              <span className="muted small">
                {data.mimics[t.mimic].desc}
                {(t.belly ?? []).length > 0 && ` Swallowed: ${t.belly.map((b) => b.name).join(', ')}.`}
                {t.lastSpell && ` Next turn it mirrors ${t.lastSpell.name} (${t.lastSpell.dmg}) at ${name(t.lastSpell.caster)}.`}
              </span>
            )}
            {t?.kind === 'chest' && !t.mimic && (
              <span className="muted small">
                Lock {t.dc} ({t.stat.toUpperCase()}){t.trap ? `, cursed (${t.trap} dmg)` : ''}.{' '}
                {t.opened ? 'Opened.' : `Holds ${t.contents.gold} Galleons${t.contents.items.length ? `, ${t.contents.items.map((i) => data.items[i]?.name).join(', ')}` : ''}.`}
                {(t.tried ?? []).length > 0 && ` Failed: ${t.tried.map(name).join(', ')}.`}
              </span>
            )}
            {t?.kind === 'item' && <span className="muted small">Waiting to be picked up.</span>}
            {t?.kind === 'hazard' && (
              <>
                <span className="muted small">{t.desc}</span>
                <button className="btn small ember" disabled={t.used} onClick={() => triggerHazard(sid, data, session, sel, chars)}>
                  {t.used ? 'Used' : t.action}
                </button>
              </>
            )}
            {t && isMonster(t) && (
              <>
                <span className="muted small">{t.hp}/{t.maxHp} HP, Defence {t.defence}{data.bestiary[t.kind]?.note ? `. ${data.bestiary[t.kind].note}` : ''}</span>
                <span className="nudges">
                  {[-5, -1, 1, 5].map((n) => (
                    <button key={n} className={`nudge ${n < 0 ? 'neg' : 'pos'}`}
                      onClick={() => setTokenHp(sid, sel, Math.max(0, Math.min(t.maxHp, t.hp + n)))}>{n > 0 ? `+${n}` : n}</button>
                  ))}
                </span>
                <span className="gm-give">
                  <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Attack whom">
                    <option value="">Attack whom?</option>
                    {here.map((u) => <option key={u} value={u}>{name(u)} (Def {defenceOf(chars[u])}, {chars[u].hp} HP)</option>)}
                  </select>
                  <button className="btn small ember" disabled={!target || t.hp <= 0} onClick={() => monsterAttack(sid, data, sel, target)}>Attack</button>
                </span>
              </>
            )}
            {t && <button className="btn small ghost" onClick={() => { removeToken(sid, sel); setSel(null); }}>Remove</button>}
            <button className="btn small ghost" onClick={() => setSel(null)}>Deselect</button>
          </div>
        )}
      </div>

      <div className="gm-table-side">
        <Box title="📍 Where">
          <select className="wide" value={locPick} onChange={(e) => setLocPick(e.target.value)} aria-label="Location">
            {areas.map((a) => (
              <optgroup key={a} label={a}>
                {data.locations.filter((l) => l.area === a).map((l) => (
                  <option key={l.id} value={l.id}>{l.icon} {l.name}{map.discovered?.includes(l.id) ? '' : ' (new)'}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="movers">
            {players.map((u) => (
              <label key={u} className={movers.includes(u) ? 'on' : ''}>
                <input type="checkbox" checked={movers.includes(u)}
                  onChange={() => setWho(movers.includes(u) ? movers.filter((x) => x !== u) : [...movers, u])} />
                {name(u)} <span className="muted small">{placeName(locOf(session, u))}</span>
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="btn small gold" disabled={!movers.length}
              onClick={() => { setSel(null); movePlayers(sid, data, locPick, movers, chars, true); }}>Move them here</button>
            <button className="btn small" disabled={locPick === map.loc} onClick={() => { setSel(null); showOnTV(sid, data, locPick); }}>Just show on TV</button>
          </div>
          {data.staff && (
            <button className="linkish" onClick={() => placeStaff(sid, data, session)}>👩‍🏫 Send all staff to their rooms</button>
          )}
        </Box>

        <Box title="➕ Place on this map">
          <div className="seg four" role="group" aria-label="What to place">
            {KINDS.map(([k, l]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>)}
          </div>
          <div className="place-list">
            {catalogue[kind].map(([id, icon, label, note]) => (
              <button key={id} className="place-btn" disabled={!loc} onClick={() => place(kind, id)}>
                <span>{icon}</span><span>{label}</span>{note && <span className="muted small">{note}</span>}
              </button>
            ))}
          </div>
          {kind === 'mimics' && (
            <label className="gm-give small">The Painted Double copies:
              <select value={copyWho} onChange={(e) => setCopyWho(e.target.value)}>
                {Object.entries(data.bestiary).filter(([, b]) => b.npc).map(([id, b]) => <option key={id} value={id}>{b.icon} {b.name}</option>)}
              </select>
            </label>
          )}
          {!loc && <p className="muted small">Choose a place first.</p>}
        </Box>

        <Box title={enc ? `⚔️ Fight: round ${enc.round}` : '⚔️ Fight'}>
          {!enc ? (
            <button className="btn small ember" disabled={!monstersHere}
              onClick={() => startFight(sid, data, session, chars)}>
              Start fight ({monstersHere} {monstersHere === 1 ? 'enemy' : 'enemies'}, {here.length} {here.length === 1 ? 'student' : 'students'})
            </button>
          ) : (
            <>
              <ol className="turn-order">
                {enc.order.map((o, i) => (
                  <li key={o.id} className={`${i === enc.turn ? 'on' : ''} ${o.kind === 'mon' && (tokens[o.id]?.hp ?? 0) <= 0 ? 'out' : ''}`}>
                    {o.name} <span className="muted">{o.init}</span>
                  </li>
                ))}
              </ol>
              <div className="actions">
                {current?.kind === 'mon' && <button className="btn small" onClick={() => setSel(current.id)}>Select {current.name}</button>}
                <button className="btn small gold" onClick={() => nextTurn(sid, session)}>Next turn ▶</button>
                <button className="btn small ghost" onClick={() => endFight(sid, data, session)}>End and share XP</button>
              </div>
            </>
          )}
        </Box>
      </div>
    </div>
  );
}
