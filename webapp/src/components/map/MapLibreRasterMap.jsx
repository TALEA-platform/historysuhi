import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderRasterImage } from "../../lib/rasterRenderer.js";
import { appUrl } from "../../lib/appPaths.js";
import { BOLOGNA_MAX_PAN_BOUNDS } from "../../lib/mapBounds.js";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

const BOLOGNA_CENTER = [11.34, 44.49];
const BOLOGNA_BOUNDARY_URL = appUrl("data/webapp_vectors/bologna_boundary_outline.geojson");
const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };

function baseStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
      ortho: {
        type: "raster",
        tiles: ["https://sitmappe.comune.bologna.it/tms/tileserver/Ortofoto2024/{z}/{x}/{y}.png"],
        tileSize: 256,
        minzoom: 10,
        maxzoom: 20,
        attribution: "SIT Comune di Bologna · Ortofoto 2024",
      },
    },
    layers: [
      { id: "osm", type: "raster", source: "osm", layout: { visibility: "visible" } },
      { id: "ortho", type: "raster", source: "ortho", layout: { visibility: "none" } },
    ],
  };
}

function addOrUpdateImage(map, id, rendered, opacity) {
  if (!map.getSource(id)) {
    map.addSource(id, {
      type: "image",
      url: rendered.url,
      coordinates: rendered.coordinates,
    });
    map.addLayer({
      id,
      type: "raster",
      source: id,
      paint: {
        "raster-opacity": opacity,
        "raster-fade-duration": 0,
      },
    });
    return;
  }

  map.getSource(id).updateImage({
    url: rendered.url,
    coordinates: rendered.coordinates,
  });
  if (map.getLayer(id)) {
    map.setPaintProperty(id, "raster-opacity", opacity);
  }
}

function removeLayerAndSource(map, id) {
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);
}

function ensureBoundaryLayer(map) {
  if (!map.getSource("bologna-boundary")) {
    map.addSource("bologna-boundary", {
      type: "geojson",
      data: BOLOGNA_BOUNDARY_URL,
    });
  }
  if (!map.getLayer("bologna-boundary-casing")) {
    map.addLayer({
      id: "bologna-boundary-casing",
      type: "line",
      source: "bologna-boundary",
      paint: {
        "line-color": "#fff8d7",
        "line-opacity": 0.92,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 3, 13, 4.6, 16, 6],
      },
    });
  } else {
    map.moveLayer("bologna-boundary-casing");
  }
  if (!map.getLayer("bologna-boundary-line")) {
    map.addLayer({
      id: "bologna-boundary-line",
      type: "line",
      source: "bologna-boundary",
      paint: {
        "line-color": "#235f4d",
        "line-opacity": 0.96,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.3, 13, 2.1, 16, 3],
      },
    });
  } else {
    map.moveLayer("bologna-boundary-casing");
    map.moveLayer("bologna-boundary-line");
  }
}

function ensureSelectedCellLayer(map) {
  if (!map.getSource("talea-selected-cell")) {
    map.addSource("talea-selected-cell", {
      type: "geojson",
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer("talea-selected-cell-fill")) {
    map.addLayer({
      id: "talea-selected-cell-fill",
      type: "fill",
      source: "talea-selected-cell",
      filter: ["==", ["get", "kind"], "fill"],
      paint: {
        "fill-color": "#f2cf63",
        "fill-opacity": 0.18,
      },
    });
  }

  if (!map.getLayer("talea-selected-cell-casing")) {
    map.addLayer({
      id: "talea-selected-cell-casing",
      type: "line",
      source: "talea-selected-cell",
      filter: ["==", ["get", "kind"], "outline"],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#fff8d7",
        "line-opacity": 0.95,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 4.2, 13, 5.6, 16, 7.2],
      },
    });
  }

  if (!map.getLayer("talea-selected-cell-line")) {
    map.addLayer({
      id: "talea-selected-cell-line",
      type: "line",
      source: "talea-selected-cell",
      filter: ["==", ["get", "kind"], "outline"],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#235f4d",
        "line-opacity": 0.98,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2.2, 13, 3, 16, 4],
      },
    });
  }

  map.moveLayer("talea-selected-cell-fill");
  map.moveLayer("talea-selected-cell-casing");
  map.moveLayer("talea-selected-cell-line");
}

