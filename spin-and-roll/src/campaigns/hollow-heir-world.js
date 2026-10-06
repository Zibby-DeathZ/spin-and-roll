// The Hollow Heir: the living castle.
// Where every person is at every hour of the week, what appears in the world and when,
// who has a quest to give, and everything each person can say.
// The app moves everyone automatically when the GM advances time, and the
// Conversation Book (docs/dm-guide) is built from this same file.

const M = 'Morning class', L = 'Lunch', A = 'Afternoon class', F = 'Free time', C = 'Curfew';
const AWAY = null; // off the map (asleep, in their office, not at school…)

// A routine for every block of the day; `days` overrides particular days.
// `prologue` is [Letters, Gringotts/Diagon Alley, Express, Feast].
const day = (m, l, a, f, c) => ({ [M]: m, [L]: l, [A]: a, [F]: f, [C]: c });
const all = (loc) => day(loc, loc, loc, loc, loc);

// ---------- Extra people (added to the bestiary) ----------
export const extraNpcs = {
  headmaster: { name: 'The Headmaster', icon: '🧓', npc: true },
  librarian: { name: 'The librarian', icon: '📚', npc: true },
  matron: { name: 'The matron', icon: '🩺', npc: true },
  collector: { name: 'Wren Ashby', icon: '🃏', npc: true },
  landlady: { name: 'The landlady', icon: '🍺', npc: true },
  ollivander: { name: 'Mr Ollivander', icon: '🪄', npc: true },
  goblin: { name: 'Gringotts goblin', icon: '💰', npc: true },
  'trolley-witch': { name: 'The trolley witch', icon: '🍬', npc: true },
  victim: { name: 'A drained student', icon: '🩶', npc: true },
};

