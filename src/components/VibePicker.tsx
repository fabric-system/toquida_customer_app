import type { VehicleVibeId } from '../api/types';

type VibePickerProps = {
  vibes: { id: VehicleVibeId; label: string; description: string }[];
  value: VehicleVibeId | '';
  onChange: (id: VehicleVibeId) => void;
  loading?: boolean;
};

export function VibePicker({ vibes, value, onChange, loading }: VibePickerProps) {
  return (
    <div className="field">
      <span className="field-label">Vibe</span>
      <p className="muted fineprint">
        How your vehicle companion speaks — tone follows the vibe you pick.
      </p>
      {loading ? (
        <p className="muted fineprint">Loading vibes…</p>
      ) : (
        <div className="vibe-scroll" role="listbox" aria-label="Vehicle vibe">
          {vibes.map((v) => {
            const selected = value === v.id;
            return (
              <button
                key={v.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`vibe-chip${selected ? ' vibe-chip--active' : ''}`}
                onClick={() => onChange(v.id)}
              >
                <span className="vibe-chip__label">{v.label}</span>
                <span className="vibe-chip__desc">{v.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
