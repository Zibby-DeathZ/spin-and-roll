import { useEffect, useState } from 'react';

// Befriend the Beast: choose the right approach before time runs out. 5 creatures, 4 right to pass.
const SCENES = [
  { q: 'A Hippogriff stares at you, unblinking.', right: 'Bow low and wait for it to bow back', wrong: ['Pat its beak to say hello', 'Stare back to show you’re not scared'] },
  { q: 'A Bowtruckle guards the branch you need for your wand.', right: 'Offer it a handful of woodlice', wrong: ['Shake the branch until it lets go', 'Snap the branch off quickly'] },
  { q: 'A Niffler is sniffing at your pockets.', right: 'Hide anything shiny before it dives in', wrong: ['Grab it by the tail', 'Let it take a coin, it’ll leave'] },
  { q: 'A Puffskein curls into a tight ball.', right: 'Hum to it softly', wrong: ['Poke it to check it’s alive', 'Roll it back to its basket'] },
  { q: 'Your friend’s Kneazle hisses at a stranger.', right: 'Keep your distance from the stranger', wrong: ['Scold the Kneazle', 'Pick the Kneazle up to calm it'] },
  { q: 'A Fwooper starts to sing.', right: 'Cover your ears and walk away', wrong: ['Sing along with it', 'Move closer to listen'] },
  { q: 'An Occamy starts growing to fill the room.', right: 'Back away and give it space', wrong: ['Shut it in a small box', 'Shout to scare it smaller'] },
  { q: 'A Demiguise vanishes right in front of you.', right: 'Do something it can’t predict', wrong: ['Chase where it just was', 'Throw a net over the spot'] },
  { q: 'An Erumpent’s horn begins to glow.', right: 'Don’t touch the horn, and back off', wrong: ['Grab the horn to steady it', 'Tap the horn to calm it'] },
  { q: 'A Thestral steps out of the trees.', right: 'Offer it raw meat, slowly', wrong: ['Offer it an apple', 'Try to climb on its back'] },
  { q: 'A Murtlap bites your hand.', right: 'Soak it in Murtlap essence', wrong: ['Ignore it, it’s harmless', 'Bite it back'] },
];
const ROUNDS = 5, NEED = 4;

export default function Creatures({ diff, onFinish }) {
  const limit = [12, 9, 6][diff - 1];
  const [deck] = useState(() => [...SCENES].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    .map((s) => ({ ...s, options: [s.right, ...s.wrong].sort(() => Math.random() - 0.5) })));
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [left, setLeft] = useState(limit);
  const [picked, setPicked] = useState(null);

  const choose = (opt) => {
    if (picked) return;
    setPicked(opt ?? '__timeout');
    const ok = opt === deck[i].right;
    const r = right + (ok ? 1 : 0);
    setRight(r);
    setTimeout(() => {
      const wrongSoFar = i + 1 - r;
      if (wrongSoFar > ROUNDS - NEED) { onFinish(false, `${r}/${ROUNDS} befriended`); return; }
      if (i + 1 === ROUNDS) { onFinish(true, `${r}/${ROUNDS} befriended`); return; }
      setI(i + 1); setPicked(null); setLeft(limit);
    }, 1100);
  };

  useEffect(() => {
    if (picked) return undefined;
    if (left <= 0) { choose(null); return undefined; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  });

  const s = deck[i];
  return (
    <div className="mg">
      <p className="mg-status">Creature {i + 1} of {ROUNDS}. Befriended {right} (need {NEED}). ⏱ {left}s</p>
      <p className="mg-scene">{s.q}</p>
      <div className="ceremony-options">
        {s.options.map((o) => (
          <button key={o} onClick={() => choose(o)}
            className={`btn big ${picked ? (o === s.right ? 'teal' : o === picked ? 'ember' : '') : ''}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}
