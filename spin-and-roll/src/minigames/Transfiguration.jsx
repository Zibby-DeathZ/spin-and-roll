import { useState } from 'react';

// Matching Pairs: match each object with what it becomes, within the move limit.
const PAIRS = [
  ['🪵 Matchstick', '🪡 Needle'], ['🐀 Rat', '🏆 Goblet'], ['🪲 Beetle', '🔘 Button'],
  ['🦔 Hedgehog', '📌 Pincushion'], ['🐦 Sparrow', '🪶 Quill'], ['🐢 Tortoise', '🫖 Teapot'],
  ['🐇 Rabbit', '🎩 Top hat'], ['🍂 Leaf', '🦋 Butterfly'],
];

export default function Transfiguration({ diff, onFinish }) {
  const n = [5, 6, 7][diff - 1];
  const limit = [15, 16, 17][diff - 1];
  const [cards] = useState(() => {
    const picked = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, n);
    return picked.flatMap(([a, b], i) => [{ pair: i, text: a }, { pair: i, text: b }]).sort(() => Math.random() - 0.5);
  });
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  const flip = (i) => {
    if (busy || open.includes(i) || matched.includes(cards[i].pair)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    const m = moves + 1;
    setMoves(m);
    const [a, b] = next;
    if (cards[a].pair === cards[b].pair) {
      const mm = [...matched, cards[a].pair];
      setMatched(mm);
      setOpen([]);
      if (mm.length === n) onFinish(true, `${m} moves`);
      else if (m >= limit) onFinish(false, `${mm.length}/${n} pairs`);
    } else {
      setBusy(true);
      setTimeout(() => {
        setOpen([]);
        setBusy(false);
        if (m >= limit) onFinish(false, `${matched.length}/${n} pairs`);
      }, 750);
    }
  };

  return (
    <div className="mg">
      <p className="mg-status">Pairs {matched.length} / {n}. Moves {moves} / {limit}</p>
      <div className="cards">
        {cards.map((c, i) => {
          const show = open.includes(i) || matched.includes(c.pair);
          return (
            <button key={i} className={`card ${show ? 'show' : ''} ${matched.includes(c.pair) ? 'matched' : ''}`} onClick={() => flip(i)}>
              {show ? c.text : '✦'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
