import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CompanionHeader } from '../components/CompanionHeader';
import { useLocationCompanion } from '../hooks/useLocationCompanion';
import { useStuffLabel } from '../hooks/useStuffLabel';
import { useAuth } from '../auth/useAuth';

const navBase: { to: string; labelKey?: 'stuff'; label?: string; end?: boolean }[] = [
  { to: '/home', label: 'Home', end: true },
  { to: '/companion', labelKey: 'stuff' },
  { to: '/transactions', label: 'Activity' },
  { to: '/profile', label: 'Profile' },
];

export function AppShell() {
  const navFn = useNavigate();
  const { logout, busy, user } = useAuth();
  const { tabLabel: stuffTabLabel } = useStuffLabel();
  useLocationCompanion(Boolean(user?.location_opt_in));

  const nav = navBase.map((item) => ({
    to: item.to,
    end: item.end,
    label: item.labelKey === 'stuff' ? stuffTabLabel : item.label!,
  }));

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
