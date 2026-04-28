import { useI18n } from "../../i18n/useI18n.js";
import { HighlightedTitle } from "../ui/HighlightedTitle.jsx";

// Section header used at the top of every view. Looks up its copy by view id.
// `metric` is optional; when present it renders the small box on the right.

export function ViewIntro({ id, metric }) {
  const { data } = useI18n();
  const copy = data.viewCopy[id];
  return (
    <section className="view-intro">
      <div>
        <div className="section-kicker">{copy.kicker}</div>
        <h1>
          <HighlightedTitle text={copy.title} />
        </h1>
        <p>{copy.note}</p>
      </div>
      {metric && (
        <div className="intro-metric">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.detail}</small>
        </div>
      )}
    </section>
  );
}
