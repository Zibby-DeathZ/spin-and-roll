// Reading a clue on the phone: the note, page or runes, on parchment.
import { useEffect } from 'react';
import { runeFor } from '../lib/puzzles';

const runes = (text) => text.split(' ').map((w, i) => (
  <span key={i} className="clue-rune-word">{w.split('').map((ch) => runeFor(ch)).join('')}</span>
));

export default function ClueReader({ item, def, qty = 1, onClose }) {
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
        {pages ? (
          <>
            {pages.map((pg, i) => (
              <div key={i} className="clue-page">
                {r.pages.length > 1 && <span className="clue-page-n">Page {i + 1}</span>}
                <p className="clue-runes" aria-label="Runes">{runes(pg)}</p>
              </div>
            ))}
            {r.pages.length > 1 && <p className="clue-count">You have {pages.length} of {r.pages.length} pages.</p>}
          </>
        ) : (
          <p className="clue-text">{r.text}</p>
        )}
        {r.footer && <p className="clue-footer">{r.footer}</p>}
        <button className="btn small ghost clue-close" onClick={onClose}>Put it away</button>
      </div>
    </div>
  );
}
