import { IDENT_MS, TITLE_MS, introPage, introStage, skipToBook, startIntro } from '../lib/intro';

// Shown at the top of the GM screen while the opening cutscene runs.
export function GMIntro({ sid, data, session, claims }) {
  const st = session.state.intro;
  const intro = data.intro;
  const pages = intro.pages.length;
  const since = Date.now() - (st.at ?? 0);
  const timed = st.stage === 'opening' && since < IDENT_MS + TITLE_MS;
  const players = session.playerUids.length;
  const claimed = Object.keys(claims).length;
  const text = st.stage === 'opening' && st.page >= 1 ? intro.pages[st.page - 1]?.text : null;

  const close = async () => {
    await introStage(sid, 'closing');
    setTimeout(() => introStage(sid, 'done'), 4000);
  };

  return (
    <section className="gm-intro">
      <div className="party-head">
        <h2>🎬 Opening cutscene</h2>
        <span className="muted small">Phones are locked until the family page.</span>
      </div>
      {timed && <p>Playing the studio ident and title… <button className="btn small ghost" onClick={() => skipToBook(sid)}>Skip to the book</button></p>}
      {!timed && st.stage === 'opening' && (
        <>
          <p className="muted small">{st.page === 0 ? 'The closed book is on the TV.' : `Page ${st.page} of ${pages}. Read this aloud (unless you recorded it):`}</p>
          {text && <blockquote className="narration">{text}</blockquote>}
          <div className="actions">
            <button className="btn small ghost" disabled={st.page === 0} onClick={() => introPage(sid, st.page - 1)}>◀ Back</button>
            {st.page < pages
              ? <button className="btn small gold" onClick={() => introPage(sid, st.page + 1)}>{st.page === 0 ? 'Open the book ▶' : 'Next page ▶'}</button>
              : <button className="btn small gold" onClick={() => introStage(sid, 'choose')}>Turn to “{intro.choose}” ▶</button>}
          </div>
        </>
      )}
      {st.stage === 'choose' && (
        <>
          <p>Players are choosing on their phones: <strong>{claimed} of {players}</strong> chosen.</p>
          <button className="btn small gold" disabled={claimed < players} onClick={close}>Close the book and begin</button>
          {claimed < players && <span className="muted small"> Waiting for everyone to choose.</span>}
        </>
      )}
      {st.stage === 'closing' && <p>The book is closing…</p>}
      <p className="muted small"><button className="linkish" onClick={() => startIntro(sid)}>Replay from the start</button></p>
    </section>
  );
}

// Music picker for the GM header.
export function GMMusic({ sid, data, session, setMusicState }) {
  const m = session.state?.music ?? { track: '', playing: false, volume: 0.5 };
  return (
    <span className="gm-music">
      <select value={m.track} onChange={(e) => setMusicState(sid, { ...m, track: e.target.value, playing: !!e.target.value })} aria-label="Music">
        <option value="">🎵 No music</option>
        {data.music.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      {m.track && (
        <button className="btn small ghost" onClick={() => setMusicState(sid, { ...m, playing: !m.playing })}>{m.playing ? '⏸' : '▶'}</button>
      )}
      <input type="range" min="0" max="1" step="0.05" value={m.volume} aria-label="Music volume"
        onChange={(e) => setMusicState(sid, { ...m, volume: Number(e.target.value) })} />
    </span>
  );
}
