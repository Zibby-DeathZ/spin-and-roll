import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCampaign, getCampaignData } from '../campaigns';
import { useProfiles, useSession } from '../lib/sessions';
import { answerKey, clockOf, levelFor, useAnswers, useCharacters } from '../lib/game';
import { ClockChip } from '../components/Clock';
import { HouseBoard, TVQuiz } from '../components/Ceremony';
import { Splash } from '../components/Gate';
import Bar from '../components/Bar';
import Wheel from '../components/Wheel';
import EventToasts from '../components/EventToasts';

export default function TVScreen() {
  const { sid } = useParams();
  const session = useSession(sid);
  const chars = useCharacters(sid);
  const profiles = useProfiles(session?.playerUids ?? []);
  const answers = useAnswers(sid);
  const nameOf = useCallback(
    (u) => chars?.[u]?.name ?? profiles[u]?.displayName ?? 'Someone', [chars, profiles]);

  if (session === undefined || chars === null) return <Splash />;
  if (!session) return <main className="login"><h1>Game not found</h1><Link className="btn" to="/">Back</Link></main>;
  const title = getCampaign(session.campaignId)?.title;
  const data = getCampaignData(session.campaignId);
  const q = session.state?.quiz;
  const quiz = q && data.quizzes?.[q.id];

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
      <div className="tv-topline">
        <div>
          <h1 className="tv-title">{title}</h1>
          {data.clock && <ClockChip data={data} clk={clockOf(session)} />}
        </div>
        {data.quizzes && <HouseBoard points={session.state?.housePoints} compact />}
      </div>
      <div className="tv-stage">
        {quiz ? (
          <TVQuiz quiz={quiz} answer={answers[answerKey(q.id, q.uid)]} name={nameOf(q.uid)} />
        ) : (
          /* The live map goes here in a later build step. */
          <div className="tv-idle"><Wheel size={180} spin={false} /></div>
        )}
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
