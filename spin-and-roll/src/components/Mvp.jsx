import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { clockOf } from '../lib/game';
import { crownMvp, MVP_ROLL_BONUS, mvpActive, removeMvp, setMvpUsed } from '../lib/mvp';
import { setShow } from '../lib/world';
import Portrait from './Portrait';

// MVP of the Day: GM tab, TV ceremony, the phone card, and the tick-off on the Players tab.

const label = (data, day) => (day === 0 ? 'the Prologue' : `Day ${day}`);

export function GMMvp({ sid, data, session, chars }) {
  const { user } = useAuth();
  const M = data.mvp;
  const clk = clockOf(session);
  const history = session.state?.mvp ?? {};
  // At the end of a day you are crowning that day; on a fresh morning, usually yesterday.
  const [day, setDay] = useState(() => (clk.block === 0 && clk.day > 1 && !history[clk.day - 1] ? clk.day - 1 : clk.day));
  const [uid, setUid] = useState('');
  const [ticks, setTicks] = useState({});
  const [perkId, setPerkId] = useState(Object.keys(M.perks)[0]);
  const [custom, setCustom] = useState({ title: '', icon: '🌟', text: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const players = session.playerUids.filter((u) => chars[u]);
  const c = uid ? { uid, ...chars[uid] } : null;
  const reasons = M.requirements.filter((r) => ticks[r.id]).map((r) => r.id);
  const already = history[day];
  const lastWinner = history[day - 1]?.uid;
  const repeat = c && lastWinner === uid;
  const perk = perkId === 'custom' ? custom : M.perks[perkId];
  const ready = c && reasons.length >= M.needs && !already && perk?.title?.trim() && perk?.text?.trim();

  const crown = async () => {
    if (!confirm(`Crown ${c.firstName ?? c.name} MVP of ${label(data, day)}? It goes on the TV.`)) return;
    setBusy(true); setMsg('');
    try {
      await crownMvp({ sid, data, gmUid: user.uid, day, c, reasons, perk: { ...perk, title: perk.title.trim(), text: perk.text.trim() } });
      setMsg(`${c.firstName ?? c.name} is MVP of ${label(data, day)}.`);
      setUid(''); setTicks({});
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  return (
    <section className="gm-mvp">
      <div className="show-bar">
        <span><strong>🏅 MVP of the Day</strong> <span className="muted small">Not every day has one: they must meet at least {M.needs} of the requirements.</span></span>
        {session.state?.show?.type === 'mvp' && <button className="btn small ghost" onClick={() => setShow(sid, null)}>Back to the map</button>}
      </div>

      <div className="mvp-pickers">
        <label>For
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {Array.from({ length: Math.max(clk.day, 1) + 1 }, (_, d) => d).filter((d) => d >= 1).map((d) => (
              <option key={d} value={d}>{label(data, d)}{history[d] ? ` (${history[d].name})` : ''}</option>
            ))}
          </select>
        </label>
        <label>Student
          <select value={uid} onChange={(e) => setUid(e.target.value)}>
            <option value="">Who earned it?</option>
            {players.map((u) => <option key={u} value={u}>{chars[u].firstName ?? chars[u].name} ({chars[u].house ?? 'Unsorted'})</option>)}
          </select>
        </label>
      </div>

      {already ? (
        <div className="mvp-done">
          <p><strong>{label(data, day)}: {already.name}</strong> ({already.house}) · {already.perk?.icon} {already.perk?.title}</p>
          <button className="linkish" onClick={() => confirm(`Remove ${already.name} as MVP of ${label(data, day)}? (House points already given stay.)`) && removeMvp(sid, day, already.uid)}>Remove</button>
        </div>
      ) : (
        <>
          <fieldset className="mvp-reqs">
            <legend>Requirements met ({reasons.length} of {M.needs} needed)</legend>
            {M.requirements.map((r) => (
              <label key={r.id}>
                <input type="checkbox" checked={!!ticks[r.id]} onChange={(e) => setTicks({ ...ticks, [r.id]: e.target.checked })} />
                <span>{r.icon} {r.text}</span>
              </label>
            ))}
          </fieldset>

          <label className="mvp-perk">Their perk (used once, during {label(data, day + 1)})
            <select value={perkId} onChange={(e) => setPerkId(e.target.value)}>
              {Object.entries(M.perks).map(([id, p]) => <option key={id} value={id}>{p.icon} {p.title}</option>)}
              <option value="custom">Make one up</option>
            </select>
          </label>
          {perkId === 'custom' ? (
            <div className="gift-form">
              <div className="gift-title">
                <label>Icon<input value={custom.icon} onChange={(e) => setCustom({ ...custom, icon: e.target.value })} maxLength={4} /></label>
                <label>Name<input value={custom.title} onChange={(e) => setCustom({ ...custom, title: e.target.value })} placeholder="e.g. The Hero’s Return" /></label>
              </div>
              <label>What it does<textarea rows={2} value={custom.text} onChange={(e) => setCustom({ ...custom, text: e.target.value })} /></label>
            </div>
          ) : <p className="muted small">{perk.text}</p>}

          <p className="muted small">Always, with it: <strong>{M.badge.icon} {M.badge.title}</strong>: {M.badge.text} (+{M.badge.points} house points now.)</p>
          {repeat && <p className="warn small">{c.firstName ?? c.name} was MVP of {label(data, day - 1)} too. Give someone else the chance if you can.</p>}
          <button className="btn gold" disabled={!ready || busy} onClick={crown}>🏅 Crown the MVP</button>
        </>
      )}
      {msg && <p className="small">{msg}</p>}

      {Object.keys(history).length > 0 && (
        <div className="mvp-history">
          <h3>Hall of MVPs</h3>
          {Object.entries(history).sort(([a], [b]) => a - b).map(([d, m]) => (
            <p key={d} className="small"><strong>{label(data, Number(d))}</strong>: {m.name} ({m.house}) · {m.perk?.icon} {m.perk?.title}</p>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------- The TV ----------
export function MvpShow({ show }) {
  return (
    <div className="mvp-show" key={show.at}>
      <p className="mvp-kicker">MVP of {show.day === 0 ? 'the Prologue' : `Day ${show.day}`}</p>
      <div className="mvp-crown">🏅</div>
      <Portrait family={show.family} name={show.name} className="mvp-portrait" />
      <h1 className="mvp-name">{show.name}</h1>
      {show.house && <p className="mvp-house">{show.house}{show.points ? ` · +${show.points} house points` : ''}</p>}
      <ul className="mvp-reasons">
        {(show.reasons ?? []).map((r, i) => <li key={i} style={{ animationDelay: `${1.6 + i * 0.7}s` }}>{r}</li>)}
      </ul>
      <div className="mvp-perk-card" style={{ animationDelay: `${1.8 + (show.reasons?.length ?? 0) * 0.7}s` }}>
        <p><strong>{show.perk?.icon} {show.perk?.title}</strong>: {show.perk?.text}</p>
        <p className="muted">And all day tomorrow: {show.badge}</p>
      </div>
    </div>
  );
}

// ---------- The phone ----------
export function MvpCard({ c, clk }) {
  const m = c.mvp;
  if (!m) return null;
  const active = mvpActive(c, clk);
  const waiting = clk.day < m.forDay;
  if (!active && !waiting) return null;
  return (
    <section className={`ability mvp-card ${m.used ? 'used' : ''}`}>
      <p className="relic-kicker">🏅 MVP of Day {m.day}</p>
      <h2>{m.perk.icon} {m.perk.title}</h2>
      <p>{m.perk.text}</p>
      <p><span className="tag">The Badge</span>+{MVP_ROLL_BONUS} to every d20 roll {active ? 'today' : `on Day ${m.forDay}`}. The app adds it for you.</p>
      <p className="muted small gift-how">{m.used ? 'Perk used.' : waiting ? `It starts on Day ${m.forDay}.` : 'To use the perk, tell the DM or show them this card.'}</p>
    </section>
  );
}

// ---------- The Players tab ----------
export function GMMvpRow({ sid, c, clk }) {
  const m = c.mvp;
  if (!m || clk.day > m.forDay) return null;
  return (
    <div className="gift-row mvp-row">
      <span className="gift-name">🏅 MVP of Day {m.day}: {m.perk.icon} {m.perk.title}{mvpActive(c, clk) ? ' (+2 rolls today)' : ''}</span>
      <label className="gift-used">
        <input type="checkbox" checked={!!m.used} onChange={(e) => setMvpUsed(sid, c.uid, e.target.checked)} />
        Perk used
      </label>
    </div>
  );
}
