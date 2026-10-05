import { useState } from 'react';
import { computeAwards, houseCup, pinClue, setShow, setSuspectMark } from '../lib/world';

const HOUSES = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

// ---------- Suspect board ----------
export function SuspectBoard({ data, board = {} }) {
  const pinned = board.pinned ?? {};
  const marks = board.marks ?? {};
  return (
    <div className="suspects">
      <h2>🕵️ Who is draining the students?</h2>
      <div className="suspect-grid">
        {data.suspects.map((s) => {
          const clues = data.clues.filter((c) => pinned[c.id] === s.id);
          return (
            <div key={s.id} className={`suspect ${marks[s.id] ?? ''}`}>
              <div className="suspect-head">
                <span className="suspect-icon">{s.icon}</span>
                <span><strong>{s.name}</strong><span className="muted small">{s.note}</span></span>
              </div>
              {marks[s.id] === 'cleared' && <span className="stamp cleared">Cleared</span>}
              {marks[s.id] === 'accused' && <span className="stamp accused">Accused</span>}
              <ul>
                {clues.map((c) => <li key={c.id} className={c.clears ? 'clears' : ''}>{c.clears ? '✓ ' : '• '}{c.text}</li>)}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- End-of-night awards ----------
export function AwardsShow({ show }) {
  return (
    <div className="awards">
      <h2>🎖️ Tonight’s awards</h2>
      {!show.awards.length && <p className="muted">Not much happened tonight… yet.</p>}
      <div className="award-grid">
        {show.awards.map((a, i) => (
          <div key={a.title} className="award" style={{ animationDelay: `${i * 0.35}s` }}>
            <span className="award-icon">{a.icon}</span>
            <strong>{a.title}</strong>
            <span className="award-name">{a.name}</span>
            <span className="muted small">{a.value} {a.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- House Cup ----------
export function HouseCupShow({ show }) {
  const top = Math.max(1, ...show.standings.map(([, p]) => p));
  return (
    <div className={`housecup hc-${show.winner.toLowerCase()}`}>
      <p className="hc-kicker">The House Cup goes to…</p>
      <h2 className="hc-winner">🏆 {show.winner}!</h2>
      {show.names.length > 0 && <p className="hc-names">{show.names.join(' · ')}</p>}
      <div className="hc-bars">
        {show.standings.map(([h, p]) => (
          <div key={h} className={`hc-bar hb-${h.toLowerCase()}`}>
            <span className="hc-fill" style={{ height: `${Math.max(6, (p / top) * 100)}%` }} />
            <strong>{p}</strong>
            <span>{h}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TVShow({ data, session }) {
  const show = session.state?.show;
  if (show?.type === 'suspects') return <SuspectBoard data={data} board={session.state?.board} />;
  if (show?.type === 'awards') return <AwardsShow show={show} />;
  if (show?.type === 'housecup') return <HouseCupShow show={show} />;
  return null;
}

// ---------- GM controls ----------
export function GMShows({ sid, data, session, chars }) {
  const show = session.state?.show;
  const board = session.state?.board ?? {};
  const pinned = board.pinned ?? {};
  const [busy, setBusy] = useState(false);
  const go = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const pts = session.state?.housePoints ?? {};
  const leader = [...HOUSES].sort((a, b) => (pts[b] ?? 0) - (pts[a] ?? 0))[0];

  return (
    <section className="gm-shows">
      <div className="show-bar">
        <span className="muted small">On the TV now: <strong>{show ? { suspects: 'Suspect board', awards: 'Awards', housecup: 'House Cup' }[show.type] : 'the map'}</strong></span>
        <span className="actions">
          <button className="btn small" disabled={show?.type === 'suspects'} onClick={() => setShow(sid, { type: 'suspects' })}>🕵️ Suspect board</button>
          <button className="btn small" disabled={busy} onClick={() => go(async () => setShow(sid, { type: 'awards', awards: await computeAwards(sid, chars) }))}>🎖️ Tonight’s awards</button>
          <button className="btn small gold" disabled={busy}
            onClick={() => confirm(`Award the House Cup to ${leader}? It goes into each ${leader} player’s trophy cabinet.`) && go(() => houseCup(sid, session, chars))}>
            🏆 House Cup ceremony
          </button>
          {show && <button className="btn small ghost" onClick={() => setShow(sid, null)}>Back to the map</button>}
        </span>
      </div>

      <h2>🕵️ Suspect board</h2>
      <p className="muted small">Pin a clue under a suspect when the players find it. Ticked clues point away from someone.</p>
      <div className="suspect-marks">
        {data.suspects.map((s) => (
          <span key={s.id} className="suspect-mark">
            {s.icon} {s.name}
            <select value={board.marks?.[s.id] ?? ''} onChange={(e) => setSuspectMark(sid, s.id, e.target.value || null)} aria-label={`Mark ${s.name}`}>
              <option value="">Open</option><option value="cleared">Cleared</option><option value="accused">Accused</option>
            </select>
          </span>
        ))}
      </div>
      <ul className="clue-list">
        {data.clues.map((c) => (
          <li key={c.id}>
            <span className={c.clears ? 'clears' : ''}>{c.clears ? '✓ ' : ''}{c.text}</span>
            <select value={pinned[c.id] ?? ''} onChange={(e) => pinClue(sid, c.id, e.target.value || null)} aria-label="Pin under">
              <option value="">Not found yet</option>
              {data.suspects.map((s) => <option key={s.id} value={s.id}>Under {s.name}{s.id === c.points ? ' ✓' : ''}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}
