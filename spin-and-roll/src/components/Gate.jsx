import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Wheel from './Wheel';

export function Splash() {
  return (
    <div className="splash">
      <Wheel size={72} />
    </div>
  );
}

// Wraps pages that need a login, and optionally a role ('dm').
export default function Gate({ role, children }) {
  const { loading, user, profile } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) return <Navigate to="/" replace />;
  return children;
}
