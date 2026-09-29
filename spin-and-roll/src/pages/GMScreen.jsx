import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCampaign, getCampaignData } from '../campaigns';
import { useProfiles, useSession } from '../lib/sessions';
import {
  adjust, assignWand, awardPoints, clockOf, createCharacter, defenceOf, describe, giveItem, levelFor, openVault,
  setField, setShopOpen, setStat, startQuiz, STATS, useAnswers, useCharacters, useEvents, useGameEngine,
} from '../lib/game';
import { Splash } from '../components/Gate';
import Bar from '../components/Bar';
import StatusPill from '../components/StatusPill';
import EventToasts from '../components/EventToasts';
import { GMQuiz, HouseBoard } from '../components/Ceremony';
import { ClockChip, GMClock } from '../components/Clock';
import { GMSpin } from '../components/SpinWheel';
import GMTable from '../components/GMTable';
import Portrait from '../components/Portrait';
import GMQuests from '../components/GMQuests';
import { useLessonEngine } from '../lib/lessons';
import { setExpelled, teachForbidden } from '../lib/combat';

function Buttons({ sid, uid, field, steps }) {
  return (
    <span className="nudges">
      {steps.map((n) => (
        <button key={n} className={`nudge ${n < 0 ? 'neg' : 'pos'}`} onClick={() => adjust(sid, uid, field, n)}>
          {n > 0 ? `+${n}` : n}
        </button>
      ))}
    </span>
  );
}

function NewCharacter({ sid, uid, profile, data }) {
  const [name, setName] = useState(profile?.displayName ?? '');
  if (data.families) {
    return (
      <div className="gm-card empty">
        <p><strong>{profile?.displayName ?? 'Player'}</strong> is choosing a family on their phone.</p>
      </div>
    );
  }
  return (
    <div className="gm-card empty">
      <p><strong>{profile?.displayName ?? 'Player'}</strong> has no character yet.</p>
      <div className="join">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" aria-label="Character name" />
        <button className="btn gold" disabled={!name.trim()} onClick={() => createCharacter(sid, uid, data, name.trim())}>
          Create
        </button>
      </div>
    </div>
  );
}

