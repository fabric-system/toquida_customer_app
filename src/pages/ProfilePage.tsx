import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as backend from '../api/backend';
import type { VehicleType, VehicleVibeId, VerificationStep } from '../api/types';
import { VibePicker } from '../components/VibePicker';
import { useAuth } from '../auth/useAuth';
import { verificationLabel } from '../ui/format';

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'motor', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'tricycle', label: 'Tricycle' },
];

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
    title: 'Vehicle profile',
    hint: 'Set type, brand, model, nickname, and vibe.',
  },
};

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();

  const [nickname, setNickname] = useState(user?.display_name ?? '');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>(
    (user?.vehicle_type as VehicleType) ?? '',
  );
  const [vehicleBrand, setVehicleBrand] = useState(user?.vehicle_brand ?? '');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicle_model ?? '');
  const [vehicleNickname, setVehicleNickname] = useState(user?.vehicle_nickname ?? '');
  const [vehicleVibe, setVehicleVibe] = useState<VehicleVibeId | ''>(
    (user?.vehicle_vibe as VehicleVibeId) ?? '',
  );

  useEffect(() => {
    setNickname(user?.display_name ?? '');
    setFullName(user?.full_name ?? '');
    setVehicleType((user?.vehicle_type as VehicleType) ?? '');
    setVehicleBrand(user?.vehicle_brand ?? '');
    setVehicleModel(user?.vehicle_model ?? '');
    setVehicleNickname(user?.vehicle_nickname ?? '');
    setVehicleVibe((user?.vehicle_vibe as VehicleVibeId) ?? '');
  }, [user]);

  const vibesQ = useQuery({
    queryKey: ['vehicle-vibes'],
    queryFn: () => backend.getVehicleVibes(),
    staleTime: 600000,
  });

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
    refetchOnWindowFocus: true,
  });

  const companionQ = useQuery({
    queryKey: ['companion-messages'],
    queryFn: () => backend.getCompanionMessages(),
    enabled: Boolean(vq.data?.all_complete),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (location.hash !== '#companion-messages') return;
    const el = document.getElementById('companion-messages');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, companionQ.data?.messages]);

  const save = useMutation({
    mutationFn: () =>
      backend.patchMe({
        display_name: nickname.trim() || null,
        full_name: fullName.trim() || null,
        vehicle_type: vehicleType || null,
        vehicle_brand: vehicleBrand.trim() || null,
        vehicle_model: vehicleModel.trim() || null,
        vehicle_nickname: vehicleNickname.trim() || null,
        vehicle_vibe: vehicleVibe || null,
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

  const progress = vq.data?.progress;
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  const companionMessages = companionQ.data?.messages ?? [];
  const aiEnabled = companionQ.data?.ai_enabled ?? false;
  const vehicleDisplayName = vehicleNickname.trim() || 'your vehicle';

  return (
    <div className="page page--padded">
      <header className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="muted page-lead">
          Complete all steps to become fully verified. Your vehicle companion sends personalized
          wash reminders in the vibe you choose.
        </p>
      </header>

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

        <h2 className="card-title">Vehicle</h2>
        <p className="muted fineprint">
          <strong>{vehicleDisplayName}</strong> will send reminders based on your selected vibe
          {aiEnabled ? ' · AI-powered' : ' · Smart templates'}.
        </p>

        <label className="field">
          <span className="field-label">Type</span>
          <select
            className="input input--select"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
          >
            <option value="">Select type</option>
            {VEHICLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Brand</span>
            <input
              className="input"
              value={vehicleBrand}
              onChange={(e) => setVehicleBrand(e.target.value)}
              placeholder="e.g. Toyota"
              autoComplete="organization"
            />
          </label>
          <label className="field">
            <span className="field-label">Model</span>
            <input
              className="input"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="e.g. Vios"
            />
          </label>
        </div>

        <label className="field">
          <span className="field-label">Nickname</span>
          <input
            className="input"
            value={vehicleNickname}
            onChange={(e) => setVehicleNickname(e.target.value)}
            placeholder="What your vehicle is called"
          />
          <span className="muted fineprint">This name appears in companion messages.</span>
        </label>

        <VibePicker
          vibes={vibesQ.data ?? []}
          value={vehicleVibe}
          onChange={setVehicleVibe}
          loading={vibesQ.isLoading}
        />

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

      {vq.data?.all_complete ? (
        <section id="companion-messages" className="card card--elevated companion-card">
          <div className="companion-card__head">
            <h2 className="card-title">All messages</h2>
            {aiEnabled ? <span className="ai-badge ai-badge--on">AI</span> : null}
          </div>

          {companionQ.isLoading ? (
            <p className="muted fineprint">Loading messages…</p>
          ) : !companionMessages.length ? (
            <p className="muted fineprint">No messages right now.</p>
          ) : (
            <ul className="companion-list">
              {companionMessages.map((msg) => (
                <li key={msg.message_id} className="companion-list__item">
                  <div className="companion-list__meta">
                    {msg.source ? (
                      <span className="companion-list__source">{msg.source}</span>
                    ) : null}
                  </div>
                  <p className="companion-list__body">{msg.body}</p>
                  <time className="muted fineprint">
                    {new Date(msg.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}

          {vq.data.last_wash_at ? (
            <p className="muted fineprint">
              Last wash · {new Date(vq.data.last_wash_at).toLocaleString()}
            </p>
          ) : (
            <p className="muted fineprint">
              Last wash · not recorded yet. Updates automatically when you wash at the kiosk with
              your linked tag.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
