import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { awardPoints, gainXp, logEvent } from './game';
import { corruptionAfter } from './spellbook';
import { addNote } from './notes';
import { setShow } from './world';

// Professor Greaves's tarot readings. The GM lays out a real deck at the table, then enters the three cards here.
// composeReading writes what Greaves says; sealReading charges the student, applies the outcome, and puts it on the TV.

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export const POSITIONS = ['Past', 'Present', 'Future'];
export const tarotKey = (dawn, house) => `${dawn}_${(house ?? 'none').replace(/\s+/g, '')}`;
export const cardById = (data, id) => data.tarot?.cards?.find((c) => c.id === id) ?? null;

// Picks a line from a list the same way every time for the same reading, so the preview and the TV agree.
const choose = (list, seed) => list[Math.abs(seed) % list.length];
const seedOf = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);

const OPENINGS = [
  (n) => `Sit down, ${n}. No, not there. There. Where the candle can see you. Now cut the deck. With your left hand. Your left.`,
  (n) => `Ah. ${n}. I wondered when you would come. The cards have been restless all morning. Cut them. Do not think about it.`,
  (n) => `Twenty Galleons, on the table. Thank you. The cards are not cheap, ${n}, and neither is the truth. Cut the deck.`,
];
const FRAMES = {
  Past: { up: ['Behind you lies', 'The first card, what has already happened:'], rev: ['Behind you, and turned upside down:', 'The first card is reversed. Something in your past went wrong:'] },
  Present: { up: ['Here, now, sitting with you at this table:', 'The second card, what surrounds you today:'], rev: ['The second card, and it is reversed:', 'Now, today, and upside down:'] },
  Future: { up: ['And the last. What is coming for you:', 'The third card. Your future. Look at it:'], rev: ['And the last card... reversed:', 'Your future, and it has come out upside down:'] },
};
const SUIT_SYNTH = {
  wands: 'So much fire in this spread. Your wand will matter more than your words.',
  cups: 'Cups, and more cups. This is a reading about who you love, and who loves you back.',
  swords: 'Swords everywhere. There is a fight in front of you, and it will hurt.',
  pentacles: 'Coin after coin. What you own, and what you are willing to lose.',
};
const VERDICT = {
  blessed: 'Every card upright. In thirty years I have seen this perhaps a dozen times. The castle itself is on your side, child. Go, before it changes its mind.',
  favour: 'The future came out upright. Fortune is with you. Not for long. Use it well.',
  none: 'The future is turned away from us. The cards will say no more. Keep your gold next time... oh, but you cannot have it back.',
  cursed: 'All three. Reversed. Do not touch the cards. Do not touch them. I am sorry. You chose to look, and now something has looked back.',
};

// picks: [{ id, rev }] for Past, Present, Future.
export function outcomeOf(data, picks) {
  const T = data.tarot;
  const cards = picks.map((p) => cardById(data, p.id));
  if (cards.some((c) => !c)) return null;
  const keyOf = (c) => (c.arcana === 'major' ? c.id : c.suit);
  const fav = (c) => ({ ...T.favours[keyOf(c)], card: c.name, kind: 'favour' });
  const allUp = picks.every((p) => !p.rev);
  const allRev = picks.every((p) => p.rev);
  if (allRev) return { kind: 'cursed', fortunes: [{ ...T.curses[keyOf(cards[2])], card: cards[2].name, kind: 'curse' }] };
  if (allUp) return { kind: 'blessed', fortunes: [fav(cards[2]), fav(cards[1])] };
  if (!picks[2].rev) return { kind: 'favour', fortunes: [fav(cards[2])] };
  return { kind: 'none', fortunes: [] };
}

