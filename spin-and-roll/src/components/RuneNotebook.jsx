// The rune notebook on a player's phone: every rune, with the letters the party has worked out in ink.
// Nothing to fill in here: the players work the runes out on paper, tell the DM, and when the DM confirms
// a tablet (Puzzles tab, Rune notebook) the ink appears on every phone at once.
import { useEffect } from 'react';
import { RUNE_ALPHABET } from '../lib/puzzles';

// What this player can read: only what the DM has confirmed.
export function readerFor(known = []) {
  const ink = Object.fromEntries(RUNE_ALPHABET.filter((r) => known.includes(r.letter)).map((r) => [r.rune, r.letter]));
  return (rune) => (ink[rune] ? { letter: ink[rune], ink: true } : null);
}

export default function RuneNotebook({ known = [], onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  const read = readerFor(known);
  const inked = RUNE_ALPHABET.filter((r) => known.includes(r.letter)).length;
  return (
    <div className="clue-overlay" role="dialog" aria-modal="true" aria-label="Rune notebook" onClick={onClose}>
      <div className="clue-sheet notebook" onClick={(e) => e.stopPropagation()}>
        <p className="clue-title">📖 Rune notebook</p>
        <p className="nb-count">{inked} of 26 worked out</p>
        <div className="nb-grid">
          {RUNE_ALPHABET.map(({ rune }) => {
            const r = read(rune);
            return (
              <div key={rune} className={`nb-cell ${r ? 'ink' : ''}`} aria-label={r ? `${rune}: ${r.letter}` : `${rune}: not worked out yet`}>
                <span className="nb-rune">{rune}</span>
                <span className="nb-letter">{r?.letter ?? '?'}</span>
              </div>
            );
          })}
        </div>
        <p className="clue-footer">
          Work the runes out on paper, from the tablets and anything else you find. When you are sure, tell the DM.
          Every rune is always the same letter, wherever you find it.
        </p>
        <button className="btn small ghost clue-close" onClick={onClose}>Close the notebook</button>
      </div>
    </div>
  );
}
