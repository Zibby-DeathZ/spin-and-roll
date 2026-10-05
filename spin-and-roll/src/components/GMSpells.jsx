import { useState } from 'react';
import Portrait from './Portrait';
import { forgetSpell, teachSpell } from '../lib/game';
import { diceLabel } from '../lib/dice';

const GROUPS = [['class', 'Taught in class'], ['extra', 'Other charms and jinxes'], ['advanced', 'Advanced magic']];
const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function rollText(sp) {
  const parts = [];
  if (sp.hit) parts.push(`d20 + ${sp.hit.toUpperCase()} to hit`);
  if (sp.check) parts.push(`d20 + ${sp.check.toUpperCase()} check`);
  if (sp.dice) parts.push(`${diceLabel(sp.dice)} ${sp.damage ? 'damage' : sp.effectLabel ?? ''}`.trim());
  return parts.join(', ') || 'No roll';
}

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function CustomSpell({ onMake }) {
  const [f, setF] = useState({ name: '', icon: '✨', mana: 3, kind: 'attack', stat: 'int', die: 6, count: 1, desc: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const make = () => {
    const sp = {
      id: `custom-${slug(f.name)}`, name: f.name.trim(), icon: f.icon || '✨', mana: Math.max(0, Number(f.mana) || 0),
      desc: f.desc.trim() || 'A spell of their own.', custom: true,
    };
    if (f.kind === 'attack') Object.assign(sp, { hit: f.stat, attack: true, dice: { count: Number(f.count) || 1, die: Number(f.die) }, damage: true });
    if (f.kind === 'effect') Object.assign(sp, { hit: f.stat, attack: true });
    if (f.kind === 'check') Object.assign(sp, { check: f.stat });
    if (f.kind === 'roll') Object.assign(sp, { dice: { count: Number(f.count) || 1, die: Number(f.die) }, effectLabel: 'rolled' });
    onMake(sp);
    setF({ ...f, name: '', desc: '' });
  };
  return (
    <div className="custom-spell">
      <h3>Make a custom spell</h3>
      <div className="custom-grid">
        <label>Name<input value={f.name} onChange={set('name')} placeholder="e.g. Lumos Solem" /></label>
        <label>Icon<input value={f.icon} onChange={set('icon')} maxLength={4} /></label>
        <label>Mana<input type="number" min="0" max="20" value={f.mana} onChange={set('mana')} /></label>
        <label>Type
          <select value={f.kind} onChange={set('kind')}>
            <option value="attack">Attack with damage</option>
            <option value="effect">Attack with an effect (no damage)</option>
            <option value="check">Check (d20 + stat)</option>
            <option value="roll">Roll a die (e.g. healing)</option>
            <option value="none">No roll</option>
          </select>
        </label>
        {f.kind !== 'roll' && f.kind !== 'none' && (
          <label>Stat<select value={f.stat} onChange={set('stat')}>{STATS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label>
        )}
        {(f.kind === 'attack' || f.kind === 'roll') && (
          <label>Dice
            <span className="dice-pick">
              <input type="number" min="1" max="4" value={f.count} onChange={set('count')} aria-label="How many dice" />
              <select value={f.die} onChange={set('die')} aria-label="Which die">{[4, 6, 8, 10, 12, 20].map((d) => <option key={d} value={d}>d{d}</option>)}</select>
            </span>
          </label>
        )}
        <label className="wide">What it does<input value={f.desc} onChange={set('desc')} placeholder="Shown on their spell card" /></label>
      </div>
      <button className="btn small gold" disabled={!f.name.trim()} onClick={make}>Teach this spell</button>
    </div>
  );
}

export default function GMSpells({ sid, data, session, chars }) {
  const players = session.playerUids.filter((u) => chars[u]);
  const [uid, setUid] = useState(players[0] ?? null);
  const [announce, setAnnounce] = useState(false);
  const [form, setForm] = useState('');
  const c = uid ? chars[uid] : null;
  const known = new Set((c?.spells ?? []).map((s) => s.id));
  const library = Object.entries(data.spells ?? {}).filter(([, s]) => !s.forbidden);

  const teach = (id, sp) => {
    const spell = { id, ...sp };
    if (sp.patronus && form.trim()) spell.form = form.trim();
    teachSpell(sid, uid, spell, announce);
  };

  if (!players.length) return <p className="muted">Spells can be taught once players have characters.</p>;

  return (
    <section className="gm-spells">
      <div className="spell-who">
        {players.map((u) => (
          <button key={u} className={`who-chip ${uid === u ? 'on' : ''}`} onClick={() => setUid(u)}>
            <Portrait family={chars[u].family} name={chars[u].name} className="chip-portrait" />
            {chars[u].firstName ?? chars[u].name}
            <span className="muted small">{(chars[u].spells ?? []).length} spells</span>
          </button>
        ))}
      </div>
      <label className="announce">
        <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />
        Announce on the TV (leave off for backstory secrets)
      </label>

      {(c?.spells ?? []).some((s) => s.custom) && (
        <>
          <h3>{c.firstName}’s own spells</h3>
          <ul className="spell-lib">
            {c.spells.filter((s) => s.custom).map((s) => (
              <li key={s.id} className="known">
                <span className="item-icon">{s.icon}</span>
                <span className="spell-info"><strong>{s.name}</strong><span className="muted small">{s.mana} mana. {rollText(s)}. {s.desc}</span></span>
                <button className="btn small ghost" onClick={() => forgetSpell(sid, uid, s.id)}>Remove</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {GROUPS.map(([g, label]) => (
        <div key={g}>
          <h3>{label}</h3>
          <ul className="spell-lib">
            {library.filter(([, s]) => (s.group ?? 'extra') === g).map(([id, s]) => {
              const has = known.has(id);
              const mine = c?.spells?.find((x) => x.id === id);
              return (
                <li key={id} className={has ? 'known' : ''}>
                  <span className="item-icon">{s.icon}</span>
                  <span className="spell-info">
                    <strong>{s.name}{mine?.form ? ` (${mine.form})` : ''}</strong>
                    <span className="muted small">{s.mana} mana. {rollText(s)}. {s.desc}</span>
                    {s.patronus && !has && (
                      <input className="form-input" value={form} onChange={(e) => setForm(e.target.value)} placeholder="Patronus form, e.g. otter" aria-label="Patronus form" />
                    )}
                  </span>
                  {has
                    ? <button className="btn small ghost" onClick={() => forgetSpell(sid, uid, id)}>Remove</button>
                    : <button className="btn small gold" onClick={() => teach(id, s)}>Teach</button>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <CustomSpell onMake={(sp) => teachSpell(sid, uid, sp, announce)} />
      <p className="muted small">The Killing Curse isn’t here on purpose. It stays secret, on the Players tab under Edit stats and limits.</p>
    </section>
  );
}
