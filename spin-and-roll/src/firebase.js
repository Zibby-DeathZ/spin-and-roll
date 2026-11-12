import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';

export { firebaseConfig };

// Game night on the laptop ("Start Game Night.bat") builds with VITE_LOCAL=1. Then the database and sign-in
// are the Firebase Emulator running on the laptop, reached through the same address as the app itself, so
// it is free, unlimited, and works for every phone on the Wi-Fi. The online version is untouched.
export const LOCAL = import.meta.env.VITE_LOCAL === '1';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = LOCAL
  ? initializeFirestore(app, { host: location.host, ssl: location.protocol === 'https:', experimentalForceLongPolling: true })
  : getFirestore(app);
if (LOCAL) connectAuthEmulator(auth, location.origin, { disableWarnings: true });
export const googleProvider = new GoogleAuthProvider();
