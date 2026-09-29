import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { getCampaign } from '../campaigns';
import { joinSession, OPEN, useQueryList } from '../lib/sessions';
import TopBar from '../components/TopBar';
import StatusPill from '../components/StatusPill';

export default function PlayerDashboard() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const mine = useQueryList(
    query(collection(db, 'sessions'), where('playerUids', 'array-contains', user.uid)),
    [user.uid]
  );
  const history = useQueryList(collection(db, 'users', user.uid, 'history'), [user.uid]) ?? [];
  const trophies = useQueryList(collection(db, 'users', user.uid, 'trophies'), [user.uid]) ?? [];
  const live = (mine ?? []).filter((s) => OPEN.includes(s.status));
  const wins = history.filter((h) => h.result === 'won').length;

  const join = async (e) => {
    e.preventDefault();
    setError('');
    setJoining(true);
    try {
      const sid = await joinSession(code, user.uid);
      nav(`/session/${sid}/play`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <section className="hello">
          <h2>Welcome back, {profile.displayName.split(' ')[0]}</h2>
          <div className="record">
            <span><strong>{history.length}</strong> played</span>
            <span><strong>{wins}</strong> won</span>
            <span><strong>{history.length - wins}</strong> lost</span>
          </div>
        </section>

        <section>
          <h2>Join a game</h2>
          <form className="join" onSubmit={join}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={4}
              placeholder="Code on the TV"
              aria-label="Join code"
              autoCapitalize="characters"
            />
            <button className="btn gold" disabled={code.trim().length !== 4 || joining}>
              {joining ? 'Joining…' : 'Join'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
          {live.length > 0 && (
            <ul className="sessions">
              {live.map((s) => (
                <li key={s.id} className="session">
                  <div className="session-head">
                    <h3>{getCampaign(s.campaignId)?.title}</h3>
                    <StatusPill status={s.status} />
                  </div>
                  <Link className="btn gold" to={`/session/${s.id}/play`}>Open my character</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Trophy cabinet</h2>
          {trophies.length ? (
            <ul className="cabinet">
              {trophies.map((t) => (
                <li key={t.id} className="trophy">
                  <span className="trophy-icon">{t.icon}</span>
                  <span>{t.title}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Win a campaign and its trophy lands here.</p>}
        </section>

        <section>
          <h2>Campaign history</h2>
          {history.length ? (
            <ul className="history">
              {history
                .slice()
                .sort((a, b) => (b.endedAt?.seconds ?? 0) - (a.endedAt?.seconds ?? 0))
                .map((h) => (
                  <li key={h.id}>
                    <span>{h.campaignTitle}</span>
                    <StatusPill status={h.result} />
                  </li>
                ))}
            </ul>
          ) : <p className="muted">Finished campaigns show up here.</p>}
        </section>
      </main>
    </>
  );
}
