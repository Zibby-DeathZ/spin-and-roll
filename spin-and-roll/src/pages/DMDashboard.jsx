import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { campaigns, getCampaign } from '../campaigns';
import {
  byNewest, createSession, endSession, OPEN, startSession, useProfiles, useQueryList,
} from '../lib/sessions';
import TopBar from '../components/TopBar';
import StatusPill from '../components/StatusPill';

function SessionRow({ s }) {
  const campaign = getCampaign(s.campaignId);
  const profiles = useProfiles(s.playerUids);
  const names = s.playerUids.map((u) => profiles[u]?.displayName ?? '…');
  const open = OPEN.includes(s.status);

  const finish = async (result) => {
    const verb = result === 'won' ? 'a win' : 'a loss';
    if (!confirm(`Record ${verb} for ${campaign?.title}? This goes on every player's account.`)) return;
    await endSession(s, result);
  };

  return (
    <li className="session">
      <div className="session-head">
        <div>
          <h3>{campaign?.title ?? s.campaignId}</h3>
          <p className="muted">
            {open ? <>Join code <strong className="code">{s.code}</strong></> : 'Finished'}
          </p>
        </div>
        <StatusPill status={s.status} />
      </div>
      <p className="players">
        {names.length ? names.join(', ') : 'No players have joined yet.'}
      </p>
      {open && (
        <div className="actions">
          <Link className="btn" to={`/session/${s.id}/gm`} target="_blank">Open GM screen</Link>
          <Link className="btn" to={`/session/${s.id}/tv`} target="_blank">Open TV screen</Link>
          {s.status === 'lobby' && (
            <button className="btn gold" disabled={!names.length} onClick={() => startSession(s.id)}>
              Start game
            </button>
          )}
          {s.status === 'active' && (
            <>
              <button className="btn teal" onClick={() => finish('won')}>Record win</button>
              <button className="btn ember" onClick={() => finish('lost')}>Record loss</button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export default function DMDashboard() {
  const { user } = useAuth();
  const [busy, setBusy] = useState('');
  const sessions = useQueryList(
    query(collection(db, 'sessions'), where('dmUid', '==', user.uid)),
    [user.uid]
  );
  const sorted = (sessions ?? []).slice().sort(byNewest);
  const open = sorted.filter((s) => OPEN.includes(s.status));
  const past = sorted.filter((s) => !OPEN.includes(s.status));

  const start = async (id) => {
    setBusy(id);
    try { await createSession(id, user.uid); } finally { setBusy(''); }
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <section>
          <h2>Campaign library</h2>
          <ul className="library">
            {campaigns.map((c) => (
              <li key={c.id} className={`campaign campaign-${c.status}`}>
                <div>
                  <h3>{c.title}</h3>
                  <p className="muted">{c.tagline}</p>
                  {c.trophy && <p className="trophy-line">{c.trophy.icon} {c.trophy.title}</p>}
                </div>
                <button
                  className="btn gold"
                  disabled={c.status === 'soon' || busy === c.id}
                  onClick={() => start(c.id)}
                >
                  {c.status === 'soon' ? 'Not ready yet' : busy === c.id ? 'Creating…' : 'Create game'}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Open games</h2>
          {sessions === null ? <p className="muted">Loading…</p>
            : open.length ? <ul className="sessions">{open.map((s) => <SessionRow key={s.id} s={s} />)}</ul>
            : <p className="muted">Create a game from the library, then share its join code.</p>}
        </section>

        {past.length > 0 && (
          <section>
            <h2>Past games</h2>
            <ul className="sessions">{past.map((s) => <SessionRow key={s.id} s={s} />)}</ul>
          </section>
        )}
      </main>
    </>
  );
}
