// The end of each in-game day: which house earned the most points that day (the House of the Day),
// the perk it gets for tomorrow, and the awards ceremony on the TV.
import { doc, getDoc, getDocs, collection, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { adjust, clockOf, giveItem, logEvent } from './game';
import { computeAwards } from './world';
import { dayLeaders, dayStandings, HOUSE_PERKS, perkById, traitOf } from './houses';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function allChars(sid) {
  const snap = await getDocs(collection(db, 'sessions', sid, 'characters'));
  return Object.fromEntries(snap.docs.map((d) => [d.id, { uid: d.id, ...d.data() }]));
}

// Gives one perk's goods to every member of the winning houses.
async function grantPerk(sid, data, chars, houses, perk) {
  for (const c of Object.values(chars)) {
    if (!houses.includes(c.house)) continue;
    if (perk.item && data.items?.[perk.item]) await giveItem(sid, c.uid, { id: perk.item, ...data.items[perk.item] }, 1);
    if (perk.gold) await adjust(sid, c.uid, 'gold', perk.gold);
  }
}

// Called when the clock rolls over to a new morning. `day` is the day that just ended.
export async function endOfDay(sid, data, day) {
  if (!data.houses) return;
  const session = (await getDoc(sessionRef(sid))).data();
  const points = session?.state?.housePoints ?? {};
  const start = session?.state?.dayStart ?? {};
  const chars = await allChars(sid);
  const standings = dayStandings(points, start.points ?? {}, data.houses);
  const leaders = dayLeaders(standings);
  const perk = leaders.length ? pick(HOUSE_PERKS) : null;
  const awards = await computeAwards(sid, chars, start.at ?? 0).catch(() => []);
  const now = clockOf(session);

  await updateDoc(sessionRef(sid), {
    'state.dayStart': { points: { ...points }, at: Date.now(), day: now.day },
    'state.houseOfDay': leaders.length ? { houses: leaders, perk: perk.id, day: now.day, dawn: now.dawn } : null,
  });
  if (perk) await grantPerk(sid, data, chars, leaders, perk);
  // Nothing happened (the prologue, say): no ceremony.
  if (!leaders.length && !awards.length) return;
  await updateDoc(sessionRef(sid), {
    'state.show': { type: 'awards', kind: 'day', day, standings, leaders, perk: perk?.id ?? null, awards, at: Date.now() },
  });
  if (perk) await logEvent(sid, { type: 'house_of_day', payload: { houses: leaders, perk: perk.id, name: perk.name, icon: perk.icon, day } });
}

// The GM picks a different perk (or draws again). The first perk's gifts are kept.
export async function changePerk(sid, data, perkId = null) {
  const session = (await getDoc(sessionRef(sid))).data();
  const hod = session?.state?.houseOfDay;
  if (!hod) return;
  const perk = perkById(perkId) ?? pick(HOUSE_PERKS.filter((p) => p.id !== hod.perk));
  await updateDoc(sessionRef(sid), {
    'state.houseOfDay.perk': perk.id,
    ...(session.state?.show?.kind === 'day' ? { 'state.show.perk': perk.id } : {}),
  });
  await grantPerk(sid, data, await allChars(sid), hod.houses, perk);
  await logEvent(sid, { type: 'house_of_day', payload: { houses: hod.houses, perk: perk.id, name: perk.name, icon: perk.icon, day: hod.day } });
}

// The GM makes a house the House of the Day by hand (or clears it).
export async function setHouseOfDay(sid, data, house) {
  const session = (await getDoc(sessionRef(sid))).data();
  const now = clockOf(session);
  if (!house) { await updateDoc(sessionRef(sid), { 'state.houseOfDay': null }); return; }
  const perk = pick(HOUSE_PERKS);
  await updateDoc(sessionRef(sid), { 'state.houseOfDay': { houses: [house], perk: perk.id, day: now.day, dawn: now.dawn } });
  await grantPerk(sid, data, await allChars(sid), [house], perk);
  await logEvent(sid, { type: 'house_of_day', payload: { houses: [house], perk: perk.id, name: perk.name, icon: perk.icon, day: now.day } });
}

// Is a perk active for this house right now?
export const perkFor = (session, house) => {
  const h = session?.state?.houseOfDay;
  return h && h.houses?.includes(house) ? perkById(h.perk) : null;
};

// ---------- House traits that the GM screen applies ----------

// Uses up a student's once-a-day house trait and announces it.
export async function spendTrait(sid, uid, what) {
  let name = null;
  await runTransaction(db, async (tx) => {
    const s = (await tx.get(sessionRef(sid))).data();
    const cSnap = await tx.get(charRef(sid, uid));
    const c = cSnap.data();
    const dawn = clockOf(s).dawn;
    if (!c || c.houseDawn === dawn) return;
    tx.update(cSnap.ref, { houseDawn: dawn });
    name = c.firstName ?? c.name;
  });
  if (name) await logEvent(sid, { type: 'house_trait', targetUid: uid, payload: { what } });
  return !!name;
}

// Hufflepuff's Steadfast: a knocked-out Hufflepuff with a charge left is back on 1 HP.
export async function steadfast(sid, uid) {
  let saved = false;
  await runTransaction(db, async (tx) => {
    const s = (await tx.get(sessionRef(sid))).data();
    const cSnap = await tx.get(charRef(sid, uid));
    const c = cSnap.data();
    const dawn = clockOf(s).dawn;
    if (!c || c.hp > 0 || traitOf(c)?.trait !== 'steadfast' || c.houseDawn === dawn) return;
    tx.update(cSnap.ref, { hp: 1, houseDawn: dawn });
    saved = true;
  });
  if (saved) await logEvent(sid, { type: 'house_trait', targetUid: uid, payload: { what: 'steadfast' } });
}
