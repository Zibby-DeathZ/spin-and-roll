import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCampaign, getCampaignData } from '../campaigns';
import { useProfiles, useSession } from '../lib/sessions';
import { answerKey, clockOf, useAnswers, useCharacters } from '../lib/game';
import { ClockChip } from '../components/Clock';
import { TVSpin } from '../components/SpinWheel';
import MapView from '../components/MapView';
import { LessonBoard } from '../minigames';
import { useLessonResults } from '../lib/lessons';
import { actionsAt, locOf, pcsAt } from '../lib/world';
import Portrait from '../components/Portrait';
import { TVPuzzle } from '../components/Puzzles';
import { TVShow } from '../components/Shows';
import TVIntro from '../components/Intro';
import SoundGate from '../components/SoundGate';
import JumpScare from '../components/JumpScare';
import { setMusic, play, soundForEvent } from '../lib/sound';
import { introActive, skipToBook } from '../lib/intro';
import { useEffect } from 'react';
import { useClaims } from '../lib/game';
import { HouseBoard, TVQuiz } from '../components/Ceremony';
import { Splash } from '../components/Gate';
import Wheel from '../components/Wheel';
import EventToasts from '../components/EventToasts';

export default function TVScreen() {
  const { sid } = useParams();
  const session = useSession(sid);
  const chars = useCharacters(sid);
  const profiles = useProfiles(session?.playerUids ?? []);
  const answers = useAnswers(sid);
  const claims = useClaims(sid);
  const lessonResults = useLessonResults(sid, session?.state?.lesson?.id);
  const nameOf = useCallback(
    (u) => chars?.[u]?.name ?? profiles[u]?.displayName ?? 'Someone', [chars, profiles]);

  if (session === undefined || chars === null) return <Splash />;
  if (!session) return <main className="login"><h1>Game not found</h1><Link className="btn" to="/">Back</Link></main>;
  const title = getCampaign(session.campaignId)?.title;
  const data = getCampaignData(session.campaignId);
  const q = session.state?.quiz;
  const quiz = q && data.quizzes?.[q.id];
  const spin = session.state?.spin;
  const showSpin = spin && !spin.hidden && data.wheels?.[spin.wheelId];
  const loc = data.locations?.find((l) => l.id === session.state?.map?.loc);
  const enc = session.state?.encounter;

  if (session.status === 'lobby') {
    return (
      <main className="tv">
        <Wheel size={140} />
        <h1>{title}</h1>
        <p className="tv-code">Join with code <strong>{session.code}</strong></p>
        <ul className="tv-players">
          {session.playerUids.map((u) => <li key={u} className="arrive">{profiles[u]?.displayName ?? '…'}</li>)}
        </ul>
        <SoundGate />
      </main>
    );
  }

  return (
    <TVLive claims={claims} session={session} chars={chars} profiles={profiles} data={data} title={title} answers={answers}
      lessonResults={lessonResults} nameOf={nameOf} sid={sid} />
  );
}

