import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the build work on any GitHub Pages repo path.
// Game night on the laptop (local/start.mjs) sets SPIN_LOCAL: then the app is served over HTTPS (so phone
// microphones work for Lumos) and passes database and sign-in traffic on to the Firebase Emulator.
const local = process.env.SPIN_LOCAL === '1';
const FIRESTORE = `http://127.0.0.1:${process.env.SPIN_FIRESTORE_PORT ?? 8181}`;
const AUTH = `http://127.0.0.1:${process.env.SPIN_AUTH_PORT ?? 9199}`;
const proxy = {
  '/google.firestore.v1.Firestore': { target: FIRESTORE, changeOrigin: true },
  '/v1/projects': { target: FIRESTORE, changeOrigin: true },
  '/identitytoolkit.googleapis.com': { target: AUTH, changeOrigin: true },
  '/securetoken.googleapis.com': { target: AUTH, changeOrigin: true },
  '/emulator': { target: AUTH, changeOrigin: true },
};
const server = local ? {
  host: '0.0.0.0',
  port: Number(process.env.SPIN_PORT ?? 5173),
  strictPort: true,
  https: { key: fs.readFileSync(process.env.SPIN_KEY), cert: fs.readFileSync(process.env.SPIN_CERT) },
  proxy,
} : undefined;

export default defineConfig({
  plugins: [react()],
  base: './',
  ...(local ? { server, preview: server, build: { outDir: 'local/site', emptyOutDir: true } } : {}),
});
