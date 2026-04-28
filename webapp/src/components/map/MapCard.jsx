import { useEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { scrollToInfo } from "../../utils/scroll.js";
import { MapLibreRasterMap } from "./MapLibreRasterMap.jsx";
import { MapFloatingControls } from "./MapFloatingControls.jsx";
import { MapTooltip } from "./MapTooltip.jsx";
import { MapPinnedInspection } from "./MapPinnedInspection.jsx";
import { Legend } from "./Legend.jsx";

// The raster map "card": header, optional toolbar, the MapLibre canvas, the floating
// control cluster, hover/inspect readouts and the legend overlay inside the map.
// Year-to-year comparison lives in CompareModal, so this component always renders a
// single map regardless of the compareEnabled store flag.

export function MapCard({
  layer,
  year = 2025,
  overlays = {},
  toolbar,
  threshold,
  infoTargetId,
  showValuesToggle = true,
  pinnedInfo,
  onPinnedInfoChange,
  focusPinnedInfo = false,
  focusZoom,
  focusOffset,
}) {
  const { data, language } = useI18n();
  const showNumericValues = useAppStore((state) => state.showNumericValues);
  const rasterOpacity = useAppStore((state) => state.rasterOpacity);
  const basemap = useAppStore((state) => state.basemap);
  const mapInteractionMode = useAppStore((state) => state.mapInteractionMode);
  const setState = useAppStore((state) => state.setState);
  const mapRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [localPinnedInfo, setLocalPinnedInfo] = useState(null);
  const effectiveShowNumericValues = showValuesToggle && showNumericValues;
  const effectivePinnedInfo = pinnedInfo === undefined ? localPinnedInfo : pinnedInfo;
  const copy = language === "en"
    ? { infoJump: "How to read it" }
    : { infoJump: "Come leggerla" };

  // Build the overlay specs once per overlay change. Each entry is an object the
  // raster renderer understands; the mapping lives in data/layers.js.
  const overlaySpecs = useMemo(() => {
    const specs = [];
    if (overlays.hotspotTemporal) specs.push(data.rasterOverlays.temporalHotspot);
    return specs;
  }, [data.rasterOverlays.temporalHotspot, overlays.hotspotTemporal]);

  // Reset hover/pin state whenever the underlying layer or the year changes,
  // otherwise a stale tooltip would point to data that no longer exists.
  useEffect(() => {
    setHoverInfo(null);
    setLocalPinnedInfo(null);
    onPinnedInfoChange?.(null);
  }, [layer.id, year, threshold, mapInteractionMode]);

  const selectedTarget = effectivePinnedInfo?.lngLat
    ? {
      key: effectivePinnedInfo.value?.cell
        ? `${effectivePinnedInfo.value.cell.row}:${effectivePinnedInfo.value.cell.col}`
        : (effectivePinnedInfo.pointKey || `${effectivePinnedInfo.lngLat.lng}:${effectivePinnedInfo.lngLat.lat}:${effectivePinnedInfo.value ?? ""}`),
      lng: effectivePinnedInfo.lngLat.lng,
      lat: effectivePinnedInfo.lngLat.lat,
    }
    : null;
  const focusTarget = focusPinnedInfo ? selectedTarget : null;

  function handleInspect(nextPinnedInfo) {
    if (pinnedInfo === undefined) setLocalPinnedInfo(nextPinnedInfo);
    onPinnedInfoChange?.(nextPinnedInfo);
  }

  function handleCloseInspection() {
    if (pinnedInfo === undefined) setLocalPinnedInfo(null);
    onPinnedInfoChange?.(null);
  }

  return (
    <section className="map-card">
      <div className="map-head">
        <div className="map-title-wrap">
          <div>
            <strong>{layer.title}</strong>
            <span>{layer.subtitle}</span>
          </div>
        </div>
        <div className="map-controls">
          {infoTargetId && (
            <button className="info-jump-button" type="button" onClick={() => scrollToInfo(infoTargetId)}>
              <Info size={16} />
              {copy.infoJump}
            </button>
          )}
          {toolbar}
        </div>
      </div>
      <div className="map-area real-map-area" ref={mapRef}>
        <MapLibreRasterMap
          layer={layer}
          year={year}
          overlays={overlaySpecs}
          threshold={threshold}
          interactionMode={mapInteractionMode}
          onHover={setHoverInfo}
          onInspect={handleInspect}
          selectedTarget={selectedTarget}
          focusTarget={focusTarget}
          focusZoom={focusZoom}
          focusOffset={focusOffset}
        />
        <MapFloatingControls
          basemap={basemap}
          rasterOpacity={rasterOpacity}
          interactionMode={mapInteractionMode}
          showInteractionMode
          showValuesToggle={showValuesToggle}
          setState={setState}
        />
        <MapTooltip
          interactionMode={mapInteractionMode}
          showNumericValues={effectiveShowNumericValues}
          layer={layer}
          // While a pinned card is open we mute the hover tooltip to avoid double UI.
          hoverInfo={effectivePinnedInfo ? null : hoverInfo}
        />
        <MapPinnedInspection
          info={effectivePinnedInfo}
          layer={layer}
          showNumericValues={effectiveShowNumericValues}
          onClose={handleCloseInspection}
        />
        <Legend layer={layer} showNumericValues={effectiveShowNumericValues} />
      </div>
    </section>
  );
}
