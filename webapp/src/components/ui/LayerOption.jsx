import { Check } from "lucide-react";

// Selectable card-style option used in the side panels (one per layer or overlay).
// Two visual modes:
//   - radio (default): the dot is a filled circle when selected
//   - checkbox: a square with a check mark when selected (pass `checkbox`)

export function LayerOption({ title, body, selected, disabled, checkbox, onClick }) {
  return (
    <button
      className={`layer-option ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <span className={checkbox ? "option-check" : "option-radio"}>
        {selected && (checkbox ? <Check size={13} /> : null)}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{body}</small>
      </span>
    </button>
  );
}
