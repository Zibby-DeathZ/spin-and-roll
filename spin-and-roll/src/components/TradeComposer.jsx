import { useState } from 'react';

function Picker({ title, inv, picks, setPicks }) {
  const change = (id, d, max) =>
    setPicks((p) => ({ ...p, [id]: Math.max(0, Math.min(max, (p[id] ?? 0) + d)) }));
  return (
    <div className="picker">
      <h4>{title}</h4>
      {inv.length === 0 && <p className="muted small">Nothing in this bag.</p>}
      {inv.map((i) => (
        <div key={i.id} className="pick-row">
          <span>{i.icon} {i.name} <span className="muted">×{i.qty}</span></span>
          <span className="stepper">
            <button type="button" onClick={() => change(i.id, -1, i.qty)} aria-label={`Less ${i.name}`}>−</button>
            <strong>{picks[i.id] ?? 0}</strong>
            <button type="button" onClick={() => change(i.id, 1, i.qty)} aria-label={`More ${i.name}`}>+</button>
          </span>
        </div>
      ))}
    </div>
  );
}

const toList = (picks) =>
  Object.entries(picks).filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty }));

// mode 'trade' shows both sides; 'gift' only shows your own bag.
export default function TradeComposer({ me, them, currency, mode = 'trade', onSend, onClose }) {
  const [give, setGive] = useState({});
  const [want, setWant] = useState({});
  const [giveGold, setGiveGold] = useState(0);
  const [wantGold, setWantGold] = useState(0);
  const [sending, setSending] = useState(false);

  const offer = { items: toList(give), gold: Number(giveGold) || 0 };
  const request = mode === 'gift' ? { items: [], gold: 0 } : { items: toList(want), gold: Number(wantGold) || 0 };
  const empty = !offer.items.length && !offer.gold && !request.items.length && !request.gold;

  const send = async () => {
    setSending(true);
    try { await onSend(offer, request); onClose(); } finally { setSending(false); }
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-label={`Trade with ${them.name}`}>
      <div className="sheet-panel">
        <h3>{mode === 'gift' ? `Give to ${them.name}` : `Trade with ${them.name}`}</h3>
        <Picker title="You give" inv={me.inventory ?? []} picks={give} setPicks={setGive} />
        <label className="gold-row">
          {currency.icon} {currency.name} to give
          <input type="number" min="0" max={me.gold} value={giveGold}
            onChange={(e) => setGiveGold(Math.max(0, Math.min(me.gold, e.target.value)))} />
        </label>
        {mode === 'trade' && (
          <>
            <Picker title="You ask for" inv={them.inventory ?? []} picks={want} setPicks={setWant} />
            <label className="gold-row">
              {currency.icon} {currency.name} to ask for
              <input type="number" min="0" max={them.gold} value={wantGold}
                onChange={(e) => setWantGold(Math.max(0, Math.min(them.gold, e.target.value)))} />
            </label>
          </>
        )}
        <div className="actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn gold" disabled={empty || sending} onClick={send}>
            {sending ? 'Sending…' : mode === 'gift' ? 'Send gift' : 'Send offer'}
          </button>
        </div>
      </div>
    </div>
  );
}
