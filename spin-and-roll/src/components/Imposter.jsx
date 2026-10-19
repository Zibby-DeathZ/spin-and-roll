// The Painted Double party game: GM controls, the phone card and vote, and the TV.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Portrait from './Portrait';
import { awardPoints } from '../lib/game';
import { sendOwl } from '../lib/owls';
import { play } from '../lib/sound';
import {
  castVote, endRound, finishGuess, newWordId, parseWordLines, resetUsed, reveal, saveWordBank, setStage, showWord, startRound,
  useMyCard, useRoundCards, useVotes, useWordBank,
} from '../lib/imposter';

const nameOf = (chars, u) => chars?.[u]?.firstName ?? chars?.[u]?.name ?? 'Someone';
const OWL_TEXT = 'You hid among them so well. Not one of them saw it. Come and see me, child, alone. We have so much in common.';

// ===================== GM =====================
export function GMImposter({ sid, session, chars }) {
  const { user } = useAuth();
  const words = useWordBank(user?.uid, session.campaignId);
  const im = session.state?.imposter;
  return (
    <section className="gm-imposter">
      <h2>🎭 The Painted Double</h2>
      <p className="muted small">
        Everyone gets the same secret word on their phone, except one player, the Double, who only gets your hint.
        Going round the table, each player says one word about it out loud. Then everyone votes on their phone.
      </p>
      {im ? <GMRound sid={sid} session={session} chars={chars} words={words ?? []} im={im} />
        : <GMSetup sid={sid} session={session} chars={chars} words={words} />}
      <WordList uid={user?.uid} campaignId={session.campaignId} words={words} used={session.state?.imposterUsed ?? []} sid={sid} />
    </section>
  );
}

function GMSetup({ sid, session, chars, words }) {
  const eligible = session.playerUids.filter((u) => chars[u] && !chars[u].expelled);
  const [picked, setPicked] = useState(null); // null = everyone
  const [double, setDouble] = useState('random');
  const [wordId, setWordId] = useState('random');
  const [busy, setBusy] = useState(false);
  const uids = (picked ?? eligible).filter((u) => eligible.includes(u));
  const used = session.state?.imposterUsed ?? [];
  const fresh = (words ?? []).filter((w) => !used.includes(w.id));
  const toggle = (u) => setPicked(uids.includes(u) ? uids.filter((x) => x !== u) : [...uids, u]);

  const start = async () => {
    const pool = fresh.length ? fresh : words;
    const entry = wordId === 'random' ? pool[Math.floor(Math.random() * pool.length)] : words.find((w) => w.id === wordId);
    const dbl = double === 'random' || !uids.includes(double) ? uids[Math.floor(Math.random() * uids.length)] : double;
    if (!entry || !dbl) return;
    setBusy(true);
    try { await startRound(sid, { uids, entry, doubleUid: dbl }); } finally { setBusy(false); }
  };

  if (words === null) return <p className="muted">Loading your words…</p>;
  return (
    <div className="imp-setup">
      <h3>Start a round</h3>
      <div className="attend">
        {eligible.map((u) => (
          <label key={u} className={uids.includes(u) ? 'on' : ''}>
            <input type="checkbox" checked={uids.includes(u)} onChange={() => toggle(u)} /> {nameOf(chars, u)}
          </label>
        ))}
      </div>
      <div className="imp-row">
        <label>The Double
          <select value={double} onChange={(e) => setDouble(e.target.value)}>
            <option value="random">Pick at random</option>
            {uids.map((u) => <option key={u} value={u}>{nameOf(chars, u)}</option>)}
          </select>
        </label>
        <label>The word
          <select value={wordId} onChange={(e) => setWordId(e.target.value)}>
            <option value="random">Random from your list{fresh.length < words.length ? ` (${fresh.length} not played yet)` : ''}</option>
            {words.map((w) => <option key={w.id} value={w.id}>{w.word}{used.includes(w.id) ? ' (played)' : ''}</option>)}
          </select>
        </label>
      </div>
      {words.length === 0 && <p className="warn small">Add some words below first. Every word needs a hint for the Double.</p>}
      {uids.length < 3 && <p className="warn small">You need at least 3 players in the round.</p>}
      <button className="btn gold" disabled={busy || uids.length < 3 || !words.length} onClick={start}>🎭 Start the round</button>
    </div>
  );
}

