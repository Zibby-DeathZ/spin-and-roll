import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signInWithGoogle, useAuth } from '../auth/AuthProvider';
import Wheel from '../components/Wheel';

export default function Login() {
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  if (!loading && user) return <Navigate to="/" replace />;

  const go = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Allow pop-ups for this site and try again.');
      }
    }
  };

  return (
    <main className="login">
      <Wheel size={168} />
      <h1>Spin & Roll</h1>
      <p className="muted">Your campaigns, characters and trophies in one place.</p>
      <button className="btn gold big" onClick={go}>Sign in with Google</button>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