export function composeReading(data, c, picks) {
  const T = data.tarot;
  const outcome = outcomeOf(data, picks);
  if (!outcome) return null;
  const name = c.firstName ?? c.name ?? 'child';
  const seed = seedOf(picks.map((p) => `${p.id}${p.rev ? 'r' : ''}`).join('|') + name);
  const cards = picks.map((p) => cardById(data, p.id));
  const lines = [{ who: 'greaves', text: choose(OPENINGS, seed)(name) }];

  picks.forEach((p, i) => {
    const pos = POSITIONS[i];
    const card = cards[i];
    let text = `${choose(FRAMES[pos][p.rev ? 'rev' : 'up'], seed + i)} ${card.name}. ${p.rev ? card.rev : card.up}`;
    if (pos === 'Past' && card.arcana === 'major' && T.familyEchoes?.[c.family]) text += ` ${T.familyEchoes[c.family]}`;
    lines.push({ who: 'greaves', pos, card: card.name, rev: !!p.rev, text });
  });

  // What the spread says as a whole.
  const notes = [];
  const majors = cards.filter((k) => k.arcana === 'major').length;
  if (majors === 3) notes.push('Three of the great cards. This is not a small reading. Fate itself is paying attention to you.');
  else if (majors === 2) notes.push('Two of the great cards. Bigger things than you are moving.');
  const bySuit = {};
  cards.forEach((k) => { if (k.suit) bySuit[k.suit] = (bySuit[k.suit] ?? 0) + 1; });
  const [topSuit, topN] = Object.entries(bySuit).sort((a, b) => b[1] - a[1])[0] ?? [];
  if (topN >= 2) notes.push(SUIT_SYNTH[topSuit]);
  const revs = picks.filter((p) => p.rev).length;
  if (revs === 2 && outcome.kind !== 'cursed') notes.push('Two cards upside down. Something is resisting you.');
  if (notes.length) lines.push({ who: 'greaves', text: notes.join(' ') });

  lines.push({ who: 'greaves', verdict: true, text: VERDICT[outcome.kind] });
  return { lines, outcome };
}

// ---------- Applying the outcome ----------

function loseOne(inv = [], which, data) {
  // Never takes clues or the things the story needs (keys, map halves).
  const can = inv.map((it, i) => ({ it, i })).filter(({ it }) => {
    const def = data.items?.[it.id] ?? it;
    return def.kind !== 'clue' && !def.keep && !def.usableAt && !def.opensMap;
  });
  if (!can.length) return [inv, null];
  const worth = ({ it }) => it.price ?? data.items?.[it.id]?.price ?? ((it.effect?.hp ?? 0) + (it.effect?.mana ?? 0));
  const pick = which === 'best'
    ? can.sort((a, b) => worth(b) - worth(a))[0]
    : can[Math.floor(Math.random() * can.length)];
  const next = inv.map((x) => ({ ...x }));
  const took = { ...next[pick.i], qty: 1 };
  next[pick.i].qty -= 1;
  return [next.filter((x) => x.qty > 0), took];
}

const isPotion = (it, data) => {
  const def = data.items?.[it.id] ?? it;
  return def.kind === 'consumable' && /potion|draught|felix|elixir/i.test(def.name ?? it.name ?? '');
};

// Works out the character update for the "now" part of every fortune. Returns { upd, points, took, summary }.
export function nowEffects(c, data, fortunes) {
  let hp = c.hp ?? 0, mana = c.mana ?? 0, gold = c.gold ?? 0, corruption = c.corruption ?? 0;
  let inv = c.inventory ?? [];
  let xp = 0, points = 0, clear = false;
  const took = [];
  const summary = [];
  for (const f of fortunes) {
    const n = f.now;
    if (!n) continue;
    if (n.hp === 'full') hp = c.maxHp; else if (n.hp) hp = clamp(hp + n.hp, 0, c.maxHp);
    if (n.mana === 'full') mana = c.maxMana; else if (n.mana === 'empty') mana = 0; else if (n.mana) mana = clamp(mana + n.mana, 0, c.maxMana);
    if (n.gold) gold = Math.max(0, gold + n.gold);
    if (n.xp) xp += n.xp;
    if (n.points) points += n.points;
    if (n.corruption) corruption = corruptionAfter(corruption, n.corruption, data.corruption);
    if (n.clear) clear = true;
    if (n.loseItem) {
      let item;
      [inv, item] = loseOne(inv, n.loseItem, data);
      if (item) took.push(item);
    }
    if (n.losePotions) {
      inv.filter((it) => isPotion(it, data)).forEach((it) => took.push(it));
      inv = inv.filter((it) => !isPotion(it, data));
    }
  }
  const upd = { hp, mana, gold, corruption, inventory: inv };
  if (clear) upd.status = {};
  if (xp > 0) Object.assign(upd, gainXp({ ...c, hp, mana }, xp).upd);
  else if (xp < 0) upd.xp = Math.max(0, (c.xp ?? 0) + xp);
  if (hp !== c.hp) summary.push(`${hp > c.hp ? '+' : ''}${hp - c.hp} HP`);
  if (mana !== c.mana) summary.push(`${mana > c.mana ? '+' : ''}${mana - c.mana} mana`);
  if (gold !== c.gold) summary.push(`${gold > c.gold ? '+' : ''}${gold - c.gold} Galleons`);
  if (xp) summary.push(`${xp > 0 ? '+' : ''}${xp} XP`);
  if (points) summary.push(`${points > 0 ? '+' : ''}${points} house points`);
  if (corruption !== (c.corruption ?? 0)) summary.push(`+${corruption - (c.corruption ?? 0)} Corruption`);
  took.forEach((it) => summary.push(`lost ${it.qty > 1 ? `${it.qty} × ` : ''}${it.name}`));
  return { upd, points, took, summary };
}

