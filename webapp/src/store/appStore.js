import { create } from "zustand";
import { normalizeLanguage, persistLanguage, readStoredLanguage } from "../i18n/config.js";

const params = new URLSearchParams(window.location.search);
const pathView = window.location.pathname.match(/\/view\/(v[1-5])/)?.[1];
const layerParam = params.get("layer");
const queryLanguage = params.has("lang") ? normalizeLanguage(params.get("lang")) : null;
const initialLanguage = queryLanguage || readStoredLanguage() || "it";
const view1LayerIds = ["lst", "zspat"];
const view2LayerIds = [
  "anomaly",
  "climatology",
  "persistenceTemporal",
  "persistenceStructural",
  "chronicVsAnomalous2025",
  "structuralVsTemporal",
];
const view3LayerIds = ["uhei", "hvi", "hri", "ndvi", "albedo"];
const initialYear = Number(params.get("year") || 2025);
const defaultCompareYear = Math.max(2013, initialYear - 1);

export const useAppStore = create((set) => ({
  language: initialLanguage,
  currentView: params.get("view") || pathView || "v1",
  selectedYear: initialYear,
  compareEnabled: params.get("compare") === "1",
  compareYear: Number(params.get("compareYear") || defaultCompareYear),
  splitPosition: Number(params.get("split") || 50),
  view1BaseLayer: view1LayerIds.includes(layerParam) ? layerParam : "lst",
  view1Overlays: {
    hotspotTemporal: params.get("overlay")?.includes("hotspot") || false,
  },
  view2Layer: view2LayerIds.includes(layerParam) ? layerParam : "climatology",
  persistenceTemporalThreshold: Number(params.get("threshold") || 3),
  persistenceStructuralThreshold: Number(params.get("structThreshold") || 5),
  view3Layer: view3LayerIds.includes(layerParam) ? layerParam : "uhei",
  view5Metric: params.get("metric") || "uhei",
  view5Aggregation: params.get("agg") === "statistical" ? "statistical" : "district",
  selectedDistrictId: params.get("district") || null,
  colorblindMode: params.get("palette") === "accessible",
  showNumericValues: params.get("values") === "1",
  basemap: params.get("basemap") || "osm",
  mapInteractionMode: params.get("mode") === "inspect" ? "inspect" : "navigate",
  districtInteractionMode: params.get("districtMode") === "inspect" ? "inspect" : "navigate",
  rasterOpacity: Number(params.get("opacity") || 0.72),
  districtOpacity: Number(params.get("districtOpacity") || 0.58),
  // First-load welcome popup gates on this flag; OnboardingModal (the comprehensive
  // Guide opened from the Header) starts closed and is opened on demand.
  welcomeOpen: !localStorage.getItem("talea:onboarded"),
  onboardingOpen: false,
  methodologyOpen: false,
  supportModeOpen: false,
  setState: (patch) => set(patch),
  setLanguage: (language) => {
    const normalizedLanguage = normalizeLanguage(language);
    persistLanguage(normalizedLanguage);
    set({ language: normalizedLanguage });
  },
  setOverlay: (key, value) =>
    set((state) => ({
      view1Overlays: {
        ...state.view1Overlays,
        [key]: value,
      },
    })),
}));
