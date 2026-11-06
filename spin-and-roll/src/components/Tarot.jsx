import { useMemo, useState } from 'react';
import { deleteField } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { clockOf, setField } from '../lib/game';
import { useNotes } from '../lib/notes';
import { setShow } from '../lib/world';
import { cardById, composeReading, nowEffects, POSITIONS, sealReading, setFortune, tarotKey } from '../lib/tarot';

// Professor Greaves's tarot. The GM reads the real cards at the table, then enters them here.

const KIND_LABEL = { blessed: '✨ Blessed', favour: '🌟 Fortune’s Favour', none: '🌑 Nothing', cursed: '☠️ Cursed' };
const MAJOR_ICON = {
  fool: '🃏', magician: '🪄', 'high-priestess': '🌙', empress: '🌿', emperor: '👑', hierophant: '📿', lovers: '🤝',
  chariot: '🐎', strength: '🦁', hermit: '🏮', wheel: '🎡', justice: '⚖️', 'hanged-man': '🙃', death: '💀',
  temperance: '⚗️', devil: '😈', tower: '🗼', star: '⭐', moon: '🌕', sun: '☀️', judgement: '📯', world: '🌍',
};
const iconOf = (data, card) => (card.arcana === 'major' ? MAJOR_ICON[card.id] : data.tarot.suits[card.suit].icon);

function clockLabel(data, session) {
  const c = clockOf(session);
  if (!data.clock) return '';
  return c.day === 0 ? data.clock.prologue?.[c.block] ?? 'Prologue' : `Day ${c.day}, ${data.clock.blocks[c.block]}`;
}

