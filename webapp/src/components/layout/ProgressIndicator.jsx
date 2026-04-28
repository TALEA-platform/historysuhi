import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

// Lightweight top-of-page progress strip. Shows the current step (1–5),
// the view title and a row of five segmented bars. The full block-arrow
// navigator that the user actually drives sits below each view so the
// learning flow stays top-down; this strip is just orientation.

export function ProgressIndicator() {
  const { data, language } = useI18n();
  const currentView = useAppStore((state) => state.currentView);
  const setState = useAppStore((state) => state.setState);
  const views = data.views;
  const index = Math.max(0, views.findIndex((view) => view.id === currentView));
  const current = views[index] || views[0];
  const copy = language === "en"
    ? { step: "Step", of: "of" }
    : { step: "Passo", of: "di" };

  return (
    <div className="progress-indicator" aria-label={copy.step}>
      <div className="progress-indicator-meta">
        <span className="progress-indicator-step">
          {copy.step} {String(index + 1).padStart(2, "0")} {copy.of} {String(views.length).padStart(2, "0")}
        </span>
        <strong className="progress-indicator-title">{current.title}</strong>
      </div>
      <div className="progress-indicator-bars" role="tablist">
        {views.map((view, i) => (
          <button
            key={view.id}
            type="button"
            role="tab"
            className={`progress-indicator-bar ${i <= index ? "filled" : ""} ${view.id === currentView ? "active" : ""}`}
            aria-selected={view.id === currentView}
            aria-label={`${String(i + 1).padStart(2, "0")} · ${view.title}`}
            onClick={() => setState({ currentView: view.id })}
          />
        ))}
      </div>
    </div>
  );
}
