// Game night on the laptop. Starts the free Firebase Emulator (database + sign-in) and the app, prints the
// address and a QR code for the phones, and saves the game every few minutes. Close with Ctrl+C.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import qrcode from 'qrcode-terminal';
import selfsigned from 'selfsigned';
import {
  DATA, HERE, PORTS, ROOT, firebase, firebaseJs, hasData, lanAddresses, projectId, vite, viteJs, waitForPort, writeFirebaseJson,
} from './common.mjs';

const SAVE_EVERY_MIN = 3;
const BACKUP_EVERY_MIN = 30;
const KEEP_BACKUPS = 12;
const say = (...a) => console.log(...a);
const shell = process.platform === 'win32';
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

function need(ok, msg) {
  if (ok) return;
  say(`\n✖ ${msg}\n`);
  process.exit(1);
}

// ---------- Checks ----------
need(fs.existsSync(path.join(ROOT, 'src', 'firebase.config.js')), 'src/firebase.config.js is missing.');
const java = spawnSync('java', ['-version'], { shell, encoding: 'utf8' });
need(java.status === 0, 'Java is not installed. Install the free "Temurin 21 (LTS)" from https://adoptium.net, then run this again.');
need(fs.existsSync(viteJs), 'The app\'s packages are missing. In the spin-and-roll folder run:  npm install');
need(fs.existsSync(firebaseJs), 'The game-server packages are missing. Double-click "Setup Game Night.bat" first.');

const pid = projectId();
writeFirebaseJson();
const ips = lanAddresses();
need(ips.length, 'This laptop is not on any network. Join the Wi-Fi (or turn on its hotspot) and try again.');

// ---------- HTTPS certificate (phones need https for the microphone, for Lumos) ----------
const certDir = path.join(HERE, 'cert');
fs.mkdirSync(certDir, { recursive: true });
const certFile = path.join(certDir, 'cert.pem');
const keyFile = path.join(certDir, 'key.pem');
const ipsFile = path.join(certDir, 'ips.json');
const wanted = ips.map((i) => i.address).sort();
const had = fs.existsSync(ipsFile) ? JSON.parse(fs.readFileSync(ipsFile, 'utf8')) : [];
if (!fs.existsSync(certFile) || wanted.some((ip) => !had.includes(ip))) {
  const all = [...new Set([...had, ...wanted])];
  const pems = selfsigned.generate([{ name: 'commonName', value: 'Spin and Roll' }], {
    days: 3650, keySize: 2048, algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' }, ...all.map((ip) => ({ type: 7, ip }))] }],
  });
  fs.writeFileSync(certFile, pems.cert);
  fs.writeFileSync(keyFile, pems.private);
  fs.writeFileSync(ipsFile, JSON.stringify(all));
}

const env = {
  ...process.env,
  SPIN_LOCAL: '1', VITE_LOCAL: '1', SPIN_KEY: keyFile, SPIN_CERT: certFile,
  SPIN_PORT: String(PORTS.app), SPIN_FIRESTORE_PORT: String(PORTS.firestore), SPIN_AUTH_PORT: String(PORTS.auth),
};

// ---------- Safety copy of last time's game before anything starts ----------
const backups = path.join(HERE, 'backups');
function backup(label) {
  if (!hasData()) return;
  fs.mkdirSync(backups, { recursive: true });
  fs.cpSync(DATA, path.join(backups, `${stamp()}-${label}`), { recursive: true });
  const list = fs.readdirSync(backups).sort();
  list.slice(0, Math.max(0, list.length - KEEP_BACKUPS)).forEach((d) => fs.rmSync(path.join(backups, d), { recursive: true, force: true }));
}
backup('before-start');

// ---------- Build the app for the laptop ----------
say('\n🔨 Getting the app ready (about 20 seconds)…');
const built = spawnSync(...vite(['build']), { cwd: ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] });
need(built.status === 0, 'The app did not build. Scroll up for the error.');

// ---------- The database ----------
say('🗄️  Starting the game database…');
const fbArgs = ['emulators:start', '--only', 'firestore,auth', '--project', pid, '--export-on-exit', DATA];
if (hasData()) fbArgs.push('--import', DATA);
const fb = spawn(...firebase(fbArgs), { cwd: HERE, env, stdio: ['ignore', 'pipe', 'pipe'] });
const fbLog = fs.createWriteStream(path.join(HERE, 'database.log'));
fb.stdout.pipe(fbLog);
fb.stderr.pipe(fbLog);
fb.on('exit', (code) => {
  say(code ? `\n✖ The database stopped (code ${code}). See local/database.log.` : '\n💾 Game saved. The database has stopped.');
  stopApp();
  process.exit(code ?? 0);
});
const dbUp = await waitForPort(PORTS.firestore) && await waitForPort(PORTS.auth);
need(dbUp, 'The database did not start. See local/database.log (and check Java is installed).');

// ---------- The app ----------
const app = spawn(...vite(['preview']), { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
app.stderr.on('data', (d) => process.stderr.write(d));
function stopApp() { try { app.kill(); } catch { /* already gone */ } }

const url = `https://${ips[0].address}:${PORTS.app}`;
await new Promise((r) => setTimeout(r, 1500));
say(`
════════════════════════════════════════════════════════════════
  🎲  SPIN & ROLL: GAME NIGHT IS RUNNING ON THIS LAPTOP
════════════════════════════════════════════════════════════════

  Open this on the TV and on every phone (same Wi-Fi):

      ${url}
${ips.slice(1).map((i) => `      (or https://${i.address}:${PORTS.app}  on ${i.name})`).join('\n')}

  First time on each device: the browser says "not secure" / "not private".
  Tap  Advanced  →  Proceed  (Chrome)   or   Show Details → visit this website  (iPhone).

  Sign in: tap "Sign in with Google", then tap your name in the list.

  The game saves itself every ${SAVE_EVERY_MIN} minutes.
  To finish the night: click this window and press  Ctrl + C  (once). Wait for "Game saved".
`);
qrcode.generate(url, { small: true }, (q) => say(q));

// ---------- Autosave ----------
let saving = false;
async function autosave() {
  if (saving) return;
  saving = true;
  const tmp = path.join(HERE, 'data-saving');
  fs.rmSync(tmp, { recursive: true, force: true });
  const r = spawnSync(...firebase(['emulators:export', tmp, '--force', '--project', pid]), { cwd: HERE, env, encoding: 'utf8' });
  if (r.status === 0 && fs.existsSync(path.join(tmp, 'firebase-export-metadata.json'))) {
    const old = path.join(HERE, 'data-old');
    fs.rmSync(old, { recursive: true, force: true });
    if (fs.existsSync(DATA)) fs.renameSync(DATA, old);
    fs.renameSync(tmp, DATA);
    fs.rmSync(old, { recursive: true, force: true });
    say(`  💾 Saved at ${new Date().toLocaleTimeString()}`);
  } else {
    say(`  ⚠️  Autosave failed at ${new Date().toLocaleTimeString()} (the game is still running).`);
  }
  saving = false;
}
setInterval(autosave, SAVE_EVERY_MIN * 60000);
setInterval(() => backup('during-game'), BACKUP_EVERY_MIN * 60000);

process.on('SIGINT', () => {
  say('\n⏳ Saving the game… (do not close the window yet)');
  stopApp();
  // The database saves itself on Ctrl+C (--export-on-exit) and then exits, which ends this script.
  setTimeout(() => process.exit(0), 60000);
});
