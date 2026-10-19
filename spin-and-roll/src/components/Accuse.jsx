// The accusation vote: GM controls (on the TV shows tab), the phone ballot and the TV.
import { useState } from 'react';
import Art from './Art';
import { BOSS_WEAKEN, closeAsHunch, endAccusation, revealTruth, showVotes, startAccusation } from '../lib/accuse';
import { useVotes, castVote } from '../lib/imposter';

const nameOf = (chars, u) => chars?.[u]?.firstName ?? chars?.[u]?.name ?? 'Someone';
const suspectName = (data, id) => data.suspects.find((s) => s.id === id)?.name ?? 'nobody';
// "The covered painting" reads as "the covered painting" mid-sentence.
const inSentence = (name) => name.replace(/^(The|A) /, (m) => m.toLowerCase());
const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// ===================== GM =====================
export function GMAccuse({ sid, data, session, chars }) {
  const ac = session.state?.accuse;
  const votes = useVotes(sid, ac?.round);
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const go = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const eligible = session.playerUids.filter((u) => chars[u] && !chars[u].expelled);
  const { reward, culprit, partOf = [] } = data.accusation;

  if (!ac) {
    return (
      <div className="accuse-gm">
        <h3>⚖️ Accusation vote</h3>
        <p className="muted small">
          Everyone votes on their phone for who is behind the attacks. When the votes are in, you choose:
          keep it a <strong>hunch</strong> (their pick is stamped Accused, nothing is revealed), or make it the
          <strong> final accusation</strong> (the truth is revealed and rewards are paid).
        </p>
        <button className="btn gold" disabled={busy || eligible.length < 1} onClick={() => go(() => startAccusation(sid, eligible))}>
          ⚖️ Call an accusation vote
        </button>
      </div>
    );
  }

  return (
    <div className="accuse-gm">
      <h3>⚖️ Accusation vote</h3>
      {ac.stage === 'vote' && (
        <>
          <p>Votes in: {new Set(votes.map((v) => v.uid)).size} of {ac.uids.length}</p>
          <ul className="imp-votes">
            {ac.uids.map((u) => {
              const v = votes.find((x) => x.uid === u);
              return <li key={u}>{nameOf(chars, u)} → {v ? <strong>{suspectName(data, v.vote)}</strong> : <span className="muted">not yet</span>}</li>;
            })}
          </ul>
          <button className="btn gold" disabled={busy || !votes.length} onClick={() => go(() => showVotes(sid, ac, votes, data.suspects))}>Show the votes on the TV</button>
        </>
      )}

      {ac.stage === 'tally' && (
        <>
          <p>The table picked <strong>{ac.pick ? suspectName(data, ac.pick) : 'nobody (it was a tie)'}</strong>. Now choose:</p>
          <div className="accuse-choices">
            <div>
              <button className="btn" disabled={busy} onClick={() => go(() => closeAsHunch(sid, ac))}>🤔 Keep it a hunch</button>
              <p className="muted small">Their pick is stamped Accused on the board. Nothing is revealed. Use this mid-week.</p>
            </div>
            <div>
              {!sure ? (
                <button className="btn ember" disabled={busy} onClick={() => setSure(true)}>⚖️ Make it the final accusation…</button>
              ) : (
                <button className="btn ember" disabled={busy} onClick={() => go(() => revealTruth(sid, data, ac, votes, chars))}>Yes, reveal the truth now</button>
              )}
              <p className="muted small">
                Reveals that it was {suspectName(data, culprit)}{partOf.length ? ` (with ${partOf.map((p) => suspectName(data, p)).join(', ')} as the hands)` : ''}.
                Each player who named {suspectName(data, culprit)} gets +{reward.xp} XP and +{reward.points} house points; half for {partOf.map((p) => suspectName(data, p)).join(' or ')}.
                If the table got it, every boss loses {BOSS_WEAKEN} HP. Use this once, just before the finale.
              </p>
            </div>
          </div>
          <button className="linkish small" onClick={() => go(() => endAccusation(sid, ac))}>Cancel without stamping anyone</button>
        </>
      )}

      {ac.stage === 'truth' && (
        <>
          <p>
            {ac.tableRight ? <strong>The table got it.</strong> : <strong>The table got it wrong.</strong>}{' '}
            {ac.right?.length ? `${andList(ac.right.map((u) => nameOf(chars, u)))} named the culprit. ` : ''}
            {ac.half?.length ? `${andList(ac.half.map((u) => nameOf(chars, u)))} ${ac.half.length === 1 ? 'was' : 'were'} half right. ` : ''}
            Rewards have been paid{ac.tableRight ? `, and the bosses will be ${BOSS_WEAKEN} HP weaker in the finale` : ''}.
          </p>
          <button className="btn small ghost" disabled={busy} onClick={() => go(() => endAccusation(sid, ac))}>Finish and clear the TV</button>
        </>
      )}
    </div>
  );
}

