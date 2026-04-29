import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, MapPin } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { PanelCard } from "../ui/PanelCard.jsx";
import { Metric } from "../ui/Metric.jsx";
import { RichText } from "../ui/RichText.jsx";

// Sidebar card on View 5 that summarises the currently selected district / area:
// rank, four key metrics and a follow-up action.

export function DistrictDetail({ district, rank, metricKey, aggregation }) {
  const { data, language } = useI18n();
  const setState = useAppStore((state) => state.setState);
  const metric = data.districtMetrics[metricKey];
  const isStatistical = aggregation === "statistical";
  const copy = language === "en"
    ? {
      statisticalTitle: "Statistical area card",
      districtTitle: "District card",
      byMetric: (label) => `#${rank} by ${label}`,
      parentDistrict: "District",
      exposure: "Heat exposure",
      surface: "Surface temperature",
      anomaly: "Anomaly",
      hotspot: "Critical share",
      action: "See this area in the other views",
      metricInfoTitle: "How to read the number",
      meansTitle: "What this means",
      anomalyHotter: "In 2025 this area's temperature was **above its usual** behaviour.",
      anomalyCooler: "In 2025 this area's temperature was **below its usual** behaviour.",
      anomalyFlat: "In 2025 this area was close to its usual behaviour.",
      hotspotHigh: "A significant share of the area is flagged as exceptionally hot.",
      hotspotLow: "Little surface flagged as exceptionally hot.",
    }
    : {
      statisticalTitle: "Scheda area statistica",
      districtTitle: "Scheda quartiere",
      byMetric: (label) => `#${rank} per ${label}`,
      parentDistrict: "Quartiere",
      exposure: "Esposizione al caldo",
      surface: "Temperatura di superficie",
      anomaly: "Anomalia",
      hotspot: "Quota critica",
      action: "Vedi questa zona nelle altre view",
      metricInfoTitle: "Come leggere il numero",
      meansTitle: "Cosa significa",
      anomalyHotter: "Nel 2025 questa zona ha avuto una **temperatura sopra il suo solito**.",
      anomalyCooler: "Nel 2025 questa zona ha avuto una **temperatura sotto il suo solito**.",
      anomalyFlat: "Nel 2025 questa zona è stata in linea con il suo solito.",
      hotspotHigh: "Una quota significativa dell'area è classificata come eccezionalmente calda.",
      hotspotLow: "Poca superficie classificata come eccezionalmente calda.",
    };
  const interpretations = [];
  if (typeof district.anomaly === "number") {
    if (district.anomaly > 0.3) interpretations.push(copy.anomalyHotter);
    else if (district.anomaly < -0.3) interpretations.push(copy.anomalyCooler);
    else interpretations.push(copy.anomalyFlat);
  }
  if (typeof district.hotspotPercent === "number") {
    interpretations.push(district.hotspotPercent > 5 ? copy.hotspotHigh : copy.hotspotLow);
  }
  return (
    <PanelCard title={isStatistical ? copy.statisticalTitle : copy.districtTitle} icon={<MapPin size={16} />}>
      <div className="district-detail">
        <span className="section-kicker">{copy.byMetric(metric.label)}</span>
        <h2>{district.name}</h2>
        {isStatistical && <p className="district-parent">{copy.parentDistrict}: {district.quartiere}</p>}
        <div className="metric-grid">
          <Metric label={copy.exposure} value={district.uhei} />
          <Metric label={copy.surface} value={`${district.lst} °C`} />
          <Metric label={copy.anomaly} value={`${district.anomaly > 0 ? "+" : ""}${district.anomaly} °C`} />
          <Metric label={copy.hotspot} value={`${district.hotspotPercent}%`} />
        </div>
        {interpretations.length > 0 && (
          <div className="metric-interpretation">
            <span>{copy.meansTitle}</span>
            <ul>
              {interpretations.map((line) => (
                <li key={line}><RichText as="span" text={line} /></li>
              ))}
            </ul>
          </div>
        )}
        <button className="inline-action" type="button" onClick={() => setState({ currentView: "v1" })}>
          {copy.action} <ChevronRight size={15} />
        </button>
      </div>
    </PanelCard>
  );
}

// "How to read the number" footnote shown inside the View 5 reading card.
// Collapsible — defaults to closed so the panel stays compact; the user opens
// it on demand to read the longer explanation of the active metric.
export function MetricInfo({ metric }) {
  const { language } = useI18n();
  const [expanded, setExpanded] = useState(true);
  if (!metric?.valueInfo) return null;
  const label = language === "en" ? "How to read the number" : "Come leggere il numero";
  const aria = expanded
    ? (language === "en" ? "Hide the explanation" : "Nascondi la spiegazione")
    : (language === "en" ? "Show the explanation" : "Mostra la spiegazione");
  return (
    <div className={`metric-info-box ${expanded ? "" : "metric-info-box--collapsed"}`}>
      <button
        type="button"
        className="metric-info-toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={aria}
      >
        <span>{label}</span>
        {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {expanded && <RichText as="p" text={metric.valueInfo} />}
    </div>
  );
}
