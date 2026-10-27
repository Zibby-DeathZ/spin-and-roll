import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { getCampaign } from '../campaigns';
import { joinSession, OPEN, useQueryList } from '../lib/sessions';
import { hiddenSet } from '../lib/hidden';
import TopBar from '../components/TopBar';
import StatusPill from '../components/StatusPill';
import Portrait from '../components/Portrait';
import NightSky from '../components/NightSky';
import HideButton from '../components/HideButton';
import { useHeroes } from '../lib/heroes';

export default function PlayerDashboard() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const mine = useQueryList(
    query(collection(db, 'sessions'), where('playerUids', 'array-contains', user.uid)),
    [user.uid]
  );
  const allHistory = useQueryList(collection(db, 'users', user.uid, 'history'), [user.uid]) ?? [];
  const allTrophies = useQueryList(collection(db, 'users', user.uid, 'trophies'), [user.uid]) ?? [];
  const heroes = useHeroes(user.uid);

  // Games this player removed from their profile. Nothing is deleted; they're just not shown.
  const hidden = hiddenSet(profile);
  const allLive = (mine ?? []).filter((s) => OPEN.includes(s.status));
  const live = allLive.filter((s) => !hidden.has(s.id));
  const history = allHistory.filter((h) => !hidden.has(h.id));
  const trophies = allTrophies.filter((t) => !hidden.has(t.id));
  const wins = history.filter((h) => h.result === 'won').length;
  const hiddenGames = [
    ...allLive.filter((s) => hidden.has(s.id)).map((s) => ({ id: s.id, title: getCampaign(s.campaignId)?.title ?? 'A game', status: s.status })),
    ...allHistory.filter((h) => hidden.has(h.id)).map((h) => ({ id: h.id, title: h.campaignTitle, status: h.result })),
  ];

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
    <div className="dash">
      <NightSky />
      <TopBar />
      <main className="page">
        <section className="dash-hero">
          <p className="dash-kicker">The adventurer’s hall</p>
          <h1 className="dash-title">Welcome back, {profile.displayName.split(' ')[0]}</h1>
          <div className="dash-seals">
            <div className="seal"><strong>{history.length}</strong><span>Played</span></div>
            <div className="seal seal-won"><strong>{wins}</strong><span>Won</span></div>
            <div className="seal seal-lost"><strong>{history.length - wins}</strong><span>Lost</span></div>
            <div className="seal seal-trophy"><strong>{trophies.length}</strong><span>Trophies</span></div>
          </div>
        </section>

        <section className="dash-card dash-join">
          <h2 className="dash-h">Join a game</h2>
          <p className="muted small">Type the four-letter code shown on the TV.</p>
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
              {joining ? 'Joining…' : '⚔ Join'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
          {live.length > 0 && (
            <ul className="sessions">
              {live.map((s) => {
                const title = getCampaign(s.campaignId)?.title;
                return (
                  <li key={s.id} className="session">
                    <div className="session-head">
                      <h3>{title}</h3>
                      <div className="session-tools">
                        <StatusPill status={s.status} />
                        <HideButton uid={user.uid} sid={s.id} title={title} />
                      </div>
                    </div>
                    <Link className="btn gold" to={`/session/${s.id}/play`}>Open my character</Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {heroes.length > 0 && (
          <section>
            <h2 className="dash-h">Your characters</h2>
            <ul className="heroes">
              {heroes.map((h) => (
                <li key={h.id} className="hero-card">
                  <Portrait family={h.family} name={h.name} className="hero-portrait" />
                  <div>
                    <span className="tag">{h.seriesName}, Year {h.year} complete</span>
                    <strong className="hero-name">{h.name}</strong>
                    <span className="muted small">{h.house}, level {h.level}, {h.xp} XP</span>
                    <span className="muted small">
                      {(h.spells ?? []).length} spells, {(h.inventory ?? []).reduce((n, i) => n + (i.qty ?? 1), 0)} items, {h.gold} Galleons
                      {h.equipment?.wand ? `. ${h.equipment.wand.name}` : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="muted small">Your character carries on into the next year: same level, spells and belongings.</p>
          </section>
        )}

        <section>
          <h2 className="dash-h">Trophy cabinet</h2>
          {trophies.length ? (
            <ul className="cabinet">
              {trophies.map((t) => (
                <li key={t.id} className="trophy">
                  <span className="trophy-icon">{t.icon}</span>
                  <span>{t.title}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted dash-empty">Win a campaign and its trophy lands here.</p>}
        </section>

        <section>
          <h2 className="dash-h">Campaign history</h2>
          {history.length ? (
            <ul className="history">
              {history
                .slice()
                .sort((a, b) => (b.endedAt?.seconds ?? 0) - (a.endedAt?.seconds ?? 0))
                .map((h) => (
                  <li key={h.id}>
                    <span>{h.campaignTitle}</span>
                    <span className="session-tools">
                      <StatusPill status={h.result} />
                      <HideButton uid={user.uid} sid={h.id} title={h.campaignTitle} />
                    </span>
                  </li>
                ))}
            </ul>
          ) : <p className="muted dash-empty">Finished campaigns show up here.</p>}

          {hiddenGames.length > 0 && (
            <div className="hidden-games">
              <button className="btn ghost small" onClick={() => setShowHidden((v) => !v)} aria-expanded={showHidden}>
                {showHidden ? 'Close the hidden list' : `Show hidden (${hiddenGames.length})`}
              </button>
              {showHidden && (
                <ul className="history">
                  {hiddenGames.map((g) => (
                    <li key={g.id} className="muted">
                      <span>{g.title}</span>
                      <span className="session-tools">
                        <StatusPill status={g.status} />
                        <HideButton uid={user.uid} sid={g.id} title={g.title} hidden />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