// ---------- Where everyone is ----------
export const routines = {
  headmaster: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day(AWAY, 'great-hall', AWAY, AWAY, AWAY),
    days: { 7: day('great-hall', 'great-hall', 'entrance-hall', 'entrance-hall', AWAY) } },
  flitwick: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('charms-classroom', 'great-hall', 'charms-classroom', 'great-hall', AWAY),
    days: { 1: { [F]: 'charms-classroom' }, 6: day(AWAY, 'great-hall', AWAY, 'great-hall', AWAY), 7: { [A]: 'gryffindor-common', [F]: 'ravenclaw-common' } } },
  grimsby: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('dungeons', 'great-hall', 'dungeons', 'dungeons', AWAY),
    days: { 5: { [C]: 'dungeons' }, 6: day('dungeons', 'great-hall', 'dungeons', 'dungeons', AWAY), 7: { [A]: 'slytherin-common', [F]: 'hospital-wing' } } },
  longbottom: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('greenhouses', 'great-hall', 'greenhouses', 'greenhouses', AWAY),
    days: { 3: { [L]: 'hospital-wing', [F]: 'hospital-wing' }, 4: { [F]: 'hospital-wing' }, 7: { [A]: 'hufflepuff-common', [F]: 'hospital-wing' } } },
  ashgrove: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('defence-classroom', 'great-hall', 'defence-classroom', 'defence-classroom', AWAY),
    days: { 2: { [L]: 'defence-classroom' }, 6: day(AWAY, 'three-broomsticks', AWAY, 'defence-classroom', AWAY), 7: all(AWAY) } },
  vance: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('transfiguration-classroom', 'great-hall', 'transfiguration-classroom', 'transfiguration-classroom', AWAY),
    days: { 6: day(AWAY, 'hogsmeade', AWAY, AWAY, AWAY), 7: { [A]: 'entrance-hall', [F]: 'grand-staircase' } } },
  scamander: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('hagrids-hut', 'great-hall', 'hagrids-hut', 'hagrids-hut', AWAY),
    days: { 3: { [F]: 'forbidden-forest' }, 6: all('hagrids-hut'), 7: { [A]: AWAY, [F]: 'hagrids-hut' } } },
  hooch: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('quidditch-pitch', 'great-hall', 'quidditch-pitch', 'quidditch-pitch', AWAY),
    days: { 7: { [A]: 'courtyard', [F]: 'courtyard' } } },
  filch: { prologue: [AWAY, AWAY, AWAY, 'entrance-hall'], base: day('entrance-hall', 'entrance-hall', 'trophy-room', 'trophy-room', 'grand-staircase'),
    days: { 3: { [C]: 'trophy-room' }, 5: { [C]: 'library' }, 7: { [C]: 'entrance-hall' } } },
  peeves: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('grand-staircase', 'great-hall', 'library', 'courtyard', 'grand-staircase'),
    days: { 1: { [F]: 'grand-staircase' }, 2: { [A]: 'dungeons' }, 4: { [C]: 'library' }, 7: all(AWAY) } },
  ghost: { prologue: [AWAY, AWAY, AWAY, 'great-hall'], base: day('entrance-hall', 'great-hall', 'grand-staircase', 'grand-staircase', 'library'),
    days: { 3: { [C]: 'restricted-section' }, 6: day('entrance-hall', 'three-broomsticks', 'shrieking-shack', 'grand-staircase', 'library') } },
  'house-elf': { prologue: [AWAY, AWAY, AWAY, AWAY], base: all('kitchens') },
  centaur: { prologue: [AWAY, AWAY, AWAY, AWAY], base: day(AWAY, AWAY, 'forbidden-forest', 'forbidden-forest', 'forbidden-forest') },
  librarian: { prologue: [AWAY, AWAY, AWAY, AWAY], base: day('library', 'library', 'library', 'library', AWAY),
    days: { 6: all(AWAY) } },
  matron: { prologue: [AWAY, AWAY, AWAY, AWAY], base: all('hospital-wing') },
  collector: { prologue: [AWAY, AWAY, AWAY, AWAY], base: day(AWAY, 'great-hall', AWAY, 'library', AWAY),
    days: { 1: day(AWAY, AWAY, AWAY, AWAY, AWAY), 6: day(AWAY, 'hogsmeade', 'hogsmeade', AWAY, AWAY), 7: all(AWAY) } },
  landlady: { prologue: [AWAY, AWAY, AWAY, AWAY], base: all('three-broomsticks') },
  'sinclair-prefect': { prologue: [AWAY, AWAY, 'express', 'great-hall'], base: all('hospital-wing'),
    days: {
      1: day(AWAY, 'great-hall', AWAY, 'grand-staircase', 'grand-staircase'),
      2: day(AWAY, 'great-hall', AWAY, 'grand-staircase', 'ravenclaw-common'),
    } },
  rival: { prologue: [AWAY, 'diagon-alley', 'express', 'great-hall'], base: day(AWAY, 'great-hall', AWAY, 'courtyard', AWAY),
    days: { 2: { [F]: 'great-hall' }, 3: { [C]: 'hospital-wing' }, 4: { [L]: 'courtyard' }, 6: day(AWAY, 'three-broomsticks', 'hogsmeade', 'hogsmeade', AWAY), 7: day(AWAY, 'great-hall', 'slytherin-common', 'slytherin-common', AWAY) } },
  painting: { prologue: [AWAY, AWAY, 'express', AWAY], base: day('undercroft', 'undercroft', 'undercroft', 'undercroft', 'undercroft') },
  ollivander: { prologue: [AWAY, 'ollivanders', AWAY, AWAY], base: all(AWAY) },
  goblin: { prologue: [AWAY, 'gringotts', AWAY, AWAY], base: all(AWAY) },
  'trolley-witch': { prologue: [AWAY, AWAY, 'express', AWAY], base: all(AWAY) },
};

