import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getCampaign, getCampaignData } from '../campaigns';
import { useSession } from '../lib/sessions';
import {
  bonuses, bonusText, cancelTrade, consumeItem, defenceOf, fmtMod, levelFor, mod, nextLevelAt,
  answerKey, clockOf, offerTrade, respondTrade, statOf, STATS, useAbility, useAnswers, useCharacters, useClaims, useTrades,
} from '../lib/game';
import FamilyPicker from './FamilyPicker';
import Shop from './Shop';
import DiceTab from './DiceTab';
import HereTab from './HereTab';
import { locOf } from '../lib/world';
import Portrait from '../components/Portrait';
import { LessonScreen } from '../minigames';
import { useLessonResults } from '../lib/lessons';
import { HouseBoard, PlayerQuiz } from '../components/Ceremony';
import { ClockChip, Timetable } from '../components/Clock';
import { Splash } from '../components/Gate';
import Bar from '../components/Bar';
import Wheel from '../components/Wheel';
import TradeComposer from '../components/TradeComposer';

function AbilityCard({ sid, c, ability, dawn }) {
  const [used, setUsed] = useState(false);
  const usedToday = c.abilityDawn === dawn;
  const fire = async () => {
    if (!confirm(`Use ${ability.name} now? It's once per day.`)) return;
    setUsed(true);
    await useAbility(sid, c.uid, ability);
    setTimeout(() => setUsed(false), 4000);
  };
  return (
    <section className="ability">
      <h2>{ability.icon} {ability.name}</h2>
      <p><span className="tag">Always</span>{ability.passive}</p>
      <p><span className="tag">Once a day</span>{ability.active}</p>
      <p className="muted small"><span className="tag tag-warn">Drawback</span>{ability.drawback}</p>
      <button className="btn gold" disabled={used || usedToday} onClick={fire}>
        {usedToday ? 'Used today. Recharges after you sleep' : used ? 'Announced on the TV' : `Use ${ability.name}`}
      </button>
    </section>
  );
}

function Sheet({ sid, c, currency, data, points, clk, loc, discovered }) {
  const lvl = levelFor(c.xp);
  const next = nextLevelAt(c.xp);
  const b = bonuses(c);
  const fam = data.families?.find((f) => f.id === c.family);
  return (
    <>
      {data.clock && <ClockChip data={data} clk={clk} />}
      {loc && <p className="loc-chip">📍 {loc.name}</p>}
      <div className="char-head">
        <Portrait family={c.family} name={c.name} className="sheet-portrait" />
        <h1>{c.name}</h1>
        <p className="muted">{c.house ? `${c.house}, ` : ''}level {lvl}{fam ? `, ${fam.blood.toLowerCase()}` : ''}</p>
      </div>
      <Bar label="HP" value={c.hp} max={c.maxHp} tone="ember" />
      <Bar label="Mana" value={c.mana} max={c.maxMana} tone="violet" />
      <Bar label={next ? `XP to level ${lvl + 1}` : 'XP (max level)'} value={c.xp} max={next ?? c.xp} tone="gold" />
      <div className="vitals">
        <span><b>{defenceOf(c)}</b> Defence</span>
        {b.spellPower > 0 && <span><b>+{b.spellPower}</b> Spell damage</span>}
        <span><b>{c.gold}</b> {currency.icon} {currency.name}</span>
      </div>
      <div className="stats">
        {STATS.map(([k, label]) => {
          const v = statOf(c, k);
          const extra = b.stats[k] ?? 0;
          return (
            <div key={k} className={`stat ${extra ? 'buffed' : ''}`}>
              <span className="stat-mod">{fmtMod(mod(v))}</span>
              <span className="stat-score">{v}{extra ? ` (+${extra})` : ''}</span>
              <span className="stat-name">{label}</span>
            </div>
          );
        })}
      </div>
      <p className="muted small">Roll a d20 and add the bonus of the stat the DM asks for. To hit you, enemies must roll your Defence or higher.</p>
      {(c.perks ?? []).length > 0 && (
        <p className="perks">{c.perks.map((p) => <span key={p} className="tag">{p}</span>)}</p>
      )}
      {data.clock && <Timetable data={data} clk={clk} />}
      {data.locations && (
        <details className="timetable">
          <summary>Places you’ve found ({discovered.length})</summary>
          <ul className="places">
            {data.locations.filter((l) => discovered.includes(l.id)).map((l) => (
              <li key={l.id}><strong>{l.icon} {l.name}</strong> <span className="muted small">{l.desc}</span></li>
            ))}
          </ul>
        </details>
      )}
      {c.house && c.house !== 'Unsorted' && points && (
        <section className="sheet-houses">
          <h2>House points</h2>
          <HouseBoard points={points} compact />
        </section>
      )}
      {fam?.ability && <AbilityCard sid={sid} c={c} ability={fam.ability} dawn={clk.dawn} />}
      {fam && (
        <details className="secret">
          <summary>Family secret (only you can see this)</summary>
          <p>{fam.secret}</p>
        </details>
      )}
    </>
  );
}

