import { useEffect } from "react";
import { useAppStore } from "../store/appStore.js";
import { buildAppHref } from "../lib/appPaths.js";
import { DEFAULT_LANGUAGE } from "../i18n/config.js";

function formatNumber(value, digits) {
  return String(Number(value.toFixed(digits)));
}

// Keeps the current URL in sync with the relevant slice of the store so a refresh
// (or a copy-pasted link) restores the same view, layer, year and overlays.
//
// Subtleties:
//  - We use history.replaceState (not pushState) so each interaction does not
//    explode the back-stack with one entry per slider tick.
//  - Only fields the user actually moved away from the default are written, so
//    a default-state URL stays clean.
//  - Selectors below pick exactly the fields that affect the URL; this is the
//    set the effect lists in its dependency array.

export function useUrlSync() {
  const language = useAppStore((state) => state.language);
  const currentView = useAppStore((state) => state.currentView);
  const selectedYear = useAppStore((state) => state.selectedYear);
  const compareEnabled = useAppStore((state) => state.compareEnabled);
  const compareYear = useAppStore((state) => state.compareYear);
  const splitPosition = useAppStore((state) => state.splitPosition);
  const view1BaseLayer = useAppStore((state) => state.view1BaseLayer);
  const view1Overlays = useAppStore((state) => state.view1Overlays);
  const view2Layer = useAppStore((state) => state.view2Layer);
  const persistenceTemporalThreshold = useAppStore((state) => state.persistenceTemporalThreshold);
  const persistenceStructuralThreshold = useAppStore((state) => state.persistenceStructuralThreshold);
  const view3Layer = useAppStore((state) => state.view3Layer);
  const view5Metric = useAppStore((state) => state.view5Metric);
  const view5Aggregation = useAppStore((state) => state.view5Aggregation);
  const selectedDistrictId = useAppStore((state) => state.selectedDistrictId);
  const districtOpacity = useAppStore((state) => state.districtOpacity);
  const districtInteractionMode = useAppStore((state) => state.districtInteractionMode);
  const colorblindMode = useAppStore((state) => state.colorblindMode);
  const showNumericValues = useAppStore((state) => state.showNumericValues);
  const basemap = useAppStore((state) => state.basemap);
  const mapInteractionMode = useAppStore((state) => state.mapInteractionMode);
  const rasterOpacity = useAppStore((state) => state.rasterOpacity);
  const mapLng = useAppStore((state) => state.mapLng);
  const mapLat = useAppStore((state) => state.mapLat);
  const mapZoom = useAppStore((state) => state.mapZoom);
  const mapBearing = useAppStore((state) => state.mapBearing);
  const mapPitch = useAppStore((state) => state.mapPitch);

  useEffect(() => {
    const search = new URLSearchParams();
    search.set("view", currentView);
    if (language !== DEFAULT_LANGUAGE) search.set("lang", language);

    if (currentView === "v1") {
      search.set("year", String(selectedYear));
      search.set("layer", view1BaseLayer);
      if (compareEnabled) {
        search.set("compare", "1");
        search.set("compareYear", String(compareYear));
        search.set("split", String(Math.round(splitPosition)));
      }
      const overlays = [];
      if (view1Overlays.hotspotTemporal) overlays.push("hotspot");
      if (overlays.length) search.set("overlay", overlays.join(","));
    }

    if (currentView === "v2") {
      search.set("layer", view2Layer);
      search.set("threshold", String(persistenceTemporalThreshold));
      search.set("structThreshold", String(persistenceStructuralThreshold));
    }

    if (currentView === "v3") search.set("layer", view3Layer);

    if (currentView === "v5") {
      search.set("metric", view5Metric);
      if (view5Aggregation !== "district") search.set("agg", view5Aggregation);
      if (selectedDistrictId) search.set("district", selectedDistrictId);
      if (districtOpacity !== 0.58) search.set("districtOpacity", String(districtOpacity));
      if (districtInteractionMode !== "navigate") search.set("districtMode", districtInteractionMode);
    }

    if (colorblindMode) search.set("palette", "accessible");
    if (showNumericValues) search.set("values", "1");
    if (basemap !== "osm") search.set("basemap", basemap);
    if (mapInteractionMode !== "navigate") search.set("mode", mapInteractionMode);
    if (rasterOpacity !== 0.72) search.set("opacity", String(rasterOpacity));
    if (mapLng != null && mapLat != null && mapZoom != null) {
      search.set("lng", formatNumber(mapLng, 5));
      search.set("lat", formatNumber(mapLat, 5));
      search.set("zoom", formatNumber(mapZoom, 2));
      if (mapBearing) search.set("bearing", formatNumber(mapBearing, 1));
      if (mapPitch) search.set("pitch", formatNumber(mapPitch, 1));
    }

    window.history.replaceState(null, "", buildAppHref(search));
  }, [
    language,
    currentView,
    selectedYear,
    compareEnabled,
    compareYear,
    splitPosition,
    view1BaseLayer,
    view1Overlays,
    view2Layer,
    persistenceTemporalThreshold,
    persistenceStructuralThreshold,
    view3Layer,
    view5Metric,
    view5Aggregation,
    selectedDistrictId,
    districtOpacity,
    districtInteractionMode,
    colorblindMode,
    showNumericValues,
    basemap,
    mapInteractionMode,
    rasterOpacity,
    mapLng,
    mapLat,
    mapZoom,
    mapBearing,
    mapPitch,
  ]);
}
