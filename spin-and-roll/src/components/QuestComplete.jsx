// The quest-complete moment: a scroll unrolls on the TV with the heroes and their rewards,
// and each player who was on the quest gets their own reward scroll on their phone.
import { useEffect, useMemo, useRef, useState } from 'react';
import Art, { itemArt } from './Art';
import { useEvents } from '../lib/game';
import { play } from '../lib/sound';

// One reward token per thing earned, revealed one after another.
function rewardTokens(reward = {}, currency) {
  const out = [];
  if (reward.xp) out.push({ key: 'xp', cls: 'rt-xp', icon: '⭐', big: `+${reward.xp}`, small: 'XP' });
  if (reward.gold) out.push({ key: 'gold', cls: 'rt-gold', icon: currency?.icon ?? '🪙', big: `+${reward.gold}`, small: currency?.name ?? 'Galleons' });
  if (reward.points) out.push({ key: 'pts', cls: 'rt-pts', icon: '⏳', big: `+${reward.points}`, small: 'house points' });
  for (const it of reward.items ?? []) out.push({ key: `i-${it.id}`, cls: 'rt-item', art: itemArt(it.id), icon: it.icon, big: it.name, small: 'item' });
  if (reward.manual) out.push({ key: 'manual', cls: 'rt-item', icon: '🎁', big: reward.manual, small: 'from the DM', wide: true });
  return out;
}

function Tokens({ reward, currency, base = 2.2 }) {
  const toks = rewardTokens(reward, currency);
  if (!toks.length) return <p className="qc-none">The thanks of the castle, and the story to tell.</p>;
  return (
    <div className="qc-rewards">
      {toks.map((t, i) => (
        <div key={t.key} className={`qc-token ${t.cls} ${t.wide ? 'wide' : ''}`} style={{ animationDelay: `${base + i * 0.55}s` }}>
          <span className="qc-orb">{t.art ? <Art path={t.art} icon={t.icon} className="qc-art" /> : t.icon}</span>
          <strong>{t.big}</strong>
          <span>{t.small}</span>
        </div>
      ))}
    </div>
  );
}

// Coins (or sparks) falling across the screen.
function Shower({ coins }) {
  const bits = useMemo(() => Array.from({ length: coins ? 26 : 18 }, (_, i) => ({
    left: (i * 41) % 100, delay: 2.4 + ((i * 0.37) % 3), dur: 2.6 + ((i * 7) % 10) / 6, spin: i % 2 ? 1 : -1,
  })), [coins]);
  return (
    <div className="qc-shower" aria-hidden="true">
      {bits.map((b, i) => (
        <span key={i} className={coins ? 'qc-coin' : 'qc-spark'}
          style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, '--spin': b.spin }} />
      ))}
    </div>
  );
}

export function QuestScroll({ q, currency, phone = false, onClose }) {
  return (
    <div className={`qc ${phone ? 'qc-phone' : ''}`} role="alert" onClick={onClose}>
      <div className="qc-burst" aria-hidden="true" />
      <Shower coins={!!q.reward?.gold} />
      <div className="qc-scroll">
        <span className="qc-roller top" aria-hidden="true" />
        <div className="qc-unroll"><div className="qc-paper">
          <span className="qc-seal" aria-hidden="true"><span>{q.icon ?? '🏅'}</span></span>
          <p className="qc-kicker">Quest complete</p>
          <h2 className="qc-title">{q.title}</h2>
          {q.giver && <p className="qc-giver">for {q.giver}</p>}
          {q.names?.length > 0 && (
            <p className="qc-heroes">{phone ? 'Well done.' : `Completed by ${q.names.join(', ')}`}</p>
          )}
          <span className="qc-rule" aria-hidden="true" />
          <Tokens reward={q.reward} currency={currency} />
          {phone && <p className="qc-tap">Tap to roll up the scroll</p>}
        </div></div>
        <span className="qc-roller bottom" aria-hidden="true" />
      </div>
    </div>
  );
}

// ---------- TV ----------
export function TVQuestComplete({ q, currency, onDone }) {
  useEffect(() => {
    play('sparkle');
    const t = setTimeout(onDone, 11000 + (rewardTokens(q.reward).length * 500));
    return () => clearTimeout(t);
  }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return <QuestScroll q={q} currency={currency} />;
}

// ---------- Phone ----------
// Shows a scroll when a quest this player was on is completed (only for new ones, not old ones on reload).
export function PlayerQuestReward({ sid, uid, currency }) {
  const events = useEvents(sid, 10);
  const seen = useRef(null);
  const [q, setQ] = useState(null);
  useEffect(() => {
    const done = events.filter((e) => e.type === 'quest_done');
    if (seen.current === null) { seen.current = new Set(done.map((e) => e.id)); return; }
    const fresh = done.find((e) => !seen.current.has(e.id) && (e.payload?.uids ?? []).includes(uid));
    done.forEach((e) => seen.current.add(e.id));
    if (fresh) {
      setQ({ id: fresh.id, ...fresh.payload });
      play('sparkle');
      try { navigator.vibrate?.([60, 40, 60, 40, 160]); } catch { /* ignore */ }
    }
  }, [events, uid]);
  if (!q) return null;
  return <QuestScroll key={q.id} q={q} currency={currency} phone onClose={() => setQ(null)} />;
}
