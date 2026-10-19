// The reaction duel: when a boss casts at a student, their phone lights up and they have a few seconds to react.
//   red spell  → Shield  (damage halved)
//   blue spell → Dodge   (the boss rolls with disadvantage)
//   gold spell → Counter (the spell misses and rebounds on the boss)
// Wrong button or too slow: a normal attack. Friends who know Protego can shield them instead (costs mana).
// Each student gets one reaction per round. Phase-2 bosses are faster and can feint (show a false colour first).
//
// Reactions reuse the Painted Double's vote collection (same Firebase rules): round "duel-<id>", vote "red|1834".
// Timing is measured on each phone from the moment it sees the spell, so clocks don't need to agree.
import { collection, deleteDoc, doc, getDocs, runTransaction, updateDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { useVotes } from './imposter';
import { rollD20, rollDice } from './dice';
import { bonuses, defenceOf, logEvent, mod, statOf } from './game';
import { addStatus, removeStatuses } from './spellbook';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);

export const COLORS = {
  red: { answer: 'shield', label: 'Shield', icon: '🛡️' },
  blue: { answer: 'dodge', label: 'Dodge', icon: '💨' },
  gold: { answer: 'counter', label: 'Counter', icon: '⚡' },
};
export const DEFAULTS = {
  baseMs: 4000, perDex: 250, minMs: 2000, // reaction window: 4 s, ±0.25 s per point of DEX bonus
  fastFactor: 0.75, // phase-2 bosses (duelFast) give 25% less time
  feintAt: 0.35, // a feint shows the false colour for the first 35% of the window
  grace: 2500, // extra wait for slow phones before the GM screen settles it
  counter: { count: 1, die: 6 }, // rebound damage (+ the student's spell damage bonus)
  protego: { mana: 3, block: { count: 1, die: 6 } },
};
export const duelCfg = (data) => ({ ...DEFAULTS, ...(data.duel ?? {}) });
export const roundId = (d) => `duel-${d.id}`;

export const duelSpellsOf = (data, token) => (token ? data.bestiary[token.kind]?.duelSpells ?? [] : []);
// On by default for monsters that have duel spells; the GM can switch it off per token.
export const duelOn = (data, token) => duelSpellsOf(data, token).length > 0 && token.duel !== false;
export const setDuelOn = (sid, tokenId, on) => updateDoc(sessionRef(sid), { [`state.tokens.${tokenId}.duel`]: on });

export function windowFor(data, c, fast) {
  const k = duelCfg(data);
  const ms = Math.max(k.minMs, k.baseMs + k.perDex * mod(statOf(c, 'dex')));
  return Math.round(ms * (fast ? k.fastFactor : 1));
}

// "red|1834" → { choice: 'red', ms: 1834 }
export const parseReaction = (v) => {
  const [choice, ms] = String(v?.vote ?? '').split('|');
  return { uid: v?.uid, choice, ms: Number(ms) };
};

// Did the target pick the right answer, in time, after any feint was over?
export function judge(d, r) {
  if (!r || !r.choice) return { outcome: 'none', correct: false };
  if (!(r.ms <= d.ms)) return { outcome: 'slow', correct: false };
  if (d.fake && r.ms < d.feintAt) return { outcome: 'fooled', correct: false };
  if (r.choice !== d.spell.color) return { outcome: 'wrong', correct: false };
  return { outcome: COLORS[d.spell.color].answer, correct: true };
}

const placeOf = (session, uid) => session.state?.pcPos?.[uid]?.loc ?? session.state?.map?.loc;

export async function startDuel(sid, data, session, chars, tokenId, targetUid, spellIdx, feint) {
  const token = session.state?.tokens?.[tokenId];
  const b = data.bestiary[token?.kind];
  const spell = duelSpellsOf(data, token)[spellIdx];
  const c = chars[targetUid];
  if (!token || !spell || !c || session.state?.duel?.stage === 'live') return;
  const k = duelCfg(data);
  const ms = windowFor(data, c, !!b.duelFast);
  const round = session.state?.encounter?.round ?? 0;
  const used = session.state?.duelUsed ?? {};
  const helpers = session.playerUids.filter((u) => u !== targetUid && chars[u] && chars[u].hp > 0
    && placeOf(session, u) === token.loc && (chars[u].spells ?? []).some((s) => s.id === 'protego')
    && (chars[u].mana ?? 0) >= k.protego.mana && used[u] !== round);
  const others = Object.keys(COLORS).filter((x) => x !== spell.color);
  const fake = feint ? others[Math.floor(Math.random() * others.length)] : null;
  await updateDoc(sessionRef(sid), {
    'state.duel': {
      id: Date.now().toString(36), stage: 'live', at: Date.now(),
      tokenId, caster: token.name, casterIcon: token.icon,
      targetUid, targetName: c.firstName ?? c.name,
      spell: { name: spell.name, icon: spell.icon, color: spell.color },
      fake, feintAt: fake ? Math.round(ms * k.feintAt) : 0, ms, round,
      helpers, targetUsed: used[targetUid] === round,
    },
  });
}

