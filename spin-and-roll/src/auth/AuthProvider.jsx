import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, profile: null });

  useEffect(() => {
    let stopProfile = null;
    const stopAuth = onAuthStateChanged(auth, async (user) => {
      stopProfile?.();
      stopProfile = null;
      if (!user) {
        setState({ loading: false, user: null, profile: null });
        return;
      }
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // Every new account starts as a player. DM is set by hand in the console.
        await setDoc(ref, {
          displayName: user.displayName || 'Adventurer',
          photoURL: user.photoURL || null,
          role: 'player',
          createdAt: serverTimestamp(),
        });
      }
      stopProfile = onSnapshot(ref, (s) =>
        setState({ loading: false, user, profile: { id: s.id, ...s.data() } })
      );
    });
    return () => {
      stopAuth();
      stopProfile?.();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);
