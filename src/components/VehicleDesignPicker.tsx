import type { VehicleDesign } from '../api/types';

const PRESET_COLORS = [
  '#007aff',
  '#5856d6',
  '#ff2d55',
  '#ff9500',
  '#34c759',
  '#1c1c1e',
  '#8e8e93',
  '#ffffff',
];

type Props = {
  value: VehicleDesign;
  onChange: (next: VehicleDesign) => void;
};

export function VehicleDesignPicker({ value, onChange }: Props) {
  return (
    <div className="vehicle-design">
      <p className="field-label">Design colors</p>
      <div className="vehicle-design__row">
        <label className="vehicle-design__field">
          <span className="muted fineprint">Primary</span>
          <div className="vehicle-design__swatches">
            {PRESET_COLORS.map((color) => (
              <button
                key={`p-${color}`}
                type="button"
                className={`vehicle-design__swatch${value.primary_color === color ? ' vehicle-design__swatch--active' : ''}`}
                style={{ background: color }}
                aria-label={`Primary ${color}`}
                onClick={() => onChange({ ...value, primary_color: color })}
              />
            ))}
            <input
              type="color"
              className="vehicle-design__color-input"
              value={value.primary_color}
              onChange={(e) => onChange({ ...value, primary_color: e.target.value })}
              aria-label="Custom primary color"
            />
          </div>
        </label>
        <label className="vehicle-design__field">
          <span className="muted fineprint">Accent</span>
          <div className="vehicle-design__swatches">
            {PRESET_COLORS.map((color) => (
              <button
                key={`a-${color}`}
                type="button"
                className={`vehicle-design__swatch${value.accent_color === color ? ' vehicle-design__swatch--active' : ''}`}
                style={{ background: color }}
                aria-label={`Accent ${color}`}
                onClick={() => onChange({ ...value, accent_color: color })}
              />
            ))}
            <input
              type="color"
              className="vehicle-design__color-input"
              value={value.accent_color}
              onChange={(e) => onChange({ ...value, accent_color: e.target.value })}
              aria-label="Custom accent color"
            />
          </div>
        </label>
      </div>
      <label className="field">
        <span className="field-label">Finish</span>
        <select
          className="input input--select"
          value={value.finish}
          onChange={(e) =>
            onChange({ ...value, finish: e.target.value as VehicleDesign['finish'] })
          }
        >
          <option value="gloss">Gloss</option>
          <option value="matte">Matte</option>
        </select>
      </label>
    </div>
  );
}

export const DEFAULT_VEHICLE_DESIGN: VehicleDesign = {
  primary_color: '#007aff',
  accent_color: '#5856d6',
  finish: 'gloss',
};
