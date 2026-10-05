import { useState } from 'react';
import { isMonster } from '../components/MapView';
import { fmtMod, mod, statOf } from '../lib/game';
import { rollD20 } from '../lib/dice';
import { exitsOf, locOf, pcsAt, rewardText, sendOpenChest, sendPickup } from '../lib/world';

function ChestRoll({ sid, c, id, t, onClose }) {
  const knowsAlohomora = (c.spells ?? []).some((s) => s.id === 'alohomora');
  const mode = knowsAlohomora ? 'adv' : 'normal';
  const [roll, setRoll] = useState(null);
  const [busy, setBusy] = useState(false);
  const bonus = mod(statOf(c, t.stat));

  const go = async () => {
    setBusy(true);
    const r = rollD20(mode);
    const total = r.nat + bonus;
    setRoll({ ...r, total });
    await sendOpenChest(sid, c.uid, { tokenId: id, nat: r.nat, rolls: r.rolls, total, mode });
    setBusy(false);
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-label={`Open ${t.name}`}>
      <div className="sheet-panel">
        <h3>{t.icon} {t.name}</h3>
        <p>Roll d20 {fmtMod(bonus)} ({t.stat.toUpperCase()}) to open it. You only get one try.</p>
        {knowsAlohomora && <p className="small hit">🔓 You know Alohomora: roll with advantage.</p>}
        {roll ? (
          <div className="roll-out">
            <span className="big-die">{roll.nat}</span>
            <span className="muted">{roll.rolls.length > 1 ? `Rolled ${roll.rolls.join(' and ')}, kept ${roll.nat}. ` : ''}Total {roll.total}</span>
            <span className="muted small">Watch the TV…</span>
          </div>
        ) : (
          <button className="btn gold big" disabled={busy} onClick={go}>Roll to open</button>
        )}
        <div className="actions"><button className="btn ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function HereTab({ sid, c, data, session, chars }) {
  const [chest, setChest] = useState(null);
  const here = locOf(session, c.uid);
  const loc = data.locations?.find((l) => l.id === here);
  const tokens = session.state?.tokens ?? {};
  const nearby = Object.entries(tokens).filter(([, t]) => t.loc === here);
  const others = pcsAt(session, chars, here).filter((p) => p.uid !== c.uid);
  const paths = exitsOf(data, here, session.state?.map?.discovered ?? []);
  const qs = session.state?.quests ?? {};
  const mine = (data.quests ?? []).filter((q) => qs[q.id]?.uids?.includes(c.uid));
  const active = mine.filter((q) => qs[q.id].status === 'active');
  const finished = mine.filter((q) => qs[q.id].status !== 'active');

  return (
    <>
      {loc ? (
        <>
          <p className="muted small here-kicker">You are in</p>
          <h1 className="here-title">{loc.icon} {loc.name}</h1>
          <p className="muted">{loc.desc}</p>
          {(loc.actions ?? []).length > 0 && (
            <p className="here-ideas">{loc.actions.map((a) => <span key={a} className="tag">{a}</span>)}</p>
          )}
          {paths.length > 0 && (
            <p className="muted small">Paths from here: {paths.map((l) => `${l.icon} ${l.name}`).join(', ')}</p>
          )}
        </>
      ) : (
        <p className="notice">The DM hasn’t placed you on the map yet.</p>
      )}

      {loc && (
        <section className="nearby">
          <h2>Nearby</h2>
          {!nearby.length && !others.length && <p className="muted">Nothing and nobody else here.</p>}
          <ul className="rows">
            {others.map((p) => (
              <li key={p.uid}><span>🧑‍🎓 {p.name}</span><span className="muted small">{p.house}</span></li>
            ))}
            {nearby.map(([id, t]) => {
              if (t.kind === 'chest') {
                const tried = (t.tried ?? []).includes(c.uid);
                return (
                  <li key={id}>
                    <span>{t.icon} {t.name}</span>
                    {t.opened ? <span className="muted small">Empty</span>
                      : tried ? <span className="muted small">You couldn’t open it</span>
                        : <button className="btn small gold" onClick={() => setChest(id)}>Open</button>}
                  </li>
                );
              }
              if (t.kind === 'item') {
                return (
                  <li key={id}>
                    <span>{t.icon} {t.name}</span>
                    <button className="btn small teal" onClick={() => sendPickup(sid, c.uid, id)}>Pick up</button>
                  </li>
                );
              }
              if (t.kind === 'hazard') {
                return <li key={id}><span>{t.icon} {t.name}</span><span className="muted small">{t.used ? 'Used' : 'Tell the DM if you want to use it'}</span></li>;
              }
              if (isMonster(t)) {
                return (
                  <li key={id} className={t.hp <= 0 ? 'muted' : ''}>
                    <span>{t.icon} {t.name}</span>
                    <span className="small">{t.hp <= 0 ? 'Defeated' : `${t.hp}/${t.maxHp} HP`}</span>
                  </li>
                );
              }
              return <li key={id}><span>{t.icon} {t.name}</span><span className="muted small">Here</span></li>;
            })}
          </ul>
        </section>
      )}

      <section className="quests">
        <h2>Quests</h2>
        {!active.length && <p className="muted">No quests yet. Talk to people.</p>}
        {active.map((q) => (
          <div key={q.id} className={`quest-card ${q.main ? 'main' : ''}`}>
            <strong>{q.icon} {q.title}</strong>
            <p className="muted small">From {q.giver}. {q.desc}</p>
            <ul className="objectives">
              {q.objectives.map((o, i) => (
                <li key={o} className={qs[q.id].done.includes(i) ? 'done' : ''}>
                  {qs[q.id].done.includes(i) ? '✓' : '○'} {o}
                </li>
              ))}
            </ul>
            <p className="small reward">Reward: {rewardText(data, q.reward)}</p>
          </div>
        ))}
        {finished.length > 0 && (
          <p className="muted small">Finished: {finished.map((q) => `${q.title}${qs[q.id].status === 'failed' ? ' (failed)' : ' ✓'}`).join(', ')}</p>
        )}
      </section>

      {chest && tokens[chest] && <ChestRoll sid={sid} c={c} id={chest} t={tokens[chest]} onClose={() => setChest(null)} />}
    </>
  );
}
