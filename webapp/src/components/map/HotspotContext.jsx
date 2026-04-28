import { RichText } from "../ui/RichText.jsx";
import { useI18n } from "../../i18n/useI18n.js";

// Small horizontal bar that shows the share of pixels flagged as a temporal hotspot
// in the selected year, normalised against the maximum across the series so the
// bar always has a reference width.

export function HotspotContext({ selectedYear, yearlyStats }) {
  const { language, data } = useI18n();
  const stat = yearlyStats.find((item) => item.year === selectedYear);
  const max = Math.max(...yearlyStats.map((item) => item.hotspot));
  const width = stat ? (stat.hotspot / max) * 100 : 0;
  const copy = language === "en"
    ? {
      title: data.rasterOverlays.temporalHotspot.title,
      share: `${(stat?.hotspot ?? 0).toFixed(2)}% of the area in ${selectedYear}`,
      description:
        "They are not necessarily **the hottest zones in Bologna**. They are points that, in the selected year, were **anomalous compared with their own history**: hotter than that same place usually is.",
    }
    : {
      title: data.rasterOverlays.temporalHotspot.title,
      share: `${(stat?.hotspot ?? 0).toFixed(2)}% dell'area nel ${selectedYear}`,
      description:
        "Non sono necessariamente **le zone più calde di Bologna**. Sono punti che, nell'anno selezionato, sono stati **anomali rispetto alla propria storia**: più caldi di quanto quello stesso luogo sia di solito.",
    };
  return (
    <div className="hotspot-context">
      <strong>{copy.title}</strong>
      <div className="hotspot-bar">
        <span style={{ width: `${width}%` }} />
      </div>
      <span>{copy.share}</span>
      <RichText
        as="p"
        text={copy.description}
      />
    </div>
  );
}
