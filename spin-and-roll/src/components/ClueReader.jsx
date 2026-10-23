// Reading a clue on the phone: the note, page or runes, on parchment.
import { useEffect, useState } from 'react';
import { runeFor } from '../lib/puzzles';

// A word in runes. With the notebook on, each rune the player can read shows its letter underneath.
function RuneWord({ word, read }) {
  return (
    <span className="clue-rune-word">
      {word.split('').map((ch, k) => {
        const rune = runeFor(ch);
        const r = read?.(rune);
        return (
          <span key={k} className="clue-rune-ch">
            {rune}
            {read && <span className={`clue-under ${r ? (r.ink ? 'ink' : 'pencil') : ''}`}>{r?.letter ?? '·'}</span>}
          </span>
        );
      })}
    </span>
  );
}
const runes = (text, read) => text.split(' ').map((w, i) => <RuneWord key={i} word={w} read={read} />);

// `read` (optional) turns a rune into what this player knows of it, from their rune notebook.
export default function ClueReader({ item, def, qty = 1, onClose, read = null }) {
  const [useBook, setUseBook] = useState(false);
  const r0 = def.read;
  const hasRunes = !!(r0?.pages || r0?.words);
  const reader = useBook ? read : null;
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  const r = def.read ?? { style: 'note', text: def.note ?? item.note ?? '' };
  const pages = r.pages ? r.pages.slice(0, Math.max(1, Math.min(qty, r.pages.length))) : null;
  return (
    <div className="clue-overlay" role="dialog" aria-modal="true" aria-label={item.name} onClick={onClose}>
      <div className={`clue-sheet clue-${r.style ?? 'note'}`} onClick={(e) => e.stopPropagation()}>
        <p className="clue-title">{item.icon} {item.name}</p>
        {r.heading && <p className="clue-heading">{r.heading}</p>}
        {r.words ? (
          <div className="tablet-grid">
            {r.words.map((w) => (
              <div key={w.word} className="tablet-cell">
                <span className="tablet-pic" aria-hidden="true">{w.pic}</span>
                <p className="clue-runes" aria-label="A word in runes"><RuneWord word={w.word} read={reader} /></p>
              </div>
            ))}
          </div>
        ) : pages ? (
          <>
            {pages.map((pg, i) => (
              <div key={i} className="clue-page">
                {r.pages.length > 1 && <span className="clue-page-n">Page {i + 1}</span>}
                <p className="clue-runes" aria-label="Runes">{runes(pg, reader)}</p>
              </div>
            ))}
            {r.pages.length > 1 && <p className="clue-count">You have {pages.length} of {r.pages.length} pages.</p>}
          </>
        ) : (
          <p className="clue-text">{r.text}</p>
        )}
        {r.footer && <p className="clue-footer">{r.footer}</p>}
        {hasRunes && read && (
          <label className="clue-nb-toggle">
            <input type="checkbox" checked={useBook} onChange={(e) => setUseBook(e.target.checked)} />
            📖 Hold my rune notebook beside it
          </label>
        )}
        <button className="btn small ghost clue-close" onClick={onClose}>Put it away</button>
      </div>
    </div>
  );
}
