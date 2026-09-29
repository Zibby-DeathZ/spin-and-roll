import { useRef, useState } from 'react';
import { castSpell, defenceOf, fmtMod, mod, statOf, STATS } from '../lib/game';
import { damageBonus, sendAttack, sendRoll, spellDef, STRIKE } from '../lib/combat';
import { DICE, diceLabel, rollD20, rollDice, rollDie } from '../lib/dice';

// Shows a number that tumbles for a moment before landing.
function useTumble() {
  const [shown, setShown] = useState(null);
  const [rolling, setRolling] = useState(false);
  const timer = useRef(null);
  const tumble = (die, final) => new Promise((resolve) => {
    setRolling(true);
    clearInterval(timer.current);
    timer.current = setInterval(() => setShown(rollDie(die)), 60);
    setTimeout(() => {
      clearInterval(timer.current);
      setShown(final);
      setRolling(false);
      resolve();
    }, 750);
  });
  return { shown, rolling, tumble, setShown };
}

function ModeToggle({ mode, setMode }) {
  return (
    <div className="seg" role="group" aria-label="Advantage">
      {[['dis', 'Disadvantage'], ['normal', 'Normal'], ['adv', 'Advantage']].map(([m, l]) => (
        <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{l}</button>
      ))}
    </div>
  );
}

function FreeRoller({ sid, c }) {
  const [die, setDie] = useState(20);
  const [stat, setStat] = useState('');
  const [mode, setMode] = useState('normal');
  const { shown, rolling, tumble } = useTumble();
  const [last, setLast] = useState(null);

  const go = async () => {
    const m = stat ? mod(statOf(c, stat)) : 0;
    let rolls, nat;
    if (die === 20) ({ rolls, nat } = rollD20(mode));
    else { rolls = rollDice({ die }).rolls; nat = rolls[0]; }
    await tumble(die, nat);
    const total = nat + m;
    const label = `d${die}${stat ? ` + ${stat.toUpperCase()}` : ''}`;
    setLast({ total, label, rolls, m });
    await sendRoll(sid, c.uid, { label, rolls, mod: m, total, mode: die === 20 ? mode : 'normal' });
  };

  return (
    <section className="roller">
      <h2>Roll dice</h2>
      <div className="dice-row">
        {DICE.map((d) => (
          <button key={d} className={`die ${die === d ? 'on' : ''}`} onClick={() => setDie(d)} aria-pressed={die === d}>d{d}</button>
        ))}
      </div>
      <label className="gold-row">
        Add a stat
        <select value={stat} onChange={(e) => setStat(e.target.value)}>
          <option value="">None</option>
          {STATS.map(([k, l]) => <option key={k} value={k}>{l} ({fmtMod(mod(statOf(c, k)))})</option>)}
        </select>
      </label>
      {die === 20 && <ModeToggle mode={mode} setMode={setMode} />}
      <div className="roll-out">
        <span className={`big-die ${rolling ? 'rolling' : ''}`}>{shown ?? '–'}</span>
        {last && !rolling && <span className="muted">{last.label} = <strong>{last.total}</strong></span>}
      </div>
      <button className="btn gold big" disabled={rolling} onClick={go}>Roll d{die}</button>
    </section>
  );
}

function badges(sp, c) {
  const out = [];
  if (sp.hit) out.push(`d20 ${fmtMod(mod(statOf(c, sp.hit)))} to hit (${sp.hit.toUpperCase()})`);
  if (sp.check) out.push(`d20 ${fmtMod(mod(statOf(c, sp.check)))} check (${sp.check.toUpperCase()})`);
  if (sp.dice) {
    const b = sp.damage ? damageBonus(c, sp) : 0;
    out.push(`${diceLabel(sp.dice)}${b ? ` + ${b}` : ''} ${sp.damage ? 'damage' : sp.effectLabel ?? ''}`);
  }
  if (sp.kill) out.push('Kills on a hit');
  return out;
}