function Bag({ c, sid, others, onGive }) {
  const [used, setUsed] = useState(null);
  const use = async (item) => {
    setUsed(item.id);
    try { await consumeItem(sid, c.uid, item.id); } finally { setTimeout(() => setUsed(null), 1200); }
  };
  const eq = Object.entries(c.equipment ?? {});
  return (
    <>
      {eq.length > 0 && (
        <>
          <h2>Equipped</h2>
          <ul className="rows">
            {eq.map(([slot, val]) => (
              <li key={slot} className="item-row">
                <span className="item-name">
                  <span className="item-icon">{val.icon}</span>
                  <span>{val.name}<br /><span className="muted small">{bonusText(val.bonus) || val.desc}</span></span>
                </span>
                <span className="muted small cap">{slot}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2>Bag</h2>
      {(c.inventory ?? []).length === 0 && <p className="muted">Your bag is empty.</p>}
      <ul className="rows">
        {(c.inventory ?? []).map((i) => (
          <li key={i.id} className="item-row">
            <span className="item-name">
              <span className="item-icon">{i.icon}</span>
              {i.name} <span className="muted">×{i.qty}</span>
            </span>
            <span className="item-actions">
              {(i.effect || i.note) && (
                <button className="btn small teal" disabled={used === i.id} onClick={() => use(i)}>
                  {used === i.id ? 'Used' : 'Use'}
                </button>
              )}
              {others.length > 0 && <button className="btn small" onClick={() => onGive()}>Give</button>}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Party({ others, onTrade, onGift, placeOf }) {
  if (!others.length) return <p className="muted">No one else has a character yet.</p>;
  return (
    <>
    <h2>Party</h2>
    <ul className="party">
      {others.map((o) => (
        <li key={o.uid} className="party-card">
          <div className="party-head">
            <strong>{o.name}</strong>
            <span className="muted small">{o.house ? `${o.house}, ` : ''}level {levelFor(o.xp)}{placeOf?.(o.uid) ? `. 📍 ${placeOf(o.uid)}` : ''}</span>
          </div>
          <Bar label="HP" value={o.hp} max={o.maxHp} tone="ember" />
          <div className="actions">
            <button className="btn small gold" onClick={() => onTrade(o)}>Trade</button>
            <button className="btn small" onClick={() => onGift(o)}>Give</button>
          </div>
        </li>
      ))}
    </ul>
    </>
  );
}

function summary(side, inv, currency) {
  const parts = side.items.map(({ id, qty }) => {
    const i = inv?.find((x) => x.id === id);
    return `${i?.icon ?? ''} ${i?.name ?? id}${qty > 1 ? ` ×${qty}` : ''}`;
  });
  if (side.gold) parts.push(`${currency.icon} ${side.gold}`);
  return parts.length ? parts.join(', ') : 'nothing';
}

function Trades({ sid, me, chars, trades, currency }) {
  const mine = trades.filter((t) => t.fromUid === me.uid || t.toUid === me.uid);
  const incoming = mine.filter((t) => t.status === 'pending' && t.toUid === me.uid);
  const outgoing = mine.filter((t) => t.status === 'pending' && t.fromUid === me.uid);
  const past = mine.filter((t) => t.status !== 'pending').slice(0, 6);
  const name = (u) => chars[u]?.name ?? 'Someone';
  const LABEL = { accepted: 'Processing…', done: 'Done', declined: 'Declined', cancelled: 'Cancelled', failed: 'Failed' };

  return (
    <>
      <h2>Offers for you</h2>
      {!incoming.length && <p className="muted">No offers right now.</p>}
      {incoming.map((t) => (
        <div key={t.id} className="trade-card">
          <p><strong>{name(t.fromUid)}</strong> gives you {summary(t.offer, chars[t.fromUid]?.inventory, currency)}</p>
          {(t.request.items.length > 0 || t.request.gold > 0) && (
            <p>and wants {summary(t.request, me.inventory, currency)}</p>
          )}
          <div className="actions">
            <button className="btn teal" onClick={() => respondTrade(sid, t, true)}>Accept</button>
            <button className="btn ember" onClick={() => respondTrade(sid, t, false)}>Decline</button>
          </div>
        </div>
      ))}

      {outgoing.length > 0 && <h2>Waiting on others</h2>}
      {outgoing.map((t) => (
        <div key={t.id} className="trade-card">
          <p>Offer to <strong>{name(t.toUid)}</strong>: {summary(t.offer, me.inventory, currency)}</p>
          <button className="btn small ghost" onClick={() => cancelTrade(sid, t)}>Cancel offer</button>
        </div>
      ))}

      {past.length > 0 && <h2>Recent</h2>}
      <ul className="rows">
        {past.map((t) => (
          <li key={t.id}>
            <span>{t.fromUid === me.uid ? `To ${name(t.toUid)}` : `From ${name(t.fromUid)}`}</span>
            <span className="muted">{LABEL[t.status] ?? t.status}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function PlayerScreen() {
  const { sid } = useParams();
  const { user } = useAuth();
  const session = useSession(sid);
  const chars = useCharacters(sid);
  const trades = useTrades(sid);
  const claims = useClaims(sid);
  const answers = useAnswers(sid);
  const lessonResults = useLessonResults(sid, session?.state?.lesson?.id);
  const [leftLesson, setLeftLesson] = useState(null);
  const [tab, setTab] = useState('sheet');
  const [composer, setComposer] = useState(null);

  if (session === undefined || chars === null) return <Splash />;
  if (!session || !session.playerUids.includes(user.uid)) {
    return (
      <main className="login">
        <h1>Game not found</h1>
        <Link className="btn" to="/">Back to dashboard</Link>
      </main>
    );
  }

  const campaign = getCampaign(session.campaignId);
  const data = getCampaignData(session.campaignId);
  const { currency } = data;
  const me = chars[user.uid];
  const shopOpen = !!session.state?.shopOpen;

  if (!me && data.families && session.status !== 'won' && session.status !== 'lost') {
    return <FamilyPicker sid={sid} uid={user.uid} data={data} claims={claims} title={campaign?.title} />;
  }

  if (!me || session.status === 'lobby') {
    return (
      <main className="login">
        <Wheel size={96} />
        <h1>{campaign?.title}</h1>
        <p className="muted">
          {session.status === 'lobby'
            ? 'You’re in. Waiting for the DM to start.'
            : 'The DM is creating your character.'}
        </p>
      </main>
    );
  }

  const q = session.state?.quiz;
  if (q?.uid === user.uid && data.quizzes?.[q.id]) {
    return (
      <PlayerQuiz sid={sid} uid={user.uid} quizId={q.id} quiz={data.quizzes[q.id]}
        answer={answers[answerKey(q.id, user.uid)]} />
    );
  }

  const lesson = session.state?.lesson;
  if (lesson && lesson.uids.includes(user.uid) && leftLesson !== lesson.id && data.classes?.[lesson.cls]) {
    return (
      <LessonScreen sid={sid} uid={user.uid} lesson={lesson} cls={data.classes[lesson.cls]}
        result={lessonResults[user.uid]} onLeave={() => setLeftLesson(lesson.id)} />
    );
  }

  const others = Object.values(chars).filter((c) => c.uid !== user.uid);
  const pending = trades.filter((t) => t.status === 'pending' && t.toUid === user.uid).length;
  const tabs = [['sheet', 'Sheet'], ...(data.locations ? [['here', 'Here']] : []), ['dice', 'Dice'], ['bag', 'Bag'],
    ...(data.shops ? [['shop', 'Shop']] : []), ['party', 'Party']];
  const enc = session.state?.encounter;
  const turnOf = enc?.order?.[enc.turn];

  return (
    <div className="phone">
      {me.expelled && <div className="banner bad">📜 You have been expelled from Hogwarts.</div>}
      {enc && (
        <div className={`banner ${turnOf?.id === me.uid ? 'mine' : ''}`}>
          ⚔️ {turnOf?.id === me.uid ? 'Your turn! Open Dice to attack or cast.' : `Fight! ${turnOf?.name}’s turn.`}
        </div>
      )}
      <main className="phone-body">
        {tab === 'sheet' && <Sheet sid={sid} c={me} currency={currency} data={data} points={session.state?.housePoints ?? {}} clk={clockOf(session)}
          loc={data.locations?.find((l) => l.id === locOf(session, user.uid))}
          discovered={session.state?.map?.discovered ?? []} />}
        {tab === 'here' && <HereTab sid={sid} c={me} data={data} session={session} chars={chars} />}
        {tab === 'dice' && <DiceTab sid={sid} c={me} data={data} session={session} chars={chars} />}
        {tab === 'shop' && <Shop sid={sid} c={me} data={data} open={shopOpen} />}
        {tab === 'bag' && (
          <Bag c={me} sid={sid} others={others}
            onGive={() => setTab('party')} />
        )}
        {tab === 'party' && pending > 0 && <Trades sid={sid} me={me} chars={chars} trades={trades} currency={currency} />}
        {tab === 'party' && (
          <Party others={others} placeOf={(u) => data.locations?.find((l) => l.id === locOf(session, u))?.name}
            onTrade={(o) => setComposer({ them: o, mode: 'trade' })}
            onGift={(o) => setComposer({ them: o, mode: 'gift' })} />
        )}
        {tab === 'party' && pending === 0 && <Trades sid={sid} me={me} chars={chars} trades={trades} currency={currency} />}
      </main>

      <nav className="tabbar" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
            {id === 'party' && pending > 0 && <span className="badge">{pending}</span>}
            {id === 'shop' && shopOpen && <span className="dot" aria-label="open" />}
          </button>
        ))}
      </nav>

      {composer && (
        <TradeComposer
          me={me}
          them={composer.them}
          mode={composer.mode}
          currency={currency}
          onClose={() => setComposer(null)}
          onSend={(offer, request) => offerTrade(sid, me.uid, composer.them.uid, offer, request)}
        />
      )}
    </div>
  );
}
