import { Link } from 'react-router-dom';
import { logOut, useAuth } from '../auth/AuthProvider';
import Wheel from './Wheel';

export default function TopBar() {
  const { profile } = useAuth();
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <Wheel size={30} spin={false} />
        <span>Spin & Roll</span>
      </Link>
      <div className="topbar-right">
        <span className="who">
          {profile?.displayName}
          {profile?.role === 'dm' && <span className="role-tag">DM</span>}
        </span>
        <button className="btn ghost small" onClick={logOut}>Sign out</button>
      </div>
    </header>
  );
}
