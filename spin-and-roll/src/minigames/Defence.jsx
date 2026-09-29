import { useEffect, useRef, useState } from 'react';

// Duel Reflexes: red → Shield, blue → Dodge, gold → Counter. 10 spells, 2 mistakes allowed.
const KINDS = [
  { color: 'red', answer: 'shield' },
  { color: 'blue', answer: 'dodge' },
  { color: 'gold', answer: 'counter' },
];
const NAMES = ['Stupefy', 'Flipendo', 'Rictusempra', 'Tarantallegra', 'Petrificus', 'Locomotor', 'Impedimenta', 'Confundo'];
const ROUNDS = 10, MISTAKES = 2;

export default function Defence({ diff, onFinish }) {
  const limit = [2000, 1450, 1050][diff - 1];
  const make = () => ({
    ...KINDS[Math.floor(Math.random() * 3)],
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    // Hardest duels sometimes print a misleading word; trust the colour.
    fake: diff === 3 && Math.random() < 0.4 ? ['RED', 'BLUE', 'GOLD'][Math.floor(Math.random() * 3)] : null,
  });
  const [spell, setSpell] = useState(make);
  const [round, setRound] = useState(1);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(limit);
  const [flash, setFlash] = useState(null);
  const locked = useRef(false);

  const answer = (a) => {
    if (locked.current) return;
    locked.current = true;
    const ok = a === spell.answer;
    const w = wrong + (ok ? 0 : 1);
    setWrong(w);
    setFlash(ok ? 'good' : 'bad');
    setTimeout(() => {
      setFlash(null);
      if (w > MISTAKES) { onFinish(false, `${round - w}/${ROUNDS} blocked`); return; }
      if (round === ROUNDS) { onFinish(true, `${ROUNDS - w}/${ROUNDS} blocked`); return; }
      setRound((r) => r + 1);
      setSpell(make());
      setLeft(limit);
      locked.current = false;
    }, 350);
  };

  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 50), 50);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (left <= 0 && !locked.current) answer('timeout'); });

  return (
    <div className={`mg duel ${flash ?? ''}`}>
      <p className="mg-status">Spell {round} of {ROUNDS}. Mistakes {wrong} / {MISTAKES}</p>
      <div className={`bolt bolt-${spell.color}`}>
        <span>{spell.fake ?? spell.name}</span>
      </div>
      <div className="timer"><span style={{ width: `${Math.max(0, (left / limit) * 100)}%` }} /></div>
      <div className="duel-btns">
        <button className="btn big red" onClick={() => answer('shield')}>🛡️ Shield</button>
        <button className="btn big blue" onClick={() => answer('dodge')}>💨 Dodge</button>
        <button className="btn big goldb" onClick={() => answer('counter')}>⚡ Counter</button>
      </div>
    </div>
  );
}
