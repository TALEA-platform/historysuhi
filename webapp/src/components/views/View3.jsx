import { SlidersHorizontal } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { ViewIntro } from "../layout/ViewIntro.jsx";
import { ContextBanner } from "../layout/ContextBanner.jsx";
import { PanelCard } from "../ui/PanelCard.jsx";
import { PanelGroup } from "../ui/PanelGroup.jsx";
import { LayerOption } from "../ui/LayerOption.jsx";
import { MapCard } from "../map/MapCard.jsx";
import { InfoPanel } from "../map/InfoPanel.jsx";

// View 3 — physical drivers (UHEI / HVI / HRI / NDVI / albedo). All layers share the same
// 2025 baseline, so there is no year picker.

export function View3() {
  const { data, language } = useI18n();
  const view3Layer = useAppStore((state) => state.view3Layer);
  const setState = useAppStore((state) => state.setState);
  const layer = data.view3Layers[view3Layer] || data.view3Layers.uhei;
  const copy = language === "en"
    ? {
      metricLabel: "Data",
      metricDetail: "heat exposure, vegetation and surfaces",
      bannerLabel: "Reading",
      bannerValue: "physical drivers",
      bannerText:
        "All layers in this view are calculated from **2025** summer data: the **overall heat exposure index**, vegetation presence, the surface reflectance and indices relating those factors to heat.",
      panelTitle: "Drivers and indices",
      syntheticGroup: "Synthetic indices",
      physicalGroup: "Physical drivers",
      uheiBody: "Surface temperature, little vegetation and dark surfaces, read together",
      hviBody: "Where surface temperature outweighs vegetation",
      hriBody: "Where dark materials and high surface temperature reinforce each other",
      ndviBody: "Where vegetation is more present",
      albedoBody: "Surface reflectance",
    }
    : {
      metricLabel: "Dati",
      metricDetail: "esposizione al caldo, verde e superfici",
      bannerLabel: "Lettura",
      bannerValue: "fattori fisici",
      bannerText:
        "Tutti i layer di questa sezione sono calcolati sui dati estivi **2025**: l'**indice di esposizione complessiva al caldo**, la presenza di verde, la riflettanza delle superfici e indici di relazione con il caldo.",
      panelTitle: "Fattori e indici",
      syntheticGroup: "Indici sintetici",
      physicalGroup: "Fattori fisici",
      uheiBody: "Temperatura di superficie, poco verde e superfici scure, letti insieme",
      hviBody: "Dove la temperatura di superficie prevale sulla vegetazione",
      hriBody: "Dove materiali scuri e alta temperatura di superficie si sommano",
      ndviBody: "Dove la vegetazione è più presente",
      albedoBody: "Riflettanza delle superfici",
    };

  return (
    <>
      <ViewIntro id="v3" metric={{ label: copy.metricLabel, value: "2025", detail: copy.metricDetail }} />
      <ContextBanner
        label={copy.bannerLabel}
        value={copy.bannerValue}
        text={copy.bannerText}
      />
      <div className="main-grid">
        <div className="map-stack">
          <MapCard
            layer={layer}
            infoTargetId="view3-info"
            focusPinnedInfo
            focusZoom={11.8}
            focusOffset={[-140, 0]}
          />
          <InfoPanel id="view3-info" layer={layer} />
        </div>
        <aside className="side-panel">
          <PanelCard title={copy.panelTitle} icon={<SlidersHorizontal size={16} />}>
            <PanelGroup label={copy.syntheticGroup}>
              <LayerOption selected={view3Layer === "uhei"} title={data.view3Layers.uhei.title} body={copy.uheiBody} onClick={() => setState({ view3Layer: "uhei" })} />
              <LayerOption selected={view3Layer === "hvi"} title={data.view3Layers.hvi.title} body={copy.hviBody} onClick={() => setState({ view3Layer: "hvi" })} />
              <LayerOption selected={view3Layer === "hri"} title={data.view3Layers.hri.title} body={copy.hriBody} onClick={() => setState({ view3Layer: "hri" })} />
            </PanelGroup>
            <PanelGroup label={copy.physicalGroup}>
              <LayerOption selected={view3Layer === "ndvi"} title={data.view3Layers.ndvi.title} body={copy.ndviBody} onClick={() => setState({ view3Layer: "ndvi" })} />
              <LayerOption selected={view3Layer === "albedo"} title={data.view3Layers.albedo.title} body={copy.albedoBody} onClick={() => setState({ view3Layer: "albedo" })} />
            </PanelGroup>
          </PanelCard>
        </aside>
      </div>
    </>
  );
}
