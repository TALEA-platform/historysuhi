import { useEffect } from "react";
import { Eye, GitCompare, Layers } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { ViewIntro } from "../layout/ViewIntro.jsx";
import { ContextBanner } from "../layout/ContextBanner.jsx";
import { PanelCard } from "../ui/PanelCard.jsx";
import { LayerOption } from "../ui/LayerOption.jsx";
import { RichText } from "../ui/RichText.jsx";
import { MapCard } from "../map/MapCard.jsx";
import { InfoPanel } from "../map/InfoPanel.jsx";
import { HotspotContext } from "../map/HotspotContext.jsx";
import { YearDataCard } from "../panels/YearDataCard.jsx";

// View 1 — "Dove fa caldo": surface temperature per year, with optional year-vs-year
// compare rendered in a dedicated modal (CompareModal, mounted from App.jsx) and the
// temporal-hotspot overlay.

export function View1({ csvInfo }) {
  const { data, language } = useI18n();
  const selectedYear = useAppStore((state) => state.selectedYear);
  const compareEnabled = useAppStore((state) => state.compareEnabled);
  const compareYear = useAppStore((state) => state.compareYear);
  const view1BaseLayer = useAppStore((state) => state.view1BaseLayer);
  const view1Overlays = useAppStore((state) => state.view1Overlays);
  const setState = useAppStore((state) => state.setState);
  const setOverlay = useAppStore((state) => state.setOverlay);

  const layer = data.view1Layers[view1BaseLayer] || data.view1Layers.lst;
  const yearlyStats = csvInfo.yearlyStats.length ? csvInfo.yearlyStats : data.yearlyStats;
  const stat = yearlyStats.find((item) => item.year === selectedYear) || yearlyStats[0];
  const canCompare = layer.id === "lst";
  const summary = describeYear(stat, language);
  const copy = language === "en"
    ? {
      metricLabel: "Selected year",
      metricDetail: (value) => `${value.toFixed(1)} °C mean surface temperature`,
      year: "Year",
      compare: "Compare",
      compareTitle: "Compare two years",
      baseLayers: "Base layer",
      overlays: "Overlays",
      lstBody: "Absolute surface heat in the selected year",
      zspatBody: "Difference from the current urban average",
      hotspotBody: "Hotter than the historical behaviour of the same place, not simply the hottest place in the city",
      hotspotHelp:
        "This overlay highlights areas **anomalous compared with their own history**. A place can be very hot and still not appear here if it is hot in almost every year.",
      summaryLabel: "Reading",
      summaryValue: "surface heat",
    }
    : {
      metricLabel: "Anno selezionato",
      metricDetail: (value) => `${value.toFixed(1)} °C media superficiale`,
      year: "Anno",
      compare: "Confronta",
      compareTitle: "Confronta due anni",
      baseLayers: "Layer base",
      overlays: "Sovrapposizioni",
      lstBody: "Valore assoluto del caldo superficiale nell'anno scelto",
      zspatBody: "Scostamento dalla media urbana dell'anno corrente",
      hotspotBody: "Più calde del comportamento storico dello stesso luogo, non le più calde della città",
      hotspotHelp:
        "Questa sovrapposizione evidenzia le aree **anomale rispetto alla propria storia**. Una zona può essere molto calda ma non comparire qui se è calda quasi sempre.",
      summaryLabel: "Lettura",
      summaryValue: "caldo superficiale",
    };

  // If the user switches to a layer that does not support compare, disable it.
  useEffect(() => {
    if (!canCompare && compareEnabled) setState({ compareEnabled: false });
  }, [canCompare, compareEnabled, setState]);

  return (
    <>
      <ViewIntro
        id="v1"
        metric={{
          label: copy.metricLabel,
          value: selectedYear,
          detail: copy.metricDetail(stat.lst),
        }}
      />
      <ContextBanner
        label={copy.summaryLabel}
        value={copy.summaryValue}
        valueNote={selectedYear}
        text={summary}
      />
      <div className="main-grid">
        <div className="map-stack">
          <MapCard
            layer={layer}
            infoTargetId="view1-info"
            year={selectedYear}
            overlays={view1Overlays}
            focusPinnedInfo
            focusZoom={11.8}
            focusOffset={[-140, 0]}
          />
          <div className="map-below-controls">
            <label className="year-slider">
              <span className="year-slider-head">
                <span>{copy.year}</span>
                <strong>{selectedYear}</strong>
              </span>
              <input
                type="range"
                min={data.years[0]}
                max={data.years[data.years.length - 1]}
                step={1}
                value={selectedYear}
                list="view1-year-ticks"
                onChange={(event) => {
                  const nextYear = Number(event.target.value);
                  const patch = { selectedYear: nextYear };
                  if (compareYear >= nextYear) {
                    patch.compareYear = Math.max(2013, nextYear - 1);
                  }
                  setState(patch);
                }}
              />
              <datalist id="view1-year-ticks">
                {data.years.map((year) => (
                  <option key={year} value={year} />
                ))}
              </datalist>
              <span
                className="year-slider-ticks"
                style={{ gridTemplateColumns: `repeat(${data.years.length}, 1fr)` }}
                aria-hidden="true"
              >
                {data.years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`year-slider-tick ${year === selectedYear ? "is-active" : ""}`}
                    onClick={() => {
                      const patch = { selectedYear: year };
                      if (compareYear >= year) {
                        patch.compareYear = Math.max(2013, year - 1);
                      }
                      setState(patch);
                    }}
                    tabIndex={-1}
                  >
                    {year}
                  </button>
                ))}
              </span>
            </label>
            {canCompare && (
              <button
                className={`icon-button ${compareEnabled ? "active" : ""}`}
                type="button"
                onClick={() => setState({ compareEnabled: !compareEnabled })}
                title={copy.compareTitle}
              >
                <GitCompare size={17} />
                {copy.compare}
              </button>
            )}
          </div>
          <InfoPanel id="view1-info" layer={layer} />
          {view1Overlays.hotspotTemporal && (
            <HotspotContext selectedYear={selectedYear} yearlyStats={yearlyStats} />
          )}
        </div>
        <aside className="side-panel">
          <PanelCard title={copy.baseLayers} icon={<Layers size={16} />}>
            <LayerOption
              selected={view1BaseLayer === "lst"}
              title={data.view1Layers.lst.title}
              body={copy.lstBody}
              onClick={() => setState({ view1BaseLayer: "lst" })}
            />
            <LayerOption
              selected={view1BaseLayer === "zspat"}
              title={data.view1Layers.zspat.title}
              body={copy.zspatBody}
              onClick={() => setState({ view1BaseLayer: "zspat" })}
            />
          </PanelCard>
          <PanelCard title={copy.overlays} icon={<Eye size={16} />}>
            <LayerOption
              checkbox
              selected={view1Overlays.hotspotTemporal}
              title={data.rasterOverlays.temporalHotspot.title}
              body={copy.hotspotBody}
              onClick={() => setOverlay("hotspotTemporal", !view1Overlays.hotspotTemporal)}
            />
            <RichText
              as="p"
              className="panel-help"
              text={copy.hotspotHelp}
            />
          </PanelCard>
          <YearDataCard year={selectedYear} detail={csvInfo.yearlyDetails[selectedYear]} />
        </aside>
      </div>
    </>
  );
}

