import { RichText } from "../ui/RichText.jsx";

// Small banner placed under the view intro to declare the temporal/spatial scope of the data.
// `valueNote` is optional — used by View 1 to show the active year under the value, since the
// banner text varies by year.

export function ContextBanner({ label, value, valueNote, text }) {
  return (
    <div className="context-banner">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {valueNote && <small>{valueNote}</small>}
      </div>
      <RichText as="p" text={text} />
    </div>
  );
}
