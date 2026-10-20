import { useEffect, useState } from 'react';
import Art from '../components/Art';

// Befriend the Beast: choose the right approach before time runs out. 5 creatures, 4 right to pass.
const SCENES = [
  { id: 'hippogriff', icon: '🦅', name: 'Hippogriff', q: 'A Hippogriff stares at you, unblinking.', right: 'Bow low and wait for it to bow back', wrong: ['Pat its beak to say hello', 'Stare back to show you’re not scared'] },
  { id: 'bowtruckle', icon: '🌿', name: 'Bowtruckle', q: 'A Bowtruckle guards the branch you need for your wand.', right: 'Offer it a handful of woodlice', wrong: ['Shake the branch until it lets go', 'Snap the branch off quickly'] },
  { id: 'niffler', icon: '🦫', name: 'Niffler', q: 'A Niffler is sniffing at your pockets.', right: 'Hide anything shiny before it dives in', wrong: ['Grab it by the tail', 'Let it take a coin, it’ll leave'] },
  { id: 'puffskein', icon: '🧶', name: 'Puffskein', q: 'A Puffskein curls into a tight ball.', right: 'Hum to it softly', wrong: ['Poke it to check it’s alive', 'Roll it back to its basket'] },
  { id: 'kneazle', icon: '🐈', name: 'Kneazle', q: 'Your friend’s Kneazle hisses at a stranger.', right: 'Keep your distance from the stranger', wrong: ['Scold the Kneazle', 'Pick the Kneazle up to calm it'] },
  { id: 'fwooper', icon: '🐦', name: 'Fwooper', q: 'A Fwooper starts to sing.', right: 'Cover your ears and walk away', wrong: ['Sing along with it', 'Move closer to listen'] },
  { id: 'occamy', icon: '🐉', name: 'Occamy', q: 'An Occamy starts growing to fill the room.', right: 'Back away and give it space', wrong: ['Shut it in a small box', 'Shout to scare it smaller'] },
  { id: 'demiguise', icon: '🐒', name: 'Demiguise', q: 'A Demiguise vanishes right in front of you.', right: 'Do something it can’t predict', wrong: ['Chase where it just was', 'Throw a net over the spot'] },
  { id: 'erumpent', icon: '🦏', name: 'Erumpent', q: 'An Erumpent’s horn begins to glow.', right: 'Don’t touch the horn, and back off', wrong: ['Grab the horn to steady it', 'Tap the horn to calm it'] },
  { id: 'thestral', icon: '🐴', name: 'Thestral', q: 'A Thestral steps out of the trees.', right: 'Offer it raw meat, slowly', wrong: ['Offer it an apple', 'Try to climb on its back'] },
  { id: 'swooping-evil', icon: '🦋', name: 'Swooping Evil', q: 'A spiky green cocoon on the windowsill snaps open into a Swooping Evil, its huge wings spreading over you.', right: 'Stay calm and coax it back into its cocoon', wrong: ['Swat it away with your book', 'Duck under it and run for the door'] },
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
      <div key={i} className="bestiary-page">
        <Art path={`creatures/${s.id}`} icon={s.icon} className="beast-portrait" />
        <p className="beast-name">{s.name}</p>
        <p className="mg-scene">{s.q}</p>
        <div className="hourglass" aria-hidden="true"><span style={{ height: `${(left / limit) * 100}%` }} /></div>
      </div>
      <div className="beast-options">
        {s.options.map((o) => (
          <button key={o} onClick={() => choose(o)}
            className={`beast-opt ${picked ? (o === s.right ? 'right' : o === picked ? 'wrong' : 'dim') : ''}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}
