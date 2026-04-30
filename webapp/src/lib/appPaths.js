import LZString from "lz-string";

const { decompressFromEncodedURIComponent } = LZString;
const LEGACY_HASH_VERSION = "1";
const COMPACT_HASH_VERSION = "2";
const VIEW_IDS = ["v1", "v2", "v3", "v4", "v5"];
const LANGUAGE_IDS = ["it", "en"];
const BASEMAP_IDS = ["osm", "ortho"];
const INTERACTION_MODE_IDS = ["navigate", "inspect"];
const VIEW5_AGGREGATION_IDS = ["district", "statistical"];
const VIEW_LAYER_IDS = {
  v1: ["lst", "zspat"],
  v2: ["anomaly", "climatology", "persistenceTemporal", "persistenceStructural", "chronicVsAnomalous2025", "structuralVsTemporal"],
  v3: ["uhei", "hvi", "hri", "ndvi", "albedo"],
};
const VIEW5_METRIC_IDS = ["uhei", "lst", "anomaly", "hotspotPercent", "persistenceMean"];
const DISTRICT_IDS = ["san-donato", "navile", "borgo-panigale", "savena", "porto-saragozza", "santo-stefano"];
const VIEWPORT_ORIGIN = {
  lng: 11.22965538811709,
  lat: 44.42111295594283,
  zoom: 9,
};

function formatNumber(value, digits) {
  return String(Number(value.toFixed(digits)));
}

function isBlank(value) {
  return value == null || value === "";
}

function decodeBase36(value) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 36);
  return Number.isFinite(parsed) ? parsed : null;
}

function encodeEnum(options, value) {
  const index = options.indexOf(value);
  return index >= 0 ? index.toString(36) : null;
}

function decodeEnum(options, token) {
  const index = decodeBase36(token);
  return index == null ? null : (options[index] ?? null);
}

function encodeYear(value) {
  if (isBlank(value)) return null;
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  return Math.round(year - 2013).toString(36);
}

function decodeYear(token) {
  const offset = decodeBase36(token);
  if (offset == null) return null;
  const year = 2013 + offset;
  return year >= 2013 && year <= 2025 ? String(year) : null;
}