// Settles the spell once the reactions are in (or time is up). Runs on the GM screen.
export async function resolveDuel(sid, data, d, votes) {
  const k = duelCfg(data);
  let payload = null;
  await runTransaction(db, async (tx) => {
    const sess = (await tx.get(sessionRef(sid))).data();
    const live = sess?.state?.duel;
    if (!live || live.id !== d.id || live.stage !== 'live') return;
    const reactions = votes.map(parseReaction);
    const mine = d.targetUsed ? null : reactions.find((r) => r.uid === d.targetUid);
    const helper = reactions.filter((r) => d.helpers.includes(r.uid) && r.choice === 'protego' && r.ms <= d.ms).sort((a, b) => a.ms - b.ms)[0];
    const cSnap = await tx.get(charRef(sid, d.targetUid));
    const hSnap = helper ? await tx.get(charRef(sid, helper.uid)) : null;
    const c = cSnap.data();
    const token = sess.state.tokens?.[d.tokenId];
    if (!c || !token) {
      tx.update(sessionRef(sid), { 'state.duel.stage': 'done', 'state.duel.result': { outcome: 'none', cancelled: true } });
      return;
    }
    const b = data.bestiary[token.kind] ?? {};
    const spell = (b.duelSpells ?? []).find((s) => s.name === d.spell.name) ?? {};
    const { outcome, correct } = judge(d, mine);
    const defence = defenceOf(c);
    const res = { outcome: d.targetUsed ? 'spent' : outcome, correct };
    const sUpd = { 'state.duel.stage': 'done', 'state.duel.at': Date.now() };
    if (mine && !d.targetUsed) sUpd[`state.duelUsed.${d.targetUid}`] = d.round;

    if (correct && outcome === 'counter') {
      // The spell turns around and hits the boss.
      const rebound = rollDice(k.counter).total + bonuses(c).spellPower;
      const hp = Math.max(0, token.hp - rebound);
      sUpd[`state.tokens.${d.tokenId}.hp`] = hp;
      Object.assign(res, { hit: false, rebound, bossDown: hp === 0 });
    } else {
      const disadvantage = (correct && outcome === 'dodge') || !!token.status?.fear;
      const d20 = rollD20(disadvantage ? 'dis' : 'normal');
      const total = d20.nat + (b.atk ?? 0);
      const landed = d20.nat === 20 || (d20.nat !== 1 && total >= defence);
      let dmg = landed ? rollDice(spell.dmg ?? b.dmg).total : 0;
      if (landed && correct && outcome === 'shield') { res.halved = true; dmg = Math.ceil(dmg / 2); }
      let status = c.status ?? {};
      if (landed && helper && hSnap?.exists()) {
        const blocked = Math.min(dmg, rollDice(k.protego.block).total);
        dmg -= blocked;
        Object.assign(res, { helperUid: helper.uid, helperName: hSnap.data().firstName ?? hSnap.data().name, blocked });
      }
      if (helper && hSnap?.exists()) {
        tx.update(hSnap.ref, { mana: Math.max(0, (hSnap.data().mana ?? 0) - k.protego.mana) });
        sUpd[`state.duelUsed.${helper.uid}`] = d.round;
        if (!res.helperName) res.helperName = hSnap.data().firstName ?? hSnap.data().name;
      }
      if (landed && dmg > 0 && status.bloodshield) { res.bloodShield = true; dmg = 0; status = removeStatuses(status, ['bloodshield']); }
      const applied = landed && dmg > 0 ? (spell.applies ?? []) : [];
      for (const a of applied) status = addStatus(status, a.status, a.held ? null : a.turns, data.statusEffects ?? {});
      const hp = Math.max(0, c.hp - dmg);
      tx.update(cSnap.ref, { hp, ...(status !== (c.status ?? {}) ? { status } : {}) });
      Object.assign(res, {
        nat: d20.nat, total, defence, hit: landed, dmg, disadvantage, ko: landed && hp === 0,
        statuses: applied.map((a) => data.statusEffects?.[a.status]?.name ?? a.status),
      });
    }
    sUpd['state.duel.result'] = res;
    tx.update(sessionRef(sid), sUpd);
    payload = { ...res, caster: d.caster, icon: d.spell.icon, spell: d.spell.name, color: d.spell.color, targetName: d.targetName };
  });
  if (payload) await logEvent(sid, { type: 'duel', targetUid: d.targetUid, payload });
}

