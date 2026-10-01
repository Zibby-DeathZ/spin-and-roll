import { useState } from 'react';
import { completeQuest, failQuest, giveQuest, rewardText, toggleObjective } from '../lib/world';

export default function GMQuests({ sid, data, session, chars }) {
  const qs = session.state?.quests ?? {};
  const players = session.playerUids.filter((u) => chars[u]);
  const [picks, setPicks] = useState({}); // qid -> uids
  const [open, setOpen] = useState(false);
  const name = (u) => chars[u]?.firstName ?? chars[u]?.name ?? '?';
  const active = data.quests.filter((q) => qs[q.id]?.status === 'active');
  const available = data.quests.filter((q) => !qs[q.id] && !q.hidden);
  const hidden = data.quests.filter((q) => !qs[q.id] && q.hidden);
  const [openHidden, setOpenHidden] = useState(false);
  const finished = data.quests.filter((q) => ['done', 'failed'].includes(qs[q.id]?.status));

  return (
    <section className="gm-quests">
      <h2>📜 Quests</h2>
      {!active.length && <p className="muted small">No active quests. Hand one out below.</p>}
      {active.map((q) => {
        const s = qs[q.id];
        return (
          <div key={q.id} className="quest-card">
            <div className="party-head">
              <strong>{q.icon} {q.title}{q.main ? ' (main)' : ''}</strong>
              <span className="muted small">{s.uids.map(name).join(', ')}</span>
            </div>
            <ul className="objectives">
              {q.objectives.map((o, i) => (
                <li key={o}>
                  <label><input type="checkbox" checked={s.done.includes(i)} onChange={() => toggleObjective(sid, q.id, s, i)} /> {o}</label>
                </li>
              ))}
            </ul>
            <div className="actions">
              <button className="btn small teal" onClick={() => completeQuest(sid, data, q.id, s, chars)}>
                Complete: {rewardText(data, q.reward)}
              </button>
              {q.manual && <span className="small warn">Then award by hand: {q.manual}</span>}
              <button className="btn small ghost" onClick={() => confirm(`Mark "${q.title}" as failed?`) && failQuest(sid, q.id)}>Failed</button>
            </div>
          </div>
        );
      })}

      <button className="linkish" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide quests to give' : `Give a quest (${available.length} available)`}
      </button>
      {open && available.map((q) => {
        const uids = picks[q.id] ?? players;
        return (
          <div key={q.id} className="quest-card dim">
            <strong>{q.icon} {q.title}</strong> <span className="muted small">from {q.giver}. Reward: {rewardText(data, q.reward)}</span>
            <p className="small">{q.desc}</p>
            <div className="movers">
              {players.map((u) => (
                <label key={u} className={uids.includes(u) ? 'on' : ''}>
                  <input type="checkbox" checked={uids.includes(u)}
                    onChange={() => setPicks({ ...picks, [q.id]: uids.includes(u) ? uids.filter((x) => x !== u) : [...uids, u] })} />
                  {name(u)}
                </label>
              ))}
              <button className="btn small gold" disabled={!uids.length} onClick={() => giveQuest(sid, data, q.id, uids)}>Give quest</button>
            </div>
          </div>
        );
      })}
      <button className="linkish" onClick={() => setOpenHidden(!openHidden)} aria-expanded={openHidden}>
        {openHidden ? 'Hide secret quests' : `🔒 Secret quests (${hidden.length}). Players can’t see these until you give them`}
      </button>
      {openHidden && hidden.map((q) => {
        const uids = picks[q.id] ?? players;
        return (
          <div key={q.id} className="quest-card dim secret-q">
            <strong>🔒 {q.icon} {q.title}</strong> <span className="muted small">from {q.giver}</span>
            <p className="small">{q.desc}</p>
            <ul className="objectives small">{q.objectives.map((o) => <li key={o}>○ {o}</li>)}</ul>
            <p className="small">Reward: {rewardText(data, q.reward)}{q.manual ? `. Plus, by hand: ${q.manual}` : ''}</p>
            <div className="movers">
              {players.map((u) => (
                <label key={u} className={uids.includes(u) ? 'on' : ''}>
                  <input type="checkbox" checked={uids.includes(u)}
                    onChange={() => setPicks({ ...picks, [q.id]: uids.includes(u) ? uids.filter((x) => x !== u) : [...uids, u] })} />
                  {name(u)}
                </label>
              ))}
              <button className="btn small gold" disabled={!uids.length} onClick={() => giveQuest(sid, data, q.id, uids)}>Reveal to them</button>
            </div>
          </div>
        );
      })}
      {finished.length > 0 && (
        <p className="muted small">Finished: {finished.map((q) => `${q.title} (${qs[q.id].status})`).join(', ')}</p>
      )}
    </section>
  );
}
