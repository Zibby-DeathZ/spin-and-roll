// The accusation: everyone votes on their phone for who is behind the attacks.
// Two endings, chosen by the GM after the votes are shown:
//   - "hunch": the table's pick is stamped Accused on the suspect board. Nothing about the truth is revealed.
//   - "truth": the real answer is revealed and rewards are paid out.
// Votes reuse the Painted Double's vote collection (same rules), with round ids starting "acc-".
import { doc, getDoc, getDocs, collection, deleteDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { adjust, awardPoints } from './game';
import { useVotes } from './imposter';

const sessionRef = (sid) => doc(db, 'sessions', sid);
export const BOSS_WEAKEN = 10; // HP the bosses lose when the table names the culprit

export async function startAccusation(sid, uids) {
  const round = `acc-${Date.now().toString(36)}`;
  await updateDoc(sessionRef(sid), { 'state.accuse': { round, stage: 'vote', uids, voted: [], at: Date.now() } });
}

export function tallySuspects(votes, uids, suspects) {
  const counts = Object.fromEntries(suspects.map((s) => [s.id, 0]));
  for (const v of votes) if (uids.includes(v.uid) && v.vote in counts) counts[v.vote] += 1;
  const top = Math.max(0, ...Object.values(counts));
  const leaders = Object.keys(counts).filter((k) => counts[k] === top && top > 0);
  return { counts, pick: leaders.length === 1 ? leaders[0] : null };
}

export async function showVotes(sid, ac, votes, suspects) {
  const { counts, pick } = tallySuspects(votes, ac.uids, suspects);
  await updateDoc(sessionRef(sid), {
    'state.accuse.stage': 'tally', 'state.accuse.counts': counts, 'state.accuse.pick': pick, 'state.accuse.at': Date.now(),
  });
}

// Keep the mystery: stamp the table's pick as Accused and close the vote.
export async function closeAsHunch(sid, ac) {
  const upd = { 'state.accuse': null };
  if (ac.pick) upd[`state.board.marks.${ac.pick}`] = 'accused';
  await updateDoc(sessionRef(sid), upd);
  await clearVotes(sid, ac.round);
}

// The final accusation: reveal the truth and pay out.
// culprit = the full answer; partOf = also counts as half right.
export async function revealTruth(sid, data, ac, votes, chars) {
  const { culprit, partOf = [], reward } = data.accusation;
  const mine = Object.fromEntries(votes.filter((v) => ac.uids.includes(v.uid)).map((v) => [v.uid, v.vote]));
  const right = Object.keys(mine).filter((u) => mine[u] === culprit);
  const half = Object.keys(mine).filter((u) => partOf.includes(mine[u]));
  const tableRight = ac.pick === culprit || partOf.includes(ac.pick);
  for (const u of right) {
    await adjust(sid, u, 'xp', reward.xp);
    await awardPoints(sid, u, chars[u]?.house, reward.points, 'Named the true culprit');
  }
  for (const u of half) {
    await adjust(sid, u, 'xp', Math.round(reward.xp / 2));
    await awardPoints(sid, u, chars[u]?.house, Math.round(reward.points / 2), 'Half right about the culprit');
  }
  const upd = {
    'state.accuse.stage': 'truth',
    'state.accuse.culprit': culprit,
    'state.accuse.right': right,
    'state.accuse.half': half,
    'state.accuse.tableRight': tableRight,
    'state.accuse.at': Date.now(),
    [`state.board.marks.${culprit}`]: 'accused',
  };
  if (tableRight) {
    upd['state.bossesWeakened'] = true;
    // Bosses already on the map lose the HP straight away.
    const snap = await getDoc(sessionRef(sid));
    for (const [id, t] of Object.entries(snap.data()?.state?.tokens ?? {})) {
      if (t.boss) {
        upd[`state.tokens.${id}.maxHp`] = Math.max(1, (t.maxHp ?? 1) - BOSS_WEAKEN);
        upd[`state.tokens.${id}.hp`] = Math.max(1, (t.hp ?? 1) - BOSS_WEAKEN);
      }
    }
  }
  await updateDoc(sessionRef(sid), upd);
}

export async function endAccusation(sid, ac) {
  await updateDoc(sessionRef(sid), { 'state.accuse': null });
  await clearVotes(sid, ac.round);
}

async function clearVotes(sid, round) {
  const all = await getDocs(collection(db, 'sessions', sid, 'imposterVotes'));
  await Promise.all(all.docs.filter((d) => d.data().round === round).map((d) => deleteDoc(d.ref).catch(() => {})));
}

// HP a boss starts with, after any accusation reward.
export const bossHp = (b, weakened) => (b.boss && weakened ? Math.max(1, b.hp - BOSS_WEAKEN) : b.hp);

// Runs on the GM screen: tells the TV who has voted.
export function useAccuseEngine(sid, session) {
  const ac = session?.state?.accuse;
  const votes = useVotes(sid, ac?.stage === 'vote' ? ac.round : null);
  const last = useRef('');
  useEffect(() => {
    if (!ac || ac.stage !== 'vote') return;
    const voted = [...new Set(votes.map((v) => v.uid))].filter((u) => ac.uids.includes(u)).sort();
    const key = voted.join(',');
    if (key === last.current || key === [...(ac.voted ?? [])].sort().join(',')) { last.current = key; return; }
    last.current = key;
    updateDoc(sessionRef(sid), { 'state.accuse.voted': voted }).catch(console.error);
  }, [sid, ac, votes]);
  return votes;
}
