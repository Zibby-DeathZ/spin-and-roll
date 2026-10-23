// The rune notebook on a player's phone: every rune, with the letters the party has confirmed in ink
// and this player's own guesses in pencil.
import { useEffect, useState } from 'react';
import { RUNE_ALPHABET } from '../lib/puzzles';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// What this player can read: ink (confirmed) wins over pencil.
export function readerFor(known = [], pencil = {}) {
  const ink = Object.fromEntries(RUNE_ALPHABET.filter((r) => known.includes(r.letter)).map((r) => [r.rune, r.letter]));
  return (rune) => (ink[rune] ? { letter: ink[rune], ink: true } : pencil[rune] ? { letter: pencil[rune], ink: false } : null);
}

export default function RuneNotebook({ known = [], pencil = {}, onPencil, onClose }) {
  const [pick, setPick] = useState(null); // the rune being pencilled
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && (pick ? setPick(null) : onClose());
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [pick, onClose]);
  const read = readerFor(known, pencil);
  const inked = RUNE_ALPHABET.filter((r) => known.includes(r.letter)).length;
  const pencilled = RUNE_ALPHABET.filter((r) => !known.includes(r.letter) && pencil[r.rune]).length;
  // A letter already used in ink can't be pencilled onto another rune.
  const inkLetters = new Set(known);

  return (
    <div className="clue-overlay" role="dialog" aria-modal="true" aria-label="Rune notebook" onClick={onClose}>
      <div className="clue-sheet notebook" onClick={(e) => e.stopPropagation()}>
        <p className="clue-title">📖 Rune notebook</p>
        <p className="nb-count">{inked} of 26 known{pencilled ? `, ${pencilled} pencilled in` : ''}</p>
        <div className="nb-grid">
          {RUNE_ALPHABET.map(({ rune }) => {
            const r = read(rune);
            return (
              <button key={rune} type="button" disabled={r?.ink}
                className={`nb-cell ${r?.ink ? 'ink' : r ? 'pencil' : ''} ${pick === rune ? 'picking' : ''}`}
                aria-label={r ? `${rune}: ${r.letter}${r.ink ? ', confirmed' : ', your guess'}` : `${rune}: unknown, tap to guess`}
                onClick={() => setPick(pick === rune ? null : rune)}>
                <span className="nb-rune">{rune}</span>
                <span className="nb-letter">{r?.letter ?? '?'}</span>
              </button>
            );
          })}
        </div>
        {pick ? (
          <div className="nb-picker">
            <p className="small">What letter is <span className="nb-rune inline">{pick}</span>?</p>
            <div className="nb-keys">
              {ABC.map((l) => (
                <button key={l} type="button" disabled={inkLetters.has(l)} className={pencil[pick] === l ? 'on' : ''}
                  onClick={() => { onPencil(pick, l); setPick(null); }}>{l}</button>
              ))}
              <button type="button" className="nb-erase" onClick={() => { onPencil(pick, null); setPick(null); }}>Rub out</button>
            </div>
          </div>
        ) : (
          <p className="clue-footer">
            Ink letters are certain: the whole party has worked them out. Tap any other rune to pencil in your own guess.
            Every rune is always the same letter, wherever you find it.
          </p>
        )}
        <button className="btn small ghost clue-close" onClick={onClose}>Close the notebook</button>
      </div>
    </div>
  );
}
