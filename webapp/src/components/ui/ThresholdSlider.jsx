// Labelled range slider used for the "minimum threshold" choices in View 2.
// Casts the input string to a Number before bubbling the change up.

export function ThresholdSlider({ label, value, min, max, suffix, onChange }) {
  return (
    <label className="threshold">
      <span>
        {label}: <strong>{value} {suffix}</strong>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step="1"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
