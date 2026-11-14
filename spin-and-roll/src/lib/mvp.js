import { deleteField, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { awardPoints, logEvent } from './game';
import { addNote } from './notes';
import { setShow } from './world';

// MVP of the Day: the GM crowns one student who met enough of the requirements. They wear the Badge (+2 to
// every d20 roll) for the whole of the next day, and get one perk of their own.

export const MVP_ROLL_BONUS = 2;
const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);

// The Badge works on the day after the one they were crowned for.
export const mvpActive = (c, clk) => !!c?.mvp && c.mvp.forDay === (clk?.day ?? 0);
export const mvpBonus = (c, clk) => (mvpActive(c, clk) ? MVP_ROLL_BONUS : 0);

export async function crownMvp({ sid, data, gmUid, day, c, reasons, perk, when }) {
  const M = data.mvp;
  const who = c.firstName ?? c.name;
  const keep = { title: perk.title, icon: perk.icon ?? '🌟', text: perk.text };
  await runTransaction(db, async (tx) => {
    const [sSnap, cSnap] = await Promise.all([tx.get(sessionRef(sid)), tx.get(charRef(sid, c.uid))]);
    const prior = sSnap.data()?.state?.mvp?.[day];
    if (prior) throw new Error(`Day ${day} already has an MVP: ${prior.name}. Remove it first to change it.`);
    const now = cSnap.data();
    const upd = { mvp: { day, forDay: day + 1, perk: keep, used: false, at: Date.now() } };
    if (perk.now?.gold) upd.gold = (now.gold ?? 0) + perk.now.gold;
    tx.update(cSnap.ref, upd);
    tx.update(sSnap.ref, {
      [`state.mvp.${day}`]: {
        uid: c.uid, name: who, house: c.house ?? null, family: c.family ?? null,
        reasons, perk: keep, at: Date.now(),
      },
    });
  });
  if (M.badge.points) await awardPoints(sid, c.uid, c.house, M.badge.points, `MVP of Day ${day}`);
  await addNote(gmUid, sid, {
    kind: 'reward', uid: c.uid, night: day + 1, when: when ?? '',
    text: `🏅 MVP of Day ${day}: ${who}. All of Day ${day + 1}: +${MVP_ROLL_BONUS} to every roll (the app adds it). Perk: ${keep.title}. ${keep.text}`,
  }).catch(() => {});
  await logEvent(sid, { type: 'mvp', targetUid: c.uid, payload: { day, perk: keep.title } });
  await setShow(sid, {
    type: 'mvp', at: Date.now(), day, name: who, house: c.house ?? null, family: c.family ?? null,
    reasons: reasons.map((id) => M.requirements.find((r) => r.id === id)?.text ?? id),
    perk: keep, badge: M.badge.text, points: M.badge.points ?? 0,
  });
}

export async function removeMvp(sid, day, uid) {
  await runTransaction(db, async (tx) => {
    const sSnap = await tx.get(sessionRef(sid));
    const cSnap = uid ? await tx.get(charRef(sid, uid)) : null;
    tx.update(sSnap.ref, { [`state.mvp.${day}`]: deleteField() });
    if (cSnap?.exists() && cSnap.data().mvp?.day === day) tx.update(cSnap.ref, { mvp: deleteField() });
  });
}

export const setMvpUsed = (sid, uid, used) => runTransaction(db, async (tx) => {
  const ref = charRef(sid, uid);
  const snap = await tx.get(ref);
  if (snap.data()?.mvp) tx.update(ref, { 'mvp.used': used });
});
