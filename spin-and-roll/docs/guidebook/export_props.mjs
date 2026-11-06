// Exports the campaign data the Props Book needs (secret gifts, rune words, the Turning Lock, the Seven Bottles).
// Run from the project folder:  node docs/guidebook/export_props.mjs   (needs a JSON-import-capable Node, or bundle with esbuild)
import { writeFileSync } from 'node:fs';
import { hollowHeir as h } from '../../src/campaigns/hollow-heir.js';
import { RUNE_ALPHABET } from '../../src/lib/puzzles.js';

const puzzle = (id) => h.puzzles.find((p) => p.id === id);
const out = {
  runes: Object.fromEntries(RUNE_ALPHABET.map((r) => [r.letter, r.rune])),
  gifts: h.gifts,
  families: Object.fromEntries(h.families.map((f) => [f.id, { name: f.name, secret: f.secret }])),
  items: Object.fromEntries(['rune-tablet-1', 'rune-tablet-2', 'rune-tablet-3', 'diary-page', 'map-half', 'ring-clue-serpent', 'ring-clue-moon', 'ring-clue-owl'].map((k) => [k, h.items[k]])),
  relics: h.relics,
  lock: puzzle('turning-lock'),
  bottles: puzzle('seven-bottles'),
};
writeFileSync(new URL('./props-data.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('wrote props-data.json');
