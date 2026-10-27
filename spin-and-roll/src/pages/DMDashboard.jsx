import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { campaigns, getCampaign, getCampaignData } from '../campaigns';
import {
  byNewest, createSession, endSession, OPEN, startSession, useProfiles, useQueryList,
} from '../lib/sessions';
import TopBar from '../components/TopBar';
import StatusPill from '../components/StatusPill';
import NightSky from '../components/NightSky';
import HideButton from '../components/HideButton';
import { hiddenSet } from '../lib/hidden';

function SessionRow({ s, uid, hidden = false }) {
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
        <div className="session-tools">
          <StatusPill status={s.status} />
          <HideButton uid={uid} sid={s.id} title={campaign?.title} hidden={hidden} />
        </div>
      </div>
      <p className="players">
        {names.length ? names.join(', ') : 'No players have joined yet.'}
      </p>
      {open && !hidden && (
        <div className="actions">
          <Link className="btn" to={`/session/${s.id}/gm`} target="_blank">Open GM screen</Link>
          <Link className="btn" to={`/session/${s.id}/tv`} target="_blank">Open TV screen</Link>
          {s.status === 'lobby' && (
            <button className="btn gold" disabled={!names.length} onClick={() => startSession(s.id, !!getCampaignData(s.campaignId).intro)}>
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
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const sessions = useQueryList(
    query(collection(db, 'sessions'), where('dmUid', '==', user.uid)),
    [user.uid]
  );
  const hidden = hiddenSet(profile);
  const all = (sessions ?? []).slice().sort(byNewest);
  const sorted = all.filter((s) => !hidden.has(s.id));
  const hiddenGames = all.filter((s) => hidden.has(s.id));
  const open = sorted.filter((s) => OPEN.includes(s.status));
  const past = sorted.filter((s) => !OPEN.includes(s.status));

  const start = async (id) => {
    setBusy(id);
    try { await createSession(id, user.uid); } finally { setBusy(''); }
  };

  return (
    <div className="dash">
      <NightSky />
      <TopBar />
      <main className="page">
        <section className="dash-hero">
          <p className="dash-kicker">The Game Master’s tower</p>
          <h1 className="dash-title">Choose your next tale</h1>
          <div className="dash-seals">
            <div className="seal"><strong>{open.length}</strong><span>Open games</span></div>
            <div className="seal seal-won"><strong>{past.filter((s) => s.status === 'won').length}</strong><span>Won</span></div>
            <div className="seal seal-lost"><strong>{past.filter((s) => s.status === 'lost').length}</strong><span>Lost</span></div>
          </div>
        </section>

        <section>
          <h2 className="dash-h">Campaign library</h2>
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
          <h2 className="dash-h">Open games</h2>
          {sessions === null ? <p className="muted">Loading…</p>
            : open.length ? <ul className="sessions">{open.map((s) => <SessionRow key={s.id} s={s} uid={user.uid} />)}</ul>
            : <p className="muted">Create a game from the library, then share its join code.</p>}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="dash-h">Past games</h2>
            <ul className="sessions">{past.map((s) => <SessionRow key={s.id} s={s} uid={user.uid} />)}</ul>
          </section>
        )}

        {hiddenGames.length > 0 && (
          <section className="hidden-games">
            <button className="btn ghost small" onClick={() => setShowHidden((v) => !v)} aria-expanded={showHidden}>
              {showHidden ? 'Close the hidden list' : `Show hidden (${hiddenGames.length})`}
            </button>
            {showHidden && (
              <ul className="sessions">{hiddenGames.map((s) => <SessionRow key={s.id} s={s} uid={user.uid} hidden />)}</ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
