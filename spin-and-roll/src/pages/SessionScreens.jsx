import { Link, useParams } from 'react-router-dom';
import { useSession, useProfiles } from '../lib/sessions';
import { getCampaign } from '../campaigns';
import { useAuth } from '../auth/AuthProvider';
import { Splash } from '../components/Gate';
import StatusPill from '../components/StatusPill';
import Wheel from '../components/Wheel';

// These three screens already sync live through Firestore.
// Steps 3–5 fill them with the map, character sheets, trades and animations.

function useLive() {
  const { sid } = useParams();
  const session = useSession(sid);
  const profiles = useProfiles(session?.playerUids ?? []);
  return { session, profiles, campaign: session && getCampaign(session.campaignId) };
}

function Missing() {
  return (
    <main className="login">
      <h1>Game not found</h1>
      <Link className="btn" to="/">Back to dashboard</Link>
    </main>
  );
}

export function TVScreen() {
  const { session, profiles, campaign } = useLive();
  if (session === undefined) return <Splash />;
  if (!session) return <Missing />;
  return (
    <main className="tv">
      <Wheel size={140} />
      <h1>{campaign?.title}</h1>
      {session.status === 'lobby' && (
        <p className="tv-code">Join with code <strong>{session.code}</strong></p>
      )}
      <ul className="tv-players">
        {session.playerUids.map((u) => (
          <li key={u} className="arrive">{profiles[u]?.displayName ?? '…'}</li>
        ))}
      </ul>
      <StatusPill status={session.status} />
    </main>
  );
}

export function GMScreen() {
  const { session, profiles, campaign } = useLive();
  if (session === undefined) return <Splash />;
  if (!session) return <Missing />;
  return (
    <main className="page">
      <h1>GM screen: {campaign?.title}</h1>
      <p><StatusPill status={session.status} /> Code <strong className="code">{session.code}</strong></p>
      <h2>At the table</h2>
      <ul className="history">
        {session.playerUids.map((u) => <li key={u}>{profiles[u]?.displayName ?? '…'}</li>)}
      </ul>
      <p className="muted">Map, player controls and the event feed arrive in the next build steps.</p>
    </main>
  );
}

export function PlayerScreen() {
  const { user } = useAuth();
  const { session, campaign } = useLive();
  if (session === undefined) return <Splash />;
  if (!session || !session.playerUids.includes(user.uid)) return <Missing />;
  return (
    <main className="login">
      <Wheel size={96} spin={session.status === 'lobby'} />
      <h1>{campaign?.title}</h1>
      <p className="muted">
        {session.status === 'lobby' && 'You’re in. Waiting for the DM to start.'}
        {session.status === 'active' && 'The game has started. Your character sheet appears here.'}
        {(session.status === 'won' || session.status === 'lost') && 'This game is over.'}
      </p>
      <Link className="btn ghost" to="/">Back to dashboard</Link>
    </main>
  );
}
