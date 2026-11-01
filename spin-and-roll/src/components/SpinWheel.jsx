import { useEffect, useRef, useState } from 'react';
import { doc, deleteField, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { applySpin, hideSpin, logEvent, SPIN_MS, spinWheelOf, startSpin } from '../lib/game';
import { play } from '../lib/sound';

const COLORS = ['#E3B04B', '#4FB3A9', '#D0543F', '#8E7CC3'];

function polar(r, a) {
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
}

// A wheel that spins forward and lands on segment `idx` whenever spinId changes.
export function WheelView({ wheel, idx, spinId, size = 420, onLanded }) {
  const n = wheel.segments.length;
  const seg = 360 / n;
  const rot = useRef(0);
  const [angle, setAngle] = useState(0);
  const [landed, setLanded] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Slice i spans [i*seg, (i+1)*seg] measured clockwise from the top pointer.
    const target = 360 - (idx + 0.5) * seg;
    const base = rot.current - (rot.current % 360);
    const next = base + 360 * 6 + target + (Math.random() - 0.5) * seg * 0.6;
    rot.current = next;
    setLanded(false);
    setAngle(next);
    const t = setTimeout(() => { setLanded(true); onLanded?.(); }, reduce ? 50 : SPIN_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  const slices = wheel.segments.map((s, i) => {
    const a0 = (i * seg - 90) * (Math.PI / 180);
    const a1 = ((i + 1) * seg - 90) * (Math.PI / 180);
    const [x0, y0] = polar(96, a0);
    const [x1, y1] = polar(96, a1);
    const mid = (i + 0.5) * seg;
    const [tx, ty] = polar(60, (mid - 90) * (Math.PI / 180));
    const hit = landed && i === idx;
    return (
      <g key={i}>
        <path d={`M100 100 L${x0} ${y0} A96 96 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1} Z`}
          fill={COLORS[i % COLORS.length]} stroke="#17142A" strokeWidth="1.5" opacity={landed && !hit ? 0.45 : 1} />
        <text x={tx} y={ty} fill="#17142A" fontSize={s.label.length > 9 ? 7.5 : 9.5} fontWeight="700"
          fontFamily="Figtree, sans-serif" textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(${mid} ${tx} ${ty})`}>{s.label}</text>
      </g>
    );
  });

  return (
    <div className="spin-wrap">
      <svg width={size} height={size * 1.06} viewBox="0 -8 200 212" role="img" aria-label={`${wheel.name} wheel`}>
        <g style={{
          transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px',
          transition: reduce ? 'none' : `transform ${SPIN_MS}ms cubic-bezier(.12,.72,.14,1)`,
        }}>
          {slices}
          <circle cx="100" cy="100" r="96" fill="none" stroke="#ECE4D3" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="11" fill="#17142A" stroke="#ECE4D3" strokeWidth="2.5" />
        </g>
        <path d="M100 10 L108 -6 L92 -6 Z" fill="#ECE4D3" stroke="#17142A" strokeWidth="1" />
      </svg>
      <p className={`spin-result ${landed ? 'show' : ''}`} aria-live="polite">
        {landed ? wheel.segments[idx].text : `${wheel.icon} ${wheel.name}`}
      </p>
    </div>
  );
}

// ---------- TV ----------
export function TVSpin({ data, spin, name }) {
  const wheel = spinWheelOf(data, spin);
  useEffect(() => {
    const timers = [];
    // Ticks that slow down like the wheel does, then a chime when it lands.
    for (let i = 0; i < 26; i++) {
      const t = SPIN_MS * (1 - Math.pow(1 - i / 26, 0.45));
      timers.push(setTimeout(() => play('tick'), t));
    }
    timers.push(setTimeout(() => play('chime'), SPIN_MS + 50));
    return () => timers.forEach(clearTimeout);
  }, [spin.id]);
  if (!wheel) return null;
  return (
    <div className="tv-spin">
      <h2>{wheel.icon} {wheel.name}{name && !wheel.secret ? `: ${name}` : ''}</h2>
      <WheelView wheel={wheel} idx={spin.idx} spinId={spin.id} size={Math.min(480, window.innerHeight * 0.55)} />
    </div>
  );
}

// ---------- GM: wheels ----------
// A custom wheel is typed one option per line. "Label | what happens" puts a short word on the wheel
// and the full result underneath; a plain line is used for both.
export function parseCustom(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 16).map((l) => {
    const [a, ...rest] = l.split('|');
    const label = a.trim();
    const full = rest.join('|').trim();
    return { label: label.length > 14 ? `${label.slice(0, 13)}…` : label, text: full || label };
  });
}
const CUSTOM_ICONS = ['🎡', '🌀', '🔮', '🎲', '⚡', '🍀', '💀', '👻', '🐉', '🗝️'];

export function GMSpin({ sid, data, session, chars }) {
  const { user, profile } = useAuth();
  const ids = Object.keys(data.wheels ?? {});
  const [mode, setMode] = useState(ids.length ? 'campaign' : 'custom'); // 'campaign' | 'custom'
  const [wheelId, setWheelId] = useState(ids[0]);
  const [who, setWho] = useState('');           // '' = the whole table, 'uid:<id>', or 'name'
  const [otherName, setOtherName] = useState('');
  const [peek, setPeek] = useState(false);
  const [cName, setCName] = useState('');
  const [cIcon, setCIcon] = useState('🎡');
  const [cText, setCText] = useState('');
  const spin = session.state?.spin;
  const players = session.playerUids.filter((u) => chars[u]);
  const saved = profile?.customWheels ?? {};

  // Apply the landed result once the wheel stops.
  useEffect(() => {
    if (!spin || spin.applied) return undefined;
    const wait = Math.max(0, spin.at + SPIN_MS + 300 - Date.now());
    const t = setTimeout(() => applySpin(sid, data, spin).catch(console.error), wait);
    return () => clearTimeout(t);
  }, [sid, data, spin]);

  const wheel = data.wheels?.[wheelId];
  const segments = parseCustom(cText);
  const custom = segments.length >= 2 ? { name: cName.trim() || 'Custom wheel', icon: cIcon, segments } : null;
  const uid = who.startsWith('uid:') ? who.slice(4) : null;
  const whoName = who === 'name' ? otherName.trim() || null : null;
  const go = (hidden) => (mode === 'custom'
    ? custom && startSpin(sid, data, 'custom', uid, { custom, hidden, who: whoName })
    : startSpin(sid, data, wheelId, uid, { hidden, who: whoName }));

  const profileRef = user ? doc(db, 'users', user.uid) : null;
  const saveCustom = () => {
    if (!custom || !profileRef) return;
    const id = (cName.trim() || 'custom').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'custom';
    updateDoc(profileRef, { [`customWheels.${id}`]: { name: custom.name, icon: cIcon, text: cText } });
  };
  const loadCustom = (w) => { setCName(w.name); setCIcon(w.icon ?? '🎡'); setCText(w.text); };
  const dropCustom = (id) => profileRef && confirm('Delete this saved wheel?') && updateDoc(profileRef, { [`customWheels.${id}`]: deleteField() });

  const current = spinWheelOf(data, spin);
  const landed = spin?.applied;
  const spinner = spin?.uid && chars[spin.uid] ? chars[spin.uid].firstName ?? chars[spin.uid].name : spin?.who;

  return (
    <section className="gm-spin wd">
      <div className="wd-head">
        <h2>🎡 Wheels</h2>
        <div className="wd-modes" role="tablist">
          <button role="tab" aria-selected={mode === 'campaign'} className={`btn small ${mode === 'campaign' ? 'gold' : 'ghost'}`} onClick={() => setMode('campaign')}>Campaign wheels</button>
          <button role="tab" aria-selected={mode === 'custom'} className={`btn small ${mode === 'custom' ? 'gold' : 'ghost'}`} onClick={() => setMode('custom')}>✏️ Custom wheel</button>
        </div>
      </div>

      {mode === 'campaign' ? (
        <>
          <div className="wd-cards">
            {ids.map((id) => (
              <button key={id} className={`wd-card ${id === wheelId ? 'on' : ''}`} onClick={() => setWheelId(id)}>
                <span className="wd-card-icon">{data.wheels[id].icon}</span>
                <span className="wd-card-name">{data.wheels[id].name}</span>
                <span className="wd-card-n">{data.wheels[id].segments.length} results</span>
              </button>
            ))}
          </div>
          {wheel && (
            <details className="wd-peek" open={peek} onToggle={(e) => setPeek(e.currentTarget.open)}>
              <summary>What can {wheel.icon} {wheel.name} land on?</summary>
              <ol>{wheel.segments.map((g, i) => <li key={i}><strong>{g.label}</strong> {g.text}</li>)}</ol>
            </details>
          )}
        </>
      ) : (
        <div className="wd-custom">
          <div className="gm-give">
            <select value={cIcon} onChange={(e) => setCIcon(e.target.value)} aria-label="Icon">{CUSTOM_ICONS.map((i) => <option key={i}>{i}</option>)}</select>
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Wheel name, e.g. Does the portrait wake?" aria-label="Wheel name" maxLength={40} />
          </div>
          <textarea value={cText} onChange={(e) => setCText(e.target.value)} rows={6} aria-label="Options, one per line"
            placeholder={'One option per line (2 to 16). Optionally a short word | what happens:\nYes | The portrait opens its eyes\nNo | Nothing happens\nMaybe | It mutters in its sleep'} />
          <div className="wd-custom-foot">
            <span className="muted small">{segments.length} option{segments.length === 1 ? '' : 's'}{segments.length < 2 ? ' (need at least 2)' : ''}. Custom wheels only show words: no HP, points or items.</span>
            <button className="btn small" disabled={!custom} onClick={saveCustom}>💾 Save to my wheels</button>
          </div>
          {Object.keys(saved).length > 0 && (
            <div className="wd-saved">
              <span className="muted small">My wheels:</span>
              {Object.entries(saved).map(([id, w]) => (
                <span key={id} className="wd-chip">
                  <button className="linkish" onClick={() => loadCustom(w)}>{w.icon} {w.name}</button>
                  <button className="wd-chip-x" aria-label={`Delete ${w.name}`} onClick={() => dropCustom(id)}>✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="gm-give wd-who">
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Who spins">
          <option value="">The whole table</option>
          {players.map((u) => <option key={u} value={`uid:${u}`}>{chars[u].firstName ?? chars[u].name}</option>)}
          <option value="name">Someone else (an NPC)…</option>
        </select>
        {who === 'name' && <input value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Name, e.g. Peeves" aria-label="Name" maxLength={30} />}
        <button className="btn small gold" disabled={mode === 'custom' && !custom} onClick={() => go(false)}>📺 Spin on the TV</button>
        <button className="btn small" disabled={mode === 'custom' && !custom} onClick={() => go(true)} title="Only you see it">🤫 Spin quietly</button>
      </div>

      {current && spin && (
        <div className="wd-live">
          <WheelView wheel={current} idx={spin.idx} spinId={spin.id} size={180} />
          <div className="wd-live-side">
            <p>
              {current.icon} <strong>{current.name}</strong>{spinner ? ` for ${spinner}` : ''}
              {spin.hidden && <span className="wd-quiet"> · only on your screen</span>}
            </p>
            <p className="wd-result">{landed ? current.segments[spin.idx].text : 'Spinning…'}</p>
            <span className="actions">
              <button className="btn small" disabled={!landed}
                onClick={() => startSpin(sid, data, spin.wheelId, spin.uid, { custom: spin.custom, hidden: spin.hidden, who: spin.who })}>Re-spin (Felix)</button>
              {!spin.hidden && <button className="btn small ghost" onClick={() => hideSpin(sid)}>Hide from TV</button>}
            </span>
          </div>
        </div>
      )}
      <p className="muted small">Campaign wheel results (HP, XP, points, items, detention) apply to the student who spun once it lands.</p>
    </section>
  );
}

// ---------- GM: dice ----------
const DICE = [4, 6, 8, 10, 12, 20, 100];
const d = (n) => 1 + Math.floor(Math.random() * n);

export function GMDice({ sid }) {
  const [die, setDie] = useState(20);
  const [count, setCount] = useState(1);
  const [mod, setMod] = useState(0);
  const [mode, setMode] = useState('normal'); // d20 only: 'normal' | 'adv' | 'dis'
  const [label, setLabel] = useState('');
  const [onTv, setOnTv] = useState(true);
  const [log, setLog] = useState([]);

  const roll = async () => {
    let rolls; let nat = null; let base;
    if (die === 20 && count === 1 && mode !== 'normal') {
      rolls = [d(20), d(20)];
      nat = mode === 'adv' ? Math.max(...rolls) : Math.min(...rolls);
      base = nat;
    } else {
      rolls = Array.from({ length: count }, () => d(die));
      base = rolls.reduce((a, b) => a + b, 0);
      if (die === 20 && count === 1) nat = rolls[0];
    }
    const total = base + mod;
    const r = { id: Date.now(), die: `${count > 1 ? count : ''}d${die}`, rolls, mod, total, nat, mode: die === 20 && count === 1 ? mode : 'normal', label: label.trim(), tv: onTv };
    setLog((l) => [r, ...l].slice(0, 8));
    if (onTv) await logEvent(sid, { type: 'gm_roll', payload: { die: r.die, rolls, mod, total, nat, mode: r.mode, label: r.label } });
  };

  return (
    <section className="gm-spin wd wd-dice">
      <h2>🎲 Dice</h2>
      <div className="wd-dice-row" role="group" aria-label="Die">
        {DICE.map((n) => (
          <button key={n} className={`wd-die ${die === n ? 'on' : ''}`} onClick={() => setDie(n)} aria-pressed={die === n}>d{n}</button>
        ))}
      </div>
      <div className="gm-give">
        <label className="wd-num">How many <input type="number" min="1" max="10" value={count} onChange={(e) => setCount(Math.max(1, Math.min(10, +e.target.value || 1)))} /></label>
        <label className="wd-num">Bonus <input type="number" min="-20" max="20" value={mod} onChange={(e) => setMod(Math.max(-20, Math.min(20, +e.target.value || 0)))} /></label>
        {die === 20 && count === 1 && (
          <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Advantage">
            <option value="normal">Normal</option><option value="adv">Advantage</option><option value="dis">Disadvantage</option>
          </select>
        )}
      </div>
      <div className="gm-give">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What is it for? e.g. Filch spots them (optional)" aria-label="What the roll is for" maxLength={60} />
        <label className="spot-toggle"><input type="checkbox" checked={onTv} onChange={(e) => setOnTv(e.target.checked)} /> 📺 Show on the TV</label>
        <button className="btn small gold" onClick={roll}>🎲 Roll {count > 1 ? count : ''}d{die}{mod ? (mod > 0 ? ` + ${mod}` : ` − ${-mod}`) : ''}</button>
      </div>
      {log.length > 0 && (
        <ol className="wd-log">
          {log.map((r, i) => (
            <li key={r.id} className={i === 0 ? 'newest' : ''}>
              <strong className={r.nat === 20 && r.die === 'd20' ? 'crit' : r.nat === 1 && r.die === 'd20' ? 'fumble' : ''}>{r.total}</strong>
              <span>{r.label || r.die}</span>
              <span className="muted small">{r.die} [{r.rolls.join(', ')}]{r.mode !== 'normal' ? ` ${r.mode === 'adv' ? 'adv' : 'dis'}` : ''}{r.mod ? ` ${r.mod > 0 ? '+' : '−'}${Math.abs(r.mod)}` : ''}{r.tv ? '' : ' · only you'}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
