// Exports the campaign data the Conversation Book needs.
// Run from the project folder:  node docs/dm-guide/export_world.mjs
import { writeFileSync } from 'node:fs';
import { hollowHeir as h } from '../../src/campaigns/hollow-heir.js';

const out = {
  blocks: h.clock.blocks, prologue: h.clock.prologue, days: h.clock.days,
  locations: Object.fromEntries(h.locations.map((l) => [l.id, l.name])),
  people: Object.fromEntries(Object.entries(h.bestiary).filter(([, b]) => b.npc).map(([k, b]) => [k, b.name])),
  routines: h.routines, schedule: h.schedule, offers: h.offers, talk: h.talk,
  quests: Object.fromEntries(h.quests.map((q) => [q.id, { title: q.title, hidden: !!q.hidden }])),
  clues: Object.fromEntries(h.clues.map((c) => [c.id, c.text])),
  names: {
    items: Object.fromEntries(Object.entries(h.items).map(([k, v]) => [k, v.name])),
    chests: Object.fromEntries(Object.entries(h.chests).map(([k, v]) => [k, v.name])),
    hazards: Object.fromEntries(Object.entries(h.hazards).map(([k, v]) => [k, v.name])),
    mimics: Object.fromEntries(Object.entries(h.mimics).map(([k, v]) => [k, v.name])),
    monsters: Object.fromEntries(Object.entries(h.bestiary).map(([k, v]) => [k, v.name])),
  },
};
writeFileSync(new URL('./world-data.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('wrote docs/dm-guide/world-data.json');
