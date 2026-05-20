import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as backend from '../api/backend';
import { appName } from '../config';
import { useAuth } from '../auth/useAuth';
import { MarqueeText } from './MarqueeText';

export function CompanionHeader() {
  const navFn = useNavigate();
  const { user } = useAuth();

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
  const preview = companionQ.data?.messages?.[0];

  function onClick() {
    if (showCompanion && preview) {
      navFn('/profile#companion-messages');
      return;
    }
    navFn('/home');
  }

  if (!showCompanion) {
    return (
      <header className="app-topbar">
        <button type="button" className="app-brand" onClick={onClick}>
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">{appName}</span>
        </button>
      </header>
    );
  }

  return (
    <header className="app-topbar">
      <button
        type="button"
        className="companion-header"
        onClick={onClick}
        aria-label={`${vehicleName}. ${preview?.body ?? 'View companion messages'}`}
      >
        <span className="companion-header__title">
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">{vehicleName}</span>
        </span>
        {preview ? (
          <MarqueeText text={preview.body} className="companion-header__message" />
        ) : companionQ.isLoading ? (
          <span className="companion-header__placeholder">…</span>
        ) : null}
      </button>
    </header>
  );
}
