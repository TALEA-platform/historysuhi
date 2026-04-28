import { RichText } from "./RichText.jsx";

// A labelled grouping of layer options inside a PanelCard.
// The optional `description` runs through RichText so the **bold** spans render.

export function PanelGroup({ label, description, children }) {
  return (
    <div className="panel-group">
      <h3>{label}</h3>
      {description && <RichText as="p" className="panel-group-note" text={description} />}
      {children}
    </div>
  );
}
