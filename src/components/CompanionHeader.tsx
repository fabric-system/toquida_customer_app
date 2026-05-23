import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import * as backend from '../api/backend';
import { appName } from '../config';
import { useAuth } from '../auth/useAuth';
import { MarqueeRotator } from './MarqueeRotator';

function BrandTitle({ label }: { label: string }) {
  return (
    <>
      <span className="app-brand-mark" aria-hidden />
      <span className="app-brand-text">{label}</span>
    </>
  );
}

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

  function openMessages() {
    if (hasMessages) {
      navFn('/companion#messages');
    }
  }

  if (!showCompanion) {
    return (
      <header className="app-topbar">
        <button type="button" className="app-brand" onClick={() => navFn('/home')}>
          <BrandTitle label={appName} />
        </button>
      </header>
    );
  }

  if (!isHome) {
    return (
      <header className="app-topbar">
        <button type="button" className="app-brand" onClick={() => navFn('/home')}>
          <BrandTitle label={vehicleName!} />
        </button>
      </header>
    );
  }

  return (
    <header className="app-topbar app-topbar--home-companion">
      <div className="app-brand app-brand--home-title" aria-hidden={false}>
        <BrandTitle label={vehicleName!} />
      </div>
      {companionQ.isLoading ? (
        <span className="companion-header__placeholder">…</span>
      ) : hasMessages ? (
        <button
          type="button"
          className="companion-home-marquee"
          onClick={openMessages}
          aria-label={`Messages from ${vehicleName}`}
        >
          <MarqueeRotator messages={messageBodies} className="companion-header__message" />
        </button>
      ) : null}
    </header>
  );
}