// ---------- What appears, and when ----------
// Each thing appears once, the first time its slot is reached. `transient` things
// (wandering monsters, the Painted Double) leave when the block ends unless they're mid-fight.
// Slot keys: '<day>-<block>' (Day 0 is the prologue: 0-0 … 0-3).
export const schedule = {
  '1-Morning class': {
    spawn: [
      { id: 'ring-serpent', type: 'item', item: 'ring-clue-serpent', loc: 'trophy-room', x: 78, y: 40 },
      { id: 'ring-moon', type: 'item', item: 'ring-clue-moon', loc: 'astronomy-tower', x: 70, y: 45 },
      { id: 'ring-owl', type: 'item', item: 'ring-clue-owl', loc: 'owlery', x: 30, y: 50 },
      { id: 'chest-library', type: 'chest', chest: 'locked-chest', loc: 'library', x: 82, y: 35 },
      { id: 'chest-owlery', type: 'chest', chest: 'small-chest', loc: 'owlery', x: 70, y: 62 },
      { id: 'chest-tower', type: 'chest', chest: 'locked-chest', loc: 'astronomy-tower', x: 22, y: 40 },
      { id: 'chest-ror', type: 'chest', chest: 'ancient-chest', loc: 'room-of-requirement', x: 50, y: 40 },
      { id: 'chest-kitchens', type: 'chest', chest: 'small-chest', loc: 'kitchens', x: 85, y: 60 },
    ],
  },
  '1-Free time': { spawn: [{ id: 'jars', type: 'item', item: 'stolen-jars', loc: 'grand-staircase', x: 80, y: 55 }] },
  '1-Curfew': { spawn: [
    { id: 'pixies-1a', type: 'monster', kind: 'cornish-pixie', loc: 'grand-staircase', transient: true, x: 35, y: 35 },
    { id: 'pixies-1b', type: 'monster', kind: 'cornish-pixie', loc: 'grand-staircase', transient: true, x: 55, y: 30 },
  ] },
  '2-Free time': { spawn: [{ id: 'duelist-2', type: 'monster', kind: 'rival-duelist', loc: 'great-hall', transient: true, x: 60, y: 40 }] },
  '3-Lunch': { spawn: [{ id: 'victim-2', type: 'npc', npc: 'victim', name: 'A drained fourth-year', loc: 'library', x: 40, y: 45 }] },
  '3-Free time': { spawn: [
    { id: 'diary-1', type: 'item', item: 'diary-page', loc: 'restricted-section', x: 75, y: 35 },
    { id: 'spider-3', type: 'monster', kind: 'acromantula', loc: 'forbidden-forest', transient: true, x: 70, y: 30 },
  ] },
  '3-Curfew': { spawn: [{ id: 'trunk', type: 'mimic', mimic: 'hungry-trunk', loc: 'trophy-room', x: 35, y: 55 }] },
  '4-Morning class': { spawn: [{ id: 'vale-page', type: 'item', item: 'vale-page', loc: 'restricted-section', x: 30, y: 40 }] },
  '4-Free time': { remove: ['vale-page'], spawn: [{ id: 'diary-2', type: 'item', item: 'diary-page', loc: 'black-lake', x: 25, y: 70 }] },
  '4-Curfew': { spawn: [
    { id: 'double', type: 'mimic', mimic: 'painted-double', copies: 'sinclair-prefect', loc: 'grand-staircase', transient: true, x: 50, y: 30 },
    { id: 'pixies-4', type: 'monster', kind: 'cornish-pixie', loc: 'library', transient: true, x: 60, y: 35 },
  ] },
  '5-Free time': { spawn: [{ id: 'boggart-5', type: 'monster', kind: 'boggart', loc: 'defence-classroom', transient: true, x: 50, y: 35 }] },
  '5-Curfew': { spawn: [
    { id: 'victim-3', type: 'npc', npc: 'victim', name: 'A drained third-year', loc: 'dungeons', x: 45, y: 50 },
    { id: 'wraith-5', type: 'monster', kind: 'paint-wraith', loc: 'dungeons', transient: true, x: 75, y: 30 },
  ] },
  '6-Afternoon class': { spawn: [
    { id: 'diary-3', type: 'item', item: 'diary-page', loc: 'shrieking-shack', x: 65, y: 45 },
    { id: 'chest-shack', type: 'chest', chest: 'cursed-chest', loc: 'shrieking-shack', x: 30, y: 55 },
  ] },
  '7-Free time': { spawn: [{ id: 'snare', type: 'monster', kind: 'devils-snare', loc: 'dungeons', x: 50, y: 30 }] },
  '7-Curfew': { spawn: [
    { id: 'boss-ashgrove', type: 'monster', kind: 'ashgrove-possessed', loc: 'undercroft', x: 50, y: 32 },
    { id: 'wraith-7a', type: 'monster', kind: 'paint-wraith', loc: 'undercroft', x: 30, y: 38 },
    { id: 'wraith-7b', type: 'monster', kind: 'paint-wraith', loc: 'undercroft', x: 70, y: 38 },
    { id: 'hz-circle', type: 'hazard', hazard: 'ritual-circle', loc: 'undercroft', x: 50, y: 52 },
    { id: 'hz-canvas', type: 'hazard', hazard: 'canvas', loc: 'undercroft', x: 50, y: 18 },
    { id: 'hz-jars', type: 'hazard', hazard: 'paint-jars', loc: 'undercroft', x: 15, y: 25 },
    { id: 'hz-mirror', type: 'hazard', hazard: 'cracked-mirror', loc: 'undercroft', x: 85, y: 25 },
    { id: 'hz-braziers', type: 'hazard', hazard: 'braziers', loc: 'undercroft', x: 15, y: 70 },
    { id: 'hz-pillar', type: 'hazard', hazard: 'pillar', loc: 'undercroft', x: 85, y: 70 },
  ] },
};