function setSelectedCellFeature(map, featureCollection) {
  const source = map.getSource("talea-selected-cell");
  if (!source) return;
  source.setData(featureCollection || EMPTY_FEATURE_COLLECTION);
}

export function MapLibreRasterMap({
  layer,
  year,
  overlays = [],
  threshold,
  interactionMode = "navigate",
  onHover,
  onInspect,
  onViewChange,
  viewState,
  interactive = true,
  selectedTarget,
  focusTarget,
  focusZoom,
  focusOffset,
}) {
  const { language } = useI18n();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const activeRasterRef = useRef(null);
  const overlayIdsRef = useRef([]);
  const didFitRef = useRef(false);
  const lastFocusKeyRef = useRef(null);
  // We mirror callback props into refs so the map's "mousemove"/"click" handlers
  // (registered once on mount) always read the *current* values without resubscribing.
  const interactionModeRef = useRef(interactionMode);
  const onHoverRef = useRef(onHover);
  const onInspectRef = useRef(onInspect);
  const onViewChangeRef = useRef(onViewChange);
  const basemap = useAppStore((state) => state.basemap);
  const colorblindMode = useAppStore((state) => state.colorblindMode);
  const rasterOpacity = useAppStore((state) => state.rasterOpacity);
  const rasterOpacityRef = useRef(rasterOpacity);
  const [status, setStatus] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const colorMode = colorblindMode ? "accessible" : "default";
  const copy = language === "en"
    ? {
      loading: "Loading map...",
      error: "Unable to load map data",
      retry: "Retry",
    }
    : {
      loading: "Caricamento mappa...",
      error: "Impossibile caricare i dati della mappa",
      retry: "Riprova",
    };

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  useEffect(() => {
    onInspectRef.current = onInspect;
  }, [onInspect]);

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  useEffect(() => {
    rasterOpacityRef.current = rasterOpacity;
  }, [rasterOpacity]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle(),
      center: BOLOGNA_CENTER,
      zoom: 10,
      minZoom: 9,
      maxZoom: 18,
      maxBounds: BOLOGNA_MAX_PAN_BOUNDS,
      interactive,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    if (interactive) map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    mapRef.current = map;

    if (interactive) {
      map.on("move", () => {
        const center = map.getCenter();
        onViewChangeRef.current?.({
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
      });
    }

    map.on("mousemove", (event) => {
      if (!activeRasterRef.current || !onHoverRef.current || interactionModeRef.current !== "inspect") return;
      const value = activeRasterRef.current.sampleAt(event.lngLat.lng, event.lngLat.lat);
      onHoverRef.current(value == null ? null : { value, lngLat: event.lngLat });
    });
    map.on("click", (event) => {
      if (!activeRasterRef.current || !onInspectRef.current || interactionModeRef.current !== "inspect") return;
      const value = activeRasterRef.current.sampleAt(event.lngLat.lng, event.lngLat.lat);
      onInspectRef.current(value == null ? null : { value, lngLat: event.lngLat });
    });
    map.on("mouseleave", () => onHoverRef.current?.(null));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !interactive) return;
    const navigationEnabled = interactionMode === "navigate";
    const handlers = [map.dragPan, map.scrollZoom, map.boxZoom, map.dragRotate, map.keyboard, map.doubleClickZoom, map.touchZoomRotate];
    handlers.forEach((handler) => {
      if (!handler) return;
      if (navigationEnabled) handler.enable();
      else handler.disable();
    });
    map.getCanvas().style.cursor = navigationEnabled ? "" : "crosshair";
    if (!navigationEnabled) onHoverRef.current?.(null);
  }, [interactionMode, interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !viewState || interactive) return;
    map.jumpTo(viewState);
  }, [viewState, interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!interactive || !map || status !== "ready") return;

    if (!focusTarget?.key) {
      lastFocusKeyRef.current = null;
      return;
    }

    if (lastFocusKeyRef.current === focusTarget.key) return;
    lastFocusKeyRef.current = focusTarget.key;
    map.easeTo({
      center: [focusTarget.lng, focusTarget.lat],
      zoom: focusZoom == null ? map.getZoom() : Math.max(map.getZoom(), focusZoom),
      offset: focusOffset || [0, 0],
      duration: 450,
      essential: true,
    });
  }, [focusOffset, focusTarget, focusZoom, interactive, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!interactive || !map || status !== "ready") return;

    ensureSelectedCellLayer(map);
    if (!selectedTarget?.key || !activeRasterRef.current?.cellFeatureAt) {
      setSelectedCellFeature(map, null);
      return;
    }

    const feature = activeRasterRef.current.cellFeatureAt(selectedTarget.lng, selectedTarget.lat);
    setSelectedCellFeature(map, feature);
  }, [selectedTarget, interactive, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer("osm") || !map.getLayer("ortho")) return;
      map.setLayoutProperty("osm", "visibility", basemap === "osm" ? "visible" : "none");
      map.setLayoutProperty("ortho", "visibility", basemap === "ortho" ? "visible" : "none");
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [basemap]);

  useEffect(() => {
    let cancelled = false;
    const map = mapRef.current;
    if (!map || !layer) return;

    async function render() {
      setStatus("loading");
      try {
        await new Promise((resolve) => {
          if (map.isStyleLoaded()) resolve();
          else map.once("load", resolve);
        });
        if (cancelled) return;
        activeRasterRef.current = null;
        onHoverRef.current?.(null);
        onInspectRef.current?.(null);
        if (map.getSource("talea-selected-cell")) setSelectedCellFeature(map, null);

        const rendered = await renderRasterImage({
          url: layer.dataUrlForYear ? layer.dataUrlForYear(year) : layer.dataUrl,
          raster: layer.raster,
          threshold,
          colorMode,
        });
        if (cancelled) return;
        activeRasterRef.current = rendered;
        addOrUpdateImage(map, "talea-main-raster", rendered, rasterOpacityRef.current);

        const activeOverlayIds = [];
        for (const overlay of overlays) {
          const overlayRendered = await renderRasterImage({
            url: overlay.dataUrlForYear ? overlay.dataUrlForYear(year) : overlay.dataUrl,
            raster: overlay.raster,
            threshold: overlay.threshold,
            colorMode,
          });
          if (cancelled) return;
          const id = `talea-overlay-${overlay.id}`;
          activeOverlayIds.push(id);
          addOrUpdateImage(map, id, overlayRendered, overlay.opacity ?? 0.72);
        }

        for (const oldId of overlayIdsRef.current) {
          if (!activeOverlayIds.includes(oldId)) removeLayerAndSource(map, oldId);
        }
        overlayIdsRef.current = activeOverlayIds;
        ensureBoundaryLayer(map);
        ensureSelectedCellLayer(map);

        if (!didFitRef.current) {
          const coords = rendered.coordinates;
          map.fitBounds([coords[3], coords[1]], { padding: 26, duration: 0 });
          didFitRef.current = true;
        }
        setStatus("ready");
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus("error");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [layer, year, overlays, threshold, colorMode, reloadToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer("talea-main-raster")) {
      map.setPaintProperty("talea-main-raster", "raster-opacity", rasterOpacity);
    }
  }, [rasterOpacity]);

  return (
    <div className="maplibre-wrap">
      <div ref={containerRef} className="maplibre-map" />
      {status === "loading" && <div className="map-status">{copy.loading}</div>}
      {status === "error" && (
        <div className="map-status error">
          <span>{copy.error}</span>
          <button type="button" onClick={() => setReloadToken((value) => value + 1)}>
            {copy.retry}
          </button>
        </div>
      )}
    </div>
  );
}
