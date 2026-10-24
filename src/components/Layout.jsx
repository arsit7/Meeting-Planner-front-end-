import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/meetings" className="brand">
          <img src="/favicon.svg" alt="" width="24" height="24" />
          Meeting Planner
        </Link>
        <nav className="topnav">
          <NavLink to="/meetings" end>
            Meetings
          </NavLink>
          <NavLink to="/meetings/new">New meeting</NavLink>
          <NavLink to="/profile" className="profile-link" aria-label="Profile">
            <Avatar user={user} size={30} />
            <span className="hide-sm">{user?.name}</span>
          </NavLink>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
