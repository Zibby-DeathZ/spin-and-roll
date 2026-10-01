import { useState } from 'react';
import { awardPoints } from '../lib/game';
import Portrait from './Portrait';

// Quick house points: pick a reason (optional), then tap a student's +/−.
export default function GMPoints({ sid, session, chars, onClose }) {
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
    </div>
  );
}
