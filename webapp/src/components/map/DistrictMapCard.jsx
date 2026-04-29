import { forwardRef, useMemo } from "react";
import { Search } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { DistrictMapLibre } from "./DistrictMapLibre.jsx";
import { Legend } from "./Legend.jsx";
import { MapFloatingControls } from "./MapFloatingControls.jsx";

// Wraps the DistrictMapLibre choropleth with the standard card chrome:
// title, the map itself, finder/legend helpers, an inspect hint and the
// floating controls. Used by View 5. Forwards a ref to the inner map so
// View 5 can call flyTo(featureId) when the user picks an area from finder/table.

export const DistrictMapCard = forwardRef(function DistrictMapCard({
  aggregation,
  entities,
  metricKey,
  selectedId,
  finderAnchorId,
  onSelect,
}, ref) {
  const { data, language } = useI18n();
  const basemap = useAppStore((state) => state.basemap);
  const districtOpacity = useAppStore((state) => state.districtOpacity);
  const districtInteractionMode = useAppStore((state) => state.districtInteractionMode);
  const setState = useAppStore((state) => state.setState);
  const isStatistical = aggregation === "statistical";
  const copy = language === "en"
    ? {
      statisticalPill: "statistical areas",
      districtPill: "districts",
      dataYear: "2025 data",
      inspectHint: `Click ${isStatistical ? "a statistical area" : "a district"} to update the card.`,
      opacityLabel: "Areas",
      findArea: "Find an area",
    }
    : {
      statisticalPill: "aree statistiche",
      districtPill: "quartieri",
      dataYear: "dati 2025",
      inspectHint: `Clicca ${isStatistical ? "un'area statistica" : "un quartiere"} per aggiornare la scheda.`,
      opacityLabel: "Aree",
      findArea: "Trova una zona",
    };
  const legendLayer = useMemo(() => {
    const values = entities
      .map((entity) => entity?.[metricKey])
      .filter(Number.isFinite);
    if (!values.length) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const mid = min + ((max - min) / 2);
    const formatter = new Intl.NumberFormat(language === "en" ? "en-US" : "it-IT", {
      minimumFractionDigits: metricKey === "uhei" ? 2 : 1,
      maximumFractionDigits: metricKey === "uhei" ? 2 : 1,
    });
    const formatValue = (value) => `${formatter.format(value)}${data.districtMetrics[metricKey].unit}`;

    return {
      legendTitle: data.districtMetrics[metricKey].label,
      legendType: "districtHeat",
      numericLegend: [formatValue(min), formatValue(mid), formatValue(max)],
      legend: [
        language === "en" ? "lower values" : "valori più bassi",
        language === "en" ? "middle" : "intermedi",
        language === "en" ? "higher values" : "valori più alti",
      ],
    };
  }, [data.districtMetrics, entities, language, metricKey]);

  function focusFinder() {
    if (!finderAnchorId) return;
    const el = document.getElementById(finderAnchorId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = el.querySelector("input[type='search']");
    if (input) setTimeout(() => input.focus(), 250);
  }

  return (
    <section className="district-map-card">
      <div className="map-head">
        <div className="map-title-wrap">
          <span className="pill">{isStatistical ? copy.statisticalPill : copy.districtPill}</span>
          <div>
            <strong>{data.districtMetrics[metricKey].label}</strong>
            <span>{data.districtMetrics[metricKey].description} · {copy.dataYear}</span>
          </div>
        </div>
      </div>
      <div className="district-map-shell">
        <DistrictMapLibre
          ref={ref}
          aggregation={aggregation}
          metricKey={metricKey}
          selectedId={selectedId}
          entities={entities}
          interactionMode={districtInteractionMode}
          onSelect={onSelect}
        />
        <div className="district-map-left-stack">
          {finderAnchorId && (
            <button
              type="button"
              className="map-search-button"
              onClick={focusFinder}
              aria-label={copy.findArea}
              title={copy.findArea}
            >
              <Search size={16} />
              <span>{copy.findArea}</span>
            </button>
          )}
          {legendLayer && <Legend layer={legendLayer} showNumericValues />}
          {districtInteractionMode === "inspect" && (
            <div className="district-inspect-hint">
              {copy.inspectHint}
            </div>
          )}
        </div>
        <MapFloatingControls
          basemap={basemap}
          setState={setState}
          interactionMode={districtInteractionMode}
          // The district map drives a separate slice of the store so navigate/inspect
          // does not collide with the raster map's mode.
          interactionStateKey="districtInteractionMode"
          showInteractionMode
          opacityValue={districtOpacity}
          opacityLabel={copy.opacityLabel}
          onOpacityChange={(value) => setState({ districtOpacity: value })}
          showValuesToggle={false}
        />
      </div>
    </section>
  );
});
