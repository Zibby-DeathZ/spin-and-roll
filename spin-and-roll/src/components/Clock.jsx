import { useState } from 'react';
import {
  clockInfo, holdClass, lessonName, moveClock, sceneBudget, setScenes, taughtKey, turnBackTime,
} from '../lib/game';
import { endLesson, startLesson } from '../lib/lessons';
import { LessonBoard } from '../minigames';
import GMWorld from './GMWorld';

// ---------- GM: the clock, today's class, and the story beat ----------
export function GMClock({ sid, data, session, clk, chars, lessonResults }) {
  const info = clockInfo(data, clk);
  const uids = session.playerUids.filter((u) => chars[u]);
  const allowed = uids.filter((u) => !chars[u].expelled);
  const [present, setPresent] = useState(null); // null = everyone
  const [busy, setBusy] = useState(false);
  const attending = present ?? allowed;
  const lesson = info.slot?.lesson;
  const taught = !!session.state?.taught?.[taughtKey(info)];
  const beat = data.beats?.[info.key];
  const turnerUsed = !!session.state?.timeTurnerUsed;
  const active = session.state?.lesson;
  const nameOf = (u) => chars[u]?.firstName ?? chars[u]?.name ?? 'Someone';

  const go = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const toggle = (u) => setPresent(attending.includes(u) ? attending.filter((x) => x !== u) : [...attending, u]);

  return (
    <section className="gm-clock">
      <div className="clock-row">
        <div>
          <p className="clock-label">{info.label}</p>
          {info.cls && (
            <p className="muted">
              {info.cls.icon} {info.cls.name} with {info.cls.professor}
              {info.cls.room && `, in the ${data.locations?.find((l) => l.id === info.cls.room)?.name ?? info.cls.room}`}
            </p>
          )}
          {info.slot?.note && <p className="muted">{info.slot.note}</p>}
        </div>
        <div className="actions">
          <button className="btn small ghost" disabled={busy} onClick={() => go(() => moveClock(sid, data, clk, -1))}>◀ Back</button>
          <button className="btn small gold" disabled={busy || info.last} onClick={() => { setPresent(null); go(() => moveClock(sid, data, clk, 1)); }}>
            Advance time ▶
          </button>
        </div>
      </div>

      <SceneControl sid={sid} data={data} clk={clk} scenes={session.state?.scenes} />
      {beat && <p className="beat"><strong>Story beat:</strong> {beat}</p>}
      {data.routines && <GMWorld sid={sid} data={data} session={session} chars={chars} />}
      {info.last && (
        <p className="beat danger">
          This is the final block. If the party hasn’t stopped Vale, record the loss from the dashboard.
        </p>
      )}

      {active && (
        <div className="class-box">
          <LessonBoard lesson={active} cls={data.classes[active.cls]} results={lessonResults} nameOf={nameOf} />
          <button className="btn small gold" onClick={() => go(() => endLesson(sid, active))}>End class</button>
        </div>
      )}

      {lesson && !active && (
        <div className="class-box">
          <p>
            Teaches <strong>{lessonName(data, lesson)}</strong> (+{data.clock.xpPerClass} XP).
            Tick who’s in class:
          </p>
          <div className="attend">
            {uids.map((u) => (
              <label key={u} className={attending.includes(u) ? 'on' : ''}>
                <input type="checkbox" checked={attending.includes(u)} onChange={() => toggle(u)} />
                {chars[u].firstName ?? chars[u].name}
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="btn small gold" disabled={busy || taught || !attending.length || !info.cls?.game}
              onClick={() => go(() => startLesson(sid, data, clk, attending, session, chars))}>
              {taught ? 'Class finished' : '🎮 Start class minigame'}
            </button>
            {!taught && (
              <button className="btn small ghost" disabled={busy || !attending.length}
                onClick={() => go(() => holdClass(sid, data, clk, attending))}>
                Teach without a minigame
              </button>
            )}
          </div>
        </div>
      )}

      <div className="turner">
        <button className="btn small" disabled={busy || turnerUsed || clk.day === 0}
          onClick={() => {
            if (confirm('Use the Time-Turner? Everyone returns to Day 1 morning, keeping XP, spells and items. It can only happen once.')) {
              go(() => turnBackTime(sid, clk, data));
            }
          }}>
          ⌛ {turnerUsed ? 'Time-Turner broken' : 'Use the Time-Turner'}
        </button>
      </div>
    </section>
  );
}

// ---------- GM: the scene counter (how much the players can still do this block) ----------
function SceneControl({ sid, data, clk, scenes }) {
  if (!data.clock?.scenes) return null;
  if (!scenes) {
    const def = sceneBudget(data, clk);
    return (
      <p className="scene-ctl muted small">
        No scene counter this block.{' '}
        <button className="linkish" onClick={() => setScenes(sid, def ?? { left: 2, total: 2 })}>Add one</button>
      </p>
    );
  }
  const { left, total } = scenes;
  return (
    <div className={`scene-ctl${left === 0 ? ' out' : ''}`}>
      <span className="scene-label">Time left this block</span>
      <Pips left={left} total={total} />
      <button className="btn small gold" disabled={left === 0} onClick={() => setScenes(sid, { left: left - 1, total })}>✓ Scene done</button>
      <button className="btn small ghost" disabled={left >= total} onClick={() => setScenes(sid, { left: left + 1, total })}>Undo</button>
      <button className="btn small ghost" title="Give them more time this block" onClick={() => setScenes(sid, { left: left + 1, total: total + 1 })}>+1</button>
      <button className="linkish small" onClick={() => setScenes(sid, null)}>Hide</button>
      {left === 1 && <span className="small warn">Warn them: “One more thing before the bell.”</span>}
      {left === 0 && <span className="small warn">Out of time. Press Advance time when you’re ready.</span>}
    </div>
  );
}

function Pips({ left, total }) {
  return (
    <span className="scene-pips" aria-label={`${left} of ${total} left`}>
      {Array.from({ length: total }, (_, i) => <i key={i} className={i < left ? 'on' : ''} />)}
    </span>
  );
}

// ---------- TV and phone: where we are in the week ----------
export function ClockChip({ data, clk, scenes = null }) {
  const info = clockInfo(data, clk);
  if (!info) return null;
  return (
    <p className="clock-chip">
      🕰️ {info.label}
      {info.cls && <span>, {info.cls.icon} {info.cls.name}</span>}
      {scenes && (
        <span className={`chip-scenes${scenes.left === 0 ? ' out' : ''}`}>
          <Pips left={scenes.left} total={scenes.total} />
          {scenes.left === 0 ? 'The bell is ringing' : scenes.left === 1 ? 'Time for one more thing' : `Time for ${scenes.left} things`}
        </span>
      )}
    </p>
  );
}

export function Timetable({ data, clk }) {
  const days = Array.from({ length: data.clock.days }, (_, i) => i + 1);
  const cols = data.clock.blocks.filter((b) => days.some((d) => data.timetable[d]?.[b]));
  const cell = (slot) => {
    if (!slot) return '—';
    if (slot.note) return <span className="muted">{slot.note.split(':')[0]}</span>;
    const cls = data.classes[slot.class];
    return <>{cls.icon} {cls.name}</>;
  };
  return (
    <details className="timetable">
      <summary>This week’s timetable</summary>
      <table>
        <thead><tr><th>Day</th>{cols.map((b) => <th key={b}>{b}</th>)}</tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d} className={d === clk.day ? 'today' : ''}>
              <td>{d}</td>
              {cols.map((b) => <td key={b}>{cell(data.timetable[d]?.[b])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Miss a class and you miss what it teaches. Lunch, free time and curfew are yours to explore. A new morning restores HP and mana.</p>
    </details>
  );
}