// The step-by-step cast: pick a target, roll to hit, roll the spell's die.
function CastFlow({ sid, c, sp, targets, onClose }) {
  const [target, setTarget] = useState(null);
  const [mode, setMode] = useState('normal');
  const [hit, setHit] = useState(null); // { nat, total, rolls, success }
  const [dmg, setDmg] = useState(null);
  const [done, setDone] = useState(false);
  const { shown, rolling, tumble } = useTumble();

  const finishAttack = async (h, d) => {
    await sendAttack(sid, c.uid, {
      spellId: sp.id, targetKind: target.kind, targetId: target.id,
      nat: h.nat, hitTotal: h.total, hitRolls: h.rolls, mode,
      dmgRolls: d?.rolls ?? [], dmgTotal: d?.total ?? 0,
    });
    setDone(true);
  };

  const rollHit = async () => {
    const r = rollD20(mode);
    await tumble(20, r.nat);
    const total = r.nat + mod(statOf(c, sp.hit));
    const success = r.nat === 20 || (r.nat !== 1 && total >= target.defence);
    const h = { ...r, total, success };
    setHit(h);
    if (!success || !sp.dice || !sp.damage) await finishAttack(h, null);
  };

  const rollDmg = async () => {
    const r = rollDice(sp.dice);
    await tumble(sp.dice.die, r.rolls[0]);
    const d = { rolls: r.rolls, total: r.total + damageBonus(c, sp) };
    setDmg(d);
    await finishAttack(hit, d);
  };

  // Non-attack spells: a check or an effect die, then announce.
  const rollUtility = async () => {
    let rolled = null, rollLabel = '';
    if (sp.check) {
      const r = rollD20(mode);
      await tumble(20, r.nat);
      rolled = r.nat + mod(statOf(c, sp.check));
      rollLabel = `on the ${sp.check.toUpperCase()} check`;
    } else if (sp.dice) {
      const r = rollDice(sp.dice);
      await tumble(sp.dice.die, r.rolls[0]);
      rolled = r.total;
      rollLabel = sp.effectLabel ?? '';
    }
    await castSpell(sid, c.uid, sp.id, rolled != null ? { rolled, rollLabel } : {});
    setDmg({ total: rolled });
    setDone(true);
  };

  const needsTarget = sp.attack && !target;

  return (
    <div className="sheet-overlay" role="dialog" aria-label={`Cast ${sp.name}`}>
      <div className="sheet-panel">
        <h3>{sp.icon} {sp.name}</h3>
        {sp.forbidden && <p className="warn small">If anyone sees this, you will be expelled.</p>}

        {needsTarget ? (
          <>
            <p className="muted">Choose a target:</p>
            {!targets.length && <p className="muted">There’s nobody here to target.</p>}
            <ul className="rows">
              {targets.map((t) => (
                <li key={t.kind + t.id}>
                  <button className="target-btn" onClick={() => setTarget(t)}>
                    <span>{t.icon} {t.name}</span>
                    <span className="muted small">Defence {t.defence}{t.hp != null ? `, ${t.hp} HP` : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            {target && <p>Target: <strong>{target.icon} {target.name}</strong>, Defence {target.defence}</p>}
            {(sp.hit || sp.check) && !hit && !done && <ModeToggle mode={mode} setMode={setMode} />}
            <div className="roll-out">
              <span className={`big-die ${rolling ? 'rolling' : ''}`}>{shown ?? '–'}</span>
              {hit && !rolling && (
                <span className={hit.success ? 'hit' : 'miss'}>
                  {hit.total} vs {target.defence}: {hit.success ? 'HIT!' : 'MISS'}
                  {hit.nat === 20 && ' Natural 20!'}{hit.nat === 1 && ' Natural 1!'}
                </span>
              )}
              {dmg && !rolling && <span className="muted">{sp.attack ? `${dmg.total} damage` : `Rolled ${dmg.total}`}</span>}
            </div>

            {!done && sp.attack && !hit && (
              <button className="btn gold big" disabled={rolling} onClick={rollHit}>Roll d20 to hit</button>
            )}
            {!done && sp.attack && hit?.success && sp.dice && sp.damage && !dmg && (
              <button className="btn gold big" disabled={rolling} onClick={rollDmg}>Roll {diceLabel(sp.dice)} damage</button>
            )}
            {!done && !sp.attack && (
              <button className="btn gold big" disabled={rolling} onClick={rollUtility}>
                {sp.check ? 'Roll d20 check' : sp.dice ? `Roll ${diceLabel(sp.dice)}` : `Cast ${sp.name}`}
              </button>
            )}
            {done && <p className="muted">Sent to the table.</p>}
          </>
        )}
        <div className="actions">
          <button className="btn ghost" onClick={onClose}>{done ? 'Close' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  );
}

export default function DiceTab({ sid, c, data, session, chars }) {
  const [casting, setCasting] = useState(null);
  const loc = session.state?.map?.loc;
  const tokens = session.state?.tokens ?? {};
  const targets = [
    ...Object.entries(tokens)
      .filter(([, t]) => t.loc === loc && !t.npc && t.hp > 0)
      .map(([id, t]) => ({ kind: 'mon', id, name: t.name, icon: t.icon, defence: t.defence, hp: t.hp })),
    ...Object.values(chars).filter((o) => o.uid !== c.uid)
      .map((o) => ({ kind: 'pc', id: o.uid, name: o.name, icon: '🧑‍🎓', defence: defenceOf(o) })),
  ];
  const spells = [STRIKE, ...(c.spells ?? []).map((sp) => spellDef(data, sp))];
  const ko = c.hp <= 0;

  return (
    <>
      <FreeRoller sid={sid} c={c} />
      <section className="spells">
        <h2>Spells and attacks</h2>
        <p className="muted small">Mana: {c.mana} / {c.maxMana}</p>
        <ul className="rows">
          {spells.map((sp) => (
            <li key={sp.id} className={`item-row spell-card ${sp.forbidden ? 'forbidden' : ''}`}>
              <span className="item-name">
                <span className="item-icon">{sp.icon}</span>
                <span>
                  <strong>{sp.name}</strong> <span className="muted small">{sp.mana ? `${sp.mana} mana` : 'free'}</span>
                  <br /><span className="badges">{badges(sp, c).map((b) => <span key={b} className="badge-pill">{b}</span>)}</span>
                  <br /><span className="muted small">{sp.desc}</span>
                </span>
              </span>
              <button className="btn small gold" disabled={ko || c.mana < (sp.mana ?? 0)} onClick={() => setCasting(sp)}>
                {sp.attack ? 'Attack' : 'Cast'}
              </button>
            </li>
          ))}
        </ul>
        {ko && <p className="warn">You’re knocked out. Someone needs to heal you.</p>}
      </section>
      {casting && <CastFlow sid={sid} c={c} sp={casting} targets={targets} onClose={() => setCasting(null)} />}
    </>
  );
}
