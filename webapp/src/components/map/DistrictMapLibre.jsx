import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { appUrl } from "../../lib/appPaths.js";
import { BOLOGNA_CITY_BOUNDS, BOLOGNA_MAX_PAN_BOUNDS } from "../../lib/mapBounds.js";
import { getOrthophotoConfig } from "../../lib/orthophoto.js";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

// OpenFreeMap-hosted vector basemap (OSM-derived). Swap the slug to switch look.
const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
// Anything we add ourselves keeps these IDs/prefixes so the basemap toggle can
// hide every OpenFreeMap layer (the rest) when the user picks the orthophoto.
const APP_LAYER_IDS = new Set(["ortho"]);
const APP_LAYER_PREFIXES = ["talea-", "districts", "bologna-", "quartieri-"];

function isAppLayer(id) {
  if (APP_LAYER_IDS.has(id)) return true;
  return APP_LAYER_PREFIXES.some((prefix) => id.startsWith(prefix));
}

function setBasemapLayersVisibility(map, visible) {
  const style = map.getStyle();
  if (!style?.layers) return;
  const value = visible ? "visible" : "none";
  for (const layer of style.layers) {
    if (isAppLayer(layer.id)) continue;
    map.setLayoutProperty(layer.id, "visibility", value);
  }
}

