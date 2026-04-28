import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import proj4 from "proj4";
import { useI18n } from "../../i18n/useI18n.js";
import { ViewIntro } from "../layout/ViewIntro.jsx";
import { ContextBanner } from "../layout/ContextBanner.jsx";
import { PanelCard } from "../ui/PanelCard.jsx";
import { RichText } from "../ui/RichText.jsx";
import { MapCard } from "../map/MapCard.jsx";
import { InfoPanel } from "../map/InfoPanel.jsx";
import { ScatterPanel } from "../panels/ScatterPanel.jsx";

// Hard-coded fallback so the panel still renders before CSV data finishes loading.
const FALLBACK_DELTA_STATS = {
  count: 185,
  deltaMean: 9.54838244979446,
  pearson: 0.5247575151889334,
};

const VIEW4_HALF_CELL_SIZE = 500.0001;

proj4.defs(
  "EPSG:32632",
  "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs",
);

function buildInspectionFromScatterPoint(point) {
  if (!point) return null;
  return {
    value: point.y,
    lngLat: { lng: point.lng, lat: point.lat },
    centroidX: point.centroidX,
    centroidY: point.centroidY,
    pointKey: point.key,
  };
}

function findScatterPointForInspection(info, points = []) {
  if (!info || !points.length) return null;

  if (Number.isFinite(info.centroidX) && Number.isFinite(info.centroidY)) {
    return points.find((point) => point.key === info.pointKey)
      || points.find((point) => (
        Math.abs(point.centroidX - info.centroidX) <= 0.5
        && Math.abs(point.centroidY - info.centroidY) <= 0.5
      ))
      || null;
  }

  const lng = info.lngLat?.lng;
  const lat = info.lngLat?.lat;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  const [inspectX, inspectY] = proj4("EPSG:4326", "EPSG:32632", [lng, lat]);
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const point of points) {
    const dx = Math.abs(point.centroidX - inspectX);
    const dy = Math.abs(point.centroidY - inspectY);
    if (dx > VIEW4_HALF_CELL_SIZE || dy > VIEW4_HALF_CELL_SIZE) continue;

    const distance = dx + dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = point;
    }
  }

  return bestMatch;
}

// View 4 — day/night surface delta (1 km MODIS) and its relationship with albedo and NDVI.

export function View4({ csvInfo }) {
  const { data, language } = useI18n();
  const [selectedInspectionInfo, setSelectedInspectionInfo] = useState(null);
  const [scatterMetric, setScatterMetric] = useState("albedo");
  const deltaStats = csvInfo.deltaStats || FALLBACK_DELTA_STATS;
  const scatterPoints = csvInfo.albedoDeltaPairs || [];
  const selectedScatterPoint = useMemo(
    () => findScatterPointForInspection(selectedInspectionInfo, scatterPoints),
    [selectedInspectionInfo, scatterPoints],
  );
  const copy = language === "en"
    ? {
      metricLabel: "Mean day-night difference",
      metricDetail: `${Math.round(deltaStats.count)} 1 km cells intersecting Bologna`,
      bannerLabel: "Reading",
      bannerValue: "day-night range",
      bannerText:
        "This view shows the **day-night temperature range** (how much surfaces heat up during the day and cool down at night) observed in summer **2025**. A high value indicates a strong day-night swing; a low value can indicate surfaces that change little, or areas that are **already cooler during the day** and therefore have less heat to lose overnight.",
      panelTitle: "Relationships",
      panelText:
        "These charts compare the day-night range with two local factors: surface reflectivity and vegetation density.",
    }
    : {
      metricLabel: "Differenza media giorno-notte",
      metricDetail: `${Math.round(deltaStats.count)} celle da 1 km che intersecano Bologna`,
      bannerLabel: "Lettura",
      bannerValue: "escursione termica",
      bannerText:
        "Questa sezione mostra l'**escursione termica** tra giorno e notte (quanto le superfici si scaldano di giorno e si raffreddano di notte) osservata nell'estate **2025**. Un valore alto indica una forte differenza tra giorno e notte; un valore basso può indicare superfici che cambiano poco o zone **già più fresche di giorno**, che hanno quindi meno calore da perdere durante la notte.",
      panelTitle: "Relazioni",
      panelText:
        "Questi grafici mettono in relazione l'escursione giorno-notte con due fattori locali: riflettenza delle superfici e densita' della vegetazione.",
    };

  return (
    <>
      <ViewIntro
        id="v4"
        metric={{
          label: copy.metricLabel,
          value: `${deltaStats.deltaMean.toFixed(2)} °C`,
          detail: copy.metricDetail,
        }}
      />
      <ContextBanner
        label={copy.bannerLabel}
        value={copy.bannerValue}
        text={copy.bannerText}
      />
      <div className="main-grid">
        <div className="map-stack">
          <MapCard
            layer={data.deltaLayer}
            infoTargetId="view4-info"
            pinnedInfo={selectedInspectionInfo}
            onPinnedInfoChange={setSelectedInspectionInfo}
            focusPinnedInfo
          />
          <InfoPanel id="view4-info" layer={data.deltaLayer} />
        </div>
        <aside className="side-panel">
          <PanelCard title={copy.panelTitle} icon={<SlidersHorizontal size={16} />}>
            <RichText
              as="p"
              className="panel-help"
              text={copy.panelText}
            />
            <ScatterPanel
              csvInfo={csvInfo}
              selectedPointKey={selectedScatterPoint?.key || null}
              onSelectPoint={(point) => setSelectedInspectionInfo(buildInspectionFromScatterPoint(point))}
              metric={scatterMetric}
              onMetricChange={setScatterMetric}
            />
          </PanelCard>
        </aside>
      </div>
    </>
  );
}
