import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getCampaign, getCampaignData } from '../campaigns';
import { useSession } from '../lib/sessions';
import {
  cancelTrade, consumeItem, fmtMod, levelFor, mod, nextLevelAt, offerTrade,
  respondTrade, STATS, useCharacters, useTrades,
} from '../lib/game';
import { Splash } from '../components/Gate';
import Bar from '../components/Bar';
import Wheel from '../components/Wheel';
import TradeComposer from '../components/TradeComposer';

function Sheet({ c, currency }) {
  const lvl = levelFor(c.xp);
  const next = nextLevelAt(c.xp);
  return (
    <>
      <div className="char-head">
        <h1>{c.name}</h1>
        <p className="muted">{c.house ? `${c.house}, ` : ''}level {lvl}</p>
      </div>
      <Bar label="HP" value={c.hp} max={c.maxHp} tone="ember" />
      <Bar label="Mana" value={c.mana} max={c.maxMana} tone="violet" />
      <Bar label={next ? `XP to level ${lvl + 1}` : 'XP (max level)'} value={c.xp} max={next ?? c.xp} tone="gold" />
      <p className="gold-line">{currency.icon} {c.gold} {currency.name}</p>
      <div className="stats">
        {STATS.map(([k, label]) => (
          <div key={k} className="stat">
            <span className="stat-mod">{fmtMod(mod(c.stats[k]))}</span>
            <span className="stat-score">{c.stats[k]}</span>
            <span className="stat-name">{label}</span>
          </div>
        ))}
      </div>
      <p className="muted small">Roll a d20 and add the bonus of the stat the DM asks for.</p>
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
              <li key={slot}><span className="muted cap">{slot}</span><span>{val}</span></li>
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

function Party({ others, onTrade, onGift }) {
  if (!others.length) return <p className="muted">No one else has a character yet.</p>;
  return (
    <ul className="party">
      {others.map((o) => (
        <li key={o.uid} className="party-card">
          <div className="party-head">
            <strong>{o.name}</strong>
            <span className="muted small">{o.house ? `${o.house}, ` : ''}level {levelFor(o.xp)}</span>
          </div>
          <Bar label="HP" value={o.hp} max={o.maxHp} tone="ember" />
          <div className="actions">
            <button className="btn small gold" onClick={() => onTrade(o)}>Trade</button>
            <button className="btn small" onClick={() => onGift(o)}>Give</button>
          </div>
        </li>
      ))}
    </ul>
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
  const { currency } = getCampaignData(session.campaignId);
  const me = chars[user.uid];

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

  const others = Object.values(chars).filter((c) => c.uid !== user.uid);
  const pending = trades.filter((t) => t.status === 'pending' && t.toUid === user.uid).length;
  const tabs = [['sheet', 'Character'], ['bag', 'Bag'], ['party', 'Party'], ['trades', 'Trades']];

  return (
    <div className="phone">
      <main className="phone-body">
        {tab === 'sheet' && <Sheet c={me} currency={currency} />}
        {tab === 'bag' && (
          <Bag c={me} sid={sid} others={others}
            onGive={() => setTab('party')} />
        )}
        {tab === 'party' && (
          <Party others={others}
            onTrade={(o) => setComposer({ them: o, mode: 'trade' })}
            onGift={(o) => setComposer({ them: o, mode: 'gift' })} />
        )}
        {tab === 'trades' && <Trades sid={sid} me={me} chars={chars} trades={trades} currency={currency} />}
      </main>

      <nav className="tabbar">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
            {id === 'trades' && pending > 0 && <span className="badge">{pending}</span>}
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
