import { useLocation, useNavigate } from 'react-router-dom';
import { appName } from '../config';
import { useStuffLabel } from '../hooks/useStuffLabel';

const ROUTE_TITLES: Record<string, string> = {
  '/home': appName,
  '/transactions': 'Activity',
  '/profile': 'Profile',
};

export function CompanionHeader() {
  const navFn = useNavigate();
  const location = useLocation();
  const { tabLabel: stuffTabLabel } = useStuffLabel();

  let title = ROUTE_TITLES[location.pathname] ?? appName;
  if (location.pathname === '/companion') {
    title = stuffTabLabel;
  }

  const isHome = location.pathname === '/home';

  return (
    <header className={`app-topbar${isHome ? ' app-topbar--feed' : ''}`}>
      <button
        type="button"
        className="app-topbar__brand"
        onClick={() => navFn('/home')}
        aria-label="Home"
      >
        {isHome ? (
          <>
            <span className="app-topbar__logo" aria-hidden />
            <span className="app-topbar__title app-topbar__title--brand">{title}</span>
          </>
        ) : (
          <span className="app-topbar__title">{title}</span>
        )}
      </button>
    </header>
  );
}
