import { useEffect, useState } from 'react';
import Portrait from './Portrait';
import { markRead, parcelText, sendOwl, useAllOwls } from '../lib/owls';

const SENDERS = ['The GM', 'An unknown hand', 'The covered painting', 'A portrait', 'Prefect Sinclair', 'Professor Ashgrove', 'Professor Grimsby', 'A ghost'];

const TEMPLATES = [
  ['The painting whispers', 'The covered painting', 'Come alone tonight. I know what you are afraid of losing. I can make sure you never lose it.'],
  ['The Quill’s vision', 'An unknown hand', 'You dream of a painted eye opening in the dark. When you wake, there is paint under your fingernails.'],
  ['A portrait’s answer', 'A portrait', 'You asked, so I must answer truthfully: '],
  ['The Killing Curse', 'The covered painting', 'You have it now: the curse that cannot be blocked. Two words. Use it wisely, and never where anyone can see. I will be watching through your eyes.'],
  ['A family secret', 'The GM', 'Remember your family secret (it’s on your Sheet). Now might be the moment to share it, or to keep it buried.'],
];

// ---------- GM ----------
const CUSTOM_ICONS = ['🧪', '💤', '🍬', '🍫', '📜', '🔑', '💍', '🪶', '🧸', '🕯️', '🧣', '🎁', '🍀', '🦴', '📕', '🪄'];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'gift';

// What gets tied to the owl's leg: campaign items, a custom item made up on the spot, and Galleons.
function ParcelBuilder({ data, parcel, setParcel }) {
  const items = Object.entries(data?.items ?? {});
  const [pick, setPick] = useState(items[0]?.[0] ?? '');
  const [qty, setQty] = useState(1);
  const [cName, setCName] = useState('');
  const [cIcon, setCIcon] = useState('🧪');
  const [cNote, setCNote] = useState('');
  const [cUse, setCUse] = useState(true);
  const [cHp, setCHp] = useState(0);
  const add = (it) => setParcel((p) => {
    const found = p.items.find((x) => x.id === it.id);
    return { ...p, items: found ? p.items.map((x) => (x.id === it.id ? { ...x, qty: x.qty + it.qty } : x)) : [...p.items, it] };
  });
  const addCampaign = () => { const d = data.items[pick]; if (d) add({ id: pick, ...d, qty }); };
  const addCustom = () => {
    if (!cName.trim()) return;
    add({ id: `gift-${slug(cName)}`, name: cName.trim(), icon: cIcon, note: cNote.trim() || null, kind: cUse ? 'consumable' : 'clue',
      ...(cUse && cHp ? { effect: { hp: cHp } } : {}), qty });
    setCName(''); setCNote(''); setCHp(0);
  };
  return (
    <details className="owl-parcel" open={parcel.items.length > 0 || parcel.gold > 0}>
      <summary>📦 Tie something to its leg {parcel.items.length || parcel.gold ? `(${parcelText(parcel, data?.currency?.name)})` : ''}</summary>
      <div className="gm-give">
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Item">
          {items.map(([id, it]) => <option key={id} value={id}>{it.icon} {it.name}</option>)}
        </select>
        <input type="number" min="1" max="20" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, +e.target.value || 1)))} aria-label="How many" className="owl-qty" />
        <button className="btn small" onClick={addCampaign}>Add</button>
      </div>
      <p className="muted small">Or make something up (a sleeping potion, a letter from home, a lucky sock):</p>
      <div className="gm-give">
        <select value={cIcon} onChange={(e) => setCIcon(e.target.value)} aria-label="Icon" className="owl-icon">{CUSTOM_ICONS.map((i) => <option key={i}>{i}</option>)}</select>
        <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Name, e.g. Sleeping Draught" maxLength={40} aria-label="Custom item name" />
      </div>
      <div className="gm-give">
        <input value={cNote} onChange={(e) => setCNote(e.target.value)} placeholder="What it does (shown on their phone), e.g. One sip and you sleep through any snoring" maxLength={120} aria-label="What it does" />
      </div>
      <div className="gm-give owl-custom-opts">
        <label className="spot-toggle"><input type="checkbox" checked={cUse} onChange={(e) => setCUse(e.target.checked)} /> Can be used up</label>
        {cUse && <label className="wd-num">Heals HP <input type="number" min="0" max="50" value={cHp} onChange={(e) => setCHp(Math.max(0, Math.min(50, +e.target.value || 0)))} /></label>}
        <button className="btn small" disabled={!cName.trim()} onClick={addCustom}>Add it</button>
      </div>
      <div className="gm-give">
        <label className="wd-num">🪙 {data?.currency?.name ?? 'Gold'} <input type="number" min="0" max="999" value={parcel.gold} onChange={(e) => setParcel((p) => ({ ...p, gold: Math.max(0, Math.min(999, +e.target.value || 0)) }))} /></label>
      </div>
      {parcel.items.length > 0 && (
        <div className="wd-saved">
          {parcel.items.map((i) => (
            <span key={i.id} className="wd-chip">{i.icon} {i.name}{i.qty > 1 ? ` ×${i.qty}` : ''}
              <button className="wd-chip-x" aria-label={`Remove ${i.name}`} onClick={() => setParcel((p) => ({ ...p, items: p.items.filter((x) => x.id !== i.id) }))}>✕</button>
            </span>
          ))}
        </div>
      )}
    </details>
  );
}