// ---------- Who offers which quest, and for how long ----------
// npc: null means it isn't given by a person (the GM hands it out when the moment comes).
// A quest is on offer from `from` to `to`. If nobody picks it up in time, it arrives by
// Owl Post at the start of the next block (owl.from writes it; owl.to 'one' = a single student).
export const offers = [
  { quest: 'keep-an-eye-out', npc: 'sinclair-prefect', from: '1-Lunch', to: '2-Free time',
    owl: { from: 'Prefect Sinclair', text: 'First-years, sorry to write instead of finding you, I keep missing you. Something is wrong in this castle. The portraits near Ravenclaw Tower have gone quiet and I don’t think I’m imagining it. Keep your eyes open for me? Tell me anything strange, however small. — S.' } },
  { quest: 'stolen-ingredients', npc: 'grimsby', from: '1-Free time', to: '3-Free time',
    owl: { from: 'Professor Grimsby', text: 'Someone has been stealing from my store cupboard. Since half the school seems to think it was you lot, you can make yourselves useful and find out who. Find the ingredients, find the thief, and I may forget I ever suspected you. H. Grimsby.' } },
  { quest: 'dueling-champion', npc: 'flitwick', from: '2-Free time', to: '4-Lunch',
    owl: { from: 'Professor Flitwick', text: 'My dear students! The Dueling Club is still short of a first-year champion, and I have heard SUCH good things about your wandwork. Come to the Great Hall any evening. Fair fights, friendly spells, and a very shiny prize! F.F.' } },
  { quest: 'card-collector', npc: 'collector', from: '2-Lunch', to: '5-Free time',
    owl: { from: 'Wren Ashby', text: 'You don’t know me. Wren Ashby, Ravenclaw, fourth year, the one with all the cards. I am one Chocolate Frog card short of a set I have been building for three years, and I hear first-years get lucky. Find me a rare one and I will trade you a secret worth far more. I know a lot of secrets. — W.A.' } },
  { quest: 'hollow-heir', npc: null, from: '2-Curfew', to: '3-Lunch', when: 'After the first victim is found',
    owl: { from: 'The Headmaster', text: 'To the first-years who were in the corridor last night. You saw what happened to Miss Sinclair. I will not insult you by pretending it was an accident. If you notice anything, anything at all, I would be grateful to hear it. Be careful. Be together. Do not be brave alone.' } },
  { quest: 'wake-sleepers', npc: 'longbottom', from: '3-Lunch', to: '5-Lunch',
    owl: { from: 'Professor Longbottom', text: 'I think I can wake them. The drained students. There’s a Restorative Draught in an old book, but it needs three Mandrake leaves and more hands than I have, and I can’t leave the Hospital Wing right now. Come and find me there? Professor Longbottom.' } },
  { quest: 'bramble', npc: 'scamander', from: '3-Afternoon class', to: '4-Free time',
    owl: { from: 'Professor Scamander', text: 'A hippogriff has been seen at the edge of the Forbidden Forest wearing a torn tag with a Thornbury crest on it. Her name is Bramble, and she is frightened, and frightened hippogriffs are dangerous. Remember to bow. Do not hurt her. Bring her out if you can. Professor Scamander.' } },
  { quest: 'other-half', npc: 'rival', from: '4-Lunch', to: '6-Lunch',
    owl: { from: 'Cassius Thorne', text: 'I know you have half of an old map, Fenwick. I have the other half. One of us is going to end up with both. Courtyard, any lunchtime, if you’re brave. Bring yours. C. Thorne.', to: 'family:fenwick' } },
  { quest: 'turning-lock', npc: null, from: '5-Free time', to: '6-Free time', when: 'When they find the Room of Requirement',
    owl: { from: 'An unknown hand', text: 'Walk past the blank wall on the seventh floor three times, wanting what you need. Inside, in the corner nobody tidies, something is ticking. Its lock has three rings. The answers are hidden where the owls sleep, where the stars are counted, and where old victories are kept.' } },
  { quest: 'painters-bargain', npc: 'painting', from: '5-Curfew', to: '6-Curfew', when: 'To one student who visits the painting alone',
    owl: { from: 'The covered painting', to: 'one', text: 'You have not come to see me. That is wise. But wisdom will not save your friends on the seventh night. I know a curse that cannot be blocked. Find my three lost pages and I will teach it to you. Only you. Tell no one. — V.' } },
  { quest: 'vales-trials', npc: null, from: '7-Lunch', to: '7-Curfew', when: 'When they reach the serpent door below the Dungeons' },
];

