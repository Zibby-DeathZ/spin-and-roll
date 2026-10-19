// The reaction duel: GM controls (in a boss's token panel), the phone reaction screen and the TV.
import { useEffect, useRef, useState } from 'react';
import { castVote, useVotes } from '../lib/imposter';
import { COLORS, clearDuel, duelCfg, duelOn, duelSpellsOf, duelText, parseReaction, resolveDuel, roundId, setDuelOn, startDuel, windowFor } from '../lib/duel';
import { play } from '../lib/sound';

// Milliseconds since this device first saw this duel. Each screen times itself, so clocks don't need to match.
function useElapsed(d) {
  const seen = useRef({ id: null, t: 0 });
  const [, tick] = useState(0);
  if (d && seen.current.id !== d.id) seen.current = { id: d.id, t: performance.now() };
  const live = d?.stage === 'live';
  useEffect(() => {
    if (!live) return undefined;
    const i = setInterval(() => tick((n) => n + 1), 50);
    return () => clearInterval(i);
  }, [live, d?.id]);
  return d ? performance.now() - seen.current.t : 0;
}

// Which colour is showing right now (a feint shows a false one first).
const shownColor = (d, ms) => (d.fake && ms < d.feintAt ? d.fake : d.spell.color);

function Countdown({ d, ms }) {
  const left = Math.max(0, d.ms - ms);
  return (
    <div className="duel-timer" role="timer" aria-label={`${(left / 1000).toFixed(1)} seconds left`}>
      <span style={{ width: `${(left / d.ms) * 100}%` }} />
    </div>
  );
}

// ===================== GM =====================
export function GMDuel({ sid, data, session, chars, tokenId, here }) {
  const token = session.state?.tokens?.[tokenId];
  const spells = duelSpellsOf(data, token);
  const [target, setTarget] = useState('');
  const [feint, setFeint] = useState(false);
  const d = session.state?.duel;
  if (!spells.length) return null;
  const on = duelOn(data, token);
  const b = data.bestiary[token.kind];
  const round = session.state?.encounter?.round ?? 0;
  const spent = (u) => session.state?.duelUsed?.[u] === round;
  const mine = d && d.tokenId === tokenId;

  return (
    <div className="duel-gm">
      <label className="announce">
        <input type="checkbox" checked={on} onChange={(e) => setDuelOn(sid, tokenId, e.target.checked)} />
        ⚔️ Reaction duel{b.duelFast ? ' (fast: phase 2)' : ''}
      </label>
      {on && !(d?.stage === 'live') && (
        <>
          <span className="gm-give">
            <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Cast at whom">
              <option value="">Cast at whom?</option>
              {here.map((u) => (
                <option key={u} value={u}>
                  {chars[u].firstName ?? chars[u].name} ({(windowFor(data, chars[u], !!b.duelFast) / 1000).toFixed(1)} s{spent(u) ? ', reaction used' : ''})
                </option>
              ))}
            </select>
          </span>
          <div className="duel-spells">
            {spells.map((s, i) => (
              <button key={s.name} className={`duel-spell c-${s.color}`} disabled={!target || token.hp <= 0}
                onClick={() => { startDuel(sid, data, session, chars, tokenId, target, i, feint); setFeint(false); }}>
                <span>{s.icon}</span><strong>{s.name}</strong>
                <span className="small">{COLORS[s.color].label} to save</span>
              </button>
            ))}
          </div>
          <label className="announce small">
            <input type="checkbox" checked={feint} onChange={(e) => setFeint(e.target.checked)} />
            Feint: flash a false colour first{b.duelFast ? '' : ' (best saved for phase 2)'}
          </label>
        </>
      )}
      {mine && d.stage === 'live' && <LiveStatus sid={sid} data={data} d={d} chars={chars} />}
      {mine && d.stage === 'done' && d.result && (
        <p className="duel-result-gm">
          {duelText({ ...d.result, caster: d.caster, spell: d.spell.name, targetName: d.targetName })}{' '}
          <button className="linkish small" onClick={() => clearDuel(sid, d)}>Clear</button>
        </p>
      )}
    </div>
  );
}

function LiveStatus({ sid, data, d, chars }) {
  const ms = useElapsed(d);
  const votes = useVotes(sid, roundId(d));
  const said = (u) => {
    const r = votes.map(parseReaction).find((x) => x.uid === u);
    return r ? `${r.choice === 'protego' ? 'Protego' : COLORS[r.choice]?.label ?? r.choice} at ${(r.ms / 1000).toFixed(2)} s` : 'waiting';
  };
  return (
    <div className="duel-live">
      <p>
        <strong>{d.spell.icon} {d.spell.name}</strong> at {d.targetName}
        {d.fake ? ` (feint: shows ${d.fake} first)` : ''}. Needs <b>{COLORS[d.spell.color].label}</b>.
        {d.targetUsed ? ' They have no reaction left this round.' : ''}
        {d.helpers.length ? ` Can shield them: ${d.helpers.map((u) => chars[u]?.firstName ?? '?').join(', ')}.` : ''}
      </p>
      <Countdown d={d} ms={ms} />
      <p className="muted small">
        {d.targetName}: {d.targetUsed ? 'no reaction' : said(d.targetUid)}
        {d.helpers.map((u) => `. ${chars[u]?.firstName ?? '?'}: ${said(u)}`).join('')}
      </p>
      <button className="linkish small" onClick={() => resolveDuel(sid, data, d, votes)}>Settle it now</button>
    </div>
  );
}

