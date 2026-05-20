import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CompanionHeader } from '../components/CompanionHeader';
import { useAuth } from '../auth/useAuth';

const nav: { to: string; label: string; end?: boolean }[] = [
  { to: '/home', label: 'Home', end: true },
  { to: '/face', label: 'Face' },
  { to: '/transactions', label: 'Activity' },
  { to: '/profile', label: 'Profile' },
];

export function AppShell() {
  const navFn = useNavigate();
  const { logout, busy } = useAuth();

  return (
    <div className="app-shell">
      <CompanionHeader />

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-tabbar" aria-label="Primary">
        {nav.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <footer className="app-footer">
        <button
          type="button"
          className="link-button"
          disabled={busy}
          onClick={() => void logout().then(() => navFn('/welcome'))}
        >
          Sign out
        </button>
      </footer>
    </div>
  );
}
