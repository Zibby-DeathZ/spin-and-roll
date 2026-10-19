// Test student: a character on the GM's own account, so the GM can open the player screen
// (in another tab, or on a phone signed in as the GM) and try every feature as a player.
// It's marked test: true, so it's never saved to a profile or given a trophy.
import { arrayRemove, arrayUnion, deleteDoc, deleteField, doc, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { buildCharacter, clockOf, xpCap } from './game';

const sessionRef = (sid) => doc(db, 'sessions', sid);
const charRef = (sid, uid) => doc(db, 'sessions', sid, 'characters', uid);

export async function addTestStudent(sid, data, session, uid, familyId, firstName = 'Test') {
  const fam = data.families?.find((f) => f.id === familyId) ?? data.families?.[0];
  const c = fam ? buildCharacter(data, fam, firstName) : { ...structuredClone(data.defaults), name: firstName, firstName };
  // Puts them where the party is, so they show up on the map straight away.
  const loc = session.state?.map?.loc;
  await updateDoc(sessionRef(sid), {
    playerUids: arrayUnion(uid),
    ...(loc ? { [`state.pcPos.${uid}`]: { loc, x: 40 + Math.random() * 20, y: 60 + Math.random() * 15 } } : {}),
  });
  await setDoc(charRef(sid, uid), { ...c, test: true, house: data.houses?.[1] ?? c.house ?? 'Unsorted', vaultOpened: true, gold: 100 });
}

export async function removeTestStudent(sid, uid) {
  await deleteDoc(charRef(sid, uid));
  await updateDoc(sessionRef(sid), { playerUids: arrayRemove(uid), [`state.pcPos.${uid}`]: deleteField() });
}

// One-tap kits for trying things out.
export async function testKit(sid, data, session, uid, kit) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(charRef(sid, uid));
    const c = snap.data();
    if (!c) return;
    const upd = {};
    if (kit === 'level') upd.xp = Math.min(xpCap(c.levelCap), 999999);
    if (kit === 'refill') Object.assign(upd, { hp: c.maxHp, mana: c.maxMana, status: {} });
    if (kit === 'mana') Object.assign(upd, { maxMana: Math.max(c.maxMana, 60), mana: Math.max(c.maxMana, 60) });
    if (kit === 'gold') upd.gold = (c.gold ?? 0) + 500;
    if (kit === 'spells') {
      // Every spell a student could ever learn, locked ones included. Not the villains' curses or the secret one.
      const have = new Set((c.spells ?? []).map((s) => s.id));
      const add = Object.entries(data.spells ?? {})
        .filter(([id, s]) => !have.has(id) && !s.forbidden && !s.villainOnly)
        .map(([id, s]) => ({ id, ...s, ...(s.patronus ? { form: 'test stag' } : {}) }));
      upd.spells = [...(c.spells ?? []), ...add];
    }
    if (kit === 'items') {
      const have = new Set((c.inventory ?? []).map((i) => i.id));
      const add = Object.entries(data.items ?? {}).filter(([id]) => !have.has(id)).map(([id, it]) => ({ id, ...it, qty: 1 }));
      upd.inventory = [...(c.inventory ?? []), ...add];
    }
    if (kit === 'clues') {
      // Every clue, with all three diary pages so the whole diary can be read.
      const inv = [...(c.inventory ?? [])];
      for (const [id, it] of Object.entries(data.items ?? {})) {
        if (it.kind !== 'clue') continue;
        const want = it.read?.pages?.length ?? 1;
        const at = inv.findIndex((i) => i.id === id);
        if (at >= 0) inv[at] = { ...inv[at], qty: Math.max(inv[at].qty ?? 1, want) };
        else inv.push({ id, ...it, qty: want });
      }
      upd.inventory = inv;
    }
    if (kit === 'once') upd.abilityDawn = null;
    if (Object.keys(upd).length) tx.update(snap.ref, upd);
  });
  // Lets once-a-day things work again today: the map, reactions in a duel.
  if (kit === 'once') {
    await updateDoc(sessionRef(sid), { 'state.marauders.usedDawn': null, [`state.duelUsed.${uid}`]: deleteField() });
  }
  return clockOf(session).dawn;
}
