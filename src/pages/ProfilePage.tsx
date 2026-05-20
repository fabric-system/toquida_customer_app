import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as backend from '../api/backend';
import type { VehicleType, VerificationStep } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { verificationLabel } from '../ui/format';

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'motor', label: 'Motor' },
  { value: 'car', label: 'Kotse' },
  { value: 'van', label: 'Van' },
  { value: 'tricycle', label: 'Tricycle' },
];

const STEP_META: Record<
  VerificationStep['id'],
  { title: string; hint: string; href?: string }
> = {
  full_name: {
    title: 'Full name',
    hint: 'Ilagay ang buong pangalan mo sa form sa ibaba.',
  },
  rfid_tag: {
    title: 'Linked RFID tag',
    hint: 'I-claim at i-link ang tag mo sa kiosk.',
    href: '/tags',
  },
  face_enrollment: {
    title: 'Face enrollment',
    hint: 'I-enroll ang mukha mo sa app, tapos i-claim sa kiosk.',
    href: '/face',
  },
  vehicle_profile: {
    title: 'Vehicle profile',
    hint: 'I-set ang type, nickname, at personality ng sasakyan mo.',
  },
};

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const qc = useQueryClient();

  const [nickname, setNickname] = useState(user?.display_name ?? '');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>(
    (user?.vehicle_type as VehicleType) ?? '',
  );
  const [vehicleNickname, setVehicleNickname] = useState(user?.vehicle_nickname ?? '');
  const [vehiclePersonality, setVehiclePersonality] = useState(
    user?.vehicle_personality ?? '',
  );

  useEffect(() => {
    setNickname(user?.display_name ?? '');
    setFullName(user?.full_name ?? '');
    setVehicleType((user?.vehicle_type as VehicleType) ?? '');
    setVehicleNickname(user?.vehicle_nickname ?? '');
    setVehiclePersonality(user?.vehicle_personality ?? '');
  }, [user]);

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

  const save = useMutation({
    mutationFn: () =>
      backend.patchMe({
        display_name: nickname.trim() || null,
        full_name: fullName.trim() || null,
        vehicle_type: vehicleType || null,
        vehicle_nickname: vehicleNickname.trim() || null,
        vehicle_personality: vehiclePersonality.trim() || null,
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

  return (
    <div className="page page--padded">
      <h1 className="page-title">Profile</h1>
      <p className="muted page-lead">
        Kumpletuhin ang lahat ng steps para maging fully verified. Ang vehicle nickname mo ang
        magse-send ng personalized reminders.
      </p>

      <section className="card">
        <h2 className="card-title">Verification progress</h2>
        <p className="fineprint">{verificationLabel(vq.data?.status ?? user?.verification_status)}</p>
        {vq.data?.message ? <p className="muted fineprint">{vq.data.message}</p> : null}
        <div className="verify-progress" aria-hidden>
          <div className="verify-progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted fineprint">
          {progress ? `${progress.completed} / ${progress.total} complete` : 'Loading…'}
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
                      Go complete →
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form key={user?.user_id ?? 'profile'} className="stack gap-md card" onSubmit={onSubmit}>
        <h2 className="card-title">Account details</h2>
        <label className="field">
          <span className="field-label">Nickname</span>
          <input
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
            placeholder="How we greet you (e.g. Choi)"
          />
        </label>
        <label className="field">
          <span className="field-label">Full name</span>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="Buong pangalan mo"
          />
        </label>

        <h2 className="card-title" style={{ marginTop: '0.5rem' }}>
          Your vehicle
        </h2>
        <p className="muted fineprint">
          Si <strong>{vehicleNickname.trim() || 'your vehicle'}</strong> ang magme-message sa iyo
          based sa personality na ilalagay mo.
        </p>
        <label className="field">
          <span className="field-label">Vehicle type</span>
          <select
            className="input"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
          >
            <option value="">Select type…</option>
            {VEHICLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Vehicle nickname</span>
          <input
            className="input"
            value={vehicleNickname}
            onChange={(e) => setVehicleNickname(e.target.value)}
            placeholder="e.g. Maria"
          />
        </label>
        <label className="field">
          <span className="field-label">Personality / vibe</span>
          <textarea
            className="input input--textarea"
            rows={3}
            value={vehiclePersonality}
            onChange={(e) => setVehiclePersonality(e.target.value)}
            placeholder="e.g. sexy, malambing, masungit, sweet…"
          />
          <span className="muted fineprint">
            Describe how your vehicle “talks” — gagamitin ito ng AI companion sa notifications.
          </span>
        </label>

        <button type="submit" className="btn btn--primary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save profile'}
        </button>
        {save.isError ? (
          <p className="banner banner--error" role="alert">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </p>
        ) : null}
        {save.isSuccess ? (
          <p className="banner banner--ok" role="status">
            Saved.
          </p>
        ) : null}
      </form>

      {vq.data?.all_complete ? (
        <section className="card companion-card">
          <h2 className="card-title">
            Messages from {vehicleNickname.trim() || 'your vehicle'}
          </h2>
          {companionQ.isLoading ? (
            <p className="muted fineprint">Loading messages…</p>
          ) : !companionQ.data?.length ? (
            <p className="muted fineprint">No messages right now.</p>
          ) : (
            <ul className="companion-list">
              {companionQ.data.map((msg) => (
                <li key={msg.message_id} className="companion-list__item">
                  <p className="companion-list__from">{msg.from_name}</p>
                  <p>{msg.body}</p>
                  <time className="muted fineprint">
                    {new Date(msg.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
          {vq.data.last_wash_at ? (
            <p className="muted fineprint">
              Last wash: {new Date(vq.data.last_wash_at).toLocaleString()}
            </p>
          ) : (
            <p className="muted fineprint">
              Last wash: wala pa — auto-update pag nag-carwash ka sa kiosk gamit ang linked tag.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
