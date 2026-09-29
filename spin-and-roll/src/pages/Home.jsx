import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Splash } from '../components/Gate';

// Sends each account to the right dashboard.
export default function Home() {
  const { loading, user, profile } = useAuth();
  if (loading || (user && !profile)) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={profile.role === 'dm' ? '/dm' : '/me'} replace />;
}
