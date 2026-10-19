// Spellbooks: spell lists written as JSON (like campaigns/spellbooks/dark-spells.json) turned into
// the app's spell format. Pure functions, no Firebase, so campaign files can use them.
//
// A spellbook JSON can have:
//   corruptionRules  { min, max, thresholds: [{ at, effect }] }
//   statusEffects    { id: { name, damagePerTurn?, defaultDuration?, skipTurn?, cannotCast?, disadvantage?, dropsItem? } }
//   spells           [{ id, name, school, category, unlockYear, minLevel, source, target, damage: "2d6",
//                       applies: [{ status, duration, onNat20Only?, whileConcentrating? }], removes, corruption,
//                       nat20, nat1, heal, cost: { hp }, lifesteal, blocksNextHits, villainOnly, bossOnly, description }]
//   lootItems        [{ id, name, unlocksSpells, requiresYear }]
// Fields the JSON doesn't have (icon, mana, which stat rolls to hit) come from APP below, or sensible defaults.

// How each spell plays at the table. Anything missing falls back to defaults in convert().
const APP = {
  sectumsempra: { icon: '🗡️', mana: 7, hit: 'int' },
  levicorpus: { icon: '🙃', mana: 4, hit: 'dex' },
  liberacorpus: { icon: '🪢', mana: 2 },
  langlock: { icon: '👅', mana: 4, hit: 'cha' },
  muffliato: { icon: '🐝', mana: 2 },
  'vulnera-sanentur': { icon: '🎶', mana: 5 },
  'sanguis-vinculum': { icon: '💞', mana: 3 },
  'cruor-haurire': { icon: '🩸', mana: 4, hit: 'int' },
  'sanguis-revelio': { icon: '🔎', mana: 2 },
  'clipeus-cruoris': { icon: '🔰', mana: 3 },
  confringo: { icon: '🧨', mana: 5, hit: 'int' },
  expulso: { icon: '🌪️', mana: 4, hit: 'int' },
  morsmordre: { icon: '💀', mana: 6 },
  fiendfyre: { icon: '☄️', mana: 9, hit: 'int' },
  crucio: { icon: '⚡', hit: 'atk' },
  imperio: { icon: '🌀', hit: 'atk' },
  'avada-kedavra': { icon: '💚' },
};

// Icons for status effects. Unknown ones get ✴️.
export const STATUS_ICONS = {
  bleed: '🩸', stun: '💫', silence: '🤐', fear: '😱', hung: '🙃', burning: '🔥',
  cruciatus: '⚡', imperio: '🌀', bloodshield: '🔰',
};

// Statuses the app adds on top of the spellbook's own.
const EXTRA_STATUSES = {
  cruciatus: { name: 'Cruciatus', skipTurn: true, damageDice: '1d4', held: true },
  imperio: { name: 'Imperius', controlled: true },
  bloodshield: { name: 'Blood Shield', blocksHits: 1 },
};

const SOURCE = { learned: 'Taught by a teacher or mentor', 'rare-tome': 'Found in a rare tome', 'dark-tome': 'Found in a dark tome', villain: 'Enemies only' };

// "2d6" → { count: 2, die: 6 }. Anything else → null.
export function parseDice(s) {
  const m = typeof s === 'string' && s.trim().match(/^(\d*)d(\d+)$/i);
  return m ? { count: Number(m[1] || 1), die: Number(m[2]) } : null;
}

// Firestore refuses undefined, so drop empty fields.
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length)));

