// Loads a "Back up everything" file into the laptop game database: every game, character, owl, note and
// trophy, plus a sign-in account for each player with the SAME account id as online, so their characters
// stay theirs. Run with "Import Game.bat" while the game is NOT running.
//
//   node import.mjs                  newest .json in local/import
//   node import.mjs path/to/file.json
//   node import.mjs --fresh ...      wipe the laptop database first (a backup is kept)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { DATA, HERE, firebase, firebaseJs, hasData, projectId, writeFirebaseJson } from './common.mjs';

const say = (...a) => console.log(...a);
const args = process.argv.slice(2);
const inside = args.includes('--inside');
const fresh = args.includes('--fresh');
const fileArg = args.find((a) => !a.startsWith('--'));

function pickFile() {
  if (fileArg) return path.resolve(fileArg);
  const dir = path.join(HERE, 'import');
  fs.mkdirSync(dir, { recursive: true });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

if (!inside) {
  // Outside: start the database just for the import, run this script inside it, and save on the way out.
  const file = pickFile();
  if (!file || !fs.existsSync(file)) {
    say('\n✖ No backup file found. Put the .json from "Back up everything" into the  local\\import  folder, then run this again.\n');
    process.exit(1);
  }
  if (!fs.existsSync(firebaseJs)) { say('\n✖ Run "Setup Game Night.bat" first.\n'); process.exit(1); }
  writeFirebaseJson();
  if (hasData()) {
    const keep = path.join(HERE, 'backups', `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}-before-import`);
    fs.mkdirSync(path.dirname(keep), { recursive: true });
    fs.cpSync(DATA, keep, { recursive: true });
    say(`📦 Kept a copy of the laptop game as it was: local\\backups\\${path.basename(keep)}`);
    if (fresh) fs.rmSync(DATA, { recursive: true, force: true });
  }
  say(`📥 Importing ${path.basename(file)}…`);
  const fbArgs = ['emulators:exec', '--only', 'firestore,auth', '--project', projectId(), '--export-on-exit', DATA];
  if (hasData()) fbArgs.push('--import', DATA);
  fbArgs.push(`"${process.execPath}" "${path.join(HERE, 'import.mjs')}" --inside "${file}"`);
  const [cmd, cmdArgs] = firebase(fbArgs);
  const r = spawnSync(cmd, cmdArgs, { cwd: HERE, stdio: 'inherit' });
  say(r.status === 0 ? '\n✔ Done. Start the game with "Start Game Night.bat".\n' : '\n✖ The import did not finish. Scroll up for the error.\n');
  process.exit(r.status ?? 1);
}

// ---------- Inside the running emulator ----------
const { initializeApp } = await import('firebase-admin/app');
const { getFirestore, Timestamp } = await import('firebase-admin/firestore');
const { getAuth } = await import('firebase-admin/auth');

const file = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
if (file.app !== 'spin-and-roll' || !file.docs) { say('✖ That file is not a Spin & Roll backup.'); process.exit(1); }
initializeApp({ projectId: projectId() });
const db = getFirestore();
const auth = getAuth();

const revive = (v) => {
  if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 1 && typeof v.__ts === 'number') return Timestamp.fromMillis(v.__ts);
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)]));
  return v;
};

// The GM stays the GM.
if (file.gmUid && file.docs[`users/${file.gmUid}`]) file.docs[`users/${file.gmUid}`].role = 'dm';

const entries = Object.entries(file.docs);
for (let i = 0; i < entries.length; i += 400) {
  const batch = db.batch();
  entries.slice(i, i + 400).forEach(([p, data]) => batch.set(db.doc(p), revive(data)));
  await batch.commit();
}
say(`  ✔ ${entries.length} records`);

// Sign-in accounts: one per player, same id as online. They sign in by tapping their name.
const slug = (t) => (t ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'player';
const users = entries.filter(([p]) => /^users\/[^/]+$/.test(p)).map(([p, d]) => {
  const uid = p.split('/')[1];
  const name = d.displayName ?? 'Player';
  const email = `${slug(name)}.${uid.slice(0, 4).toLowerCase()}@spinandroll.game`;
  return {
    uid, email, displayName: name, emailVerified: true,
    ...(d.photoURL ? { photoURL: d.photoURL } : {}),
    providerData: [{ uid: `google-${uid}`, providerId: 'google.com', email, displayName: name, ...(d.photoURL ? { photoURL: d.photoURL } : {}) }],
  };
});
let made = 0;
for (const u of users) {
  try { await auth.deleteUser(u.uid); } catch { /* new */ }
}
for (let i = 0; i < users.length; i += 100) {
  const res = await auth.importUsers(users.slice(i, i + 100));
  made += res.successCount;
  res.errors.forEach((e) => say(`  ⚠️  ${users[i + e.index].displayName}: ${e.error.message}`));
}
say(`  ✔ ${made} player accounts: ${users.map((u) => u.displayName).join(', ')}`);