// preset: { uid, note } when answering a note from the Notes tab; onSent(note) marks it done.
export function GMOwlPost({ sid, session, chars, data, preset = null, onSent }) {
  const players = session.playerUids.filter((u) => chars[u]);
  const [to, setTo] = useState(preset?.uid ?? players[0] ?? '');
  const [from, setFrom] = useState('An unknown hand');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [parcel, setParcel] = useState({ items: [], gold: 0 });
  const [answering, setAnswering] = useState(preset?.note ?? null);
  const [markDone, setMarkDone] = useState(true);
  const all = useAllOwls(sid);
  const name = (u) => chars[u]?.firstName ?? chars[u]?.name ?? '?';
  useEffect(() => { if (preset) { setTo(preset.uid); setAnswering(preset.note ?? null); } }, [preset]);
  const hasParcel = parcel.items.length > 0 || parcel.gold > 0;

  const send = async () => {
    await sendOwl(sid, to, from, text.trim(), hasParcel ? parcel : null);
    if (answering && markDone) onSent?.(answering);
    setText(''); setParcel({ items: [], gold: 0 }); setAnswering(null);
    setSent(true); setTimeout(() => setSent(false), 2500);
  };

  return (
    <section className="gm-owls">
      <h2>🦉 Owl Post</h2>
      <p className="muted small">A private letter to one player, and anything tied to its leg. Only they can read it, and the parcel goes straight into their bag. The TV just shows that an owl arrived.</p>
      {answering && (
        <div className="owl-answering">
          <span>Answering {answering.uid ? <strong>{name(answering.uid)}</strong> : ''}: “{answering.text}”</span>
          <label className="spot-toggle"><input type="checkbox" checked={markDone} onChange={(e) => setMarkDone(e.target.checked)} /> Tick the note off when sent</label>
          <button className="wd-chip-x" onClick={() => setAnswering(null)} aria-label="Stop answering">✕</button>
        </div>
      )}
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
      <ParcelBuilder data={data} parcel={parcel} setParcel={setParcel} />
      <button className="btn gold" disabled={!to || (!text.trim() && !hasParcel)} onClick={send}>{sent ? 'Sent! 🦉' : `Send to ${name(to)}${hasParcel ? ' with the parcel' : ''}`}</button>

      {all.length > 0 && (
        <>
          <h3>Sent</h3>
          <ul className="owl-log">
            {all.map((o) => (
              <li key={o.id}><strong>{name(o.toUid)}</strong> <span className="muted small">from {o.from}{o.read ? ', read' : ', unopened'}</span><br />{o.text}
                {o.parcel && <><br /><span className="owl-parcel-line">📦 {parcelText(o.parcel, data?.currency?.name)}</span></>}</li>
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
          {owl.text && <p className="owl-text">{owl.text}</p>}
          {owl.parcel && (
            <div className="owl-gift">
              <p className="owl-gift-title">Tied to its leg</p>
              <p>{parcelText(owl.parcel)}</p>
              <p className="muted small">It’s in your Bag now.</p>
            </div>
          )}
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
          {o.text && <p>{o.text}</p>}
          {o.parcel && <p className="muted small">📦 {parcelText(o.parcel)}</p>}
        </div>
      ))}
    </details>
  );
}