// The live table view, split out so it can be previewed with sample data.
export function TVLive({ session, chars, profiles, data, title, answers, lessonResults, nameOf, sid, claims = {} }) {
  // Music: the intro track during the opening, otherwise whatever the GM picked.
  const music = session.state?.music;
  const opening = introActive(session);
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    if (opening) setMusic(`${base}sounds/music/intro.mp3`, 0.5, true);
    else setMusic(music?.track ? `${base}sounds/music/${music.track}.mp3` : null, music?.volume ?? 0.5, !!music?.playing);
  }, [opening, music?.track, music?.playing, music?.volume]);

  const q = session.state?.quiz;
  const quiz = q && data.quizzes?.[q.id];
  const spin = session.state?.spin;
  const showSpin = spin && !spin.hidden && data.wheels?.[spin.wheelId];
  const loc = data.locations?.find((l) => l.id === session.state?.map?.loc);
  const enc = session.state?.encounter;
  const acts = loc ? actionsAt(data, session, loc.id) : null;

  const ist = session.state?.intro;
  const closingDone = ist?.stage === 'closing' && Date.now() - (ist.at ?? 0) > 3600;
  if (data.intro && ist && ist.stage !== 'done' && !closingDone) {
    return (
      <main className="tv2 tv-intro">
        <TVIntro intro={data.intro} data={data} st={ist} claims={claims} onVideoDone={() => sid && skipToBook(sid)} />
        <SoundGate />
      </main>
    );
  }

  let stage;
  if (session.state?.show) stage = <div className="tv2-center"><TVShow data={data} session={session} /></div>;
  else if (quiz) stage = <div className="tv2-center"><TVQuiz quiz={quiz} answer={answers[answerKey(q.id, q.uid)]} name={nameOf(q.uid)} /></div>;
  else if (showSpin) stage = <div className="tv2-center"><TVSpin data={data} spin={spin} name={spin.uid ? nameOf(spin.uid) : null} /></div>;
  else if (session.state?.puzzle && data.puzzles?.find((p) => p.id === session.state.puzzle.id)) {
    stage = <div className="tv2-center"><TVPuzzle p={data.puzzles.find((p) => p.id === session.state.puzzle.id)} st={session.state.puzzle} /></div>;
  } else if (session.state?.lesson) {
    stage = (
      <div className="tv2-center">
        <LessonBoard lesson={session.state.lesson} cls={data.classes[session.state.lesson.cls]} results={lessonResults} nameOf={nameOf} big />
      </div>
    );
  } else if (loc) {
    stage = (
      <div className="tv2-play">
        <div className="tv2-map">
          <MapView loc={loc} tokens={session.state?.tokens} pcs={pcsAt(session, chars, loc.id)} encounter={enc} big caption={false} />
          {enc && (
            <ol className="tv-turns">
              <li className="tv-round">Round {enc.round}</li>
              {enc.order.map((o, i) => (
                <li key={o.id} className={`${i === enc.turn ? 'on' : ''} ${o.kind === 'mon' ? 'mon' : ''} ${o.kind === 'mon' && (session.state?.tokens?.[o.id]?.hp ?? 0) <= 0 ? 'out' : ''}`}>
                  {o.name}
                </li>
              ))}
            </ol>
          )}
        </div>
        <aside className="tv2-options">
          <h2>{loc.icon} {loc.name}</h2>
          <p className="muted">{loc.desc}</p>
          {enc ? (
            <p className="tv2-fight">⚔️ Fight! {enc.order[enc.turn]?.name}’s turn</p>
          ) : (
            <>
              {acts.things.length > 0 && (
                <>
                  <h3>Here</h3>
                  <ul>{acts.things.map((a) => <li key={a.text} className={a.danger ? 'danger' : ''}><span>{a.icon}</span>{a.text}</li>)}</ul>
                </>
              )}
              {acts.extras.length > 0 && (
                <>
                  <h3>You could</h3>
                  <ul>{acts.extras.map((a) => <li key={a.text}><span>{a.icon}</span>{a.text}</li>)}</ul>
                </>
              )}
              {acts.paths.length > 0 && (
                <>
                  <h3>Paths</h3>
                  <ul>{acts.paths.map((l) => <li key={l.id}><span>{l.icon}</span>{l.name}</li>)}</ul>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    );
  } else stage = <div className="tv2-center tv-idle"><Wheel size={180} spin={false} /></div>;

  return (
    <main className="tv2">
      <header className="tv2-top">
        <span className="tv2-title">{title}</span>
        {data.clock && <ClockChip data={data} clk={clockOf(session)} scenes={session.state?.scenes} />}
        {data.quizzes && <HouseBoard points={session.state?.housePoints} compact />}
      </header>
      <div className="tv2-stage">{stage}</div>
      <footer className="tv2-party">
        {session.playerUids.map((u) => {
          const c = chars[u];
          if (!c) return <span key={u} className="tv2-chip muted">{profiles[u]?.displayName ?? '…'} is choosing…</span>;
          const where = locOf(session, u);
          const away = loc && where && where !== loc.id;
          return (
            <span key={u} className={`tv2-chip ${c.hp <= 0 ? 'ko' : ''} ${enc?.order?.[enc.turn]?.id === u ? 'turn' : ''}`}>
              <Portrait family={c.family} name={c.firstName ?? c.name} className="chip-portrait" />
              <span className="tv2-chip-text">
                <strong>{c.firstName ?? c.name}</strong>
                <span className="tv2-hp"><span style={{ width: `${Math.max(0, (c.hp / c.maxHp) * 100)}%` }} /></span>
                {c.hp <= 0 ? <em>Knocked out</em> : away ? <em>📍 {data.locations.find((l) => l.id === where)?.name}</em> : null}
              </span>
            </span>
          );
        })}
      </footer>
      {sid && <EventToasts sid={sid} nameOf={nameOf} big skip={['wheel']}
        onNew={(e) => { const s2 = soundForEvent(e); (Array.isArray(s2) ? s2 : s2 ? [s2] : []).forEach((n, i) => setTimeout(() => play(n), i * 180)); }} />}
      <JumpScare scare={session.state?.scare} />
      <SoundGate />
    </main>
  );
}