function GMRound({ sid, session, chars, words, im }) {
  const cards = useRoundCards(sid, im.round);
  const votes = useVotes(sid, im.round);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState({});
  const doubleUid = Object.entries(cards).find(([, c]) => c.role === 'double')?.[0] ?? im.doubleUid;
  const entry = words.find((w) => w.id === im.wordId);
  const word = entry?.word ?? Object.values(cards).find((c) => c.role === 'word')?.word ?? '?';
  const hint = entry?.hint ?? cards[doubleUid]?.hint ?? '?';
  const go = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const rightVoters = votes.filter((v) => v.vote === doubleUid).map((v) => v.uid).filter((u) => u !== doubleUid);

  // When the round ends, the TV may show the word.
  useEffect(() => {
    if (im.stage === 'done' && !im.word && word !== '?') showWord(sid, word).catch(console.error);
  }, [sid, im.stage, im.word, word]);

  return (
    <div className="imp-round">
      <div className="imp-secret">
        <span>Word: <strong>{word}</strong></span>
        <span>Hint for the Double: <em>{hint}</em></span>
        <span>The Double: <strong>{doubleUid ? nameOf(chars, doubleUid) : '…'}</strong></span>
      </div>
      <p className="muted small">Players: {im.uids.map((u) => nameOf(chars, u)).join(', ')}. {nameOf(chars, im.starter)} goes first.</p>

      {im.stage === 'clues' && (
        <>
          <p>Going round the table, each player says <strong>one word</strong> about their secret. Two times round is usually enough.</p>
          <button className="btn gold" disabled={busy} onClick={() => go(() => setStage(sid, 'vote'))}>🗳️ Start the vote</button>
        </>
      )}

      {im.stage === 'vote' && (
        <>
          <p>Votes in: {votes.length} of {im.uids.length}</p>
          <ul className="imp-votes">
            {im.uids.map((u) => {
              const v = votes.find((x) => x.uid === u);
              return <li key={u}>{nameOf(chars, u)} → {v ? <strong>{nameOf(chars, v.vote)}</strong> : <span className="muted">not yet</span>}</li>;
            })}
          </ul>
          <button className="btn gold" disabled={busy || !votes.length || !doubleUid} onClick={() => go(() => reveal(sid, im, votes, doubleUid))}>
            🎭 Reveal on the TV
          </button>
        </>
      )}

      {im.stage === 'guess' && (
        <>
          <p><strong>Caught!</strong> {nameOf(chars, doubleUid)} gets one guess at the word. Let them say it out loud.</p>
          <div className="actions">
            <button className="btn ember" disabled={busy} onClick={() => go(() => finishGuess(sid, true))}>They guessed it (the Double steals the win)</button>
            <button className="btn teal" disabled={busy} onClick={() => go(() => finishGuess(sid, false))}>Wrong guess (the table wins)</button>
          </div>
        </>
      )}

      {im.stage === 'done' && (
        <>
          <p className="imp-result">
            {im.result === 'caught' && <>The table caught {nameOf(chars, doubleUid)}.</>}
            {im.result === 'stolen' && <>{nameOf(chars, doubleUid)} was caught but guessed the word, and steals the win.</>}
            {im.result === 'escaped' && <>{nameOf(chars, doubleUid)} got away with it.</>}
          </p>
          <div className="actions">
            {im.result === 'caught' && rightVoters.length > 0 && (
              <button className="btn small gold" disabled={done.points} onClick={async () => {
                setDone({ ...done, points: true });
                for (const u of rightVoters) await awardPoints(sid, u, chars[u]?.house, 5, 'Caught the Painted Double');
              }}>+5 house points to each of the {rightVoters.length} who voted right</button>
            )}
            {im.result !== 'caught' && (
              <>
                <button className="btn small gold" disabled={done.points} onClick={async () => {
                  setDone({ ...done, points: true });
                  await awardPoints(sid, doubleUid, chars[doubleUid]?.house, 10, 'Fooled everyone');
                }}>+10 house points to the Double</button>
                <button className="btn small" disabled={done.owl} onClick={async () => {
                  setDone({ ...done, owl: true });
                  await sendOwl(sid, doubleUid, 'The covered painting', OWL_TEXT);
                }}>🦉 The painting sends the Double an owl</button>
              </>
            )}
          </div>
        </>
      )}

      <div className="actions imp-end">
        <button className="btn small ghost" disabled={busy} onClick={() => go(() => endRound(sid, im))}>
          {im.stage === 'done' ? 'Finish and clear the TV' : 'Cancel the round'}
        </button>
      </div>
    </div>
  );
}

