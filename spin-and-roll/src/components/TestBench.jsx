// GM: a test student on your own account, plus one-tap kits, so you can try everything as a player.
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { addTestStudent, removeTestStudent, testKit } from '../lib/testing';

const KITS = [
  ['level', '⭐ Top level for this year'],
  ['spells', '✨ Every spell (locked ones too)'],
  ['items', '🎒 One of every item (both map halves too)'],
  ['mana', '🔮 Lots of mana'],
  ['refill', '❤️ Full HP and mana, clear statuses'],
  ['gold', '🪙 +500 Galleons'],
  ['once', '🔁 Reset once-a-day things (ability, map, duel reaction)'],
];

export default function TestBench({ sid, data, session, chars }) {
  const { user } = useAuth();
  const [family, setFamily] = useState(data.families?.[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const go = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const me = user && chars[user.uid];
  const link = `${window.location.origin}${window.location.pathname}#/session/${sid}/play`;

  return (
    <details className="test-bench" open={!!me}>
      <summary>🧪 Test student {me ? `(${me.firstName ?? me.name})` : ''}</summary>
      {!me ? (
        <>
          <p className="muted small">
            Adds a student on your own account, so you can play it yourself on the player screen. It’s never saved to a profile
            and gets no trophy. Remove it before game night.
          </p>
          {data.families && (
            <select value={family} onChange={(e) => setFamily(e.target.value)} aria-label="Family">
              {data.families.map((f) => <option key={f.id} value={f.id}>{f.ability?.icon} {f.name}</option>)}
            </select>
          )}{' '}
          <button className="btn small gold" disabled={busy || !user} onClick={() => go(() => addTestStudent(sid, data, session, user.uid, family))}>
            Add a test student
          </button>
        </>
      ) : (
        <>
          <p className="small">
            Open the player screen in another tab, or on your phone signed in as you:{' '}
            <a href={link} target="_blank" rel="noreferrer">player screen ↗</a>
          </p>
          <div className="test-kits">
            {KITS.map(([k, label]) => (
              <button key={k} className="btn small" disabled={busy} onClick={() => go(() => testKit(sid, data, session, user.uid, k))}>{label}</button>
            ))}
          </div>
          <button className="btn small ghost" disabled={busy}
            onClick={() => confirm('Remove the test student and everything it holds?') && go(() => removeTestStudent(sid, user.uid))}>
            Remove the test student
          </button>
        </>
      )}
    </details>
  );
}
