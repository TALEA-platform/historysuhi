import { useEffect, useMemo, useRef, useState } from "react";
import { MousePointer2, X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { MapLibreRasterMap } from "../map/MapLibreRasterMap.jsx";

// Full-viewport modal that shows two synchronized MapLibre rasters for the same layer
// across two different years. Replaces the previous inline split-screen from MapCard:
// keeping compare off the main map lets View 1's controls stay simple while the
// draggable divider experience still lives here.

export function CompareModal() {
  const { data, language } = useI18n();
  const selectedYear = useAppStore((state) => state.selectedYear);
  const compareYear = useAppStore((state) => state.compareYear);
  const splitPosition = useAppStore((state) => state.splitPosition);
  const view1BaseLayer = useAppStore((state) => state.view1BaseLayer);
  const view1Overlays = useAppStore((state) => state.view1Overlays);
  const setState = useAppStore((state) => state.setState);
  const paneRef = useRef(null);
  const [viewState, setViewState] = useState(null);

  const layer = data.view1Layers[view1BaseLayer] || data.view1Layers.lst;
  const overlaySpecs = useMemo(() => {
    const specs = [];
    if (view1Overlays.hotspotTemporal) specs.push(data.rasterOverlays.temporalHotspot);
    return specs;
  }, [data.rasterOverlays.temporalHotspot, view1Overlays.hotspotTemporal]);

  const copy = language === "en"
    ? {
      close: "Close",
      kicker: "Compare years",
      title: `${compareYear} ↔ ${selectedYear}`,
      leftLabel: "Left year",
      rightLabel: "Right year",
      drag: "Drag to compare",
    }
    : {
      close: "Chiudi",
      kicker: "Confronta anni",
      title: `${compareYear} ↔ ${selectedYear}`,
      leftLabel: "Anno sinistro",
      rightLabel: "Anno destro",
      drag: "Trascina per confrontare",
    };

  function handlePointer(event) {
    if (!paneRef.current) return;
    const rect = paneRef.current.getBoundingClientRect();
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setState({ splitPosition: Math.max(8, Math.min(92, next)) });
  }

  function close() {
    setState({ compareEnabled: false });
  }

  // Dismiss with Escape, like the other modals.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="compare-title">
      <div className="modal modal-compare">
        <button className="close-button" type="button" onClick={close} aria-label={copy.close}>
          <X size={19} />
        </button>
        <span className="section-kicker">{copy.kicker}</span>
        <h2 id="compare-title">{copy.title}</h2>
        <div className="compare-year-selects">
          <label className="select-label">
            {copy.leftLabel}
            <select
              value={compareYear}
              onChange={(event) => setState({ compareYear: Number(event.target.value) })}
            >
              {data.years.map((year) => (
                <option key={year} value={year} disabled={year >= selectedYear}>{year}</option>
              ))}
            </select>
          </label>
          <label className="select-label">
            {copy.rightLabel}
            <select
              value={selectedYear}
              onChange={(event) => {
                const nextYear = Number(event.target.value);
                const patch = { selectedYear: nextYear };
                if (compareYear >= nextYear) {
                  patch.compareYear = Math.max(2013, nextYear - 1);
                }
                setState(patch);
              }}
            >
              {data.years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="compare-pane" ref={paneRef}>
          <MapLibreRasterMap
            layer={layer}
            year={compareYear}
            overlays={overlaySpecs}
            interactionMode="navigate"
            onViewChange={setViewState}
          />
          <div className="compare-map-pane" style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}>
            <MapLibreRasterMap
              layer={layer}
              year={selectedYear}
              overlays={overlaySpecs}
              viewState={viewState}
              interactive={false}
            />
          </div>
          <button
            type="button"
            className="split-handle"
            style={{ left: `${splitPosition}%` }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              handlePointer(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) handlePointer(event);
            }}
            title={copy.drag}
          >
            <span><MousePointer2 size={17} /></span>
          </button>
          <div className="split-labels" style={{ left: `${splitPosition}%` }}>
            <b>{compareYear}</b>
            <b>{selectedYear}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