// ===================== Phone =====================
export function PlayerAccuse({ sid, uid, data, session }) {
  const ac = session.state?.accuse;
  const [mine, setMine] = useState(null);
  if (!ac || !ac.uids.includes(uid)) return null;
  return (
    <main className="imp-phone">
      <p className="imp-title">⚖️ Who is draining the students?</p>
      {ac.stage === 'vote' ? (
        <>
          <p className="imp-step">Vote for the one you think is behind it all.</p>
          <div className="imp-vote-grid accuse-grid">
            {data.suspects.map((s) => (
              <button key={s.id} type="button" className={`imp-pick ${mine === s.id ? 'on' : ''}`}
                onClick={async () => { setMine(s.id); await castVote(sid, ac.round, uid, s.id); }}>
                <Art path={`people/${s.id}`} icon={s.icon} className="accuse-face" />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          <p className="muted small">{mine ? `You accused ${suspectName(data, mine)}. You can change it until the votes are shown.` : 'Tap a suspect.'}</p>
        </>
      ) : (
        <p className="imp-step">Watch the TV.</p>
      )}
    </main>
  );
}

// ===================== TV =====================
export function TVAccuse({ data, session, chars }) {
  const ac = session.state?.accuse;
  if (!ac) return null;
  const voted = new Set(ac.voted ?? []);
  const max = Math.max(1, ...Object.values(ac.counts ?? {}));
  return (
    <div className="tv-imp">
      <p className="tv-imp-eyebrow">⚖️ The accusation</p>
      {ac.stage === 'vote' && (
        <>
          <h2>Who is draining the students?</h2>
          <p className="tv-imp-sub">Vote on your phones. {voted.size} of {ac.uids.length} have voted{voted.size ? `: ${[...voted].map((u) => nameOf(chars, u)).join(', ')}` : ''}.</p>
        </>
      )}
      {ac.stage === 'tally' && <h2>{ac.pick ? `The table accuses ${inSentence(suspectName(data, ac.pick))}.` : 'The table cannot agree.'}</h2>}
      {ac.stage === 'truth' && (
        <h2>{ac.tableRight ? 'You were right.' : 'You were wrong.'} It was {inSentence(suspectName(data, ac.culprit))}.</h2>
      )}
      <div className="tv-imp-ring">
        {data.suspects.map((s) => {
          const count = ac.counts?.[s.id] ?? 0;
          const isCulprit = ac.stage === 'truth' && s.id === ac.culprit;
          const isPick = ac.stage === 'tally' && s.id === ac.pick;
          return (
            <div key={s.id} className={`tv-imp-p ${isCulprit || isPick ? 'double' : ''}`}>
              <Art path={`people/${s.id}`} icon={s.icon} className="tv-imp-face portrait accuse-tv-face" />
              <span className="tv-imp-name">{s.name}</span>
              {ac.stage !== 'vote' && (
                <>
                  <span className="tv-imp-bar" aria-hidden="true"><i style={{ width: `${(count / max) * 100}%` }} /></span>
                  <span className="tv-imp-tag">{count} {count === 1 ? 'vote' : 'votes'}</span>
                </>
              )}
              {isCulprit && <span className="tv-imp-mark">The culprit</span>}
            </div>
          );
        })}
      </div>
      {ac.stage === 'truth' && ac.tableRight && (
        <p className="tv-imp-word">Knowing the truth gives you the edge: the enemy will be <strong>weaker</strong> when you face it.</p>
      )}
    </div>
  );
}
