// Standard "card" used across the side panel.
// When `id` is provided, the section becomes a focusable scroll target so the
// "Come leggerla" buttons can scrollToInfo() and move focus into it.
// tabIndex={-1} makes the element programmatically focusable without putting it
// in the regular tab order.

export function PanelCard({ id, className = "", title, icon, children }) {
  return (
    <section
      id={id}
      className={`panel-card ${className}`.trim()}
      tabIndex={id ? -1 : undefined}
    >
      <div className="panel-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
