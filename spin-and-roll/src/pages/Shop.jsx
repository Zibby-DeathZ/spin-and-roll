import { useState } from 'react';
import { bonusText, buy, shopEntry } from '../lib/game';

export default function Shop({ sid, c, data, open }) {
  const [pending, setPending] = useState(null);
  const cur = data.currency;
  const eq = c.equipment ?? {};

  const purchase = async (id) => {
    setPending(id);
    try { await buy(sid, c.uid, id); } finally { setTimeout(() => setPending(null), 1500); }
  };

  return (
    <>
      <div className="shop-head">
        <h1>Diagon Alley</h1>
        <p className="gold-line">{cur.icon} {c.gold} {cur.name}</p>
      </div>

      <ul className="checklist" aria-label="School list">
        {data.required.map(([slot, label]) => (
          <li key={slot} className={eq[slot] ? 'done' : ''}>
            <span aria-hidden="true">{eq[slot] ? '✓' : '○'}</span> {label}
          </li>
        ))}
      </ul>

      {!open && <p className="notice">The shops are closed right now. The DM opens them when you reach Diagon Alley.</p>}

      <section className="shop">
        <h2>Ollivanders</h2>
        <div className="shop-item">
          <span className="item-icon">🪄</span>
          <span className="shop-info">
            <strong>{eq.wand ? eq.wand.name : 'The wand chooses the wizard'}</strong>
            <span className="muted small">
              {eq.wand ? bonusText(eq.wand.bonus) : `Mr Ollivander will ask you a few questions. ${data.wandPrice} ${cur.name}.`}
            </span>
          </span>
        </div>
      </section>

      {data.shops.map((shop) => (
        <section key={shop.name} className="shop">
          <h2>{shop.name}</h2>
          {shop.stock.map((s) => {
            const e = shopEntry(data, s.id);
            const owned = e.slot && eq[e.slot]?.id === e.id;
            const swapping = e.slot && eq[e.slot] && !owned;
            const broke = c.gold < e.price;
            return (
              <div key={e.id} className="shop-item">
                <span className="item-icon">{e.icon}</span>
                <span className="shop-info">
                  <strong>{e.name}</strong>
                  <span className="muted small">{e.desc ?? e.note ?? bonusText(e.effect)}</span>
                  {swapping && <span className="small warn">Replaces your {eq[e.slot].name}</span>}
                </span>
                <span className="shop-buy">
                  <span className="price">{e.price} {cur.icon}</span>
                  <button className="btn small gold" disabled={!open || owned || broke || pending === e.id}
                    onClick={() => purchase(e.id)}>
                    {owned ? 'Owned' : pending === e.id ? 'Buying…' : broke ? 'Too pricey' : 'Buy'}
                  </button>
                </span>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
