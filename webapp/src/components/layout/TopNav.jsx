import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

// Top navigation bar that lets the user jump between the five views.
// Reads only `currentView` from the store, so other state changes do not re-render it.

export function TopNav() {
  const { data, language } = useI18n();
  const currentView = useAppStore((state) => state.currentView);
  const setState = useAppStore((state) => state.setState);
  const ariaLabel = language === "en" ? "Main views" : "Sezioni principali";

  return (
    <nav className="nav-views" aria-label={ariaLabel}>
      {data.views.map((view, index) => (
        <button
          key={view.id}
          className={`nav-btn ${currentView === view.id ? "active" : ""}`}
          type="button"
          onClick={() => setState({ currentView: view.id })}
        >
          {/* padStart(2, "0") keeps the numbering visually consistent: "01"..."05". */}
          <span className="nav-num">{String(index + 1).padStart(2, "0")}</span>
          <span className="nav-title">{view.title}</span>
          <span className="nav-sub">{view.subtitle}</span>
        </button>
      ))}
    </nav>
  );
}
