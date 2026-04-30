import { Move, Search } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

// The cluster of small controls floating in the top-right corner of every map.
// Wraps three groups: navigate/inspect, basemap toggle, opacity + display toggles.
//
// Both the raster MapCard and the DistrictMapCard reuse this component, so the
// `interactionStateKey` prop lets each one update its own slice of the store
// (mapInteractionMode vs districtInteractionMode). The dynamic key is fed back
// to setState as a computed property: { [interactionStateKey]: "navigate" }.

export function MapFloatingControls({
  basemap,
  opacityValue,
  rasterOpacity,
  interactionMode = "navigate",
  showInteractionMode = false,
  interactionStateKey = "mapInteractionMode",
  setState,
  opacity = true,
  opacityLabel,
  onOpacityChange,
  showValuesToggle = true,
}) {
  const { language } = useI18n();
  const value = opacityValue ?? rasterOpacity;
  const showNumericValues = useAppStore((state) => state.showNumericValues);
  const colorblindMode = useAppStore((state) => state.colorblindMode);
  const copy = language === "en"
    ? {
      mapMode: "Map mode",
      navigateTitle: "Move and navigate the map",
      navigate: "Move",
      inspectTitle: "Hover or click to read map data",
      inspect: "Inspect",
      basemap: "Map background",
      orthophoto: "Orthophoto",
      opacityLabel: "Transparency",
      numericValuesTitle: "Show numeric values next to the qualitative reading.",
      numericValues: "Values",
      colorTitle: "Switch the map palette to alternative colors.",
      colorToggle: "Change colors",
    }
    : {
      mapMode: "Modalità mappa",
      navigateTitle: "Muovi e naviga la mappa",
      navigate: "Muovi",
      inspectTitle: "Passa sopra o clicca per leggere i dati della mappa",
      inspect: "Ispeziona",
      basemap: "Sfondo mappa",
      orthophoto: "Ortofoto",
      opacityLabel: "Trasparenza",
      numericValuesTitle: "Mostra i valori numerici accanto alla lettura qualitativa.",
      numericValues: "Valori",
      colorTitle: "Cambia la palette della mappa usando colori alternativi.",
      colorToggle: "Cambia colori",
    };
  const resolvedOpacityLabel = opacityLabel || copy.opacityLabel;

  return (
    <div className="map-floating-controls">
      {showInteractionMode && (
        <div className="control-group primary-control">
          <div className="mode-switch" role="group" aria-label={copy.mapMode}>
            <button
              type="button"
              className={interactionMode === "navigate" ? "active" : ""}
              aria-pressed={interactionMode === "navigate"}
              onClick={() => setState({ [interactionStateKey]: "navigate" })}
              title={copy.navigateTitle}
            >
              <Move size={14} />
              {copy.navigate}
            </button>
            <button
              type="button"
              className={interactionMode === "inspect" ? "active" : ""}
              aria-pressed={interactionMode === "inspect"}
              onClick={() => setState({ [interactionStateKey]: "inspect" })}
              title={copy.inspectTitle}
            >
              <Search size={14} />
              {copy.inspect}
            </button>
          </div>
        </div>
      )}
      <div className="control-group">
        <div className="basemap-switch" role="group" aria-label={copy.basemap}>
          <button
            type="button"
            className={basemap === "osm" ? "active" : ""}
            aria-pressed={basemap === "osm"}
            onClick={() => setState({ basemap: "osm" })}
          >
            OSM
          </button>
          <button
            type="button"
            className={basemap === "ortho" ? "active" : ""}
            aria-pressed={basemap === "ortho"}
            onClick={() => setState({ basemap: "ortho" })}
          >
            {copy.orthophoto}
          </button>
        </div>
      </div>
      {opacity && (
        <div className="control-group">
          <label className="opacity-control">
            <span>{resolvedOpacityLabel}</span>
            <input
              type="range"
              min="0.15"
              max="1"
              step="0.05"
              value={value}
              onChange={(event) => {
                const next = Number(event.target.value);
                // The district map needs a custom store slice; the raster map uses
                // the default rasterOpacity. onOpacityChange wins when provided.
                if (onOpacityChange) onOpacityChange(next);
                else setState({ rasterOpacity: next });
              }}
            />
          </label>
        </div>
      )}
      <div className="control-group display-control">
        {showValuesToggle && (
          <label className="floating-toggle map-values-toggle" title={copy.numericValuesTitle}>
            <input
              type="checkbox"
              checked={showNumericValues}
              onChange={(event) => setState({ showNumericValues: event.target.checked })}
            />
            <span>{copy.numericValues}</span>
          </label>
        )}
        <label className="floating-toggle" title={copy.colorTitle}>
          <input
            type="checkbox"
            checked={colorblindMode}
            onChange={(event) => setState({ colorblindMode: event.target.checked })}
          />
          <span>{copy.colorToggle}</span>
        </label>
      </div>
    </div>
  );
}
