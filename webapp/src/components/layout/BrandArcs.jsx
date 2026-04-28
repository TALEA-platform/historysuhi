// Decorative concentric SVG arcs in the brand colours, rendered behind the layout.
// aria-hidden because they convey no information.

export function BrandArcs() {
  return (
    <div className="brand-arcs" aria-hidden="true">
      <svg className="arc-blue" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#1272B7" strokeWidth="5" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="#1272B7" strokeWidth="5" />
      </svg>
      <svg className="arc-green" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="#21A84A" strokeWidth="6" />
      </svg>
      <svg className="arc-yellow" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="34" fill="none" stroke="#FFE604" strokeWidth="7" />
      </svg>
    </div>
  );
}
