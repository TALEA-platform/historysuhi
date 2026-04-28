import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

// Renders the legend below each map. The shape depends on the layer:
//   - bivariate (cronico × anomalo)
//   - categorical (named buckets)
//   - explicit `legendStops` array (one swatch per discrete class)
//   - default: a continuous gradient strip + tick labels
//
// `accessibleColor` lets a stop override its colour when the user enables the
// colour-blind palette via the floating "Cambia colori" toggle.

export function Legend({ layer, showNumericValues }) {
  const { language } = useI18n();
  const categorical = layer.legendType === "categorical";
  const bivariate = layer.legendType === "bivariate";
  const compactLegendLayout = layer.legendLayout === "compact";
  const colorblindMode = useAppStore((state) => state.colorblindMode);
  const [expanded, setExpanded] = useState(false);
  const copy = language === "en"
    ? {
      valuesVisible: "values visible",
      qualitative: "qualitative reading",
      expand: "Open legend",
      collapse: "Close legend",
      collapsedLabel: "Legend",
      bivariateCards: [
        {
          key: "chronic",
          kicker: "Compared with Bologna",
          title: "Chronic heat",
          description: "How many summers this place stays in Bologna's hottest 5%.",
          start: "1 year",
          end: "13 years",
          swatches: ["chronic c1", "chronic c2", "chronic c3"],
        },
        {
          key: "anomalous",
          kicker: "Compared with its own history",
          title: "Anomalous heat",
          description: "How many summers this place becomes hotter than usual for itself.",
          start: "1 year",
          end: "5 years",
          swatches: ["anomalous a1", "anomalous a2", "anomalous a3"],
        },
        {
          key: "both",
          kicker: "Where both signals overlap",
          title: "Chronic + anomalous",
          description: "Mixed colours mean a place is structurally hot for Bologna and also recurrently anomalous.",
          start: "lighter mix",
          end: "stronger mix",
          swatches: ["both b1", "both b2", "both b3"],
        },
      ],
    }
    : {
      valuesVisible: "valori visibili",
      qualitative: "lettura qualitativa",
      expand: "Apri legenda",
      collapse: "Chiudi legenda",
      collapsedLabel: "Legenda",
      bivariateCards: [
        {
          key: "chronic",
          kicker: "Confronto con Bologna",
          title: "Caldo cronico",
          description: "Quante estati questo punto rimane nel 5% piu caldo di Bologna.",
          start: "1 anno",
          end: "13 anni",
          swatches: ["chronic c1", "chronic c2", "chronic c3"],
        },
        {
          key: "anomalous",
          kicker: "Confronto con la sua storia",
          title: "Caldo anomalo",
          description: "Quante estati questo punto diventa piu caldo del suo comportamento abituale.",
          start: "1 anno",
          end: "5 anni",
          swatches: ["anomalous a1", "anomalous a2", "anomalous a3"],
        },
        {
          key: "both",
          kicker: "Quando i due segnali coincidono",
          title: "Cronico + anomalo",
          description: "I colori misti indicano luoghi strutturalmente caldi per Bologna e anche spesso anomali.",
          start: "mix lieve",
          end: "mix forte",
          swatches: ["both b1", "both b2", "both b3"],
        },
      ],
    };
  const gradientLegendItems = showNumericValues && layer.numericLegend ? layer.numericLegend : layer.legend;
  const legendClassName = [
    "legend",
    expanded ? "" : "legend--collapsed",
    compactLegendLayout ? "legend--compact-layout" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={legendClassName}>
      <button
        type="button"
        className={`legend-head ${expanded ? "legend-head--expanded" : "legend-head--collapsed"}`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? copy.collapse : copy.expand}
      >
        {expanded ? (
          <div className="legend-head-copy">
            <strong>{layer.legendTitle}</strong>
            <span>{showNumericValues ? copy.valuesVisible : copy.qualitative}</span>
          </div>
        ) : (
          <strong className="legend-collapsed-label">{copy.collapsedLabel}</strong>
        )}
        <span className="legend-toggle" aria-hidden="true">
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>
      {bivariate ? (
        <div className="bivariate-legend">
          {copy.bivariateCards.map((item) => (
            <article key={item.key} className="bivar-card">
              <div className="bivar-copy">
                <span className="bivar-kicker">{item.kicker}</span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
              <div className="bivar-scale-wrap">
                <div className="bivar-swatches" aria-hidden="true">
                  {item.swatches.map((swatch) => (
                    <i key={swatch} className={`bivar ${swatch}`} />
                  ))}
                </div>
                <div className="bivar-scale-note">
                  <span>{item.start}</span>
                  <span>{item.end}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : categorical ? (
        <div className={`categorical-legend ${compactLegendLayout ? "categorical-legend--compact" : ""}`}>
          {layer.legend.map((item, index) => (
            <span key={item}>
              <i className={`cat-swatch cat-${index}`} />
              <span className="legend-item-text">{item}</span>
            </span>
          ))}
        </div>
      ) : layer.legendStops ? (
        <div className={`class-legend ${compactLegendLayout ? "class-legend--compact" : ""}`}>
          {layer.legendStops.map((item) => (
            <span key={item.label}>
              <i style={{ background: colorblindMode && item.accessibleColor ? item.accessibleColor : item.color }} />
              <span className="legend-item-text">{item.label}</span>
            </span>
          ))}
        </div>
      ) : (
        <>
          <div className={`legend-scale scale-${layer.legendType}`} />
          <div className="legend-ticks" style={{ "--legend-columns": String(gradientLegendItems.length) }}>
            {gradientLegendItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </>
      )}
      {layer.noDataLabel && (
        <div className="legend-nodata">
          <span>
            <i aria-hidden="true" />
            {layer.noDataLabel}
          </span>
          {layer.noDataLegendDetail && <small>{layer.noDataLegendDetail}</small>}
        </div>
      )}
    </div>
  );
}
