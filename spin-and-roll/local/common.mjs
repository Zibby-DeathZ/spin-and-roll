// Shared bits for the laptop game server.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
export const PORTS = { app: 5173, firestore: 8181, auth: 9199, hub: 4499 };
// The saved game lives outside the project (in AppData on Windows), so OneDrive or any other sync tool never
// touches it while the game is writing to it.
export const STORE = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'SpinAndRoll') : HERE;
export const DATA = path.join(STORE, 'data');
export const BACKUPS = path.join(STORE, 'backups');
fs.mkdirSync(STORE, { recursive: true });
// A game saved inside the project by an earlier version moves out once.
if (STORE !== HERE && fs.existsSync(path.join(HERE, 'data')) && !fs.existsSync(DATA)) fs.renameSync(path.join(HERE, 'data'), DATA);

// The project id comes from the app's own Firebase config (read, never changed), so the laptop database
// and the app agree on which project they are.
export function projectId() {
  const cfg = fs.readFileSync(path.join(ROOT, 'src', 'firebase.config.js'), 'utf8');
  const m = cfg.match(/projectId\s*:\s*['"]([^'"]+)['"]/);
  if (!m) throw new Error('Could not find projectId in src/firebase.config.js');
  return m[1];
}

// firebase.json for the emulator, and a copy of the real security rules, so the laptop behaves like the real thing.
export function writeFirebaseJson() {
  fs.copyFileSync(path.join(ROOT, 'firestore.rules'), path.join(HERE, 'firestore.rules'));
  fs.writeFileSync(path.join(HERE, 'firebase.json'), JSON.stringify({
    firestore: { rules: 'firestore.rules' },
    emulators: {
      firestore: { host: '127.0.0.1', port: PORTS.firestore },
      auth: { host: '127.0.0.1', port: PORTS.auth },
      hub: { host: '127.0.0.1', port: PORTS.hub },
      ui: { enabled: false },
      logging: { host: '127.0.0.1', port: 4599 },
      singleProjectMode: true,
    },
  }, null, 2));
}

// The laptop's address on the Wi-Fi (the one phones use).
export function lanAddresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === 'IPv4' && !a.internal && !/^169\.254\./.test(a.address)) out.push({ name, address: a.address });
    }
  }
  // Wi-Fi first, virtual adapters (VirtualBox, WSL, VPN) last.
  const score = (n) => (/wi-?fi|wlan|wireless/i.test(n.name) ? 0 : /vethernet|virtual|vmware|vbox|wsl|docker|tailscale|zerotier|vpn/i.test(n.name) ? 2 : 1);
  return out.sort((a, b) => score(a) - score(b));
}

// Run the tools through node directly (not their .cmd wrappers), so Ctrl+C on Windows doesn't stop to ask
// "Terminate batch job?" and the database gets the chance to save.
export const firebaseJs = path.join(HERE, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
export const viteJs = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
export const firebase = (args) => [process.execPath, [firebaseJs, ...args]];
export const vite = (args) => [process.execPath, [viteJs, ...args]];

export async function waitForPort(port, ms = 120000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      await fetch(`http://127.0.0.1:${port}/`);
      return true;
    } catch { await new Promise((r) => setTimeout(r, 700)); }
  }
  return false;
}

export const hasData = () => fs.existsSync(path.join(DATA, 'firebase-export-metadata.json'));
