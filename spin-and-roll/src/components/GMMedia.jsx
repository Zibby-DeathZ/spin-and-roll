import { useEffect, useState } from 'react';
import TVIntro from './Intro';
import JumpScare from './JumpScare';
import MainEventLock from './MainEventLock';
import { OwlArrival } from './OwlPost';
import { AwardsShow, HouseCupShow } from './Shows';
import { IDENT_MS, TITLE_MS } from '../lib/intro';
import { play, playFile, setMusic, SFX, unlockAudio } from '../lib/sound';

const BASE = import.meta.env.BASE_URL;

// Does this file exist? (A dev server answers missing files with the app's HTML, so check the type too.)
async function exists(path) {
  try {
    const r = await fetch(`${BASE}${path}`, { method: 'HEAD', cache: 'no-store' });
    return r.ok && !(r.headers.get('content-type') ?? '').includes('text/html');
  } catch { return false; }
}
async function anyOf(paths) {
  for (const p of paths) if (await exists(p)) return p;
  return null;
}

// ---------- Full-screen previews (local only: nothing reaches the TV or phones) ----------
function IntroPreview({ data, onClose }) {
  const intro = data.intro;
  const [st, setSt] = useState({ stage: 'opening', page: 0, at: Date.now() });
  const [claims, setClaims] = useState({});
  // 'waiting' until we know whether a custom video played ('video') or is missing ('builtin').
  const [phase, setPhase] = useState('waiting');

  useEffect(() => {
    if (phase === 'waiting') return undefined;
    const timers = [];
    const step = (ms, fn) => timers.push(setTimeout(fn, ms));
    const start = (phase === 'builtin' ? IDENT_MS + TITLE_MS : 0) + 2500;
    intro.pages.forEach((_, i) => step(start + i * 7000, () => setSt((s) => ({ ...s, page: i + 1 }))));
    const chooseAt = start + intro.pages.length * 7000;
    step(chooseAt, () => setSt((s) => ({ ...s, stage: 'choose' })));
    data.families.slice(0, 4).forEach((f, i) => step(chooseAt + 1500 + i * 1200, () =>
      setClaims((c) => ({ ...c, [f.id]: { uid: f.id, firstName: ['Zibby', 'Leo', 'Mia', 'Ari'][i] } }))));
    step(chooseAt + 8000, () => setSt((s) => ({ ...s, stage: 'closing', at: Date.now() })));
    step(chooseAt + 12000, onClose);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="media-preview tv-intro">
      <TVIntro intro={intro} data={data} st={st} claims={claims}
        onVideoMissing={() => setPhase('builtin')}
        onVideoDone={() => { setSt({ stage: 'opening', page: 0, at: Date.now() - IDENT_MS - TITLE_MS - 1 }); setPhase('video'); }} />
    </div>
  );
}

function Preview({ kind, data, session, onClose }) {
  const pts = session.state?.housePoints ?? { Gryffindor: 85, Hufflepuff: 40, Ravenclaw: 120, Slytherin: 95 };
  const standings = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'].map((h) => [h, pts[h] ?? 0]).sort((a, b) => b[1] - a[1]);
  let body = null;
  if (kind === 'intro') body = <IntroPreview data={data} onClose={onClose} />;
  if (kind === 'scare') body = <JumpScare scare={{ id: `p${Date.now()}`, at: Date.now(), name: 'The Hungry Trunk', icon: '🧳' }} />;
  if (kind === 'scare-phone') body = <div className="media-phone"><JumpScare scare={{ id: `q${Date.now()}`, at: Date.now(), name: 'The Hungry Trunk', icon: '🧳' }} phone /></div>;
  if (kind === 'owl') {
    body = (
      <div className="media-phone">
        <OwlArrival sid="preview" onFold={onClose}
          owl={{ id: 'p', from: 'The covered painting', text: 'Come alone tonight. I know what you are afraid of losing. I can make sure you never lose it.' }} />
      </div>
    );
  }
  if (kind === 'lock') body = <div className="media-phone"><MainEventLock /></div>;
  if (kind === 'awards') {
    body = (
      <div className="media-preview tv2-center"><AwardsShow show={{ awards: [
        { icon: '⚔️', title: 'Heaviest Hitter', unit: 'damage dealt', name: 'Leo', value: 47 },
        { icon: '⏳', title: 'Point Machine', unit: 'house points earned', name: 'Zibby', value: 45 },
        { icon: '🍀', title: 'Luckiest Wand', unit: 'natural 20s', name: 'Ari', value: 3 },
        { icon: '💀', title: 'Glorious Disaster', unit: 'natural 1s', name: 'Mia', value: 4 },
      ] }} /></div>
    );
  }
  if (kind === 'housecup') body = <div className="media-preview tv2-center"><HouseCupShow show={{ winner: standings[0][0], names: ['Zibby', 'Mia'], standings }} /></div>;
  return (
    <>
      {body}
      <button className="btn gold media-close" onClick={onClose}>✕ Close preview</button>
    </>
  );
}

// ---------- The tab ----------
export default function GMMedia({ data, session }) {
  const [preview, setPreview] = useState(null);
  const [found, setFound] = useState(null);
  const [playing, setPlaying] = useState(null);

  const open = async (kind) => { await unlockAudio(); setPreview(kind); };
  const sfx = async (name) => { await unlockAudio(); play(name); };
  const music = async (id) => {
    await unlockAudio();
    if (playing === id) { setMusic(null); setPlaying(null); return; }
    setMusic(`${BASE}sounds/music/${id}.mp3`, 0.6, true); setPlaying(id);
  };
  useEffect(() => () => setMusic(null), []);

  // Check every expected file once.
  useEffect(() => {
    let alive = true;
    (async () => {
      const img = (base) => anyOf(['jpg', 'png', 'webp'].map((e) => `${base}.${e}`));
      const groups = {
        Videos: [['Intro video', 'video/intro.mp4', exists('video/intro.mp4')], ['Jump scare video', 'video/jumpscare.mp4', exists('video/jumpscare.mp4')]],
        Music: [['intro', 'sounds/music/intro.mp3'], ...(data.music ?? []).map((m) => [m.id, `sounds/music/${m.id}.mp3`])].map(([n, p]) => [n, p, exists(p)]),
        Narration: (data.intro?.pages ?? []).map((_, i) => [`Page ${i + 1}`, `sounds/narration/page-${i + 1}.mp3`, exists(`sounds/narration/page-${i + 1}.mp3`)]),
        'Storybook pictures': (data.intro?.pages ?? []).map((_, i) => [`Page ${i + 1}`, `story/page-${i + 1}.jpg`, exists(`story/page-${i + 1}.jpg`)]),
        Portraits: (data.families ?? []).map((f) => [f.name, `portraits/${f.id}.jpg`, img(`portraits/${f.id}`)]),
        Maps: (data.locations ?? []).map((l) => [l.name, `maps/${l.id}.jpg`, img(`maps/${l.id}`)]),
        Puzzles: [['Scrambled Portrait', 'puzzles/portrait.jpg', exists('puzzles/portrait.jpg')]],
      };
      const out = {};
      for (const [g, rows] of Object.entries(groups)) {
        out[g] = await Promise.all(rows.map(async ([n, p, pr]) => ({ name: n, path: p, ok: !!(await pr) })));
      }
      if (alive) setFound(out);
    })();
    return () => { alive = false; };
  }, [data]);

  const tally = found ? Object.values(found).flat() : [];

  return (
    <section className="gm-media">
      <p className="muted small">Test everything here. Previews play on this screen only: nothing reaches the TV or the phones.</p>

      <h2>Cutscenes and moments</h2>
      <div className="media-buttons">
        <button className="btn gold" onClick={() => open('intro')}>🎬 Opening cutscene</button>
        <button className="btn ember" onClick={() => open('scare')}>😱 Jump scare (TV)</button>
        <button className="btn" onClick={() => open('scare-phone')}>📱 Jump scare (phone)</button>
        <button className="btn" onClick={() => open('owl')}>🦉 Owl arrival (phone)</button>
        <button className="btn" onClick={() => open('lock')}>🔒 Main event lock (phone)</button>
        <button className="btn" onClick={() => open('awards')}>🎖️ Awards</button>
        <button className="btn" onClick={() => open('housecup')}>🏆 House Cup</button>
      </div>

      <h2>Sound effects</h2>
      <div className="media-buttons">
        {Object.keys(SFX).map((n) => <button key={n} className="btn small" onClick={() => sfx(n)}>🔊 {n}</button>)}
      </div>

      <h2>Music</h2>
      <div className="media-buttons">
        {[{ id: 'intro', name: 'Intro' }, ...(data.music ?? [])].map((m) => {
          const ok = found?.Music?.find((x) => x.name === m.id)?.ok;
          return (
            <button key={m.id} className={`btn small ${playing === m.id ? 'gold' : ''}`} disabled={found && !ok} onClick={() => music(m.id)}>
              {playing === m.id ? '⏹' : '▶'} {m.name}{found && !ok ? ' (missing)' : ''}
            </button>
          );
        })}
      </div>

      <h2>Narration</h2>
      <div className="media-buttons">
        {(data.intro?.pages ?? []).map((_, i) => {
          const ok = found?.Narration?.[i]?.ok;
          return (
            <button key={i} className="btn small" disabled={found && !ok}
              onClick={async () => { await unlockAudio(); playFile(`${BASE}sounds/narration/page-${i + 1}.mp3`); }}>
              ▶ Page {i + 1}{found && !ok ? ' (missing)' : ''}
            </button>
          );
        })}
      </div>

      <h2>File checklist</h2>
      {!found ? <p className="muted">Checking files…</p> : (
        <>
          <p className="muted small">{tally.filter((x) => x.ok).length} of {tally.length} files found. Missing files fall back to the built-in version or a plain backdrop.</p>
          <div className="checklist-grid">
            {Object.entries(found).map(([g, rows]) => (
              <div key={g} className="check-group">
                <h3>{g} <span className="muted small">{rows.filter((r) => r.ok).length}/{rows.length}</span></h3>
                <ul>
                  {rows.map((r) => (
                    <li key={r.path} className={r.ok ? 'ok' : 'miss'} title={`public/${r.path}`}>
                      <span>{r.ok ? '✓' : '✗'}</span> {r.name} <code>{r.path.split('/').pop()}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {preview && <Preview kind={preview} data={data} session={session} onClose={() => setPreview(null)} />}
    </section>
  );
}