// Charges 20 Galleons, applies everything, writes the omen into the GM notes, and puts the reading on the TV.
export async function sealReading({ sid, data, gmUid, c, picks, clock, when, night }) {
  const reading = composeReading(data, c, picks);
  if (!reading) throw new Error('Pick all three cards first.');
  const price = data.tarot.reader.price;
  const key = tarotKey(clock.dawn, c.house);
  const fid = (i) => `t${clock.dawn}-${Date.now().toString(36)}-${i}`;
  let result;
  await runTransaction(db, async (tx) => {
    const [sSnap, cSnap] = await Promise.all([tx.get(sessionRef(sid)), tx.get(charRef(sid, c.uid))]);
    const prior = sSnap.data()?.state?.tarot?.[key];
    if (prior) throw new Error(`${c.house} has already had a reading today (${prior.name}).`);
    const now = cSnap.data();
    if ((now.gold ?? 0) < price) throw new Error(`${now.firstName ?? now.name} only has ${now.gold ?? 0} Galleons. A reading costs ${price}.`);
    const paid = { ...now, gold: now.gold - price };
    result = nowEffects(paid, data, reading.outcome.fortunes);
    const upd = { ...result.upd };
    reading.outcome.fortunes.forEach((f, i) => {
      const keep = { ...f };
      delete keep.now;
      delete keep.omen;
      upd[`fortunes.${fid(i)}`] = { ...keep, dawn: clock.dawn, used: false };
    });
    tx.update(cSnap.ref, upd);
    tx.update(sSnap.ref, {
      [`state.tarot.${key}`]: {
        uid: c.uid, name: c.firstName ?? c.name, house: c.house, dawn: clock.dawn,
        cards: picks.map((p) => ({ id: p.id, rev: !!p.rev })), kind: reading.outcome.kind, at: Date.now(),
      },
    });
  });
  if (result.points) await awardPoints(sid, c.uid, c.house, result.points, `The cards (${reading.outcome.fortunes.map((f) => f.title).join(', ')})`);
  const who = c.firstName ?? c.name;
  for (const f of reading.outcome.fortunes) {
    const tag = f.kind === 'curse' ? 'CURSED' : 'Favour';
    await addNote(gmUid, sid, {
      kind: 'reward', uid: c.uid, night: night ?? 1, when: when ?? '',
      text: `🔮 ${tag}: ${f.title} (${f.card}). ${f.text}${f.omen ? ` For you: ${f.omen}` : ''}`,
    }).catch(() => {});
  }
  await logEvent(sid, { type: 'tarot', targetUid: c.uid, payload: { kind: reading.outcome.kind, titles: reading.outcome.fortunes.map((f) => f.title) } });
  await setShow(sid, {
    type: 'tarot', at: Date.now(), name: who, house: c.house, family: c.family ?? null,
    cards: picks.map((p, i) => ({ id: p.id, rev: !!p.rev, name: cardById(data, p.id).name, pos: POSITIONS[i] })),
    lines: reading.lines.map((l) => l.text),
    kind: reading.outcome.kind,
    fortunes: reading.outcome.fortunes.map((f) => ({ title: f.title, icon: f.icon, text: f.text, kind: f.kind })),
    summary: result.summary,
  });
  return { reading, summary: result.summary };
}

export const setFortune = (sid, uid, id, patch) => runTransaction(db, async (tx) => {
  const ref = charRef(sid, uid);
  const snap = await tx.get(ref);
  if (!snap.data()?.fortunes?.[id]) return;
  tx.update(ref, Object.fromEntries(Object.entries(patch).map(([k, v]) => [`fortunes.${id}.${k}`, v])));
});