// ---------- Conversations ----------
// topics: q (what players might ask), a (what to say, in the person's voice),
// from/to (days the topic is available; Day 0 = prologue), clue (pin it on the suspect board),
// quest (offer it), note (GM-only reminder).
export const talk = {
  headmaster: {
    voice: 'Old, kind, slow to speak, quietly frightened. Never answers a question directly the first time.',
    wants: 'To keep the school open, and the students alive.',
    topics: [
      { from: 0, to: 1, q: 'Welcome', a: '“Every year I tell first-years the same thing: Hogwarts will look after you, if you let it. This year I find myself hoping that is true.”' },
      { from: 2, q: 'What happened to the students?', a: '“They are alive. That is what matters tonight. Whatever took their colour, it did not take their lives… yet.”' },
      { from: 3, q: 'Who could do this?', a: '“Magic that drains and does not kill is old magic. Older than this castle’s current portraits. Perhaps ask them.”', note: 'Nudges them toward the portraits and the painting.' },
      { from: 4, q: 'Have you heard of Corvin Vale?', a: 'A long pause. “A name I have not heard since I was a boy. A painter. My predecessor’s predecessor invited him to paint the staff. It did not end well.”' },
      { from: 5, q: 'Is Professor Grimsby guilty?', a: '“I have known Horace Grimsby for thirty years. He is unpleasant, unkind, and entirely incapable of this. Which is not, I grant you, the same as innocent.”' },
      { from: 7, q: 'The lockdown', a: '“Stay in your common rooms. I mean it. Whatever is happening tonight, I would rather face it without counting first-years.”' },
    ],
  },
  flitwick: {
    voice: 'Squeaky, delighted, talks fast, stands on a pile of books. Loves a clever answer.',
    wants: 'A first-year Dueling Club champion. Ideally a Ravenclaw.',
    topics: [
      { from: 1, q: 'Help with Charms', a: '“Swish and flick! It is all in the wrist, and a little in the heart. Try again, try again!”' },
      { from: 2, q: 'The Dueling Club', a: '“Every evening in the Great Hall! Fair fights, friendly spells. I am looking for a first-year champion, you know.”', quest: 'dueling-champion' },
      { from: 3, q: 'The silent portraits', a: '“Portraits go quiet when they are frightened. In fifty years I have only seen it twice. I did not like it either time.”', clue: 'portraits-silent' },
      { from: 5, q: 'Alohomora and locks', a: '“Most locks in this castle open to Alohomora. The very old ones do not. The very old ones want something else: a word, a key, a riddle.”', note: 'Hint for the Turning Lock and the serpent door.' },
    ],
  },
  grimsby: {
    voice: 'Clipped, sarcastic, never looks up. Says “Hm” a lot. Secretly kind and secretly scared.',
    wants: 'To wake the drained students without anyone knowing he cares.',
    topics: [
      { from: 1, q: 'What was stolen?', a: '“Boomslang skin. Lacewing flies. Gone. If it was a first-year, they will be scrubbing cauldrons until they are forty.”', quest: 'stolen-ingredients', clue: 'cupboard-raided' },
      { from: 3, q: 'Do you know what is draining them?', a: '“Hm. If I did, do you think I would be standing here talking to you?” He goes back to his cauldron. His hands are shaking.' },
      { from: 5, q: 'Why were you standing over the victim?', a: 'He glares, then sags. “Because I got there first. Because I am trying to wake them, you foolish child. Now get out before someone sees you talking to me.”', clue: 'grimsby-standing' },
      { from: 5, q: 'The glowing bottle', a: 'If they press, or a WIS 14 check: “A draught. Restorative. It is not ready. It will not be ready in time.” He shows them the half-brewed cauldron.', clue: 'grimsby-draught', note: 'This clears him. Mark him Cleared on the suspect board.' },
      { from: 7, q: 'Help us', a: '“The thing below the castle feeds on light. Fire is light. Fire burns paint. Do not make me say anything else.”' },
    ],
  },
  longbottom: {
    voice: 'Gentle, nervous laugh, talks to plants. Brave when it matters.',
    wants: 'To save the drained students. Believes in the Restorative Draught.',
    topics: [
      { from: 1, q: 'Herbology', a: '“Earmuffs on! Mandrakes won’t kill you at this age, but they’ll ruin your afternoon.”' },
      { from: 3, q: 'Can the victims be saved?', a: '“There’s a draught. Old magic. It might bring them back. I’d need three Mandrake leaves, and someone with a steady hand at a cauldron.”', quest: 'wake-sleepers' },
      { from: 3, q: 'What did the victims have in common?', a: '“All of them were near a painting. The night before, every one of them said they’d been dreaming about paint.”' },
      { from: 6, q: 'Ashgrove', a: '“Ashgrove? Lovely man. Brought me a painting of the greenhouses for my office. I took it down last week. It kept… changing.”', clue: 'more-paintings' },
    ],
  },
  ashgrove: {
    voice: 'Warm, encouraging, remembers names. Too warm. From Day 5, sometimes pauses mid-sentence as if listening.',
    wants: 'To be loved. Underneath: to be free of Vale.',
    topics: [
      { from: 1, q: 'Defence lessons', a: '“Defence is not about fighting. It is about making sure the fight never reaches you.”' },
      { from: 2, q: 'Your paintings', a: '“I collect them! Every one has a story. Some of them are even true.” He laughs. One of the portraits behind him does not.', clue: 'more-paintings' },
      { from: 4, q: 'Corvin Vale', a: 'His smile stays on, but his eyes go still. “Never heard of him. Off you go, now. Lunch.”', note: 'He is lying. A WIS 12 check notices.' },
      { from: 5, q: 'Look closely', a: 'There are flecks of wet paint on his sleeve, crimson and gold. He tucks his hand away.', clue: 'wet-paint' },
      { from: 6, q: 'His eyes', a: 'For a moment his eyes are brushstrokes: thick, wet, swirling. He blinks. “Can I help you?”', clue: 'ashgrove-eyes' },
      { from: 6, q: 'Talk to the real Ashgrove', a: 'CHA 16: “Help me. He is in my head. The canvas. Burn the canvas.” Then he is smiling again.', note: 'A gift for brave players. Use it at most once.' },
    ],
  },
  vance: {
    voice: 'Crisp and exact. Taps her wand on the desk once before every sentence.',
    wants: 'Precision. Order. Silence.',
    topics: [
      { from: 1, q: 'Transfiguration', a: '“Transfiguration is the most complex magic you will learn. It is also the most dangerous. Pay attention.”' },
      { from: 3, q: 'Can paint become real?', a: '“With enough power and enough time, anything can be made to become anything. That is precisely why we do not allow it.”' },
      { from: 7, q: 'Incendio', a: '“Fire is the oldest spell and the least forgiving. Today you will learn it. Do not make me regret that.”' },
    ],
  },
  scamander: {
    voice: 'Dreamy, distracted, the suitcase at her feet thumps. Speaks to creatures more kindly than to people.',
    wants: 'Creatures treated kindly. Bramble home.',
    topics: [
      { from: 1, q: 'The suitcase', a: '“Oh, don’t mind that. He’s shy.” The suitcase growls.' },
      { from: 3, q: 'A hippogriff', a: '“A grey hippogriff at the edge of the forest. Proud. Torn tag on her leg.” She looks right at the Thornbury. “I believe she might be yours.”', quest: 'bramble' },
      { from: 3, q: 'The forest', a: '“The creatures are restless. Something under the castle is calling, and they don’t like the sound of it.”' },
    ],
  },
  hooch: {
    voice: 'Barks like a sports coach. Hates excuses. Respects anyone who gets back on a broom.',
    wants: 'Nobody falling off a broom.',
    topics: [
      { from: 4, q: 'Flying', a: '“Right hand over the broom and say UP! Not up, not please, UP!”' },
      { from: 5, q: 'Fastest way around the castle?', a: '“By broom? The Astronomy Tower to the Owlery in a minute flat. Not that I’m telling first-years that.”' },
    ],
  },
  filch: {
    voice: 'Mutters, shuffles, threatens. Talks to his cat more than to students.',
    wants: 'To catch someone, anyone, after curfew.',
    topics: [
      { from: 1, q: 'Anything', a: '“Out of bounds, out of bounds, all of it. I’ve got keys to every door in this castle, and I know who opens them.”', clue: 'filch-keys' },
      { from: 3, q: 'Where were you on night two?', a: '“Supervising detention, weren’t I? Two Gryffindors, three hours, every cup in that room. Ask them.”', clue: 'filch-detention', note: 'This clears him.' },
      { from: 4, q: 'The paintings', a: '“New ones every week. I don’t hang them. Nobody asked me. Nobody asks me anything.”', clue: 'painting-moves' },
    ],
  },
  peeves: {
    voice: 'Shrieks, rhymes, throws things. Never stays still.',
    wants: 'Chaos. He stole Grimsby’s ingredients.',
    topics: [
      { from: 1, q: 'Anything', a: '“Ickle firsties, lost and scared, wandering where the painting stared!” He blows a raspberry and vanishes.' },
      { from: 1, q: 'The stolen jars', a: 'If cornered (DEX or CHA 13): “Wasn’t me! Was me. Lacewing flies make lovely missiles!” The jars are on the Grand Staircase.', note: 'Peeves is the thief in Stolen Ingredients.' },
      { from: 4, q: 'What have you seen?', a: '“Painted man walking, painted man stalking, out of the frame and down to the deep!”', clue: 'painting-moves' },
    ],
  },
  ghost: {
    voice: 'Sad, polite, very old-fashioned. Drifts through walls mid-sentence.',
    wants: 'Someone to listen.',
    topics: [
      { from: 1, q: 'Directions', a: '“The staircases change on Fridays, and on Tuesdays if they are cross. Ask the portraits. Most of them are kind.”' },
      { from: 3, q: 'Did you see anything?', a: '“On the night of the second attack, I saw a man step out of a frame. Out. As if it were a door. He was beautiful, in a way I did not like.”', clue: 'ghost-saw' },
      { from: 4, q: 'Corvin Vale', a: '“I knew him. When I was alive. He painted me, once. He said I would last forever on canvas. I died the next winter. I have never seen the painting since.”' },
    ],
  },
  'house-elf': {
    voice: 'Eager, bowing, talks in the third person.',
    wants: 'To feed the students. To be thanked.',
    topics: [
      { from: 1, q: 'Food', a: '“Pip is bringing pies! Pip is bringing pasties! Young masters and misses must eat!”', note: 'Give a Pumpkin Pasty or Chocolate Frog (Players tab, Give item).' },
      { from: 3, q: 'Have you heard anything?', a: '“The portraits is whispering to each other at night, miss. About a door that wants opening. Pip does not like it.”' },
      { from: 5, q: 'The Undercroft', a: '“Below the dungeons, sir. Pip is not going there. Nobody is going there. There is a snake on the door.”' },
    ],
  },
  centaur: {
    voice: 'Proud, cryptic, speaks of the stars, never gives a straight answer.',
    wants: 'For humans to leave the forest alone.',
    topics: [
      { from: 2, q: 'Anything', a: '“Mars is bright tonight. Something old is waking beneath the stone.”' },
      { from: 3, q: 'The hippogriff', a: '“She is deeper in. Afraid. Go gently, or do not go at all.”', note: 'Helps the Bramble quest.' },
      { from: 5, q: 'How do we stop it?', a: '“Light burns the dark. And what was painted can be unpainted.”' },
    ],
  },
  librarian: {
    voice: 'Whispers. Furious about noise. Knows every book by its smell.',
    wants: 'Silence. And her books back on time.',
    topics: [
      { from: 1, q: 'Books about paintings', a: '“Portraiture, aisle nine. Enchanted portraiture, the Restricted Section. Which you are not permitted to enter.”' },
      { from: 4, q: 'The missing page', a: '“Someone has been at the Restricted Section. A page is torn from Lives of the Lesser Masters. If I find out who…”', note: 'After the beat on Day 4.' },
    ],
  },
  matron: {
    voice: 'Brisk, warm, exhausted. Tucks in blankets while she talks.',
    wants: 'Her patients awake.',
    topics: [
      { from: 2, q: 'How are they?', a: '“Alive. Cold. They don’t wake, and they don’t dream. I’ve never seen anything like it.”' },
      { from: 3, q: 'Can we help?', a: '“If Professor Longbottom’s draught works, perhaps. Until then, keep your voices down.”' },
      { from: 4, q: 'Cassius Thorne', a: '“Thorne? He was here on the third night with a Bludger bruise. All night. Snored like a troll.”', clue: 'rival-alibi', note: 'This clears Cassius.' },
    ],
  },
  collector: {
    voice: 'Ink-stained fingers, talks quickly about rarities, knows everyone’s secrets.',
    wants: 'One rare Chocolate Frog card.',
    topics: [
      { from: 2, q: 'The cards', a: '“I’m missing one. A rare. Find it for me and I’ll tell you something about the painting nobody else knows.”', quest: 'card-collector' },
      { from: 2, q: 'The secret', a: 'Only once they hand over a rare card: “It came with the new portraits. Ashgrove signed for it himself.”', note: 'Complete Card Collector.' },
    ],
  },
  landlady: {
    voice: 'Loud, motherly, gossips while she pours.',
    wants: 'Customers. And a good story.',
    topics: [
      { from: 6, q: 'Strange business at the school', a: '“Kids going grey, I hear. My gran used to tell a story about a painter who did that. Vale, his name was. Don’t go looking for him, dears.”' },
      { from: 6, q: 'Butterbeer', a: '“Two Sickles. On the house for anyone who tells me something good about that castle.”' },
    ],
  },
  'sinclair-prefect': {
    voice: 'Brisk, tired, protective of her younger sibling. Laughs it off when she’s scared.',
    wants: 'For someone to believe her.',
    topics: [
      { from: 0, to: 0, q: 'On the train', a: '“First years? Compartments at the back. And if anyone gives you trouble, find me.” To the Sinclair, quietly: “I’ve been having bad dreams. About paintings.”' },
      { from: 1, to: 2, q: 'The castle feels wrong', a: '“I’m probably being silly. But meet me by the Grand Staircase after dinner. I want to show you something.”', quest: 'keep-an-eye-out' },
      { from: 1, to: 2, q: 'On her patrol', a: 'She shows them a corridor where every portrait is empty, and a dead end where the air is cold. “That’s where it’s worst. Under there, somewhere.”' },
      { from: 3, q: 'Drained', a: 'She lies grey and still. If someone holds her hand, she whispers one word: “Canvas.”', note: 'After Wake the Sleepers she wakes: “The man in the painting… he was wearing Ashgrove’s face.”' },
    ],
  },
  rival: {
    voice: 'Lazy, smug drawl. Flips a Galleon. Calls everyone by their surname.',
    wants: 'To win. He holds the other half of the Marauder’s Map.',
    topics: [
      { from: 0, q: 'First meeting', a: '“First-years. Lovely. Try not to cry in the Great Hall this year.” He says the Marlowe’s surname loudly enough for the whole carriage.' },
      { from: 2, q: 'Dueling Club', a: '“You? Duel me? Go on, then. I could use the laugh.”', note: 'Use Dueling Club rival stats for him.' },
      { from: 4, q: 'The map', a: 'He unfolds half an old map. The torn edge matches the Fenwick’s exactly. “Finders keepers. Unless you’ve got something better.”', quest: 'other-half', clue: 'rival-map' },
      { from: 5, q: 'Are you behind the attacks?', a: '“Me? I was in the Hospital Wing on the third night. Ask the matron. Ask anyone.” He looks genuinely rattled.' },
    ],
  },
  painting: {
    voice: 'Velvet-soft, patient, speaks in colours and brushstrokes. Always calls students “child”.',
    wants: 'To finish his self-portrait and live forever.',
    topics: [
      { from: 0, to: 0, q: 'On the train', a: 'Only the Quill sees it: a painted eye opening under the cloth, following them.', clue: 'painting-eyes' },
      { from: 1, q: 'Anyone who gets close', a: 'Cold air. The faint smell of turpentine. Something under the cloth breathes.' },
      { from: 5, q: 'The bargain (to one student, alone)', a: '“You want to protect them. I know a curse that cannot be blocked, child. Prove you deserve it.”', quest: 'painters-bargain', note: 'Send the rest privately by Owl Post.' },
      { from: 6, q: 'The question', a: '“What would you give up to never lose again?” Any honest answer is accepted.', note: 'Then teach the Killing Curse from the Players tab. An owl from the painting goes automatically.' },
    ],
  },
  ollivander: {
    voice: 'Soft, wide-eyed, appears without a sound. Remembers every wand he ever sold.',
    wants: 'For the right wand to find the right wizard.',
    topics: [
      { from: 0, to: 0, q: 'Choosing a wand', a: '“The wand chooses the wizard. It is not always clear why.” Start the Wand questions on the Players tab.' },
      { from: 0, to: 0, q: 'To the Marlowe', a: '“A Marlowe. I sold your great-grandfather a wand of yew and serpent scale. It did terrible things. I do hope you do better.”' },
    ],
  },
  goblin: {
    voice: 'Curt, suspicious, prices everything with his eyes.',
    wants: 'Efficiency.',
    topics: [
      { from: 0, to: 0, q: 'The vaults', a: '“Vault keys. Or account names. Quickly.” Open each vault from the Players tab.' },
      { from: 0, to: 0, q: 'The serpent key', a: 'He glances at the Marlowe’s key and says nothing. A WIS 13 check: he has seen that crest before, on a vault nobody has opened in three hundred years.' },
    ],
  },
  'trolley-witch': {
    voice: 'Cheerful, sing-song, has done this run for sixty years.',
    wants: 'To sell sweets.',
    topics: [
      { from: 0, to: 0, q: 'Anything from the trolley?', a: '“Chocolate Frogs, Pumpkin Pasties, Bertie Bott’s Every Flavour Beans! A Galleon each, dears.”', note: 'Players tab: Give item, and −1 Galleon each.' },
      { from: 0, to: 0, q: 'The last carriage', a: '“Oh, don’t go back there, dear. Some delivery for the school. Gave me the shivers, and I’ve carried a dragon egg on this train.”' },
    ],
  },
  victim: {
    voice: 'Grey, silent, breathing.',
    wants: 'Their colour back.',
    topics: [
      { from: 3, q: 'Look closely', a: 'Their eyes are open. Their wand has crumbled to charcoal. On their fingers: a smear of oil paint.' },
    ],
  },
};
