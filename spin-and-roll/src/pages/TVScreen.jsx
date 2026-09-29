import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCampaign } from '../campaigns';
import { useProfiles, useSession } from '../lib/sessions';
import { levelFor, useCharacters } from '../lib/game';
import { Splash } from '../components/Gate';
import Bar from '../components/Bar';
import Wheel from '../components/Wheel';
import EventToasts from '../components/EventToasts';

export default function TVScreen() {
  const { sid } = useParams();
  const session = useSession(sid);
  const chars = useCharacters(sid);
  const profiles = useProfiles(session?.playerUids ?? []);
  const nameOf = useCallback(
    (u) => chars?.[u]?.name ?? profiles[u]?.displayName ?? 'Someone', [chars, profiles]);

  if (session === undefined || chars === null) return <Splash />;
  if (!session) return <main className="login"><h1>Game not found</h1><Link className="btn" to="/">Back</Link></main>;
  const title = getCampaign(session.campaignId)?.title;

  if (session.status === 'lobby') {
    return (
      <main className="tv">
        <Wheel size={140} />
        <h1>{title}</h1>
        <p className="tv-code">Join with code <strong>{session.code}</strong></p>
        <ul className="tv-players">
          {session.playerUids.map((u) => <li key={u} className="arrive">{profiles[u]?.displayName ?? '…'}</li>)}
        </ul>
      </main>
    );
  }

  return (
    <main className="tv tv-live">
      <h1 className="tv-title">{title}</h1>
      <div className="tv-stage">
        {/* The live map goes here in the next build step. */}
        <Wheel size={180} spin={false} />
      </div>
      <ul className="tv-party">
        {session.playerUids.map((u) => {
          const c = chars[u];
          return (
            <li key={u} className="tv-card">
              <strong>{c?.name ?? profiles[u]?.displayName}</strong>
              {c ? (
                <>
                  <span className="muted">{c.house ? `${c.house}, ` : ''}level {levelFor(c.xp)}</span>
                  <Bar label="HP" value={c.hp} max={c.maxHp} tone="ember" />
                  <Bar label="Mana" value={c.mana} max={c.maxMana} tone="violet" />
                </>
              ) : <span className="muted">Creating character…</span>}
            </li>
          );
        })}
      </ul>
      <EventToasts sid={sid} nameOf={nameOf} big />
    </main>
  );
}
