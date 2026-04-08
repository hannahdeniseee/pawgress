import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/Navbar.css';

const TABS = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Pet Shop' },
  { path: '/customization', label: 'Customize Pet' },
  { path: '/profile', label: 'My Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth0();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-tabs">
        {TABS.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`navbar-tab ${location.pathname === tab.path ? 'active' : ''}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="navbar-user">
        {user?.picture && (
          <img src={user.picture} alt="" className="navbar-avatar" />
        )}
        <span className="navbar-username">{user?.nickname || user?.name}</span>
        <button
          className="navbar-logout"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
