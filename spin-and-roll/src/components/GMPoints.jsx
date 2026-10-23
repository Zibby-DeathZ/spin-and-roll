import { useState } from 'react';
import { awardPoints } from '../lib/game';
import Portrait from './Portrait';
import { dayStandings, HOUSE_PERKS, HOUSE_TRAITS, perkById } from '../lib/houses';
import { changePerk, setHouseOfDay } from '../lib/houseday';

// Quick house points: pick a reason (optional), then tap a student's +/−.
export default function GMPoints({ sid, data, session, chars, onClose }) {
  const [reason, setReason] = useState('');
  const players = session.playerUids.filter((u) => chars[u]);
  return (
    <div className="gm-points" role="dialog" aria-label="House points">
      <div className="party-head">
        <h2>⏳ House points</h2>
        <button className="btn small ghost" onClick={onClose}>Close</button>
      </div>
      <input className="wide-input" value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional), e.g. for quick thinking" aria-label="Reason" />
      <ul className="points-list">
        {players.map((u) => {
          const c = chars[u];
          const sorted = c.house && c.house !== 'Unsorted';
          return (
            <li key={u}>
              <Portrait family={c.family} name={c.name} className="chip-portrait" />
              <span className="points-name">
                <strong>{c.firstName ?? c.name}</strong>
                <span className={`muted small hb-${(c.house ?? '').toLowerCase()}`}>{sorted ? c.house : 'Not sorted yet'}</span>
              </span>
              <span className="nudges">
                {[-10, -5, 5, 10].map((n) => (
                  <button key={n} className={`nudge ${n < 0 ? 'neg' : 'pos'}`} disabled={!sorted}
                    onClick={() => awardPoints(sid, u, c.house, n, reason)}>
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      {data?.houses && <HouseOfDay sid={sid} data={data} session={session} />}
    </div>
  );
}

// Today's race, who is House of the Day right now, and the perk.
function HouseOfDay({ sid, data, session }) {
  const [busy, setBusy] = useState(false);
  const hod = session.state?.houseOfDay;
  const perk = perkById(hod?.perk);
  const today = dayStandings(session.state?.housePoints ?? {}, session.state?.dayStart?.points ?? {}, data.houses);
  const go = (fn) => { setBusy(true); fn().catch(console.error).finally(() => setBusy(false)); };
  return (
    <section className="hod-gm">
      <h3>🏅 House of the Day</h3>
      <p className="muted small">
        Points earned today: {today.map(([h, p]) => `${h} ${p}`).join(' · ')}.
        When you move the clock to the next morning, the leader becomes House of the Day and draws a perk.
      </p>
      {hod ? (
        <p><strong>{hod.houses.join(' & ')}</strong>: {perk ? `${perk.icon} ${perk.name}. ${perk.text}` : 'no perk'}</p>
      ) : <p className="muted">No House of the Day yet.</p>}
      <div className="hod-actions">
        {hod && <button className="btn small" disabled={busy} onClick={() => go(() => changePerk(sid, data))}>🎲 Draw another perk</button>}
        {hod && (
          <select disabled={busy} value="" onChange={(e) => e.target.value && go(() => changePerk(sid, data, e.target.value))} aria-label="Pick a perk">
            <option value="">Pick a perk…</option>
            {HOUSE_PERKS.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
          </select>
        )}
        <select disabled={busy} value="" onChange={(e) => e.target.value && go(() => setHouseOfDay(sid, data, e.target.value === 'none' ? null : e.target.value))} aria-label="Set House of the Day">
          <option value="">Set the house by hand…</option>
          {Object.keys(HOUSE_TRAITS).map((h) => <option key={h} value={h}>{h}</option>)}
          {hod && <option value="none">Nobody (clear it)</option>}
        </select>
      </div>
      <p className="muted small">A new perk’s gifts (potions, Galleons) are handed out straight away. Ones already given stay.</p>
    </section>
  );
}
