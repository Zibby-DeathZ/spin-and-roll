import { signInWithCustomToken, updateProfile } from 'firebase/auth';
import { auth, firebaseConfig } from '../firebase';

// Laptop game server only. Sign-in is the Firebase Emulator, which needs no Google account: each player just
// taps their name (the accounts were brought over by "Import Game.bat", with the same ids as online).

const pid = () => firebaseConfig.projectId;
const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

// The emulator accepts unsigned tokens, so the phone can make its own.
function tokenFor(uid) {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    iss: 'spin-and-roll@local', sub: 'spin-and-roll@local', uid, iat: now, exp: now + 3600,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
  })}.`;
}

export async function listLocalAccounts() {
  const res = await fetch(`${location.origin}/identitytoolkit.googleapis.com/v1/projects/${pid()}/accounts:batchGet?maxResults=500`,
    { headers: { Authorization: 'Bearer owner' } });
  if (!res.ok) throw new Error(`The game server did not answer (${res.status}).`);
  const { users = [] } = await res.json();
  return users
    .map((u) => ({ uid: u.localId, name: u.displayName ?? u.email ?? 'Player', photo: u.photoUrl ?? null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const signInLocal = (uid) => signInWithCustomToken(auth, tokenFor(uid));

export async function newLocalAccount(name) {
  const uid = `local-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const cred = await signInLocal(uid);
  await updateProfile(cred.user, { displayName: name });
  return cred;
}
