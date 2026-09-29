import { useState } from 'react';
import {
  answerKey, assignWand, endQuiz, hatVerdict, saveAnswers, scoreQuiz, sortInto, wandVerdict,
} from '../lib/game';

const HOUSES = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

function progress(quiz, answer) {
  const picks = answer?.picks ?? [];
  const needsWish = !!quiz.wish;
  const onWish = picks.length >= quiz.questions.length && needsWish && !answer?.wish;
  const done = picks.length >= quiz.questions.length && (!needsWish || !!answer?.wish);
  return { picks, onWish, done, step: picks.length };
}

// ---------- Phone: the player answers here ----------
export function PlayerQuiz({ sid, uid, quizId, quiz, answer }) {
  const [busy, setBusy] = useState(false);
  const { picks, onWish, done, step } = progress(quiz, answer);

  const pick = async (i) => {
    setBusy(true);
    try { await saveAnswers(sid, uid, quizId, [...picks, i]); } finally { setBusy(false); }
  };
  const wish = async (w) => {
    setBusy(true);
    try { await saveAnswers(sid, uid, quizId, picks, w); } finally { setBusy(false); }
  };

  return (
    <main className="ceremony">
      <p className="ceremony-icon" aria-hidden="true">{quiz.icon}</p>
      <h1>{quiz.title}</h1>
      {done ? (
        <p className="ceremony-q">{quiz.thinking}</p>
      ) : onWish ? (
        <>
          <p className="ceremony-q">{quiz.wish.q}</p>
          <div className="ceremony-options">
            {quiz.wish.options.map((w) => (
              <button key={w} className="btn big" disabled={busy} onClick={() => wish(w)}>{w}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="muted">Question {step + 1} of {quiz.questions.length}</p>
          <p className="ceremony-q">{quiz.questions[step].q}</p>
          <div className="ceremony-options">
            {quiz.questions[step].options.map((o, i) => (
              <button key={o.text} className="btn big" disabled={busy} onClick={() => pick(i)}>{o.text}</button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

// ---------- TV: everyone watches ----------
export function TVQuiz({ quiz, answer, name }) {
  const { onWish, done, step } = progress(quiz, answer);
  const q = onWish ? quiz.wish.q : quiz.questions[step]?.q;
  const opts = onWish ? quiz.wish.options : quiz.questions[step]?.options.map((o) => o.text);
  return (
    <div className="tv-ceremony">
      <p className="ceremony-icon big" aria-hidden="true">{quiz.icon}</p>
      <h1>{name}</h1>
      {done ? <p className="ceremony-q tv">{quiz.thinking}</p> : (
        <>
          {!onWish && <p className="muted">Question {step + 1} of {quiz.questions.length}</p>}
          <p className="ceremony-q tv">{q}</p>
          <ul className="tv-options">{opts?.map((o) => <li key={o}>{o}</li>)}</ul>
        </>
      )}
    </div>
  );
}

// ---------- GM: live answers, the verdict, and the final call ----------
export function GMQuiz({ sid, quizState, data, chars, answers }) {
  const quiz = data.quizzes[quizState.id];
  const c = chars[quizState.uid];
  const answer = answers[answerKey(quizState.id, quizState.uid)];
  const { picks, done } = progress(quiz, answer);
  const isSorting = quizState.id === 'sorting';
  const verdict = isSorting ? hatVerdict(quiz, answer) : wandVerdict(quiz, answer);
  const scores = scoreQuiz(quiz, picks);
  const shown = isSorting ? scores.house : { ...scores.wood, ...scores.core };
  const woodName = (id) => data.wandWoods.find((w) => w.id === id)?.name;
  const coreName = (id) => data.wandCores.find((w) => w.id === id)?.name;

  const giveWand = async () => {
    await assignWand(sid, c.uid, data, verdict.wood, verdict.core);
    await endQuiz(sid);
  };

  return (
    <section className="gm-quiz">
      <div className="party-head">
        <h2>{quiz.icon} {quiz.title}: {c?.name}</h2>
        <button className="btn small ghost" onClick={() => endQuiz(sid)}>Cancel</button>
      </div>
      <ol className="gm-answers">
        {quiz.questions.map((q, i) => (
          <li key={q.q} className={picks[i] === undefined ? 'muted' : ''}>
            {picks[i] === undefined ? 'Waiting…' : q.options[picks[i]].text}
          </li>
        ))}
        {isSorting && <li className={answer?.wish ? '' : 'muted'}>Wish: {answer?.wish ?? 'Waiting…'}</li>}
      </ol>
      <p className="gm-scores">
        {Object.entries(shown).map(([k, v]) => <span key={k}>{woodName(k) ?? coreName(k) ?? k} {v}</span>)}
      </p>

      {isSorting ? (
        <>
          <p>
            {done ? 'The Hat chooses ' : 'Leaning towards '}<strong>{verdict.house ?? '…'}</strong>
            {verdict.listened && ' (it listened to their wish)'}
          </p>
          <div className="actions">
            {HOUSES.map((h) => (
              <button key={h} className={`btn small ${h === verdict.house ? 'gold' : ''}`}
                disabled={!c} onClick={() => sortInto(sid, c.uid, h)}>
                {h}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p>
            {done ? 'The wand that chooses them: ' : 'Leaning towards '}
            <strong>{woodName(verdict.wood) ?? '…'}, {coreName(verdict.core) ?? '…'}</strong>
          </p>
          <button className="btn small gold" disabled={!done || !c} onClick={giveWand}>Give this wand</button>
          <p className="muted small">Or pick a different one with the wand dropdowns on their card.</p>
        </>
      )}
    </section>
  );
}

// ---------- House standings ----------
export function HouseBoard({ points = {}, compact = false }) {
  const rows = HOUSES.map((h) => [h, points[h] ?? 0]).sort((a, b) => b[1] - a[1]);
  return (
    <ul className={`houseboard ${compact ? 'compact' : ''}`}>
      {rows.map(([h, p]) => (
        <li key={h} className={`hb-${h.toLowerCase()}`}>
          <span>{h}</span><strong>{p}</strong>
        </li>
      ))}
    </ul>
  );
}