function convert(s, loot, all = []) {
  const app = APP[s.id] ?? {};
  const dice = parseDice(s.damage);
  const healDice = parseDice(s.heal);
  const applies = (s.applies ?? []).map((a) => clean({
    status: a.whileConcentrating && a.status === 'stun' && s.damagePerTurn ? 'cruciatus' : a.status,
    turns: a.whileConcentrating ? undefined : a.duration ?? undefined,
    held: a.whileConcentrating || undefined, // lasts until the caster lets go (GM removes it)
    nat20Only: a.onNat20Only || undefined,
  }));
  const single = s.target === 'single';
  // Single-target spells that hurt or hex an enemy roll to hit.
  const attack = single && (dice || applies.length) && s.school !== 'healing' && s.target !== 'ally';
  const book = loot.find((l) => l.id === s.source);
  const names = (ids) => ids.map((id) => all.find((x) => x.id === id)?.name ?? id).join(', ');
  const desc = [s.description, s.counteredBy?.length ? `Countered by ${names(s.counteredBy)}.` : ''].filter(Boolean).join(' ');
  return clean({
    group: s.villainOnly ? 'villain' : 'dark',
    school: s.school, category: s.category,
    name: s.name, incantation: s.incantation ?? undefined,
    icon: app.icon ?? '✴️',
    mana: s.villainOnly ? 0 : app.mana ?? Math.max(2, Math.min(10, Math.round((s.unlockYear ?? 3) + (dice ? dice.count : 0)))),
    hit: attack ? app.hit ?? 'int' : undefined,
    attack: attack ? true : undefined,
    dice: dice ?? healDice ?? undefined,
    damage: dice ? true : undefined,
    effectLabel: healDice ? 'HP healed (GM applies)' : dice && !attack ? 'damage to everything caught in it (GM applies)' : undefined,
    applies: applies.length ? applies : undefined,
    // Spells cast on a friend (or yourself) rather than an enemy.
    targetAlly: ['ally'].includes(s.target) || (single && !attack && (s.removes?.length || s.heal)) ? true : undefined,
    area: s.target === 'all-enemies' ? 'all-enemies' : s.target === 'area' ? 'area' : undefined,
    removes: s.removes,
    selfStatus: s.blocksNextHits ? 'bloodshield' : undefined,
    hpCost: typeof s.cost?.hp === 'number' ? s.cost.hp : undefined,
    hpCostChosen: s.cost?.hp === 'chosen' ? true : undefined,
    heal: typeof s.heal === 'string' && !healDice ? s.heal : undefined,
    lifesteal: s.lifesteal,
    splash: s.splash, knockback: s.knockback,
    controlRoll: s.controlRoll,
    corruption: s.corruption || undefined,
    nat20: s.nat20, nat1: s.nat1,
    unlockYear: s.unlockYear ?? undefined, minLevel: s.minLevel ?? undefined,
    source: book ? `${book.name}${book.subtitle ? `, ${book.subtitle.toLowerCase()}` : ''}` : SOURCE[s.source] ?? s.source,
    villainOnly: s.villainOnly, bossOnly: s.bossOnly,
    desc,
  });
}

export function importSpellbook(json) {
  const loot = json.lootItems ?? [];
  const spells = {}, villain = {};
  for (const s of json.spells ?? []) (s.villainOnly ? villain : spells)[s.id] = convert(s, loot, json.spells);
  return {
    spells, villain, loot,
    statusEffects: { ...(json.statusEffects ?? {}), ...EXTRA_STATUSES },
    corruptionRules: json.corruptionRules ?? null,
  };
}

// Adds spells without replacing ones the campaign already defines.
export const addMissing = (base, extra) => {
  for (const [id, s] of Object.entries(extra)) if (!base[id]) base[id] = s;
  return base;
};

// ---------- Unlocks ----------

// Why a player can't learn a spell yet, or null if they can.
export function lockReason(spell, level, year) {
  if (spell.villainOnly) return 'Enemies only';
  if (spell.unlockYear && year < spell.unlockYear) return `Year ${spell.unlockYear}, level ${spell.minLevel ?? '?'}`;
  if (spell.minLevel && level < spell.minLevel) return `Needs level ${spell.minLevel}`;
  return null;
}

// ---------- Corruption ----------

export const CORRUPTION = { min: 0, max: 10 };
export const corruptionAfter = (value = 0, delta, rules) =>
  Math.max(rules?.min ?? 0, Math.min(rules?.max ?? 10, value + delta));
export const activeThresholds = (value = 0, rules) => (rules?.thresholds ?? []).filter((t) => value >= t.at);

// ---------- Status effects (pure) ----------

// status map: { bleed: { turns: 3 }, cruciatus: { turns: null } }  (turns null = until removed)
export function addStatus(map = {}, key, turns, defs = {}) {
  const def = defs[key] ?? {};
  const t = turns === undefined ? def.defaultDuration ?? 1 : turns;
  const prev = map[key];
  // Doesn't stack: the longer duration wins.
  const next = prev && prev.turns != null && t != null ? Math.max(prev.turns, t) : t;
  return { ...map, [key]: { turns: next } };
}

export function removeStatuses(map = {}, keys) {
  const out = { ...map };
  for (const k of keys) delete out[k];
  return out;
}

// Start of a turn: damage over time, whether they lose the turn, and what wears off.
// rollDie is passed in so this stays testable.
export function tickStatus(map = {}, defs = {}, roll) {
  let damage = 0;
  let skip = null;
  const next = {};
  const expired = [];
  for (const [k, v] of Object.entries(map)) {
    const def = defs[k] ?? {};
    if (def.damagePerTurn) damage += def.damagePerTurn;
    const dd = parseDice(def.damageDice);
    if (dd) damage += roll(dd);
    if (def.skipTurn && !skip) skip = def.name ?? k;
    if (v.turns == null) next[k] = v;
    else if (v.turns > 1) next[k] = { turns: v.turns - 1 };
    else expired.push(def.name ?? k);
  }
  return { next, damage, skip, expired };
}

export const statusList = (map = {}, defs = {}) =>
  Object.entries(map).map(([k, v]) => ({ key: k, icon: STATUS_ICONS[k] ?? '✴️', name: defs[k]?.name ?? k, turns: v.turns }));
