import { useState } from 'react';
import { setField } from '../lib/game';

// Secret gifts: the one thing about a student that nobody at Hogwarts knows.
// The GM gives it from the Players tab (a preset from the campaign, edited if they like).
// Only that player sees it, on their Sheet. Nothing goes to the TV.

const EMPTY = { name: '', icon: '✨', always: '', daily: '', drawback: '' };
const pick = (g) => ({ name: g.name ?? '', icon: g.icon ?? '✨', always: g.always ?? '', daily: g.daily ?? '', drawback: g.drawback ?? '' });

export function GMSecretGift({ sid, c, data, dawn }) {
  const presets = data.gifts ?? {};
  // The preset made for this student's family comes first.
  const order = Object.entries(presets).sort(([, a], [, b]) => (b.family === c.family) - (a.family === c.family));
  const [open, setOpen] = useState(false);
  const [presetId, setPresetId] = useState(order[0]?.[0] ?? '');
  const [form, setForm] = useState(() => (c.gift ? pick(c.gift) : order[0] ? pick(order[0][1]) : EMPTY));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const choose = (id) => {
    setPresetId(id);
    setForm(id ? pick(presets[id]) : EMPTY);
  };
  const usedToday = c.gift && c.giftDawn === dawn;

  const save = async () => {
    await setField(sid, c.uid, 'gift', { ...pick(form), name: form.name.trim(), given: true });
    setOpen(false);
  };
  const remove = () => {
    if (confirm(`Take ${c.gift.name} away from ${c.firstName ?? c.name}?`)) setField(sid, c.uid, 'gift', null);
  };

  return (
    <div className="gift-gm">
      {c.gift ? (
        <div className="gift-row">
          <span className="gift-name">🤫 {c.gift.icon} {c.gift.name}</span>
          <label className="gift-used">
            <input type="checkbox" checked={!!usedToday} onChange={(e) => setField(sid, c.uid, 'giftDawn', e.target.checked ? dawn : null)} />
            Used today
          </label>
          <button className="linkish" onClick={() => { setForm(pick(c.gift)); setOpen(!open); }} aria-expanded={open}>{open ? 'Close' : 'Edit'}</button>
          <button className="linkish" onClick={remove}>Remove</button>
        </div>
      ) : (
        <button className="btn small ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
          🤫 {open ? 'Close' : 'Give a secret gift'}
        </button>
      )}
      {open && (
        <div className="gift-form">
          {!c.gift && order.length > 0 && (
            <label>Start from
              <select value={presetId} onChange={(e) => choose(e.target.value)}>
                {order.map(([id, g]) => <option key={id} value={id}>{g.icon} {g.name}{g.family === c.family ? ' (made for them)' : ''}</option>)}
                <option value="">Write my own</option>
              </select>
            </label>
          )}
          <div className="gift-title">
            <label>Icon<input value={form.icon} onChange={set('icon')} maxLength={4} /></label>
            <label>Name<input value={form.name} onChange={set('name')} placeholder="e.g. Spider-Speech" /></label>
          </div>
          <label>Always<textarea rows={2} value={form.always} onChange={set('always')} /></label>
          <label>Once a day<textarea rows={2} value={form.daily} onChange={set('daily')} /></label>
          <label>Drawback<textarea rows={3} value={form.drawback} onChange={set('drawback')} /></label>
          <button className="btn small gold" disabled={!form.name.trim()} onClick={save}>
            {c.gift ? 'Save changes' : `Give it to ${c.firstName ?? c.name}`}
          </button>
          <p className="muted small">Only they see it, on their Sheet. Nothing shows on the TV.</p>
        </div>
      )}
    </div>
  );
}

export function SecretGiftCard({ c, dawn }) {
  const g = c.gift;
  if (!g) return null;
  const usedToday = c.giftDawn === dawn;
  return (
    <section className="ability gift-card">
      <p className="gift-kicker">🤫 Your secret: nobody at Hogwarts knows</p>
      <h2>{g.icon} {g.name}</h2>
      {g.always && <p><span className="tag">Always</span>{g.always}</p>}
      {g.daily && <p><span className="tag">Once a day</span>{g.daily}</p>}
      {g.drawback && <p className="muted small"><span className="tag tag-warn">Drawback</span>{g.drawback}</p>}
      <p className="muted small gift-how">
        {usedToday ? 'Used today. It recharges after you sleep.' : 'To use it, tell the DM quietly or show them this card.'}
      </p>
    </section>
  );
}
