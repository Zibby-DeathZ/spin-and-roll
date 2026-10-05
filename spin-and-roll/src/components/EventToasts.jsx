import { useEffect, useRef, useState } from 'react';
import { describe, useEvents } from '../lib/game';

// Pops a toast for every new event. Used on the TV and GM screens.
export default function EventToasts({ sid, nameOf, big = false, skip = [], onNew }) {
  const events = useEvents(sid, 10);
  const seen = useRef(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const ready = events.filter((e) => e.processed !== false);
    if (seen.current === null) {
      // First load: don't replay old events.
      seen.current = new Set(ready.map((e) => e.id));
      return;
    }
    const fresh = ready.filter((e) => !seen.current.has(e.id)).reverse();
    fresh.forEach((e) => {
      seen.current.add(e.id);
      onNew?.(e);
      if (skip.includes(e.type)) return;
      const d = describe(e, nameOf);
      if (!d) return;
      setToasts((t) => [...t, { ...d, id: e.id }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== e.id)), d.big ? 7000 : 5000);
    });
  }, [events, nameOf]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`toasts ${big ? 'toasts-big' : ''}`} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast tone-${t.tone} ${t.big ? 'toast-hero' : ''}`}>
          <span className="toast-icon">{t.icon}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
