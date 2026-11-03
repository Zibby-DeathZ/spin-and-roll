import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Portrait from './Portrait';
import { getCampaign } from '../campaigns';
import { clockOf } from '../lib/game';
import { addNote, kindInfo, NOTE_KINDS, notesAsText, removeNote, setNight, setNote, useNotes } from '../lib/notes';

// When in the game a note was written, e.g. "Day 1, Curfew" or "The Welcome Feast".
function clockLabel(data, session) {
  const c = clockOf(session);
  if (!data.clock) return '';
  return c.day === 0 ? data.clock.prologue?.[c.block] ?? 'Prologue' : `Day ${c.day}, ${data.clock.blocks[c.block]}`;
}

export default function GMNotes({ sid, data, session, chars, onOwl }) {
  const { user } = useAuth();
  const notes = useNotes(user?.uid, sid);
  const players = session.playerUids.filter((u) => chars[u]);
  const name = (u) => chars[u]?.firstName ?? chars[u]?.name ?? 'Someone';
  const [kind, setKind] = useState('request');
  const [who, setWho] = useState('');
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('open'); // 'open' | 'all' | a kind
  const [byWho, setByWho] = useState('');
  const [copied, setCopied] = useState(false);
  const night = notes?.night ?? 1;

  const list = useMemo(() => Object.entries(notes?.entries ?? {}).map(([id, n]) => ({ id, ...n }))
    .filter((n) => (filter === 'open' ? !n.done : filter === 'all' ? true : n.kind === filter))
    .filter((n) => (byWho ? (n.uid ?? '') === byWho : true))
    .sort((a, b) => b.at - a.at), [notes, filter, byWho]);
  const openCount = Object.values(notes?.entries ?? {}).filter((n) => !n.done).length;

  if (!user) return null;
  if (notes === null) return <p className="muted">Loading notes…</p>;

  const add = async () => {
    if (!text.trim()) return;
    await addNote(user.uid, sid, { kind, uid: who || null, text: text.trim(), night, when: clockLabel(data, session) });
    setText('');
  };
  const exportText = () => notesAsText({ title: getCampaign(session.campaignId)?.title ?? 'Campaign', notes, nameOf: name });
  const copy = async () => {
    try { await navigator.clipboard.writeText(exportText()); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { download(); }
  };
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new window.Blob([exportText()], { type: 'text/markdown' }));
    a.download = `session-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <section className="gm-notes wd">
      <div className="wd-head">
        <h2>📓 Session notes</h2>
        <div className="notes-night">
          <span className="muted small">Game night</span>
          <button className="btn small ghost" disabled={night <= 1} onClick={() => setNight(user.uid, sid, night - 1)} aria-label="Previous night">−</button>
          <strong>{night}</strong>
          <button className="btn small ghost" onClick={() => setNight(user.uid, sid, night + 1)} aria-label="Next night">+</button>
        </div>
      </div>
      {notes.error && <p className="error">Notes couldn’t load. Check you’re signed in as the GM.</p>}
      <p className="muted small">Only you can see these. Write down what players ask for, what you owe them and what they wrote in their diaries. After the night, press <b>Copy for Claude</b> and paste it into the chat to have it built into the game.</p>

      <div className="notes-kinds" role="group" aria-label="Kind of note">
        {NOTE_KINDS.map(([k, icon, label, help]) => (
          <button key={k} className={`btn small ${kind === k ? 'gold' : 'ghost'}`} onClick={() => setKind(k)} title={help}>{icon} {label}</button>
        ))}
      </div>
      <div className="spell-who notes-who">
        <button className={`who-chip ${who === '' ? 'on' : ''}`} onClick={() => setWho('')}>👥 Everyone</button>
        {players.map((u) => (
          <button key={u} className={`who-chip ${who === u ? 'on' : ''}`} onClick={() => setWho(u)}>
            <Portrait family={chars[u].family} name={chars[u].name} className="chip-portrait" />{name(u)}
          </button>
        ))}
      </div>
      <textarea className="notes-text" rows={3} value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add(); }}
        placeholder={kind === 'diary' ? 'What did they write? e.g. “Rook snores, I can’t sleep.”' : kind === 'request' ? 'What did they ask for? e.g. Wants a pet owl to send letters home.' : 'Write it down…'} />
      <div className="notes-add">
        <span className="muted small">{clockLabel(data, session) && `Stamped: night ${night}, ${clockLabel(data, session)}`}</span>
        <button className="btn small gold" disabled={!text.trim()} onClick={add}>Add {kindInfo(kind)[1]}</button>
      </div>

      <div className="notes-filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Show">
          <option value="open">Still to do ({openCount})</option>
          <option value="all">Everything</option>
          {NOTE_KINDS.map(([k, icon, label]) => <option key={k} value={k}>{icon} {label}</option>)}
        </select>
        <select value={byWho} onChange={(e) => setByWho(e.target.value)} aria-label="Whose">
          <option value="">Every student</option>
          {players.map((u) => <option key={u} value={u}>{name(u)}</option>)}
        </select>
        <span className="notes-export">
          <button className="btn small" onClick={copy}>{copied ? 'Copied ✓' : '📋 Copy for Claude'}</button>
          <button className="btn small ghost" onClick={download}>⬇ Download</button>
        </span>
      </div>

      {list.length === 0 ? <p className="muted dash-empty">Nothing here yet.</p> : (
        <ul className="notes-list">
          {list.map((n) => {
            const [, icon, label] = kindInfo(n.kind);
            return (
              <li key={n.id} className={`note note-${n.kind} ${n.done ? 'done' : ''}`}>
                <label className="note-check" title={n.done ? 'Mark as not done' : 'Mark as done'}>
                  <input type="checkbox" checked={!!n.done} onChange={(e) => setNote(user.uid, sid, n.id, { done: e.target.checked })} />
                </label>
                <div className="note-body">
                  <p className="note-meta">
                    <span>{icon} {label}</span>
                    {n.uid && <strong>{name(n.uid)}</strong>}
                    <span className="muted small">night {n.night ?? 1}{n.when ? `, ${n.when}` : ''}</span>
                  </p>
                  <p className="note-text">{n.text}</p>
                </div>
                <div className="note-tools">
                  {n.uid && chars[n.uid] && <button className="btn small" onClick={() => onOwl?.(n.uid, n)} title="Answer it with an owl: a letter, an item or Galleons">🦉 Owl</button>}
                  <button className="hide-btn" onClick={() => confirm('Delete this note?') && removeNote(user.uid, sid, n.id)} aria-label="Delete note">✕</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