function encodeInteger(value) {
  if (isBlank(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed).toString(36) : null;
}

function decodeInteger(token) {
  const value = decodeBase36(token);
  return value == null ? null : String(value);
}

function encodeScaled(value, scale) {
  if (isBlank(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * scale).toString(36) : null;
}

function decodeScaled(token, scale, digits) {
  const value = decodeBase36(token);
  return value == null ? null : formatNumber(value / scale, digits);
}

function encodeView(value) {
  const match = String(value || "").match(/^v([1-5])$/);
  return match ? match[1] : null;
}

function decodeView(token) {
  return /^[1-5]$/.test(String(token || "")) ? `v${token}` : null;
}

function encodeViewportCoordinate(value, axis) {
  if (isBlank(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const origin = VIEWPORT_ORIGIN[axis];
  const scale = axis === "zoom" ? 100 : 100000;
  const offset = Math.round((parsed - origin) * scale);
  return offset >= 0 ? offset.toString(36) : null;
}

function decodeViewportCoordinate(token, axis) {
  const offset = decodeBase36(token);
  if (offset == null) return null;
  const digits = axis === "zoom" ? 2 : 5;
  const origin = VIEWPORT_ORIGIN[axis];
  const value = axis === "zoom" ? origin + (offset / 100) : origin + (offset / 100000);
  return formatNumber(value, digits);
}

function encodeSelectedArea(value) {
  if (!value) return null;

  const districtIndex = DISTRICT_IDS.indexOf(value);
  if (districtIndex >= 0) return `d${districtIndex.toString(36)}`;

  const statisticalMatch = String(value).match(/^stat-(\d+)$/);
  if (statisticalMatch) return `s${Number(statisticalMatch[1]).toString(36)}`;

  return `r${encodeURIComponent(String(value))}`;
}

function decodeSelectedArea(token) {
  if (!token) return null;

  const kind = token[0];
  const payload = token.slice(1);
  if (kind === "d") {
    const index = decodeBase36(payload);
    return index == null ? null : (DISTRICT_IDS[index] ?? null);
  }
  if (kind === "s") {
    const code = decodeBase36(payload);
    return code == null ? null : `stat-${code}`;
  }
  if (kind === "r") {
    try {
      return decodeURIComponent(payload);
    } catch {
      return null;
    }
  }

  return null;
}

function pushCompactSegment(segments, tag, value = "") {
  if (value == null) return;
  segments.push(`${tag}${value}`);
}

function readViewportSearchParams(rawHash) {
  const separatorIndex = rawHash.indexOf("&");
  if (separatorIndex < 0) return null;

  const viewportQuery = rawHash.slice(separatorIndex + 1);
  if (!viewportQuery) return null;

  const params = new URLSearchParams(viewportQuery);
  return params.has("lng") || params.has("lat") || params.has("zoom") ? params : null;
}

function buildCompactHash(searchParams) {
  const params = searchParams instanceof URLSearchParams
    ? searchParams
    : new URLSearchParams(searchParams?.toString?.() || "");
  const view = params.get("view");
  if (!view) return "";

  const segments = [];
  pushCompactSegment(segments, "v", encodeView(view));
  pushCompactSegment(segments, "g", encodeEnum(LANGUAGE_IDS, params.get("lang")));

  if (view === "v1") {
    pushCompactSegment(segments, "y", encodeYear(params.get("year")));
    pushCompactSegment(segments, "l", encodeEnum(VIEW_LAYER_IDS.v1, params.get("layer")));
    if (params.get("compare") === "1") pushCompactSegment(segments, "c");
    pushCompactSegment(segments, "q", encodeYear(params.get("compareYear")));
    pushCompactSegment(segments, "s", encodeInteger(params.get("split")));
    if (params.get("overlay")?.includes("hotspot")) pushCompactSegment(segments, "h");
  }

  if (view === "v2") {
    pushCompactSegment(segments, "l", encodeEnum(VIEW_LAYER_IDS.v2, params.get("layer")));
    pushCompactSegment(segments, "t", encodeInteger(params.get("threshold")));
    pushCompactSegment(segments, "u", encodeInteger(params.get("structThreshold")));
  }

  if (view === "v3") {
    pushCompactSegment(segments, "l", encodeEnum(VIEW_LAYER_IDS.v3, params.get("layer")));
  }

  if (view === "v5") {
    pushCompactSegment(segments, "m", encodeEnum(VIEW5_METRIC_IDS, params.get("metric")));
    pushCompactSegment(segments, "a", encodeEnum(VIEW5_AGGREGATION_IDS, params.get("agg")));
    pushCompactSegment(segments, "d", encodeSelectedArea(params.get("district")));
    pushCompactSegment(segments, "r", encodeScaled(params.get("districtOpacity"), 100));
    pushCompactSegment(segments, "k", encodeEnum(INTERACTION_MODE_IDS, params.get("districtMode")));
  }

  if (params.get("palette") === "accessible") pushCompactSegment(segments, "p");
  if (params.get("values") === "1") pushCompactSegment(segments, "n");
  pushCompactSegment(segments, "b", encodeEnum(BASEMAP_IDS, params.get("basemap")));
  pushCompactSegment(segments, "i", encodeEnum(INTERACTION_MODE_IDS, params.get("mode")));
  pushCompactSegment(segments, "o", encodeScaled(params.get("opacity"), 100));

  return segments.length ? `${COMPACT_HASH_VERSION}.${segments.join(".")}` : "";
}

function readCompactHashParams(rawHash) {
  const segments = rawHash.split(".");
  if (segments[0] !== COMPACT_HASH_VERSION) return null;

  const segmentMap = new Map();
  for (const segment of segments.slice(1)) {
    if (!segment) continue;
    segmentMap.set(segment[0], segment.slice(1));
  }

  const params = new URLSearchParams();
  const view = decodeView(segmentMap.get("v"));
  if (view) params.set("view", view);

  const language = decodeEnum(LANGUAGE_IDS, segmentMap.get("g"));
  if (language) params.set("lang", language);

  if (view === "v1") {
    const year = decodeYear(segmentMap.get("y"));
    if (year) params.set("year", year);

    const layer = decodeEnum(VIEW_LAYER_IDS.v1, segmentMap.get("l"));
    if (layer) params.set("layer", layer);

    if (segmentMap.has("c")) params.set("compare", "1");

    const compareYear = decodeYear(segmentMap.get("q"));
    if (compareYear) params.set("compareYear", compareYear);

    const split = decodeInteger(segmentMap.get("s"));
    if (split) params.set("split", split);

    if (segmentMap.has("h")) params.set("overlay", "hotspot");
  }

  if (view === "v2") {
    const layer = decodeEnum(VIEW_LAYER_IDS.v2, segmentMap.get("l"));
    if (layer) params.set("layer", layer);

    const threshold = decodeInteger(segmentMap.get("t"));
    if (threshold) params.set("threshold", threshold);

    const structThreshold = decodeInteger(segmentMap.get("u"));
    if (structThreshold) params.set("structThreshold", structThreshold);
  }

  if (view === "v3") {
    const layer = decodeEnum(VIEW_LAYER_IDS.v3, segmentMap.get("l"));
    if (layer) params.set("layer", layer);
  }

  if (view === "v5") {
    const metric = decodeEnum(VIEW5_METRIC_IDS, segmentMap.get("m"));
    if (metric) params.set("metric", metric);

    const aggregation = decodeEnum(VIEW5_AGGREGATION_IDS, segmentMap.get("a"));
    if (aggregation) params.set("agg", aggregation);

    const selectedArea = decodeSelectedArea(segmentMap.get("d"));
    if (selectedArea) params.set("district", selectedArea);

    const districtOpacity = decodeScaled(segmentMap.get("r"), 100, 2);
    if (districtOpacity) params.set("districtOpacity", districtOpacity);

    const districtMode = decodeEnum(INTERACTION_MODE_IDS, segmentMap.get("k"));
    if (districtMode) params.set("districtMode", districtMode);
  }

  if (segmentMap.has("p")) params.set("palette", "accessible");
  if (segmentMap.has("n")) params.set("values", "1");

  const basemap = decodeEnum(BASEMAP_IDS, segmentMap.get("b"));
  if (basemap) params.set("basemap", basemap);

  const interactionMode = decodeEnum(INTERACTION_MODE_IDS, segmentMap.get("i"));
  if (interactionMode) params.set("mode", interactionMode);

  const opacity = decodeScaled(segmentMap.get("o"), 100, 2);
  if (opacity) params.set("opacity", opacity);

  const lng = decodeViewportCoordinate(segmentMap.get("x"), "lng");
  if (lng) params.set("lng", lng);

  const lat = decodeViewportCoordinate(segmentMap.get("w"), "lat");
  if (lat) params.set("lat", lat);

  const zoom = decodeViewportCoordinate(segmentMap.get("z"), "zoom");
  if (zoom) params.set("zoom", zoom);

  return params;
}

function normalizeBasePath(pathname) {
  if (!pathname) return "/";
  if (pathname.endsWith("/")) return pathname;
  const lastSlash = pathname.lastIndexOf("/");
  return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : "/";
}

function getRuntimeBasePath() {
  if (typeof window === "undefined") return "/";
  if (import.meta.env?.DEV) return normalizeBasePath(import.meta.env?.BASE_URL || "/");
  const pathname = window.location.pathname || "/";
  const legacyViewMatch = pathname.match(/^(.*?\/)view\/v[1-5]\/?$/);
  if (legacyViewMatch) return legacyViewMatch[1] || "/";
  return normalizeBasePath(pathname);
}

export function getAppBasePath() {
  return getRuntimeBasePath();
}

function readHashSearchParams(hashValue) {
  const rawHash = String(hashValue || "").replace(/^#/, "").replace(/^\?/, "");
  if (!rawHash) return null;

  const separatorIndex = rawHash.indexOf("&");
  const compactHash = separatorIndex >= 0 ? rawHash.slice(0, separatorIndex) : rawHash;
  const viewportParams = readViewportSearchParams(rawHash);

  if (compactHash.startsWith(`${COMPACT_HASH_VERSION}.`)) {
    const params = readCompactHashParams(compactHash);
    if (!params) return viewportParams;
    viewportParams?.forEach((value, key) => {
      params.set(key, value);
    });
    return params;
  }

  const legacySeparatorIndex = compactHash.indexOf(":");
  if (legacySeparatorIndex > 0) {
    const version = compactHash.slice(0, legacySeparatorIndex);
    const payload = compactHash.slice(legacySeparatorIndex + 1);
    if (version === LEGACY_HASH_VERSION && payload) {
      try {
        const decoded = decompressFromEncodedURIComponent(payload);
        if (decoded) {
          const params = new URLSearchParams(decoded);
          viewportParams?.forEach((value, key) => {
            params.set(key, value);
          });
          return params;
        }
      } catch {
        return viewportParams;
      }
      return viewportParams;
    }
  }

  if (!rawHash.includes("=")) return null;
  return new URLSearchParams(rawHash);
}

export function readAppUrlParams() {
  if (typeof window === "undefined") return new URLSearchParams();

  const params = new URLSearchParams(window.location.search);
  const hashParams = readHashSearchParams(window.location.hash);
  if (!hashParams) return params;

  hashParams.forEach((value, key) => {
    params.set(key, value);
  });

  return params;
}

export function appUrl(path) {
  const relativePath = String(path || "").replace(/^\/+/, "");
  return `${getAppBasePath()}${relativePath}`;
}

export function buildAppHref(searchParams) {
  const query = searchParams?.toString?.() || "";
  const basePath = getAppBasePath();
  if (!query) return basePath;

  const params = searchParams instanceof URLSearchParams
    ? searchParams
    : new URLSearchParams(query);
  const encoded = buildCompactHash(searchParams);
  if (!encoded) return basePath;

  const viewport = new URLSearchParams();
  const lng = params.get("lng");
  const lat = params.get("lat");
  const zoom = params.get("zoom");
  if (lng != null) viewport.set("lng", lng);
  if (lat != null) viewport.set("lat", lat);
  if (zoom != null) viewport.set("zoom", zoom);

  const viewportSuffix = viewport.toString();
  return viewportSuffix ? `${basePath}#${encoded}&${viewportSuffix}` : `${basePath}#${encoded}`;
}
