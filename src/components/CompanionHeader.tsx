import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import * as backend from '../api/backend';
import { appName } from '../config';
import { useAuth } from '../auth/useAuth';
import { MarqueeRotator } from './MarqueeRotator';

export function CompanionHeader() {
  const navFn = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isHome = location.pathname === '/home';

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
    staleTime: 30000,
  });

  const companionQ = useQuery({
    queryKey: ['companion-messages'],
    queryFn: () => backend.getCompanionMessages(),
    enabled: Boolean(vq.data?.all_complete),
    refetchInterval: 3600000,
  });

  const vehicleName = user?.vehicle_nickname?.trim();
  const showCompanion = Boolean(vq.data?.all_complete && vehicleName);
  const messageBodies = (companionQ.data?.messages ?? []).map((m) => m.body);
  const hasMessages = messageBodies.length > 0;

  function onClick() {
    if (showCompanion && hasMessages) {
      navFn('/profile#companion-messages');
      return;
    }
    if (showCompanion) {
      navFn('/home');
      return;
    }
    navFn('/home');
  }

  if (!showCompanion) {
    return (
      <header className="app-topbar">
        <button type="button" className="app-brand" onClick={() => navFn('/home')}>
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">{appName}</span>
        </button>
      </header>
    );
  }

  if (!isHome) {
    return (
      <header className="app-topbar">
        <button type="button" className="app-brand" onClick={() => navFn('/home')}>
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">{vehicleName}</span>
        </button>
      </header>
    );
  }

  return (
    <header className="app-topbar app-topbar--home-companion">
      <button
        type="button"
        className="companion-header"
        onClick={onClick}
        aria-label={`${vehicleName}. ${messageBodies[0] ?? 'View companion messages'}`}
      >
        <span className="companion-header__title">
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">{vehicleName}</span>
        </span>
        {companionQ.isLoading ? (
          <span className="companion-header__placeholder">…</span>
        ) : hasMessages ? (
          <MarqueeRotator messages={messageBodies} className="companion-header__message" />
        ) : null}
      </button>
    </header>
  );
}
