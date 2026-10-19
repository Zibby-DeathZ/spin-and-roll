// A small "i" button that opens a short explanation in a bubble. Tap it again, or anywhere else, to close.
import { useEffect, useId, useRef, useState } from 'react';

export default function Info({ title, children, label = 'What is this?' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span className="info" ref={ref}>
      <button type="button" className={`info-btn ${open ? 'on' : ''}`} aria-label={title ? `About ${title}` : label}
        aria-expanded={open} aria-controls={id} onClick={(e) => {
          e.stopPropagation();
          // Keep the bubble on screen, even for an "i" near the edge.
          const r = e.currentTarget.getBoundingClientRect();
          const w = Math.min(260, window.innerWidth * 0.8);
          const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
          const below = r.bottom + 10 + 140 < window.innerHeight;
          setPos({ left, width: w, arrow: r.left + r.width / 2 - left, ...(below ? { top: r.bottom + 10 } : { bottom: window.innerHeight - r.top + 10 }) });
          setOpen(!open);
        }}>i</button>
      {open && (
        <span className={`info-bubble ${pos?.bottom != null ? 'above' : ''}`} id={id} role="note"
          style={pos ? { left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, '--arrow': `${pos.arrow}px` } : undefined}>
          {title && <strong>{title}</strong>}
          <span>{children}</span>
        </span>
      )}
    </span>
  );
}
