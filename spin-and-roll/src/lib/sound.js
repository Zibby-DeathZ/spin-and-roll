// Sound for the TV. Effects are synthesized (no files needed); music comes from
// files in public/sounds/music/. Browsers only allow sound after a click, so the
// TV asks for one click first (see SoundGate).

let ctx = null;
let master = null;
let musicEl = null;
let musicGain = 0.5;

export function audioReady() {
  return !!ctx && ctx.state === 'running';
}

export async function unlockAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state !== 'running') await ctx.resume();
}

const now = () => ctx.currentTime;

function env(node, t, a, peak, d) {
  node.gain.setValueAtTime(0.0001, t);
  node.gain.exponentialRampToValueAtTime(peak, t + a);
  node.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(freq, { type = 'sine', at = 0, attack = 0.01, decay = 0.6, vol = 0.3, slideTo = null } = {}) {
  if (!audioReady()) return;
  const t = now() + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + attack + decay);
  env(g, t, attack, vol, decay);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
}

function noise({ at = 0, attack = 0.01, decay = 0.4, vol = 0.25, from = 800, to = 3000, q = 1, type = 'bandpass' } = {}) {
  if (!audioReady()) return;
  const t = now() + at;
  const len = Math.ceil(ctx.sampleRate * (attack + decay + 0.1));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
  const g = ctx.createGain();
  env(g, t, attack, vol, decay);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

// ---------- The effects ----------
export const SFX = {
  chime: () => [880, 1320, 1760].forEach((f, i) => tone(f, { at: i * 0.07, decay: 0.9, vol: 0.16 })),
  lowChime: () => [330, 247].forEach((f, i) => tone(f, { at: i * 0.12, decay: 0.8, vol: 0.18, type: 'triangle' })),
  sparkle: () => [1568, 2093, 2637, 3136, 2637, 3520].forEach((f, i) => tone(f, { at: i * 0.05, decay: 0.35, vol: 0.09 })),
  whoosh: () => noise({ decay: 0.45, vol: 0.22, from: 400, to: 4000, q: 0.8 }),
  swish: () => noise({ decay: 0.25, vol: 0.14, from: 2000, to: 600, q: 1.5 }),
  hit: () => { noise({ decay: 0.18, vol: 0.35, from: 1200, to: 200, type: 'lowpass' }); tone(110, { decay: 0.25, vol: 0.3, type: 'square', slideTo: 55 }); },
  thud: () => tone(80, { decay: 0.7, vol: 0.45, slideTo: 35 }),
  boom: () => { noise({ attack: 0.02, decay: 1.4, vol: 0.4, from: 900, to: 60, type: 'lowpass' }); tone(55, { decay: 1.4, vol: 0.4, slideTo: 30 }); },
  coins: () => [2400, 2900, 2600, 3100, 2750].forEach((f, i) => tone(f, { at: i * 0.06, decay: 0.12, vol: 0.08, type: 'square' })),
  page: () => noise({ attack: 0.05, decay: 0.35, vol: 0.12, from: 3000, to: 1200, q: 0.5 }),
  tick: () => tone(1800, { decay: 0.03, vol: 0.06, type: 'square' }),
  bell: () => [523, 1046, 1569].forEach((f) => tone(f, { decay: 2.2, vol: 0.12, type: 'sine' })),
  gong: () => { tone(98, { attack: 0.02, decay: 2.8, vol: 0.35, type: 'triangle' }); tone(147, { attack: 0.02, decay: 2.4, vol: 0.15 }); },
  fanfare: () => [[523, 0], [659, 0.14], [784, 0.28], [1046, 0.46]].forEach(([f, at]) => {
    tone(f, { at, decay: at > 0.4 ? 1.1 : 0.3, vol: 0.14, type: 'sawtooth' });
    tone(f / 2, { at, decay: at > 0.4 ? 1.1 : 0.3, vol: 0.1, type: 'triangle' });
  }),
  scream: () => {
    noise({ attack: 0.005, decay: 0.9, vol: 0.5, from: 3000, to: 500, q: 0.7 });
    tone(880, { attack: 0.005, decay: 0.8, vol: 0.25, type: 'sawtooth', slideTo: 140 });
    tone(1245, { attack: 0.005, decay: 0.7, vol: 0.15, type: 'square', slideTo: 200 });
    tone(55, { at: 0.05, decay: 1.2, vol: 0.5, slideTo: 30 });
  },
  // A slow, rising shimmer for the studio ident.
  swell: () => {
    [262, 330, 392, 523, 659].forEach((f, i) => tone(f, { at: i * 0.35, attack: 1.2, decay: 3.5, vol: 0.07, type: 'triangle' }));
    [1046, 1319, 1568, 2093].forEach((f, i) => tone(f, { at: 2 + i * 0.12, attack: 0.02, decay: 2.5, vol: 0.06 }));
  },
};

export const play = (name) => { try { SFX[name]?.(); } catch { /* ignore */ } };

// Which sound goes with which table event.
export function soundForEvent(e) {
  const p = e.payload ?? {};
  switch (e.type) {
    case 'attack':
      if (e.failed) return null;
      if (p.forbidden) return 'boom';
      if (p.nat === 20) return ['whoosh', 'sparkle', p.defeated ? 'thud' : 'hit'];
      return p.hit ? ['whoosh', p.defeated ? 'thud' : 'hit'] : ['whoosh', 'swish'];
    case 'monster_attack': return p.hit ? ['hit'] : ['swish'];
    case 'spell_cast': return e.failed ? null : ['whoosh', 'sparkle'];
    case 'points': return p.delta > 0 ? 'chime' : 'lowChime';
    case 'level_up': case 'sorted': case 'quest_done': case 'puzzle_solved': case 'lesson_passed': return 'fanfare';
    case 'wand_chosen': case 'ability_used': case 'spell_learned': return 'sparkle';
    case 'vault': case 'purchase': case 'open_chest': return p.ok === false ? 'lowChime' : 'coins';
    case 'quest_new': case 'puzzle_start': return 'page';
    case 'owl': return ['whoosh', 'page'];
    case 'hazard': return 'boom';
    case 'mimic': return null; // the jump scare plays its own scream
    case 'expelled': case 'detention': return 'gong';
    case 'time': return p.dawn ? 'bell' : 'tick';
    case 'travel': case 'moved': return 'swish';
    case 'lesson_failed': return 'lowChime';
    case 'time_turner': return ['sparkle', 'bell'];
    default: return null;
  }
}

// ---------- Music ----------
export function setMusic(src, volume = 0.5, playing = true) {
  musicGain = volume;
  if (!src || !playing) {
    if (musicEl) fadeOut(musicEl);
    musicEl = null;
    return;
  }
  if (musicEl && musicEl.dataset.src === src) { musicEl.volume = musicGain; return; }
  const old = musicEl;
  const el = new Audio(src);
  el.dataset.src = src;
  el.loop = true;
  el.volume = 0;
  el.play().then(() => fadeIn(el)).catch(() => {});
  musicEl = el;
  if (old) fadeOut(old);
}

function fadeIn(el) {
  const step = () => { if (el !== musicEl) return; el.volume = Math.min(musicGain, el.volume + 0.03); if (el.volume < musicGain) setTimeout(step, 80); };
  step();
}
function fadeOut(el) {
  const step = () => { el.volume = Math.max(0, el.volume - 0.04); if (el.volume > 0) setTimeout(step, 80); else el.pause(); };
  step();
}

// One-off audio file (used for recorded narration). Resolves when it ends or fails.
export function playFile(src) {
  return new Promise((resolve) => {
    const a = new Audio(src);
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}
