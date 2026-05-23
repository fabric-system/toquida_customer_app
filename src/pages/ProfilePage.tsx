import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as backend from '../api/backend';
import type { VerificationStep } from '../api/types';
import { UserAvatar } from '../components/UserAvatar';
import { requestLocationPermission } from '../hooks/useLocationCompanion';
import { useStuffLabel } from '../hooks/useStuffLabel';
import { useAuth } from '../auth/useAuth';
import { verificationLabel } from '../ui/format';

const STEP_META: Record<
  VerificationStep['id'],
  { title: string; hint: string; href?: string }
> = {
  full_name: {
    title: 'Full name',
    hint: 'Enter your legal name below.',
  },
  rfid_tag: {
    title: 'Linked RFID tag',
    hint: 'Claim and link your tag at the kiosk.',
    href: '/tags',
  },
  face_enrollment: {
    title: 'Face enrollment',
    hint: 'Enroll your face in the app, then claim at the kiosk.',
    href: '/face',
  },
  vehicle_profile: {
    title: 'My Stuff',
    hint: 'Set type, design, photos, vibe, and nickname in the My Stuff tab.',
    href: '/companion',
  },
};

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const { tabLabel: stuffTabLabel, hasNamedStuff, nickname: stuffNickname } = useStuffLabel();
  const qc = useQueryClient();

  const [nickname, setNickname] = useState(user?.display_name ?? '');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [locationOptIn, setLocationOptIn] = useState(Boolean(user?.location_opt_in));
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setNickname(user?.display_name ?? '');
    setFullName(user?.full_name ?? '');
    setLocationOptIn(Boolean(user?.location_opt_in));
  }, [user]);

  const balanceQ = useQuery({
    queryKey: ['balance'],
    queryFn: () => backend.getBalance(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
    refetchOnWindowFocus: true,
  });

  const companionQ = useQuery({
    queryKey: ['companion-messages'],
    queryFn: () => backend.getCompanionMessages(),
    enabled: hasNamedStuff,
    refetchInterval: 3600000,
  });

  const latestMessage = companionQ.data?.messages?.[0];

  const save = useMutation({
    mutationFn: () =>
      backend.patchMe({
        display_name: nickname.trim() || null,
        full_name: fullName.trim() || null,
      }),
    onSuccess: async () => {
      await refreshMe();
      void qc.invalidateQueries({ queryKey: ['verification'] });
      void qc.invalidateQueries({ queryKey: ['companion-messages'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  async function onLocationToggle(next: boolean) {
    setLocationError(null);
    setLocationBusy(true);
    try {
      if (next) {
        await requestLocationPermission();
      }
      await backend.patchMe({ location_opt_in: next });
      setLocationOptIn(next);
      await refreshMe();
      void qc.invalidateQueries({ queryKey: ['companion-messages'] });
    } catch (err) {
      setLocationOptIn(false);
      setLocationError(
        err instanceof Error ? err.message : 'Could not enable location. Check browser permission.',
      );
    } finally {
      setLocationBusy(false);
    }
  }

  const progress = vq.data?.progress;
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="page page--padded">
      <header className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="muted page-lead">
          Account, balance, and verification. Stuff settings live in{' '}
          <Link to="/companion">{stuffTabLabel}</Link>.
        </p>
      </header>

      <section className="card card--elevated">
        <h2 className="card-title">Balance</h2>
        {balanceQ.isLoading ? (
          <p className="muted">Loading balance…</p>
        ) : balanceQ.isError ? (
          <p className="banner banner--error">Could not load balance.</p>
        ) : (
          <>
            <p className="balance-amount">
              {balanceQ.data?.unit} {balanceQ.data?.balance?.toLocaleString()}
            </p>
            <p className="muted fineprint">
              As of{' '}
              {balanceQ.dataUpdatedAt
                ? new Date(balanceQ.dataUpdatedAt).toLocaleString()
                : '—'}
              {balanceQ.data?.stale ? ' · balance may be stale' : ''}
            </p>
            <p className="muted fineprint">
              Top up at the <Link to="/branches">carwash kiosk</Link>.
            </p>
          </>
        )}
      </section>

      <section className="card card--elevated profile-stuff-card">
        <h2 className="card-title">Your stuff</h2>
        {hasNamedStuff && stuffNickname ? (
          <>
            <div className="profile-stuff-card__hero">
              <UserAvatar
                name={stuffNickname}
                variant="stuff"
                size="lg"
                imageUrl={user?.vehicle_hero_image}
              />
              <div className="profile-stuff-card__info">
                <p className="profile-stuff-card__name">{stuffNickname}</p>
                <p className="muted fineprint">
                  {[user?.vehicle_brand, user?.vehicle_model].filter(Boolean).join(' ') ||
                    user?.vehicle_type ||
                    'Vehicle'}
                </p>
              </div>
            </div>
            {companionQ.isLoading ? (
              <p className="muted fineprint">Loading latest message…</p>
            ) : latestMessage ? (
              <blockquote className="profile-stuff-card__quote">
                <p className="companion-list__body">{latestMessage.body}</p>
              </blockquote>
            ) : (
              <p className="muted fineprint">No messages from {stuffNickname} yet.</p>
            )}
            <Link to="/companion#messages" className="verify-steps__link">
              Open {stuffNickname} · messages & settings →
            </Link>
          </>
        ) : (
          <>
            <p className="muted fineprint">
              Set up your stuff to get a nickname and personalized replies on your feed.
            </p>
            <Link to="/companion" className="verify-steps__link">
              Set up {stuffTabLabel} →
            </Link>
          </>
        )}
      </section>

      <section className="card card--elevated">
        <h2 className="card-title">Verification</h2>
        <p className="fineprint">{verificationLabel(vq.data?.status ?? user?.verification_status)}</p>
        {vq.data?.message ? <p className="muted fineprint">{vq.data.message}</p> : null}
        <div className="verify-progress" aria-hidden>
          <div className="verify-progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted fineprint">
          {progress ? `${progress.completed} of ${progress.total} complete` : 'Loading…'}
        </p>
        <ul className="verify-steps">
          {(vq.data?.steps ?? []).map((step) => {
            const meta = STEP_META[step.id];
            return (
              <li
                key={step.id}
                className={`verify-steps__item${step.complete ? ' verify-steps__item--done' : ''}`}
              >
                <span className="verify-steps__icon" aria-hidden>
                  {step.complete ? '✓' : '○'}
                </span>
                <div>
                  <p className="verify-steps__title">{meta.title}</p>
                  <p className="muted fineprint">{meta.hint}</p>
                  {!step.complete && meta.href ? (
                    <Link to={meta.href} className="verify-steps__link">
                      Complete step →
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form key={user?.user_id ?? 'profile'} className="stack gap-md card card--elevated" onSubmit={onSubmit}>
        <h2 className="card-title">Account</h2>
        <label className="field">
          <span className="field-label">Nickname</span>
          <input
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
            placeholder="How we greet you"
          />
        </label>
        <label className="field">
          <span className="field-label">Full name</span>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="Legal name"
          />
        </label>

        <div className="section-divider" aria-hidden />

        <div className="field location-opt-in">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={locationOptIn}
              disabled={locationBusy}
              onChange={(e) => void onLocationToggle(e.target.checked)}
            />
            <span>
              <span className="field-label">Smarter reminders with location</span>
              <span className="muted fineprint">
                Optional. Uses GPS while the app is open to estimate travel since your last wash
                and when you are near a Toquida branch. Never tracked in the background on web.
              </span>
            </span>
          </label>
          {locationOptIn && user?.km_since_wash != null ? (
            <p className="muted fineprint">
              About {user.km_since_wash.toFixed(1)} km recorded since last wash.
            </p>
          ) : null}
          {locationError ? (
            <p className="banner banner--error" role="alert">
              {locationError}
            </p>
          ) : null}
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save profile'}
        </button>
        {save.isError ? (
          <p className="banner banner--error" role="alert">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </p>
        ) : null}
        {save.isSuccess ? (
          <p className="banner banner--ok" role="status">
            Profile saved.
          </p>
        ) : null}
      </form>

      <ul className="link-list card card--elevated">
        <li>
          <Link to="/transactions">Transaction history</Link>
        </li>
        <li>
          <Link to="/tags">RFID tags</Link>
        </li>
        <li>
          <Link to="/face">Face & kiosk code</Link>
        </li>
        <li>
          <Link to="/help">Help</Link>
        </li>
      </ul>
    </div>
  );
}