// ===================== Phone =====================
export function duelNeedsMe(session, uid) {
  const d = session.state?.duel;
  return !!d && d.stage === 'live' && (d.targetUid === uid || d.helpers.includes(uid));
}

export function PlayerDuel({ sid, uid, session, data }) {
  const d = session.state.duel;
  const ms = useElapsed(d);
  const [sent, setSent] = useState(null); // the screen is keyed by the duel's id, so this resets per spell
  useEffect(() => { try { navigator.vibrate?.([120, 60, 120]); } catch { /* ignore */ } }, [d.id]);
  const isTarget = d.targetUid === uid;
  const over = ms > d.ms;
  const color = shownColor(d, ms);
  const react = (choice) => {
    if (sent || over) return;
    const r = { choice, ms: Math.round(ms) };
    setSent(r);
    castVote(sid, roundId(d), uid, `${choice}|${r.ms}`).catch(console.error);
  };
  const cost = duelCfg(data).protego.mana;

  if (!isTarget) {
    return (
      <main className="duel-phone helper">
        <p className="duel-eyebrow">⚔️ {d.caster} attacks!</p>
        <h1>{d.targetName} is under attack!</h1>
        <div className={`duel-orb c-${color}`}><span>{d.spell.icon}</span></div>
        <Countdown d={d} ms={ms} />
        {sent ? <p className="duel-said">🛡️ Protego! You throw a shield over {d.targetName}.</p>
          : over ? <p className="duel-said muted">Too late.</p>
            : <button className="duel-btn c-red big" onClick={() => react('protego')}>🛡️ Protego: shield them<span className="small">{cost} mana, uses your reaction this round</span></button>}
      </main>
    );
  }

  return (
    <main className="duel-phone">
      <p className="duel-eyebrow">⚔️ {d.caster} casts at you!</p>
      <h1>{d.spell.name}</h1>
      <div className={`duel-orb c-${color}`}><span>{d.spell.icon}</span></div>
      <Countdown d={d} ms={ms} />
      {d.targetUsed ? (
        <p className="duel-said">You used your reaction this round. Brace yourself!</p>
      ) : sent ? (
        <p className="duel-said">{COLORS[sent.choice]?.icon} {COLORS[sent.choice]?.label}! ({(sent.ms / 1000).toFixed(2)} s)</p>
      ) : over ? (
        <p className="duel-said muted">Too slow!</p>
      ) : (
        <div className="duel-btns">
          {Object.entries(COLORS).map(([c, x]) => (
            <button key={c} className={`duel-btn c-${c}`} onClick={() => react(c)}>{x.icon} {x.label}</button>
          ))}
        </div>
      )}
      <p className="muted small">Red: Shield. Blue: Dodge. Gold: Counter. Trust the colour, not the name.</p>
    </main>
  );
}

// ===================== TV =====================
export function TVDuel({ session }) {
  const d = session.state?.duel;
  const ms = useElapsed(d);
  const last = useRef(null);
  useEffect(() => {
    if (d?.stage === 'live' && last.current !== d.id) { last.current = d.id; play('whoosh'); }
  }, [d?.id, d?.stage]);
  if (!d) return null;
  const color = d.stage === 'live' ? shownColor(d, ms) : d.spell.color;
  const r = d.result;
  return (
    <div className={`tv-duel ${d.stage}`} role="alert">
      <div className="tv-duel-card">
        <p className="tv-duel-eyebrow">{d.casterIcon} {d.caster} casts</p>
        <h2>{d.spell.name}</h2>
        <div className={`duel-orb big c-${color}`}><span>{d.spell.icon}</span></div>
        <p className="tv-duel-at">at <strong>{d.targetName}</strong></p>
        {d.stage === 'live' && <Countdown d={d} ms={ms} />}
        {d.stage === 'live' && <p className="tv-duel-hint">Red: Shield · Blue: Dodge · Gold: Counter</p>}
        {d.stage === 'done' && r && (
          <p className={`tv-duel-result ${r.rebound != null ? 'good' : r.hit && r.dmg ? 'bad' : 'good'}`}>
            {duelText({ ...r, caster: d.caster, spell: d.spell.name, targetName: d.targetName })}
          </p>
        )}
      </div>
    </div>
  );
}