function CardSelect({ data, value, onChange, label }) {
  const T = data.tarot;
  const majors = T.cards.filter((c) => c.arcana === 'major');
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">Pick the card…</option>
      <optgroup label="Major Arcana">
        {majors.map((c) => <option key={c.id} value={c.id}>{c.number}. {c.name}</option>)}
      </optgroup>
      {Object.entries(T.suits).map(([sid, s]) => (
        <optgroup key={sid} label={`${s.icon} ${s.name}`}>
          {T.cards.filter((c) => c.suit === sid).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export function GMTarot({ sid, data, session, chars }) {
  const { user } = useAuth();
  const notes = useNotes(user?.uid, sid);
  const T = data.tarot;
  const clock = clockOf(session);
  const today = session.state?.tarot ?? {};
  const players = session.playerUids.filter((u) => chars[u]);
  const [uid, setUid] = useState('');
  const [picks, setPicks] = useState([{ id: '', rev: false }, { id: '', rev: false }, { id: '', rev: false }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const c = uid ? { uid, ...chars[uid] } : null;
  const readToday = (house) => today[tarotKey(clock.dawn, house)];
  const ready = c && picks.every((p) => p.id);
  const reading = useMemo(() => (ready ? composeReading(data, c, picks) : null), [ready, data, c, picks]);
  const preview = reading ? nowEffects({ ...c, gold: (c.gold ?? 0) - T.reader.price }, data, reading.outcome.fortunes).summary : [];
  const blocked = c && (readToday(c.house) ? `${c.house} already had a reading today (${readToday(c.house).name}).`
    : (c.gold ?? 0) < T.reader.price ? `${c.firstName ?? c.name} only has ${c.gold ?? 0} Galleons.` : '');
  const set = (i, patch) => setPicks(picks.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const todays = Object.values(today).filter((r) => r.dawn === clock.dawn).sort((a, b) => a.at - b.at);

  const seal = async () => {
    if (!confirm(`Seal ${c.firstName ?? c.name}’s reading? ${T.reader.price} Galleons are taken and the outcome goes on the TV.`)) return;
    setBusy(true); setMsg('');
    try {
      await sealReading({ sid, data, gmUid: user.uid, c, picks, clock, when: clockLabel(data, session), night: notes?.night });
      setMsg(`Sealed. ${c.firstName ?? c.name}’s reading is on the TV.`);
      setPicks([{ id: '', rev: false }, { id: '', rev: false }, { id: '', rev: false }]);
      setUid('');
    } catch (e) {
      setMsg(e.message);
    } finally { setBusy(false); }
  };

  return (
    <section className="gm-tarot">
      <div className="show-bar">
        <span><strong>🔮 {T.reader.name}</strong> <span className="muted small">in the Library. {T.reader.price} Galleons. One reading per house per day.</span></span>
        {session.state?.show?.type === 'tarot' && <button className="btn small ghost" onClick={() => setShow(sid, null)}>Back to the map</button>}
      </div>

      <div className="tarot-houses">
        {['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'].map((h) => {
          const r = readToday(h);
          return <span key={h} className={`tarot-house ${r ? 'done' : ''}`}>{h}: {r ? `${r.name}, ${KIND_LABEL[r.kind]}` : 'free today'}</span>;
        })}
      </div>

      <label className="tarot-who">Who sat down?
        <select value={uid} onChange={(e) => setUid(e.target.value)}>
          <option value="">Pick a student…</option>
          {players.map((u) => {
            const p = chars[u];
            const done = readToday(p.house);
            return <option key={u} value={u} disabled={!!done}>{p.firstName ?? p.name} ({p.house ?? 'Unsorted'}, {p.gold ?? 0} G){done ? ': house already read' : ''}</option>;
          })}
        </select>
      </label>

      <div className="tarot-picks">
        {POSITIONS.map((pos, i) => (
          <div key={pos} className="tarot-pick">
            <span className="tarot-pos">{i + 1}. {pos}</span>
            <CardSelect data={data} value={picks[i].id} label={`${pos} card`} onChange={(id) => set(i, { id })} />
            <label className="tarot-rev"><input type="checkbox" checked={picks[i].rev} onChange={(e) => set(i, { rev: e.target.checked })} /> Reversed</label>
          </div>
        ))}
      </div>

      {reading && (
        <div className={`tarot-preview kind-${reading.outcome.kind}`}>
          <p className="tarot-outcome"><strong>{KIND_LABEL[reading.outcome.kind]}</strong>
            {preview.length > 0 && <span className="muted small"> (straight away: {preview.join(', ')})</span>}</p>
          <h3>Read this aloud, as Professor Greaves</h3>
          {reading.lines.map((l, i) => (
            <p key={i} className={`tarot-line ${l.verdict ? 'verdict' : ''}`}>
              {l.pos && <span className="tag">{l.pos}</span>}{l.text}
            </p>
          ))}
          {reading.outcome.fortunes.map((f, i) => (
            <div key={i} className={`fortune-card ${f.kind}`}>
              <strong>{f.icon} {f.title}</strong> <span className="muted small">({f.card})</span>
              <p>{f.text}</p>
              {f.omen && <p className="muted small">For you: {f.omen}</p>}
            </div>
          ))}
        </div>
      )}

      {blocked && <p className="warn small">{blocked}</p>}
      <button className="btn gold" disabled={!ready || !!blocked || busy} onClick={seal}>
        🔮 Seal the reading ({T.reader.price} Galleons)
      </button>
      {msg && <p className="small">{msg}</p>}

      {todays.length > 0 && (
        <div className="tarot-today">
          <h3>Today’s readings</h3>
          {todays.map((r) => (
            <p key={r.uid + r.at} className="small">
              <strong>{r.name}</strong> ({r.house}): {r.cards.map((k, i) => `${POSITIONS[i]} ${cardById(data, k.id)?.name}${k.rev ? ' (rev.)' : ''}`).join(', ')}. {KIND_LABEL[r.kind]}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------- The TV ----------
export function TarotShow({ data, show }) {
  const cards = show.cards ?? [];
  const nCards = cards.length;
  const lineDelay = (i) => 1.2 + nCards * 1.4 + i * 1.6;
  const end = lineDelay(show.lines?.length ?? 0);
  return (
    <div className="tarot-show" key={show.at}>
      <p className="tarot-kicker">🔮 Professor Greaves reads the cards for {show.name}</p>
      <div className="tarot-spread">
        {cards.map((k, i) => {
          const card = cardById(data, k.id);
          return (
            <div key={i} className="tarot-slot" style={{ animationDelay: `${0.6 + i * 1.4}s` }}>
              <span className="tarot-slot-pos">{k.pos}</span>
              <div className={`tarot-card ${k.rev ? 'rev' : ''} ${card?.arcana ?? ''}`}>
                <span className="tc-num">{card?.arcana === 'major' ? card.number : card?.rank}</span>
                <span className="tc-icon">{card ? iconOf(data, card) : '?'}</span>
                <span className="tc-name">{k.name}</span>
              </div>
              {k.rev && <span className="tarot-slot-rev">reversed</span>}
            </div>
          );
        })}
      </div>
      <div className="tarot-words">
        {(show.lines ?? []).slice(1).map((t, i) => (
          <p key={i} style={{ animationDelay: `${lineDelay(i)}s` }}>{t}</p>
        ))}
      </div>
      <div className={`tarot-banner kind-${show.kind}`} style={{ animationDelay: `${end}s` }}>
        <h2>{KIND_LABEL[show.kind]}</h2>
        {(show.fortunes ?? []).map((f, i) => (
          <p key={i}><strong>{f.icon} {f.title}</strong>: {f.text}</p>
        ))}
        {show.kind === 'none' && <p>The cards keep their silence. The Galleons are gone.</p>}
      </div>
    </div>
  );
}

// ---------- The phone: what the cards gave you ----------
export function FortuneCards({ c }) {
  const list = Object.values(c.fortunes ?? {}).sort((a, b) => (a.used - b.used) || (b.dawn - a.dawn));
  if (!list.length) return null;
  return (
    <>
      {list.map((f, i) => (
        <section key={i} className={`ability fortune-card ${f.kind} ${f.used ? 'used' : ''}`}>
          <p className="relic-kicker">{f.kind === 'curse' ? '☠️ A curse from the cards' : '🔮 Fortune’s Favour'} · {f.card}</p>
          <h2>{f.icon} {f.title}</h2>
          <p>{f.text}</p>
          <p className="muted small gift-how">
            {f.used ? (f.kind === 'curse' ? 'It has run its course.' : 'Used.') : f.kind === 'curse' ? 'It hangs over you until the DM lifts it.' : 'To use it, tell the DM, or show them this card.'}
          </p>
        </section>
      ))}
    </>
  );
}

// ---------- The Players tab: tick off or remove fortunes ----------
export function GMFortunes({ sid, c }) {
  const list = Object.entries(c.fortunes ?? {});
  if (!list.length) return null;
  return (
    <div className="relics-gm">
      {list.map(([id, f]) => (
        <div key={id} className={`gift-row fortune-row ${f.kind}`}>
          <span className="gift-name">{f.kind === 'curse' ? '☠️' : '🔮'} {f.icon} {f.title}</span>
          <label className="gift-used">
            <input type="checkbox" checked={!!f.used} onChange={(e) => setFortune(sid, c.uid, id, { used: e.target.checked })} />
            {f.kind === 'curse' ? 'Lifted' : 'Used'}
          </label>
          <button className="linkish" onClick={() => confirm(`Remove ${f.title} from ${c.firstName ?? c.name}?`) && setField(sid, c.uid, `fortunes.${id}`, deleteField())}>Remove</button>
        </div>
      ))}
    </div>
  );
}
