// House specialties and the House of the Day perks. Plain data and small helpers, no Firebase,
// so game.js can use them without an import loop.
import { rollD20 } from './dice';

// Every sorted student gets their house's stat bonus all the time, and its trait.
// Once-a-day traits reset each morning (they share one daily charge: houseDawn).
export const HOUSE_TRAITS = {
  Gryffindor: {
    name: 'Nerve', icon: '🦁', stats: { str: 2 }, trait: 'nerve', daily: true,
    text: '+2 STR. Once a day, your first natural 1 is re-rolled automatically.',
  },
  Ravenclaw: {
    name: 'Wit', icon: '🦅', stats: { int: 2 }, trait: 'wit', daily: true, button: 'Ask for a hint',
    text: '+2 INT. Once a day, tap for a free hint on a puzzle. The DM gives it.',
  },
  Slytherin: {
    name: 'Cunning', icon: '🐍', stats: { cha: 2 }, trait: 'cunning', goldBonus: 0.5,
    text: '+2 CHA. You find half as much gold again in every chest you open.',
  },
  Hufflepuff: {
    name: 'Steadfast', icon: '🦡', stats: { con: 2 }, trait: 'steadfast', daily: true,
    text: '+2 CON. Once a day, a hit that would knock you out leaves you on 1 HP instead.',
  },
};

export const traitOf = (c) => HOUSE_TRAITS[c?.house] ?? null;
export const traitReady = (c, dawn) => !!traitOf(c)?.daily && c.houseDawn !== dawn;

// Gryffindor's Nerve: a d20 that re-rolls its first natural 1 of the day.
// `spent` is a per-phone memory so a second roll can't use it again before the GM screen catches up.
const spentHere = new Set();
export function nerveRoll(c, mode, dawn) {
  const r = rollD20(mode);
  const key = `${c.uid}:${dawn}`;
  if (r.nat !== 1 || traitOf(c)?.trait !== 'nerve' || !traitReady(c, dawn) || spentHere.has(key)) return r;
  spentHere.add(key);
  const again = rollD20(mode);
  return { ...again, nerve: true, firstNat: 1 };
}

// The House of the Day: the house that earned the most points during a day gets one of these for the next day.
export const HOUSE_PERKS = [
  { id: 'hamper', icon: '🧺', name: 'House-elf Hamper', text: 'A Pepperup Potion for every member.', item: 'pepperup' },
  { id: 'purse', icon: '🪙', name: 'Founders’ Purse', text: '+15 Galleons for every member.', gold: 15 },
  { id: 'luck', icon: '✨', name: 'Liquid Luck', text: 'A Felix Felicis for every member: one free re-spin.', item: 'felix' },
  { id: 'hourglass', icon: '⏳', name: 'Golden Hourglass', text: 'House points they earn today count one and a half times.', pointsX: 1.5 },
  { id: 'library', icon: '📚', name: 'Restricted Section Pass', text: 'One free puzzle hint for the house today. Ask the DM.' },
  { id: 'curfew', icon: '🌙', name: 'Prefect’s Blind Eye', text: 'Out after curfew today without losing points.' },
];
export const perkById = (id) => HOUSE_PERKS.find((p) => p.id === id) ?? null;

// Points each house earned between two snapshots, best first. Ties share the win.
export function dayStandings(now = {}, start = {}, houses = []) {
  const names = houses.length ? houses : Object.keys({ ...now, ...start });
  return names.filter((h) => h !== 'Unsorted')
    .map((h) => [h, (now[h] ?? 0) - (start[h] ?? 0)])
    .sort((a, b) => b[1] - a[1]);
}
export function dayLeaders(standings) {
  const top = standings[0]?.[1] ?? 0;
  return top > 0 ? standings.filter(([, p]) => p === top).map(([h]) => h) : [];
}