function ensureOrthoLayer(map, orthophoto) {
  if (map.__taleaOrthoYear !== orthophoto.year) {
    if (map.getLayer("ortho")) map.removeLayer("ortho");
    if (map.getSource("ortho")) map.removeSource("ortho");
  }

  if (!map.getSource("ortho")) {
    map.addSource("ortho", {
      type: "raster",
      tiles: orthophoto.tiles,
      tileSize: 256,
      minzoom: 10,
      maxzoom: 20,
      attribution: orthophoto.attribution,
    });
    map.__taleaOrthoYear = orthophoto.year;
  }
  if (!map.getLayer("ortho")) {
    // Keep ortho underneath the district fills/lines so the data still reads.
    const beforeId = map.getLayer("districts-fill") ? "districts-fill" : undefined;
    map.addLayer(
      {
        id: "ortho",
        type: "raster",
        source: "ortho",
        layout: { visibility: "none" },
      },
      beforeId,
    );
  }
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

// Build a FeatureCollection of LineStrings tracing only the boundaries between adjacent
// statistical areas that belong to *different* quartieri (plus the city outline). We do
// this by counting how many polygons share each undirected edge, grouped by quartiere.
// An edge is part of the quartiere boundary when:
//   - it appears in only one polygon (so it sits on the city border), or
//   - it appears in two polygons whose `quartiere` properties differ.
// Coordinates are rounded so adjacent polygons that share an edge produce identical keys
// despite tiny floating-point drift. Empirically Bologna's geojson has ~6 decimals of
// precision, so rounding to 7 keeps the edge-matching exact.
function computeQuartiereBoundary(geojson) {
  const round = (n) => Math.round(n * 1e7) / 1e7;
  const edgeMap = new Map();
  const pushEdge = (a, b, q) => {
    const ax = round(a[0]);
    const ay = round(a[1]);
    const bx = round(b[0]);
    const by = round(b[1]);
    const forward = ax < bx || (ax === bx && ay <= by);
    const key = forward ? `${ax},${ay}|${bx},${by}` : `${bx},${by}|${ax},${ay}`;
    let entry = edgeMap.get(key);
    if (!entry) {
      entry = { coords: [[ax, ay], [bx, by]], quartieri: [] };
      edgeMap.set(key, entry);
    }
    entry.quartieri.push(q);
  };
  for (const feature of geojson.features) {
    const q = feature.properties?.quartiere;
    const geom = feature.geometry;
    if (!geom) continue;
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
    for (const poly of polys) {
      for (const ring of poly) {
        for (let i = 0; i < ring.length - 1; i++) {
          pushEdge(ring[i], ring[i + 1], q);
        }
      }
    }
  }
  const features = [];
  for (const { coords, quartieri } of edgeMap.values()) {
    if (quartieri.length === 1 || (quartieri.length === 2 && quartieri[0] !== quartieri[1])) {
      features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
    }
  }
  return { type: "FeatureCollection", features };
}

function heatColor(value, min, max, colorblindMode) {
  const t = (value - min) / Math.max(0.0001, max - min);
  if (colorblindMode) {
    if (t > 0.8) return "#00204d";
    if (t > 0.6) return "#0868ac";
    if (t > 0.4) return "#43a2ca";
    if (t > 0.2) return "#7bccc4";
    return "#f7fcf0";
  }
  if (t > 0.8) return "#b10026";
  if (t > 0.6) return "#e31a1c";
  if (t > 0.4) return "#fd8d3c";
  if (t > 0.2) return "#feb24c";
  return "#fff5c0";
}

export const DistrictMapLibre = forwardRef(function DistrictMapLibre({
  aggregation = "district",
  metricKey,
  selectedId,
  entities,
  interactionMode = "navigate",
  onSelect,
}, ref) {
  const { language } = useI18n();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const interactionModeRef = useRef(interactionMode);
  const [geojson, setGeojson] = useState(null);
  // Single one-way flag flipped on the map's `load` event. Subsequent effects gate on it
  // instead of calling `map.once("load", apply)` themselves — `once("load")` only fires if
  // load hasn't happened yet, so any effect re-running after initial load (e.g. when the
  // user toggles aggregation) would otherwise register a listener that never fires.
  const [mapReady, setMapReady] = useState(false);
  const basemap = useAppStore((state) => state.basemap);
  const colorblindMode = useAppStore((state) => state.colorblindMode);
  const districtOpacity = useAppStore((state) => state.districtOpacity);
  const loadingLabel = language === "en" ? "Loading areas..." : "Caricamento aree...";
  const orthophoto = useMemo(() => getOrthophotoConfig(2025), []);

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  // Expose a flyTo(featureId) API so View 5 can animate the map to a district or
  // statistical area when the user picks one from the finder or the table. We look
  // the geometry up in the enriched source data and use the centroid of the feature's
  // bounding box so islands with odd shapes still end up reasonably framed.
  useImperativeHandle(ref, () => ({
    flyTo(featureId) {
      const map = mapRef.current;
      if (!map || !geojson) return;
      const matchField = aggregation === "statistical" ? "area_statistica" : "quartiere";
      const byName = new Map((entities || []).map((entity) => [normalizeName(entity.name), entity]));
      const feature = geojson.features.find((item) => {
        const match = byName.get(normalizeName(item.properties?.[matchField]));
        return match?.id === featureId;
      });
      if (!feature?.geometry) return;
      const coords = [];
      const walk = (node) => {
        if (!node) return;
        if (typeof node[0] === "number" && typeof node[1] === "number") {
          coords.push(node);
          return;
        }
        for (const child of node) walk(child);
      };
      walk(feature.geometry.coordinates);
      if (!coords.length) return;
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;
      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: 80,
        duration: 900,
        maxZoom: aggregation === "statistical" ? 13.8 : 12,
      });
    },
  }), [aggregation, entities, geojson]);

  // Inject the metric value, the colour mapped from it and a `selected` flag
  // into each feature's properties so the MapLibre style can use ["get", ...] expressions.
  const enriched = useMemo(() => {
    if (!geojson) return null;
    const matchField = aggregation === "statistical" ? "area_statistica" : "quartiere";
    const byName = new Map((entities || []).map((entity) => [normalizeName(entity.name), entity]));
    const values = (entities || []).map((entity) => entity[metricKey]).filter(Number.isFinite);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    return {
      ...geojson,
      features: geojson.features.map((feature) => {
        const match = byName.get(normalizeName(feature.properties[matchField]));
        const metricValue = Number.isFinite(match?.[metricKey]) ? match[metricKey] : null;
        return {
          ...feature,
          properties: {
            ...feature.properties,
            districtId: match?.id || null,
            metricValue: metricValue ?? 0,
            metricColor: metricValue == null ? "#d9e0d4" : heatColor(metricValue, min, max, colorblindMode),
            selected: match?.id === selectedId,
          },
        };
      }),
    };
  }, [aggregation, geojson, entities, metricKey, selectedId, colorblindMode]);

  useEffect(() => {
    fetch(appUrl("data/webapp_vectors/districts_enriched_2025.geojson"))
      .then((response) => response.json())
      .then(setGeojson)
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE_URL,
      bounds: BOLOGNA_CITY_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      minZoom: 9,
      maxZoom: 17,
      maxBounds: BOLOGNA_MAX_PAN_BOUNDS,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    mapRef.current = map;
    map.on("load", () => {
      // MapLibre v5 renders the compact attribution expanded by default; collapse
      // it on init so the user only sees the "i" button until they tap it.
      const attribEl = map.getContainer().querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
      if (attribEl) attribEl.classList.remove("maplibregl-compact-show");
      setMapReady(true);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    ensureOrthoLayer(map, orthophoto);
    const showOrtho = basemap === "ortho";
    setBasemapLayersVisibility(map, !showOrtho);
    map.setLayoutProperty("ortho", "visibility", showOrtho ? "visible" : "none");
  }, [basemap, mapReady, orthophoto]);

  // Compute the 6 quartiere outlines once from the source geojson. We render them as a
  // separate layer so we can keep statistical-area borders thin while still emphasising the
  // quartiere boundary when that aggregation is selected.
  const quartiereBoundary = useMemo(() => (geojson ? computeQuartiereBoundary(geojson) : null), [geojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !enriched) return;
    if (!map.getSource("districts")) {
      map.addSource("districts", { type: "geojson", data: enriched });
      map.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts",
        paint: {
          "fill-color": ["get", "metricColor"],
          "fill-opacity": ["case", ["get", "selected"], Math.min(0.92, districtOpacity + 0.18), districtOpacity],
        },
      });
      map.addLayer({
        id: "districts-line",
        type: "line",
        source: "districts",
        paint: {
          "line-color": ["case", ["get", "selected"], "#ffe604", "#235f4d"],
          "line-opacity": ["case", ["get", "selected"], 1, 0.82],
          "line-width": ["case", ["get", "selected"], 3, 1.25],
        },
      });
      map.on("click", "districts-fill", (event) => {
        if (interactionModeRef.current !== "inspect") return;
        const feature = event.features?.[0];
        const districtId = feature?.properties?.districtId;
        if (districtId) onSelect(districtId);
      });
      map.on("mouseenter", "districts-fill", () => {
        if (interactionModeRef.current === "inspect") map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "districts-fill", () => {
        map.getCanvas().style.cursor = interactionModeRef.current === "inspect" ? "crosshair" : "";
      });
    } else {
      map.getSource("districts").setData(enriched);
      map.setPaintProperty("districts-fill", "fill-opacity", ["case", ["get", "selected"], Math.min(0.92, districtOpacity + 0.18), districtOpacity]);
    }
  }, [districtOpacity, enriched, mapReady, onSelect]);

  // Quartiere boundary overlay — added on top of the per-feature borders only when the user
  // is reading at the district aggregation. We add/remove the layer instead of just toggling
  // its visibility so aree-statistiche mode renders identically to before this overlay
  // existed: no extra layer, no chance of overlap on shared edges.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !quartiereBoundary) return;
    const want = aggregation === "district";
    const hasLayer = !!map.getLayer("quartieri-boundary-line");
    if (want) {
      if (!map.getSource("quartieri-boundary")) {
        map.addSource("quartieri-boundary", { type: "geojson", data: quartiereBoundary });
      } else {
        map.getSource("quartieri-boundary").setData(quartiereBoundary);
      }
      if (!hasLayer) {
        map.addLayer({
          id: "quartieri-boundary-line",
          type: "line",
          source: "quartieri-boundary",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#0c2f24",
            "line-opacity": 0.95,
            "line-width": 2.6,
          },
        });
      }
    } else if (hasLayer) {
      map.removeLayer("quartieri-boundary-line");
    }
  }, [aggregation, mapReady, quartiereBoundary]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const navigationEnabled = interactionMode === "navigate";
    const handlers = [map.dragPan, map.scrollZoom, map.boxZoom, map.dragRotate, map.keyboard, map.doubleClickZoom, map.touchZoomRotate];
    handlers.forEach((handler) => {
      if (!handler) return;
      if (navigationEnabled) handler.enable();
      else handler.disable();
    });
    map.getCanvas().style.cursor = navigationEnabled ? "" : "crosshair";
  }, [interactionMode]);

  return (
    <div className="district-map-real">
      <div ref={containerRef} className="maplibre-map" />
      {!geojson && <div className="map-status">{loadingLabel}</div>}
    </div>
  );
});