export async function clearDuel(sid, d) {
  await updateDoc(sessionRef(sid), { 'state.duel': null });
  if (!d) return;
  const all = await getDocs(collection(db, 'sessions', sid, 'imposterVotes'));
  await Promise.all(all.docs.filter((x) => x.data().round === roundId(d)).map((x) => deleteDoc(x.ref).catch(() => {})));
}

// GM screen: settles the duel when the right answer is in, a friend has shielded, or time runs out,
// and clears the result off the TV a few seconds later.
export function useDuelEngine(sid, data, session) {
  const d = session?.state?.duel;
  const votes = useVotes(sid, d?.stage === 'live' ? roundId(d) : null);
  const busy = useRef('');
  const latest = useRef(votes);
  latest.current = votes;
  useEffect(() => {
    if (!d || !data) return undefined;
    if (d.stage === 'live') {
      const go = () => {
        if (busy.current === d.id) return;
        busy.current = d.id;
        resolveDuel(sid, data, d, latest.current).catch(console.error);
      };
      const rs = votes.map(parseReaction);
      const mine = d.targetUsed ? null : rs.find((r) => r.uid === d.targetUid);
      const early = (mine && judge(d, mine).correct) || rs.some((r) => d.helpers.includes(r.uid) && r.choice === 'protego');
      const allIn = (d.targetUsed || mine) && d.helpers.every((u) => rs.some((r) => r.uid === u));
      if (early || allIn) { const t = setTimeout(go, 600); return () => clearTimeout(t); }
      const t = setTimeout(go, Math.max(0, d.ms + duelCfg(data).grace - (Date.now() - d.at)));
      return () => clearTimeout(t);
    }
    if (d.stage === 'done') {
      const t = setTimeout(() => clearDuel(sid, d).catch(console.error), Math.max(0, 7000 - (Date.now() - (d.at ?? 0))));
      return () => clearTimeout(t);
    }
    return undefined;
  }, [sid, data, d, votes]);
  return votes;
}

// The line for the TV feed and the result screen.
export function duelText(p) {
  const who = p.targetName;
  if (p.cancelled) return 'The spell fizzles.';
  if (p.rebound != null) return `${who} counters ${p.spell}! It rebounds on ${p.caster} for ${p.rebound}.${p.bossDown ? ` ${p.caster} falls!` : ''}`;
  const how = {
    shield: `${who} shields in time`, dodge: `${who} dives aside`, wrong: `${who} reacts the wrong way`,
    slow: `${who} is too slow`, fooled: `${who} falls for the feint`, none: `${who} doesn’t react`, spent: `${who} has no reaction left`,
  }[p.outcome] ?? who;
  const save = p.helperName ? ` ${p.helperName} casts Protego${p.blocked ? `, blocking ${p.blocked}` : ''}.` : '';
  const roll = `${p.total} vs Defence ${p.defence}${p.disadvantage ? ' (disadvantage)' : ''}`;
  let end;
  if (!p.hit) end = 'Miss!';
  else if (p.bloodShield) end = 'The Blood Shield takes it!';
  else if (!p.dmg) end = 'No damage!';
  else end = `Hit for ${p.dmg}${p.halved ? ' (halved)' : ''}!${p.statuses?.length ? ` ${p.statuses.join(', ')}.` : ''}${p.ko ? ` ${who} is down!` : ''}`;
  return `${p.caster} casts ${p.spell}. ${how}.${save} ${roll}. ${end}`;
}
