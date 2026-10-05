import { useState } from 'react';
import Portrait from './Portrait';
import { markRead, sendOwl, useAllOwls } from '../lib/owls';

const SENDERS = ['The GM', 'An unknown hand', 'The covered painting', 'A portrait', 'Prefect Sinclair', 'Professor Ashgrove', 'Professor Grimsby', 'A ghost'];

const TEMPLATES = [
  ['The painting whispers', 'The covered painting', 'Come alone tonight. I know what you are afraid of losing. I can make sure you never lose it.'],
  ['The Quill’s vision', 'An unknown hand', 'You dream of a painted eye opening in the dark. When you wake, there is paint under your fingernails.'],
  ['A portrait’s answer', 'A portrait', 'You asked, so I must answer truthfully: '],
  ['The Killing Curse', 'The covered painting', 'You have it now: the curse that cannot be blocked. Two words. Use it wisely, and never where anyone can see. I will be watching through your eyes.'],
  ['A family secret', 'The GM', 'Remember your family secret (it’s on your Sheet). Now might be the moment to share it, or to keep it buried.'],
];

// ---------- GM ----------
export function GMOwlPost({ sid, session, chars }) {
  const players = session.playerUids.filter((u) => chars[u]);
  const [to, setTo] = useState(players[0] ?? '');
  const [from, setFrom] = useState('An unknown hand');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const all = useAllOwls(sid);
  const name = (u) => chars[u]?.firstName ?? chars[u]?.name ?? '?';

  const send = async () => {
    await sendOwl(sid, to, from, text.trim());
    setText(''); setSent(true); setTimeout(() => setSent(false), 2500);
  };

  return (
    <section className="gm-owls">
      <h2>🦉 Owl Post</h2>
      <p className="muted small">A private letter to one player. Only they can read it. The TV just shows that an owl arrived.</p>
      <div className="spell-who">
        {players.map((u) => (
          <button key={u} className={`who-chip ${to === u ? 'on' : ''}`} onClick={() => setTo(u)}>
            <Portrait family={chars[u].family} name={chars[u].name} className="chip-portrait" />{name(u)}
          </button>
        ))}
      </div>
      <div className="owl-templates">
        {TEMPLATES.map(([label, f, t]) => (
          <button key={label} className="btn small ghost" onClick={() => { setFrom(f); setText(t); }}>{label}</button>
        ))}
      </div>
      <label className="owl-field">From
        <input list="owl-senders" value={from} onChange={(e) => setFrom(e.target.value)} />
        <datalist id="owl-senders">{SENDERS.map((x) => <option key={x} value={x} />)}</datalist>
      </label>
      <label className="owl-field">Letter
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write the secret…" />
      </label>
      <button className="btn gold" disabled={!to || !text.trim()} onClick={send}>{sent ? 'Sent! 🦉' : `Send to ${name(to)}`}</button>

      {all.length > 0 && (
        <>
          <h3>Sent</h3>
          <ul className="owl-log">
            {all.map((o) => (
              <li key={o.id}><strong>{name(o.toUid)}</strong> <span className="muted small">from {o.from}{o.read ? ', read' : ', unopened'}</span><br />{o.text}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// ---------- Phone: the arriving owl ----------
export function OwlArrival({ sid, owl, onFold }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="owl-arrival" role="dialog" aria-label="A letter has arrived">
      {!open ? (
        <>
          <span className="owl-bird" aria-hidden="true">🦉</span>
          <p className="owl-title">An owl has arrived</p>
          <p className="muted">It drops a letter in your lap. It is sealed, and it is only for you.</p>
          <button className="owl-seal" onClick={() => { setOpen(true); try { navigator.vibrate?.(60); } catch { /* */ } }} aria-label="Break the seal">
            <span>✦</span>
          </button>
          <p className="muted small">Tap the seal to open</p>
        </>
      ) : (
        <div className="owl-letter">
          <p className="owl-from">From {owl.from}</p>
          <p className="owl-text">{owl.text}</p>
          <button className="btn gold" onClick={() => (onFold ? onFold() : markRead(sid, owl.id))}>Fold it away</button>
          <p className="muted small">You can read it again on your Sheet.</p>
        </div>
      )}
    </div>
  );
}

// ---------- Phone: the archive on the Sheet ----------
export function OwlArchive({ owls }) {
  if (!owls.length) return null;
  return (
    <details className="timetable owl-archive">
      <summary>🦉 Owl Post ({owls.length})</summary>
      {owls.map((o) => (
        <div key={o.id} className="owl-old">
          <p className="owl-from">From {o.from}</p>
          <p>{o.text}</p>
        </div>
      ))}
    </details>
  );
}
