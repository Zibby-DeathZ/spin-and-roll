import { useCallback, useRef, useState } from 'react';
import Charms from './Charms';
import Potions from './Potions';
import Herbology from './Herbology';
import Defence from './Defence';
import Transfiguration from './Transfiguration';
import Creatures from './Creatures';
import Flying from './Flying';
import { MAX_ATTEMPTS, saveAttempt } from '../lib/lessons';

export const GAMES = {
  charms: { C: Charms, title: 'Wand Motion', rules: 'Watch the wand move, then repeat the motion with the arrows. The pattern grows each round. One wrong move and the charm fizzles.' },
  potions: { C: Potions, title: 'Stir Timing', rules: 'Tap Stir when the needle is inside the green zone. You get 5 stirs and need 4 perfect ones. It speeds up as the potion thickens.' },
  herbology: { C: Herbology, title: 'Mandrake Repotting', rules: 'Mandrakes pop out of their pots. Tap them back down before they scream. Three screams and you faint.' },
  defence: { C: Defence, title: 'Duel Reflexes', rules: 'Spells fly at you. Red: Shield. Blue: Dodge. Gold: Counter. Trust the colour, not the word. 10 spells, 2 mistakes allowed.' },
  transfiguration: { C: Transfiguration, title: 'Matching Pairs', rules: 'Flip cards to match each object with what it transforms into. Finish every pair before you run out of moves.' },
  creatures: { C: Creatures, title: 'Befriend the Beast', rules: 'A creature appears. Pick the right way to approach it before time runs out. Get 4 of 5 right.' },
  flying: { C: Flying, title: 'Broom Dodge', rules: 'Steer left and right to dodge obstacles for 20 seconds. Three crashes and Madam Hooch grounds you.' },
};
const DIFF = ['', 'Gentle', 'Tricky', 'Fiendish'];

// Phone: intro → play → result, with two attempts.
export function LessonScreen({ sid, uid, lesson, cls, result, onLeave }) {
  const game = GAMES[lesson.game];
  const attempts = result?.attempts ?? 0;
  const [phase, setPhase] = useState('intro');
  const [last, setLast] = useState(null);
  const finishing = useRef(false);

  const onFinish = useCallback(async (passed, score) => {
    if (finishing.current) return;
    finishing.current = true;
    setLast({ passed, score });
    setPhase('after');
    await saveAttempt(sid, lesson.id, uid, attempts + 1, passed, score);
  }, [sid, lesson.id, uid, attempts]);

  const start = () => { finishing.current = false; setPhase('play'); };
  const passed = result?.passed;
  const outOfTries = !passed && attempts >= MAX_ATTEMPTS;

  if (phase === 'play') {
    const G = game.C;
    return (
      <main className="lesson">
        <h2>{cls.icon} {game.title}</h2>
        <G key={attempts} diff={lesson.diff} onFinish={onFinish} />
      </main>
    );
  }

  return (
    <main className="lesson ceremony">
      <p className="ceremony-icon" aria-hidden="true">{passed ? '🎓' : outOfTries ? '😬' : cls.icon}</p>
      <h1>{cls.name}</h1>
      <p className="muted">{cls.professor} teaches <strong>{lesson.lessonName}</strong></p>

      {passed ? (
        <>
          <p className="ceremony-q">You mastered {lesson.lessonName}!</p>
          {last?.score && <p className="muted">{last.score}</p>}
          <button className="btn gold big" onClick={onLeave}>Back to my sheet</button>
        </>
      ) : outOfTries ? (
        <>
          <p className="ceremony-q">Not today. You’ll have to manage without {lesson.lessonName}.</p>
          {last?.score && <p className="muted">{last.score}</p>}
          <button className="btn big" onClick={onLeave}>Back to my sheet</button>
        </>
      ) : phase === 'after' && last && !last.passed ? (
        <>
          <p className="ceremony-q">So close. {last.score}.</p>
          <p className="muted">One more try.</p>
          <button className="btn gold big" onClick={start}>Last attempt</button>
        </>
      ) : phase === 'after' ? (
        <p className="ceremony-q">Checking with {cls.professor}…</p>
      ) : (
        <>
          <p className="mg-title">{game.title} <span className="tag">{DIFF[lesson.diff]}</span></p>
          <p className="mg-rules">{game.rules}</p>
          <button className="btn gold big" onClick={start}>
            {attempts === 0 ? 'Start (attempt 1 of 2)' : 'Start (last attempt)'}
          </button>
        </>
      )}
    </main>
  );
}

function status(r) {
  if (!r) return ['playing', 'Playing…'];
  if (r.passed) return ['passed', `Passed${r.score ? `: ${r.score}` : ''}`];
  if (r.attempts >= MAX_ATTEMPTS) return ['failed', 'Failed twice'];
  return ['retry', 'Failed once, retrying'];
}

// TV and GM: who's passed, who's struggling.
export function LessonBoard({ lesson, cls, results, nameOf, big = false }) {
  return (
    <div className={`lesson-board ${big ? 'big' : ''}`}>
      <p className="ceremony-icon" aria-hidden="true">{cls.icon}</p>
      <h2>{cls.name}</h2>
      <p className="muted">{cls.professor}: {lesson.lessonName}. {GAMES[lesson.game]?.title}</p>
      <ul>
        {lesson.uids.map((u) => {
          const [k, text] = status(results[u]);
          return <li key={u} className={`st-${k}`}><strong>{nameOf(u)}</strong><span>{text}</span></li>;
        })}
      </ul>
    </div>
  );
}