// Returns a qualitative one-sentence summary of the selected year, derived from anomaly
// and hotspot share. Avoids any temperature value: a citizen could mistake LST °C for
// air temperature, and the mean is already shown in the intro metric box.
function describeYear(stat, language) {
  const anomaly = Number(stat?.anomaly ?? 0);
  const hotspot = Number(stat?.hotspot ?? 0);
  if (language === "en") {
    let mood;
    if (anomaly < -3) mood = "**exceptionally cool**";
    else if (anomaly < -0.7) mood = "**clearly cooler**";
    else if (anomaly < -0.2) mood = "**slightly cooler**";
    else if (anomaly < 0.3) mood = "**close to the historical average**";
    else if (anomaly < 0.7) mood = "**slightly warmer**";
    else if (anomaly < 1.7) mood = "**clearly warmer**";
    else if (anomaly < 2.5) mood = "**much warmer**";
    else mood = "**record-breaking**";
    let exceptional;
    if (hotspot >= 50) exceptional = "broad areas flagged as exceptionally hot";
    else if (hotspot >= 20) exceptional = "many areas flagged as exceptionally hot";
    else if (hotspot >= 5) exceptional = "some areas flagged as exceptionally hot";
    else if (hotspot >= 0.5) exceptional = "few areas flagged as exceptionally hot";
    else exceptional = "almost no area flagged as exceptionally hot";
    if (anomaly >= 2.5) {
      return `Summer ${mood}: the hottest in the 2013-2025 series, with ${exceptional}.`;
    }
    if (anomaly < -3) {
      return `One of the coolest summers in the 2013-2025 series, with ${exceptional}.`;
    }
    return `Summer ${mood} than the 2013-2025 historical average, with ${exceptional}.`;
  }
  let mood;
  if (anomaly < -3) mood = "**eccezionalmente fresca**";
  else if (anomaly < -0.7) mood = "**chiaramente più fresca**";
  else if (anomaly < -0.2) mood = "**leggermente più fresca**";
  else if (anomaly < 0.3) mood = "**vicina alla media storica**";
  else if (anomaly < 0.7) mood = "**leggermente più calda**";
  else if (anomaly < 1.7) mood = "**chiaramente più calda**";
  else if (anomaly < 2.5) mood = "**molto più calda**";
  else mood = "**da record**";
  let exceptional;
  if (hotspot >= 50) exceptional = "ampie aree classificate come eccezionalmente calde";
  else if (hotspot >= 20) exceptional = "molte aree classificate come eccezionalmente calde";
  else if (hotspot >= 5) exceptional = "alcune aree classificate come eccezionalmente calde";
  else if (hotspot >= 0.5) exceptional = "poche aree classificate come eccezionalmente calde";
  else exceptional = "quasi nessuna area classificata come eccezionalmente calda";
  if (anomaly >= 2.5) {
    return `Estate ${mood}: la più calda della serie 2013-2025, con ${exceptional}.`;
  }
  if (anomaly < -3) {
    return `Una delle estati più fresche della serie 2013-2025, con ${exceptional}.`;
  }
  return `Estate ${mood} rispetto alla media storica 2013-2025, con ${exceptional}.`;
}
