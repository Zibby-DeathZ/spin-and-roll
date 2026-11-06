import { useState } from 'react';
import { deleteField } from 'firebase/firestore';
import { setField } from '../lib/game';

// Relics: legendary and mythic magical objects. The GM gives them from the Players tab (a preset from the
// campaign, edited if they like, or one made up on the spot). The phone shows each as a card on the Sheet.
// A student can hold several. Nothing is announced on the TV.

const EMPTY = { rarity: 'Legendary', name: '', icon: '✨', lore: '', always: '', daily: '', drawback: '' };
const pick = (g) => ({
  rarity: g.rarity ?? 'Legendary', name: g.name ?? '', icon: g.icon ?? '✨', lore: g.lore ?? '',
  always: g.always ?? '', daily: g.daily ?? '', drawback: g.drawback ?? '',
});
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function GMRelics({ sid, c, data, dawn, holders = {} }) {
  const presets = data.relics ?? {};
  const held = c.relics ?? {};
  const [open, setOpen] = useState(false);
  const [presetId, setPresetId] = useState('');
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const choose = (id) => {
    setPresetId(id);
    setForm(id ? pick(presets[id]) : EMPTY);
  };
  const give = async () => {
    const id = presetId || `relic-${slug(form.name)}`;
    await setField(sid, c.uid, `relics.${id}`, { ...pick(form), name: form.name.trim(), usedDawn: null });
    setOpen(false);
    setPresetId('');
    setForm(EMPTY);
  };
  const who = c.firstName ?? c.name;

  return (
    <div className="relics-gm">
      {Object.entries(held).map(([id, r]) => (
        <div key={id} className={`gift-row relic-row rarity-${(r.rarity ?? 'legendary').toLowerCase()}`}>
          <span className="gift-name">{r.icon} {r.name} <span className="relic-rarity">{r.rarity}</span></span>
          <label className="gift-used">
            <input type="checkbox" checked={r.usedDawn === dawn} onChange={(e) => setField(sid, c.uid, `relics.${id}.usedDawn`, e.target.checked ? dawn : null)} />
            Used today
          </label>
          <button className="linkish" onClick={() => confirm(`Take ${r.name} away from ${who}?`) && setField(sid, c.uid, `relics.${id}`, deleteField())}>Remove</button>
        </div>
      ))}
      <button className="btn small ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
        🏺 {open ? 'Close' : 'Give a relic'}
      </button>
      {open && (
        <div className="gift-form">
          <label>Relic
            <select value={presetId} onChange={(e) => choose(e.target.value)}>
              <option value="">Make one up</option>
              {Object.entries(presets).map(([id, r]) => (
                <option key={id} value={id}>
                  {r.icon} {r.name} ({r.rarity}){holders[id] ? `: held by ${holders[id]}` : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="gift-title relic-title">
            <label>Icon<input value={form.icon} onChange={set('icon')} maxLength={4} /></label>
            <label>Name<input value={form.name} onChange={set('name')} placeholder="e.g. The Moonlit Compass" /></label>
            <label>Rarity
              <select value={form.rarity} onChange={set('rarity')}>
                <option>Legendary</option>
                <option>Mythic</option>
              </select>
            </label>
          </div>
          <label>The story<textarea rows={2} value={form.lore} onChange={set('lore')} /></label>
          <label>Always<textarea rows={2} value={form.always} onChange={set('always')} placeholder="Leave empty if it only works when used" /></label>
          <label>When used<textarea rows={2} value={form.daily} onChange={set('daily')} /></label>
          <label>Drawback<textarea rows={3} value={form.drawback} onChange={set('drawback')} /></label>
          {presetId && presets[presetId]?.found && <p className="muted small">Where it could turn up: {presets[presetId].found}</p>}
          <button className="btn small gold" disabled={!form.name.trim() || (presetId && held[presetId])} onClick={give}>
            Give it to {who}
          </button>
          <p className="muted small">It shows on their Sheet. Nothing is announced on the TV, so hand it over in the story first.</p>
        </div>
      )}
    </div>
  );
}

export function RelicCards({ c, dawn }) {
  const list = Object.values(c.relics ?? {});
  if (!list.length) return null;
  return (
    <>
      {list.map((r) => (
        <section key={r.name} className={`ability relic-card rarity-${(r.rarity ?? 'legendary').toLowerCase()}`}>
          <p className="relic-kicker">{r.rarity} relic</p>
          <h2>{r.icon} {r.name}</h2>
          {r.lore && <p className="relic-lore">{r.lore}</p>}
          {r.always && <p><span className="tag">Always</span>{r.always}</p>}
          {r.daily && <p><span className="tag">When used</span>{r.daily}</p>}
          {r.drawback && <p className="muted small"><span className="tag tag-warn">Drawback</span>{r.drawback}</p>}
          <p className="muted small gift-how">
            {r.usedDawn === dawn ? 'Used today.' : 'To use it, tell the DM, or show them this card.'}
          </p>
        </section>
      ))}
    </>
  );
}
