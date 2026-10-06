import { useState } from 'react';
import { applyWorld, lastChance, missedOffers, npcLocAt, offersNow, owlMissedQuests, setAutoOwls, setAutoWorld, slotKey, talkNow } from '../lib/schedule';
import { giveQuest, pinClue } from '../lib/world';

// What a person can say today, with one-click clue pins and quest offers.
export function Conversation({ sid, data, session, chars, npcId, name }) {
  const clk = session.state?.clock ?? { day: 0, block: 0 };
  const t = talkNow(data, npcId, clk);
  const pinned = session.state?.board?.pinned ?? {};
  const quests = session.state?.quests ?? {};
  const players = (session.playerUids || []).filter((u) => chars[u]);
  if (!t) return <p className="muted small">No conversation written for {name ?? npcId} yet.</p>;
  return (
    <div className="talk">
      <p className="talk-voice"><strong>Voice:</strong> {t.voice}</p>
      <p className="talk-voice"><strong>Wants:</strong> {t.wants}</p>
      {!t.topics.length && <p className="muted small">Nothing new to say today.</p>}
      <ul className="talk-topics">
        {t.topics.map((x) => {
          const clue = x.clue && data.clues?.find((c) => c.id === x.clue);
          const quest = x.quest && data.quests.find((q) => q.id === x.quest);
          return (
            <li key={x.q}>
              <p className="talk-q">“{x.q}”</p>
              <p className="talk-a">{x.a}</p>
              {x.note && <p className="talk-note">GM: {x.note}</p>}
              {(clue || quest) && (
                <div className="actions">
                  {clue && (pinned[clue.id]
                    ? <span className="tag">📌 Clue pinned</span>
                    : <button className="btn small" onClick={() => pinClue(sid, clue.id, clue.points)}>📌 Pin clue: {clue.text.slice(0, 40)}…</button>)}
                  {quest && (quests[quest.id]
                    ? <span className="tag">📜 {quest.title} given</span>
                    : <button className="btn small gold" disabled={!players.length} onClick={() => giveQuest(sid, data, quest.id, players)}>📜 Give “{quest.title}”</button>)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// The Day & class tab: who is where this block, quests on offer, and the autopilot switch.
export default function GMWorld({ sid, data, session, chars }) {
  const clk = session.state?.clock ?? { day: 0, block: 0, dawn: 0 };
  const auto = session.state?.autoWorld !== false;
  const autoOwls = session.state?.autoOwls !== false;
  const missed = missedOffers(data, session);
  const owled = Object.entries(session.state?.questOwls ?? {});
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const offers = offersNow(data, session);
  const players = (session.playerUids || []).filter((u) => chars[u]);
  const locName = (id) => data.locations.find((l) => l.id === id)?.name ?? id;
  const byLoc = {};
  for (const id of Object.keys(data.routines ?? {})) {
    const loc = npcLocAt(data, id, clk);
    if (loc) (byLoc[loc] ??= []).push(id);
  }
  const sch = data.schedule?.[slotKey(data, clk)];

  return (
    <section className="gm-world">
      <div className="party-head">
        <h3>🏰 The castle this block</h3>
        <span className="actions">
          <label className="announce">
            <input type="checkbox" checked={auto} onChange={(e) => setAutoWorld(sid, e.target.checked)} />
            Move everyone automatically when time advances
          </label>
          <label className="announce">
            <input type="checkbox" checked={autoOwls} onChange={(e) => setAutoOwls(sid, e.target.checked)} />
            Send missed quests by owl
          </label>
          <button className="btn small ghost" disabled={busy}
            onClick={async () => { setBusy(true); try { await applyWorld(sid, data, clk); } finally { setBusy(false); } }}>
            ↻ Put everyone in place now
          </button>
        </span>
      </div>

      {offers.length > 0 && (
        <div className="world-offers">
          <p className="muted small">Quests on offer right now:</p>
          {offers.map((o) => (
            <div key={o.quest} className="offer-row">
              <span>{o.q.icon} <strong>{o.q.title}</strong>{o.q.hidden ? ' (secret)' : ''}
                {lastChance(data, session, o) && <em className="last-chance">{o.owl ? ' Last chance: arrives by owl next block' : ' Last chance'}</em>}
              </span>
              <span className="muted small">
                {o.npc ? `from ${data.bestiary[o.npc]?.name}, ${npcLocAt(data, o.npc, clk) ? `now at ${locName(npcLocAt(data, o.npc, clk))}` : 'not around this block'}` : o.when}
              </span>
              <button className="btn small gold" disabled={!players.length} onClick={() => giveQuest(sid, data, o.quest, players)}>Give to everyone</button>
            </div>
          ))}
          <p className="muted small">Or give a quest to only some students on the Quests tab.</p>
        </div>
      )}

      {missed.length > 0 && (
        <div className="world-offers missed">
          <p className="muted small">
            Missed: {missed.map((o) => data.quests.find((q) => q.id === o.quest)?.title).join(', ')}.
            {autoOwls ? ' They go out by owl when you next advance time.' : ''}
          </p>
          <button className="btn small" disabled={busy}
            onClick={async () => { setBusy(true); try { await owlMissedQuests(sid, data, { force: true }); } finally { setBusy(false); } }}>
            🦉 Send them by owl now
          </button>
        </div>
      )}
      {owled.length > 0 && (
        <p className="muted small">
          🦉 Arrived by owl: {owled.map(([qid, uids]) => `${data.quests.find((q) => q.id === qid)?.title} (to ${uids.length === players.length ? 'everyone' : uids.map((u) => chars[u]?.firstName ?? chars[u]?.name ?? '?').join(', ')})`).join('; ')}.
        </p>
      )}

      {sch?.spawn?.length > 0 && (
        <p className="muted small">
          Appeared this block: {sch.spawn.map((x) => `${x.type === 'item' ? data.items[x.item]?.name : x.type === 'chest' ? data.chests[x.chest]?.name : x.type === 'hazard' ? data.hazards[x.hazard]?.name : x.type === 'mimic' ? data.mimics[x.mimic]?.name + ' (disguised)' : x.type === 'npc' ? x.name : data.bestiary[x.kind]?.name} (${locName(x.loc)})`).join(', ')}.
        </p>
      )}

      <div className="world-grid">
        {Object.entries(byLoc).sort((a, b) => locName(a[0]).localeCompare(locName(b[0]))).map(([loc, ids]) => (
          <div key={loc} className="world-loc">
            <p className="world-loc-name">{data.locations.find((l) => l.id === loc)?.icon} {locName(loc)}</p>
            {ids.map((id) => (
              <button key={id} className={`world-npc ${open === id ? 'on' : ''}`} onClick={() => setOpen(open === id ? null : id)}>
                {data.bestiary[id]?.icon} {data.bestiary[id]?.name}
                {offers.some((o) => o.npc === id) && <span title="Has a quest"> 📜</span>}
              </button>
            ))}
          </div>
        ))}
        {!Object.keys(byLoc).length && <p className="muted small">Nobody is scheduled anywhere this block.</p>}
      </div>

      {open && (
        <div className="world-talk">
          <div className="party-head">
            <h3>💬 {data.bestiary[open]?.name}</h3>
            <button className="btn small ghost" onClick={() => setOpen(null)}>Close</button>
          </div>
          <Conversation sid={sid} data={data} session={session} chars={chars} npcId={open} />
        </div>
      )}
    </section>
  );
}