function Ollivander({ sid, c, data }) {
  const [wood, setWood] = useState(data.wandWoods[0].id);
  const [core, setCore] = useState(data.wandCores[0].id);
  return (
    <div className="gm-give">
      <select value={wood} onChange={(e) => setWood(e.target.value)} aria-label="Wand wood">
        {data.wandWoods.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <select value={core} onChange={(e) => setCore(e.target.value)} aria-label="Wand core">
        {data.wandCores.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <button className="btn small gold" onClick={() => assignWand(sid, c.uid, data, wood, core)}>
        {c.equipment?.wand ? 'Swap wand' : `Give wand (${data.wandPrice} 🪙)`}
      </button>
    </div>
  );
}

function CharacterControls({ sid, c, data, playerName, quizBusy, forbiddenLearner }) {
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState(Object.keys(data.items)[0] ?? '');
  const give = () => {
    const base = data.items[itemId];
    if (base) giveItem(sid, c.uid, { id: itemId, ...base }, 1);
  };

  return (
    <div className="gm-card">
      <div className="party-head">
        <div>
          <Portrait family={c.family} name={c.name} className="card-portrait" />
          <strong className="gm-name">{c.name}</strong>
          <span className="muted small"> {playerName}, level {levelFor(c.xp)}, Defence {defenceOf(c)}</span>
          {c.hp <= 0 && <span className="tag tag-warn">Knocked out</span>}
          {c.expelled && <span className="tag tag-warn">Expelled</span>}
          {forbiddenLearner === c.uid && <span className="tag tag-green">Knows the Killing Curse</span>}
        </div>
        {data.houses.length > 0 && (
          <select value={c.house} onChange={(e) => setField(sid, c.uid, 'house', e.target.value)} aria-label="House">
            {data.houses.map((h) => <option key={h}>{h}</option>)}
          </select>
        )}
      </div>

      <div className="gm-row"><Bar label="HP" value={c.hp} max={c.maxHp} tone="ember" /><Buttons sid={sid} uid={c.uid} field="hp" steps={[-5, -1, 1, 5]} /></div>
      <div className="gm-row"><Bar label="Mana" value={c.mana} max={c.maxMana} tone="violet" /><Buttons sid={sid} uid={c.uid} field="mana" steps={[-3, -1, 1, 3]} /></div>
      <div className="gm-row"><span className="gm-label">XP {c.xp}</span><Buttons sid={sid} uid={c.uid} field="xp" steps={[10, 25, 50]} /></div>
      <div className="gm-row"><span className="gm-label">{data.currency.icon} {c.gold}</span><Buttons sid={sid} uid={c.uid} field="gold" steps={[-5, 5, 10, 50]} /></div>

      {data.quizzes && (
        <div className="actions ceremony-btns">
          <button className="btn small" disabled={quizBusy} onClick={() => startQuiz(sid, 'sorting', c.uid)}>
            🎩 {c.house === 'Unsorted' ? 'Sorting Hat' : 'Re-sort'}
          </button>
          <button className="btn small" disabled={quizBusy} onClick={() => startQuiz(sid, 'wand', c.uid)}>
            🪄 Wand questions
          </button>
        </div>
      )}
      {data.quizzes && c.house && c.house !== 'Unsorted' && (
        <div className="gm-row">
          <span className="gm-label">⏳ {c.house}</span>
          <span className="nudges">
            {[-10, -5, 5, 10].map((n) => (
              <button key={n} className={`nudge ${n < 0 ? 'neg' : 'pos'}`} onClick={() => awardPoints(sid, c.uid, c.house, n)}>
                {n > 0 ? `+${n}` : n}
              </button>
            ))}
          </span>
        </div>
      )}
      {data.families && !c.vaultOpened && (
        <button className="btn small gold vault-btn" onClick={() => openVault(sid, c.uid, data)}>
          🏦 Open the {c.familyName} vault
        </button>
      )}
      {data.wandWoods && <Ollivander sid={sid} c={c} data={data} />}
      {c.equipment && Object.keys(c.equipment).length > 0 && (
        <p className="muted small gm-eq">
          {Object.values(c.equipment).map((e) => `${e.icon} ${e.name}`).join('   ')}
        </p>
      )}

      <div className="gm-give">
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} aria-label="Item to give">
          {Object.entries(data.items).map(([id, i]) => <option key={id} value={id}>{i.icon} {i.name}</option>)}
        </select>
        <button className="btn small teal" onClick={give} disabled={!itemId}>Give item</button>
      </div>

      <button className="linkish" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide stats and limits' : 'Edit stats and limits'}
      </button>
      {open && data.spells?.['avada-kedavra'] && (
        <div className="actions secret-actions">
          {!forbiddenLearner && (
            <button className="btn small" onClick={() => {
              if (confirm(`Teach ${c.name} the Killing Curse? Only one character can ever learn it. Nothing is shown on the TV.`)) teachForbidden(sid, data, c.uid);
            }}>💚 Teach the Killing Curse (secret)</button>
          )}
          <button className="btn small ghost" onClick={() => setExpelled(sid, c.uid, !c.expelled)}>
            {c.expelled ? 'Reinstate at Hogwarts' : 'Expel'}
          </button>
        </div>
      )}
      {open && (
        <div className="gm-stats">
          {STATS.map(([k, label]) => (
            <label key={k}>
              {label}
              <input type="number" min="1" max="20" value={c.stats[k]}
                onChange={(e) => setStat(sid, c.uid, k, Number(e.target.value))} />
            </label>
          ))}
          <label>Max HP
            <input type="number" min="1" value={c.maxHp} onChange={(e) => setField(sid, c.uid, 'maxHp', Math.max(1, Number(e.target.value)))} />
          </label>
          <label>Max mana
            <input type="number" min="0" value={c.maxMana} onChange={(e) => setField(sid, c.uid, 'maxMana', Math.max(0, Number(e.target.value)))} />
          </label>
        </div>
      )}
    </div>
  );
}

function Feed({ sid, nameOf }) {
  const events = useEvents(sid, 15);
  return (
    <ul className="feed">
      {events.map((e) => {
        const d = describe(e, nameOf);
        return d && <li key={e.id} className={`tone-${d.tone}`}><span>{d.icon}</span> {d.text}</li>;
      })}
      {!events.length && <li className="muted">Actions from players and from you appear here.</li>}
    </ul>
  );
}

const TABS = [
  ['table', '🗺️ Table'], ['day', '🕰️ Day & class'], ['quests', '📜 Quests'], ['players', '🧑‍🎓 Players'], ['wheels', '🎡 Wheels'],
];

export default function GMScreen() {
  const { sid } = useParams();
  const session = useSession(sid);
  const chars = useCharacters(sid);
  const profiles = useProfiles(session?.playerUids ?? []);
  const answers = useAnswers(sid);
  const data = session ? getCampaignData(session.campaignId) : null;
  useGameEngine(sid, data); // carries out claims, purchases, trades and item uses while open
  const lessonResults = useLessonEngine(sid, data, session?.state?.lesson);
  const [tab, setTab] = useState('table');
  const [feedOpen, setFeedOpen] = useState(false);
  const nameOf = useCallback(
    (u) => chars?.[u]?.name ?? profiles[u]?.displayName ?? 'Someone', [chars, profiles]);

  if (session === undefined || chars === null) return <Splash />;
  if (!session) return <main className="login"><h1>Game not found</h1><Link className="btn" to="/">Back</Link></main>;

  const shopOpen = !!session.state?.shopOpen;
  const quizState = session.state?.quiz;
  const enc = session.state?.encounter;
  const lesson = session.state?.lesson;
  const tabs = TABS.filter(([id]) => (id === 'day' ? data.clock : id === 'quests' ? data.quests : id === 'wheels' ? data.wheels : id === 'table' ? data.locations : true));
  const active = tabs.some(([id]) => id === tab) ? tab : tabs[0][0];

  return (
    <div className="gm">
      <header className="gm-top">
        <div className="gm-title">
          <h1>{getCampaign(session.campaignId)?.title}</h1>
          {data.clock && <ClockChip data={data} clk={clockOf(session)} />}
        </div>
        <div className="gm-top-right">
          {data.quizzes && <HouseBoard points={session.state?.housePoints} compact />}
          {data.shops && (
            <button className={`btn small ${shopOpen ? 'ember' : ''}`} onClick={() => setShopOpen(sid, !shopOpen)}>
              {shopOpen ? '🛍️ Close shops' : '🛍️ Open shops'}
            </button>
          )}
          <StatusPill status={session.status} />
          <strong className="code">{session.code}</strong>
          <button className="btn small ghost" onClick={() => setFeedOpen(!feedOpen)} aria-expanded={feedOpen}>📰 Feed</button>
        </div>
      </header>

      <nav className="gm-tabs" aria-label="GM sections">
        {tabs.map(([id, label]) => (
          <button key={id} className={active === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
            {id === 'table' && enc && <span className="gm-dot ember" aria-label="fight in progress" />}
            {id === 'day' && lesson && <span className="gm-dot gold" aria-label="class in progress" />}
          </button>
        ))}
      </nav>

      {quizState && data.quizzes?.[quizState.id] && (
        <GMQuiz sid={sid} quizState={quizState} data={data} chars={chars} answers={answers} />
      )}

      <div className={`gm-body ${feedOpen ? 'with-feed' : ''}`}>
        <main className="gm-main">
          {active === 'table' && <GMTable sid={sid} data={data} session={session} chars={chars} />}
          {active === 'day' && <GMClock sid={sid} data={data} session={session} clk={clockOf(session)} chars={chars} lessonResults={lessonResults} />}
          {active === 'quests' && <GMQuests sid={sid} data={data} session={session} chars={chars} />}
          {active === 'wheels' && <GMSpin sid={sid} data={data} session={session} chars={chars} />}
          {active === 'players' && (
            <section className="gm-players">
              {session.playerUids.map((u) => chars[u]
                ? <CharacterControls key={u} sid={sid} c={chars[u]} data={data} playerName={profiles[u]?.displayName} quizBusy={!!quizState} forbiddenLearner={session.state?.forbiddenLearner} />
                : <NewCharacter key={u} sid={sid} uid={u} profile={profiles[u]} data={data} />)}
              {!session.playerUids.length && <p className="muted">Players appear here once they join with the code.</p>}
            </section>
          )}
        </main>
        {feedOpen && (
          <aside className="gm-feed">
            <h2>Table feed</h2>
            <Feed sid={sid} nameOf={nameOf} />
          </aside>
        )}
      </div>
      <p className="gm-foot muted small">Keep this screen open during play. It carries out trades, purchases and attacks.</p>
      <EventToasts sid={sid} nameOf={nameOf} />
    </div>
  );
}
