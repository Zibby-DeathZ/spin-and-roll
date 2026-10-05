import { useEffect, useRef, useState } from 'react';
import Portrait from './Portrait';
import { IDENT_MS, TITLE_MS } from '../lib/intro';
import { play, playFile } from '../lib/sound';

const BASE = import.meta.env.BASE_URL;

// ---------- Studio ident: clouds part, a golden crest, the GM's name ----------
function StudioIdent({ studio }) {
  useEffect(() => { play('swell'); }, []);
  return (
    <div className="ident">
      <div className="clouds">
        {Array.from({ length: 9 }, (_, i) => <span key={i} className={`cloud c${i}`} />)}
      </div>
      <div className="crest-wrap">
        <svg className="crest" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff3c4" /><stop offset=".35" stopColor="#e3b04b" />
              <stop offset=".65" stopColor="#a8781f" /><stop offset="1" stopColor="#f6dc8f" />
            </linearGradient>
            <radialGradient id="face" cx=".5" cy=".4" r=".7">
              <stop offset="0" stopColor="#2b2550" /><stop offset="1" stopColor="#120f24" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill="url(#gold)" />
          <circle cx="100" cy="100" r="84" fill="url(#face)" />
          <circle cx="100" cy="100" r="78" fill="none" stroke="url(#gold)" strokeWidth="1.5" strokeDasharray="2 4" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={100 + Math.cos(a) * 70} cy={100 + Math.sin(a) * 70} r="2.2" fill="url(#gold)" />;
          })}
          <text x="100" y="122" textAnchor="middle" fontFamily="'Cinzel Decorative', 'Cinzel', Georgia, serif" fontSize="64" fontWeight="700" fill="url(#gold)">
            G<tspan dx="-4">M</tspan>
          </text>
        </svg>
        <span className="crest-shine" />
      </div>
      <p className="ident-name">{studio.name}</p>
      <p className="ident-presents">{studio.presents}</p>
    </div>
  );
}

// ---------- Title card ----------
function TitleCard({ title }) {
  useEffect(() => { const t = setTimeout(() => play('boom'), 400); return () => clearTimeout(t); }, []);
  return (
    <div className="title-card">
      <div className="embers">{Array.from({ length: 24 }, (_, i) => <span key={i} style={{ '--i': i }} />)}</div>
      <p className="tc-over">{title.over}</p>
      <h1 className="tc-main">{title.main}</h1>
    </div>
  );
}

// ---------- The book ----------
function StoryImage({ n, icon }) {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(true), [n]);
  return ok
    ? <img className="story-img" src={`${BASE}story/page-${n}.jpg`} alt="" onError={() => setOk(false)} />
    : <span className="story-icon" aria-hidden="true">{icon}</span>;
}

function Spread({ intro, page }) {
  const p = intro.pages[page - 1];
  return (
    <div className="spread">
      <div className="leaf left"><StoryImage n={page} icon={p.icon} /></div>
      <div className="leaf right">
        <p className="story-text"><span className="dropcap">{p.text[0]}</span>{p.text.slice(1)}</p>
        <span className="folio">{page}</span>
      </div>
    </div>
  );
}

function ChooseSpread({ intro, data, claims }) {
  const fams = data.families;
  const card = (f) => {
    const c = claims[f.id];
    return (
      <div key={f.id} className={`fam-card ${c ? 'claimed' : ''}`}>
        <Portrait family={f.id} name={f.name} className="fam-portrait" />
        <span className="fam-name">{f.name}</span>
        <span className="fam-sub">{f.blood}</span>
        {c && <span className="fam-stamp">{c.firstName}</span>}
      </div>
    );
  };
  return (
    <div className="spread choose">
      <div className="leaf left">
        <p className="choose-title">{intro.choose}</p>
        <div className="fam-col">{fams.slice(0, 3).map(card)}</div>
      </div>
      <div className="leaf right">
        <p className="choose-title muted-ink">Pick on your phone</p>
        <div className="fam-col">{fams.slice(3).map(card)}</div>
      </div>
    </div>
  );
}

function Cover({ intro }) {
  return (
    <div className="cover">
      <div className="cover-frame">
        <span className="cover-crest" aria-hidden="true">✦</span>
        <p className="cover-title">{intro.cover}</p>
        <span className="cover-crest" aria-hidden="true">✦</span>
      </div>
    </div>
  );
}

function Storybook({ intro, data, claims, st }) {
  const page = st.stage === 'choose' || st.stage === 'closing' ? intro.pages.length + 1 : st.page;
  const prev = useRef(page);
  const [flip, setFlip] = useState(null); // 'open' | 'turn' | 'close'

  useEffect(() => {
    if (st.stage === 'closing') { setFlip('close'); play('thud'); return; }
    if (page === prev.current) return;
    setFlip(prev.current === 0 ? 'open' : 'turn');
    play('page');
    prev.current = page;
    if (page >= 1 && page <= intro.pages.length) {
      setTimeout(() => playFile(`${BASE}sounds/narration/page-${page}.mp3`), 900);
    }
    const t = setTimeout(() => setFlip(null), 1100);
    return () => clearTimeout(t);
  }, [page, st.stage, intro.pages.length]);

  return (
    <div className="book-stage">
      <div className={`book ${page === 0 ? 'closed' : 'open'} ${st.stage === 'closing' ? 'closing' : ''}`}>
        {page === 0 ? <Cover intro={intro} />
          : page > intro.pages.length ? <ChooseSpread intro={intro} data={data} claims={claims} />
            : <Spread intro={intro} page={page} />}
        {flip === 'open' && <div className="flip-cover"><Cover intro={intro} /></div>}
        {flip === 'turn' && <div className="flip-leaf" />}
        {flip === 'close' && <div className="flip-close"><Cover intro={intro} /></div>}
      </div>
    </div>
  );
}

// ---------- Your own opening video (public/video/intro.mp4) ----------
function IntroVideo({ onDone, onMissing }) {
  return (
    <video className="intro-video" src={`${BASE}video/intro.mp4`} autoPlay playsInline
      onEnded={onDone} onError={onMissing} />
  );
}

// ---------- The whole opening, driven by the session state ----------
// onVideoDone: called when a custom intro video finishes, to open the book.
export default function TVIntro({ intro, data, st, claims, onVideoDone, onVideoMissing }) {
  const [, tick] = useState(0);
  const [video, setVideo] = useState('try'); // 'try' | 'done' | 'missing'
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 250); return () => clearInterval(t); }, []);
  useEffect(() => { setVideo('try'); }, [st.at]);
  const since = Date.now() - (st.at ?? 0);
  const opening = st.stage === 'opening' && st.page === 0;
  if (opening && video === 'try' && since < 10 * 60 * 1000) {
    return <IntroVideo onDone={() => { setVideo('done'); onVideoDone?.(); }} onMissing={() => { setVideo('missing'); onVideoMissing?.(); }} />;
  }
  if (video === 'missing' && st.stage === 'opening' && since < IDENT_MS) return <StudioIdent studio={intro.studio} />;
  if (video === 'missing' && st.stage === 'opening' && since < IDENT_MS + TITLE_MS) return <TitleCard title={intro.title} />;
  return <Storybook intro={intro} data={data} claims={claims} st={st} />;
}