function WordList({ uid, campaignId, words, used, sid }) {
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [bulk, setBulk] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(null);
  if (words === null) return null;
  const save = (next) => saveWordBank(uid, campaignId, next);
  const add = async () => {
    if (!word.trim() || !hint.trim()) return;
    await save([...words, { id: newWordId(), word: word.trim(), hint: hint.trim() }]);
    setWord(''); setHint('');
  };
  const addBulk = async () => {
    const { words: added, skipped } = parseWordLines(bulk);
    if (added.length) await save([...words, ...added]);
    setNote(`Added ${added.length}.${skipped.length ? ` Skipped ${skipped.length} without a hint: ${skipped.join('; ')}` : ''}`);
    setBulk('');
  };

  return (
    <div className="imp-words">
      <h3>Your words ({words.length})</h3>
      <p className="muted small">Only you can see this list. It’s saved to your account, so it’s there for every game. Pick words the table can describe in one word each.</p>
      <div className="imp-add">
        <input aria-label="Word" placeholder="Word (e.g. Library)" value={word} onChange={(e) => setWord(e.target.value)} maxLength={60} />
        <input aria-label="Hint for the Double" placeholder="Hint for the Double (e.g. Quiet)" value={hint} onChange={(e) => setHint(e.target.value)} maxLength={80}
          onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn small gold" disabled={!word.trim() || !hint.trim()} onClick={add}>Add</button>
      </div>
      <button className="linkish small" onClick={() => setBulkOpen(!bulkOpen)} aria-expanded={bulkOpen}>
        {bulkOpen ? 'Hide' : 'Add lots at once'}
      </button>
      {bulkOpen && (
        <div className="imp-bulk">
          <label htmlFor="imp-bulk-text" className="small muted">One per line, word then a bar then the hint: <code>Owlery | Feathers</code></label>
          <textarea id="imp-bulk-text" rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={'Owlery | Feathers\nGreat Hall | Feasts'} />
          <button className="btn small gold" disabled={!bulk.trim()} onClick={addBulk}>Add these</button>
        </div>
      )}
      {note && <p className="small muted">{note}</p>}
      {words.length > 0 && (
        <table className="imp-table">
          <thead><tr><th>Word</th><th>Hint for the Double</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id} className={used.includes(w.id) ? 'used' : ''}>
                {editing?.id === w.id ? (
                  <>
                    <td><input aria-label="Word" value={editing.word} onChange={(e) => setEditing({ ...editing, word: e.target.value })} /></td>
                    <td><input aria-label="Hint" value={editing.hint} onChange={(e) => setEditing({ ...editing, hint: e.target.value })} /></td>
                    <td className="imp-acts">
                      <button className="btn small gold" disabled={!editing.word.trim() || !editing.hint.trim()} onClick={async () => {
                        await save(words.map((x) => (x.id === w.id ? { ...x, word: editing.word.trim(), hint: editing.hint.trim() } : x)));
                        setEditing(null);
                      }}>Save</button>
                      <button className="btn small ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{w.word}{used.includes(w.id) && <span className="muted small"> (played)</span>}</td>
                    <td>{w.hint}</td>
                    <td className="imp-acts">
                      <button className="btn small ghost" onClick={() => setEditing({ ...w })}>Edit</button>
                      <button className="btn small ghost" onClick={() => save(words.filter((x) => x.id !== w.id))} aria-label={`Delete ${w.word}`}>✕</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {used.length > 0 && <button className="linkish small" onClick={() => resetUsed(sid)}>Make played words random again</button>}
    </div>
  );
}

// ===================== Phone =====================
export function PlayerImposter({ sid, uid, session, chars }) {
  const im = session.state?.imposter;
  const card = useMyCard(sid, uid, im?.round);
  const [shown, setShown] = useState(false);
  const [myVote, setMyVote] = useState(null);
  useEffect(() => { setShown(false); setMyVote(null); }, [im?.round]);
  if (!im || !im.uids.includes(uid)) return null;
  const others = im.uids.filter((u) => u !== uid);
  const isDouble = card?.role === 'double';

  return (
    <main className="imp-phone">
      <p className="imp-title">🎭 The Painted Double</p>
      {(im.stage === 'clues' || im.stage === 'vote') && (
        <button type="button" className={`imp-card ${shown ? 'open' : ''} ${shown && isDouble ? 'double' : ''}`} onClick={() => setShown(!shown)}
          aria-label={shown ? 'Hide your card' : 'Show your card'}>
          {!card && <span className="muted">Your card is on its way…</span>}
          {card && !shown && <span>Tap to see your card<br /><small>Keep it hidden from everyone else</small></span>}
          {card && shown && !isDouble && (
            <>
              <small>The secret word</small>
              <strong className="imp-word">{card.word}</strong>
              <small>Describe it in one word. Don’t make it too easy: the Double is listening.</small>
            </>
          )}
          {card && shown && isDouble && (
            <>
              <strong className="imp-word">You are the Painted Double</strong>
              <small>You don’t know the word. Here is your only hint:</small>
              <strong className="imp-hint">{card.hint}</strong>
              <small>Blend in. Listen to the others and say something that fits.</small>
            </>
          )}
        </button>
      )}

      {im.stage === 'clues' && <p className="imp-step">{im.starter === uid ? 'You go first.' : `${nameOf(chars, im.starter)} goes first.`} One word each, going round the table.</p>}

      {im.stage === 'vote' && (
        <div className="imp-vote">
          <p className="imp-step">Who is the Painted Double?</p>
          <div className="imp-vote-grid">
            {others.map((u) => (
              <button key={u} type="button" className={`imp-pick ${myVote === u ? 'on' : ''}`}
                onClick={async () => { setMyVote(u); await castVote(sid, im.round, uid, u); }}>
                <Portrait family={chars[u]?.family} name={nameOf(chars, u)} />
                <span>{nameOf(chars, u)}</span>
              </button>
            ))}
          </div>
          <p className="muted small">{myVote ? `You voted for ${nameOf(chars, myVote)}. You can change it until the reveal.` : 'Tap a name to vote.'}</p>
        </div>
      )}

      {(im.stage === 'guess' || im.stage === 'done') && (
        <div className="imp-outcome">
          {im.stage === 'guess' && (im.doubleUid === uid
            ? <p className="imp-step">They caught you! Guess the word out loud to steal the win.</p>
            : <p className="imp-step">{nameOf(chars, im.doubleUid)} was the Double! They get one guess at the word…</p>)}
          {im.stage === 'done' && (
            <p className="imp-step">
              {im.result === 'escaped' && (im.doubleUid === uid ? 'You fooled them all.' : `${nameOf(chars, im.doubleUid)} was the Double, and got away with it.`)}
              {im.result === 'caught' && (im.doubleUid === uid ? 'They caught you.' : `Caught! ${nameOf(chars, im.doubleUid)} was the Double.`)}
              {im.result === 'stolen' && (im.doubleUid === uid ? 'Caught, but you guessed the word. You win!' : `${nameOf(chars, im.doubleUid)} guessed the word and stole the win.`)}
            </p>
          )}
          {im.word && <p>The word was <strong>{im.word}</strong>.</p>}
          <p className="muted small">Watch the TV.</p>
        </div>
      )}
    </main>
  );
}

// ===================== TV =====================
export function TVImposter({ session, chars }) {
  const im = session.state?.imposter;
  const prev = useRef(null);
  useEffect(() => {
    if (!im || prev.current === im.stage) return;
    prev.current = im.stage;
    if (im.stage === 'clues') play('lowChime');
    if (im.stage === 'vote') play('tick');
    if (im.stage === 'guess') play('boom');
    if (im.stage === 'done') play(im.result === 'escaped' || im.result === 'stolen' ? 'boom' : 'chime');
  }, [im]);
  const order = useMemo(() => {
    if (!im) return [];
    const i = im.uids.indexOf(im.starter);
    return [...im.uids.slice(i), ...im.uids.slice(0, i)];
  }, [im]);
  if (!im) return null;
  const voted = new Set(im.voted ?? []);
  const max = Math.max(1, ...Object.values(im.counts ?? {}));

  return (
    <div className="tv-imp">
      <p className="tv-imp-eyebrow">🎭 The Painted Double</p>
      {im.stage === 'clues' && (
        <>
          <h2>One of you is not who they seem.</h2>
          <p className="tv-imp-sub">Check your phone. Then, going round, say <strong>one word</strong> about your secret.</p>
        </>
      )}
      {im.stage === 'vote' && <h2>Vote on your phones. Who is painted?</h2>}
      {im.stage === 'guess' && <h2>Caught! But the Double gets one guess at the word…</h2>}
      {im.stage === 'done' && (
        <h2>
          {im.result === 'caught' && 'The Painted Double is caught!'}
          {im.result === 'stolen' && 'Caught, but the Double guessed the word!'}
          {im.result === 'escaped' && 'The Painted Double got away with it.'}
        </h2>
      )}

      <div className="tv-imp-ring">
        {order.map((u, i) => {
          const isDouble = (im.stage === 'guess' || im.stage === 'done') && u === im.doubleUid;
          const count = im.counts?.[u] ?? 0;
          return (
            <div key={u} className={`tv-imp-p ${isDouble ? 'double' : ''} ${im.stage === 'vote' && voted.has(u) ? 'voted' : ''}`}>
              <Portrait family={chars?.[u]?.family} name={nameOf(chars, u)} className="tv-imp-face" />
              <span className="tv-imp-name">{nameOf(chars, u)}</span>
              {im.stage === 'clues' && <span className="tv-imp-tag">{i === 0 ? 'Starts' : `${i + 1}`}</span>}
              {im.stage === 'vote' && <span className="tv-imp-tag">{voted.has(u) ? '✓ Voted' : '…'}</span>}
              {(im.stage === 'guess' || im.stage === 'done') && (
                <>
                  <span className="tv-imp-bar" aria-hidden="true"><i style={{ width: `${(count / max) * 100}%` }} /></span>
                  <span className="tv-imp-tag">{count} {count === 1 ? 'vote' : 'votes'}</span>
                </>
              )}
              {isDouble && <span className="tv-imp-mark">The Double</span>}
            </div>
          );
        })}
      </div>
      {im.stage === 'done' && im.word && <p className="tv-imp-word">The word was <strong>{im.word}</strong></p>}
    </div>
  );
}
