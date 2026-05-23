import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as backend from '../api/backend';
import type { VehicleDesign, VehicleType, VehicleVibeId } from '../api/types';
import {
  DEFAULT_VEHICLE_DESIGN,
  VehicleDesignPicker,
} from '../components/VehicleDesignPicker';
import { VibePicker } from '../components/VibePicker';
import { useAuth } from '../auth/useAuth';
import { useStuffLabel } from '../hooks/useStuffLabel';
import { fileToCompressedDataUrl } from '../utils/imageUpload';

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'motor', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'tricycle', label: 'Tricycle' },
];

export function VehicleCompanionPage() {
  const { user, refreshMe } = useAuth();
  const { tabLabel: pageTitle, hasNamedStuff, nickname } = useStuffLabel();
  const location = useLocation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [vehicleType, setVehicleType] = useState<VehicleType | ''>(
    (user?.vehicle_type as VehicleType) ?? '',
  );
  const [vehicleBrand, setVehicleBrand] = useState(user?.vehicle_brand ?? '');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicle_model ?? '');
  const [vehicleNickname, setVehicleNickname] = useState(user?.vehicle_nickname ?? '');
  const [vehicleVibe, setVehicleVibe] = useState<VehicleVibeId | ''>(
    (user?.vehicle_vibe as VehicleVibeId) ?? '',
  );
  const [design, setDesign] = useState<VehicleDesign>(
    user?.vehicle_design ?? DEFAULT_VEHICLE_DESIGN,
  );
  const [heroImage, setHeroImage] = useState(user?.vehicle_hero_image ?? '');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [genNote, setGenNote] = useState<string | null>(null);

  useEffect(() => {
    setVehicleType((user?.vehicle_type as VehicleType) ?? '');
    setVehicleBrand(user?.vehicle_brand ?? '');
    setVehicleModel(user?.vehicle_model ?? '');
    setVehicleNickname(user?.vehicle_nickname ?? '');
    setVehicleVibe((user?.vehicle_vibe as VehicleVibeId) ?? '');
    setDesign(user?.vehicle_design ?? DEFAULT_VEHICLE_DESIGN);
    setHeroImage(user?.vehicle_hero_image ?? '');
  }, [user]);

  const vibesQ = useQuery({
    queryKey: ['vehicle-vibes'],
    queryFn: () => backend.getVehicleVibes(),
    staleTime: 600000,
  });

  const companionQ = useQuery({
    queryKey: ['companion-messages'],
    queryFn: () => backend.getCompanionMessages(),
    enabled: Boolean(vehicleNickname.trim() && vehicleType && vehicleVibe),
    refetchInterval: 3600000,
  });

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
  });

  useEffect(() => {
    if (location.hash !== '#messages') return;
    const el = document.getElementById('stuff-messages');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, companionQ.data?.messages]);

  const save = useMutation({
    mutationFn: () =>
      backend.patchMe({
        vehicle_type: vehicleType || null,
        vehicle_brand: vehicleBrand.trim() || null,
        vehicle_model: vehicleModel.trim() || null,
        vehicle_nickname: vehicleNickname.trim() || null,
        vehicle_vibe: vehicleVibe || null,
        vehicle_design: design,
      }),
    onSuccess: async () => {
      await refreshMe();
      void qc.invalidateQueries({ queryKey: ['verification'] });
      void qc.invalidateQueries({ queryKey: ['companion-messages'] });
    },
  });

  const generateHero = useMutation({
    mutationFn: () => backend.generateVehicleHero(true),
    onSuccess: async (data) => {
      setHeroImage(data.vehicle_hero_image ?? '');
      setGenNote(
        data.hero_source === 'ai'
          ? 'Generated with AI illustration.'
          : 'Generated stylized preview (AI unavailable — used built-in art).',
      );
      await refreshMe();
    },
    onError: (err) => {
      setGenNote(err instanceof Error ? err.message : 'Could not generate image.');
    },
  });

  const addPhoto = useMutation({
    mutationFn: (dataUrl: string) => backend.addVehiclePhoto({ data_url: dataUrl }),
    onSuccess: async () => {
      setPhotoError(null);
      await refreshMe();
    },
    onError: (err) => {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    },
  });

  const removePhoto = useMutation({
    mutationFn: (photoId: string) => backend.removeVehiclePhoto(photoId),
    onSuccess: () => refreshMe(),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      addPhoto.mutate(dataUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not read image.');
    }
  }

  const heroLabel = nickname || vehicleNickname.trim() || 'your vehicle';
  const photos = user?.vehicle_photos ?? [];
  const companionMessages = companionQ.data?.messages ?? [];
  const messagesUpdatedAt = companionQ.data?.messages_updated_at;
  const vehicleDisplayName = nickname || vehicleNickname.trim() || 'your stuff';

  return (
    <div className="page page--padded">
      <header className="page-header">
        <h1 className="page-title">{pageTitle}</h1>
        <p className="muted page-lead">
          {hasNamedStuff
            ? `Customize ${nickname} — colors, photos, and a hero image from your vehicle type.`
            : 'Set up your stuff — add vehicle details, photos, design, and a nickname to finish verification.'}
        </p>
      </header>

      <section className="card card--elevated vehicle-hero-card">
        <div className="vehicle-hero-card__frame">
          {heroImage ? (
            <img src={heroImage} alt={`${heroLabel} preview`} className="vehicle-hero-card__img" />
          ) : (
            <div className="vehicle-hero-card__empty muted">
              {vehicleType
                ? 'Save your vehicle, then tap Generate image.'
                : 'Choose a vehicle type to get started.'}
            </div>
          )}
        </div>
        <div className="vehicle-hero-card__actions">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={!vehicleType || generateHero.isPending}
            onClick={() => generateHero.mutate()}
          >
            {generateHero.isPending ? 'Generating…' : 'Generate image'}
          </button>
          {genNote ? <p className="muted fineprint">{genNote}</p> : null}
        </div>
      </section>

      <section className="card card--elevated">
        <h2 className="card-title">Your photos</h2>
        <p className="muted fineprint">Add up to 4 photos of your {vehicleType || 'vehicle'}.</p>
        <div className="vehicle-photo-grid">
          {photos.map((photo) => (
            <figure key={photo.id} className="vehicle-photo-grid__item">
              <img src={photo.data_url} alt="" />
              <button
                type="button"
                className="vehicle-photo-grid__remove"
                aria-label="Remove photo"
                onClick={() => removePhoto.mutate(photo.id)}
              >
                ×
              </button>
            </figure>
          ))}
          {photos.length < 4 ? (
            <button
              type="button"
              className="vehicle-photo-grid__add"
              disabled={addPhoto.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {addPhoto.isPending ? '…' : '+ Add photo'}
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void onPickPhoto(e)}
        />
        {photoError ? (
          <p className="banner banner--error" role="alert">
            {photoError}
          </p>
        ) : null}
      </section>

      <form className="stack gap-md card card--elevated" onSubmit={onSubmit}>
        <h2 className="card-title">Vehicle details</h2>

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
              placeholder="e.g. Kawasaki"
            />
          </label>
          <label className="field">
            <span className="field-label">Model</span>
            <input
              className="input"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="e.g. Rouser 150NS"
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
          <span className="muted fineprint">Shown in the app header and in messages from your stuff.</span>
        </label>

        <VibePicker
          vibes={vibesQ.data ?? []}
          value={vehicleVibe}
          onChange={setVehicleVibe}
          loading={vibesQ.isLoading}
        />

        <VehicleDesignPicker value={design} onChange={setDesign} />

        <button type="submit" className="btn btn--primary btn--full" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        {save.isError ? (
          <p className="banner banner--error" role="alert">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </p>
        ) : null}
        {save.isSuccess ? (
          <p className="banner banner--ok" role="status">
            Saved. Tap Generate image to refresh the preview.
          </p>
        ) : null}
      </form>

      {hasNamedStuff ? (
        <section id="stuff-messages" className="card card--elevated companion-card">
          <h2 className="card-title">Messages from {vehicleDisplayName}</h2>

          {companionQ.isLoading ? (
            <p className="muted fineprint">Loading messages…</p>
          ) : !companionMessages.length ? (
            <p className="muted fineprint">No messages right now.</p>
          ) : (
            <ul className="companion-list">
              {companionMessages.map((msg) => (
                <li key={msg.message_id} className="companion-list__item">
                  <p className="companion-list__from">{msg.from_name}</p>
                  <p className="companion-list__body">{msg.body}</p>
                  <time className="muted fineprint">
                    {new Date(msg.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}

          {messagesUpdatedAt ? (
            <p className="muted fineprint">
              Updated · {new Date(messagesUpdatedAt).toLocaleString()}
            </p>
          ) : null}
          <p className="muted fineprint">
            New messages after you save changes, record a wash at the kiosk, or about once per hour.
          </p>

          {vq.data?.last_wash_at ? (
            <p className="muted fineprint">
              Last wash · {new Date(vq.data.last_wash_at).toLocaleString()}
            </p>
          ) : (
            <p className="muted fineprint">
              Last wash · not recorded yet. Updates when you wash at the kiosk with your linked tag.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
