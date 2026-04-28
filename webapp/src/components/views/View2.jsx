import { Layers } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { ViewIntro } from "../layout/ViewIntro.jsx";
import { ContextBanner } from "../layout/ContextBanner.jsx";
import { PanelCard } from "../ui/PanelCard.jsx";
import { PanelGroup } from "../ui/PanelGroup.jsx";
import { LayerOption } from "../ui/LayerOption.jsx";
import { ThresholdSlider } from "../ui/ThresholdSlider.jsx";
import { MapCard } from "../map/MapCard.jsx";
import { InfoPanel } from "../map/InfoPanel.jsx";

// View 2 — historical comparisons. The threshold passed to MapCard depends on the active layer:
// the persistence-temporal slider, the persistence-structural slider, or none of the above.

export function View2() {
  const { data, language } = useI18n();
  const view2Layer = useAppStore((state) => state.view2Layer);
  const persistenceTemporalThreshold = useAppStore((state) => state.persistenceTemporalThreshold);
  const persistenceStructuralThreshold = useAppStore((state) => state.persistenceStructuralThreshold);
  const setState = useAppStore((state) => state.setState);

  const layer = data.view2Layers[view2Layer] || data.view2Layers.climatology;
  const threshold =
    view2Layer === "persistenceTemporal"
      ? persistenceTemporalThreshold
      : view2Layer === "persistenceStructural"
        ? persistenceStructuralThreshold
        : undefined;
  const copy = language === "en"
    ? {
      metricLabel: "Period",
      metricDetail: "13 summers observed",
      bannerLabel: "Reading",
      bannerValue: "historical pattern",
      bannerText:
        "This view starts from conditions that repeat over time: **historical mean**, recurring anomalies and chronic heat, before showing how 2025 fits into that pattern.",
      panelTitle: "Analysis path",
      historicalGroup: "Historical heat pattern (2013-2025)",
      historicalDescription:
        "Start here to read the **historical mean**, chronic heat and recurring anomalies before looking at 2025.",
      climatologyBody: "Historical summer mean 2013-2025: the normal reference",
      temporalBody: "How many summers a point was hotter than its own normal",
      thresholdLabel: "Minimum threshold",
      thresholdSuffix: "years",
      structuralBody: "How many summers a point ranks among the city's hottest surfaces",
      bivariateBody: "Long-term critical areas and repeated anomalies",
      recentGroup: "How 2025 fits into the historical pattern",
      recentDescription:
        "After the aggregated overview, use these layers to understand where 2025 was **anomalous compared with its own history**.",
      anomalyBody: "Where 2025 diverges from the history of the same location",
      chronicVsAnomalousBody: "Long-standing critical areas and critical areas that emerged in 2025",
    }
    : {
      metricLabel: "Periodo",
      metricDetail: "13 estati osservate",
      bannerLabel: "Lettura",
      bannerValue: "schema storico",
      bannerText:
        "Questa sezione parte dalle condizioni che si ripetono nel tempo: **media storica**, anomalie ricorrenti e caldo cronico, per poi mostrare come il 2025 si inserisce in quello schema.",
      panelTitle: "Percorso di analisi",
      historicalGroup: "Schema storico del caldo (2013-2025)",
      historicalDescription:
        "La lettura parte dalla **media storica**, dal caldo cronico e dalle anomalie ricorrenti, prima del confronto con il 2025.",
      climatologyBody: "Media storica estiva 2013-2025: il riferimento normale",
      temporalBody: "Quante estati il punto è stato più caldo del proprio normale",
      thresholdLabel: "Soglia minima",
      thresholdSuffix: "anni",
      structuralBody: "Quante estati il punto è tra le superfici più calde della città",
      bivariateBody: "Criticità di sempre e anomalie ripetute",
      recentGroup: "Come il 2025 si inserisce nello schema storico",
      recentDescription:
        "Dopo il quadro aggregato, questi layer aiutano a capire dove il 2025 è stato **anomalo rispetto alla propria storia**.",
      anomalyBody: "Dove il 2025 si discosta dalla storia dello stesso punto",
      chronicVsAnomalousBody: "Criticità storiche e criticità emerse nel 2025",
    };

  return (
    <>
      <ViewIntro id="v2" metric={{ label: copy.metricLabel, value: "2013-2025", detail: copy.metricDetail }} />
      <ContextBanner
        label={copy.bannerLabel}
        value={copy.bannerValue}
        text={copy.bannerText}
      />
      <div className="main-grid">
        <div className="map-stack">
          <MapCard
            layer={layer}
            infoTargetId="view2-info"
            showValuesToggle={!data.view2LayersWithoutValuesToggle.has(view2Layer)}
            threshold={threshold}
            focusPinnedInfo
          />
          <InfoPanel id="view2-info" layer={layer} />
        </div>
        <aside className="side-panel">
          <PanelCard title={copy.panelTitle} icon={<Layers size={16} />}>
            <PanelGroup
              label={copy.historicalGroup}
              description={copy.historicalDescription}
            >
              <LayerOption selected={view2Layer === "climatology"} title={data.view2Layers.climatology.title} body={copy.climatologyBody} onClick={() => setState({ view2Layer: "climatology" })} />
              <LayerOption selected={view2Layer === "persistenceTemporal"} title={data.view2Layers.persistenceTemporal.title} body={copy.temporalBody} onClick={() => setState({ view2Layer: "persistenceTemporal" })} />
              {view2Layer === "persistenceTemporal" && (
                <ThresholdSlider
                  label={copy.thresholdLabel}
                  value={persistenceTemporalThreshold}
                  min={1}
                  max={5}
                  suffix={copy.thresholdSuffix}
                  onChange={(value) => setState({ persistenceTemporalThreshold: value })}
                />
              )}
              <LayerOption selected={view2Layer === "persistenceStructural"} title={data.view2Layers.persistenceStructural.title} body={copy.structuralBody} onClick={() => setState({ view2Layer: "persistenceStructural" })} />
              {view2Layer === "persistenceStructural" && (
                <ThresholdSlider
                  label={copy.thresholdLabel}
                  value={persistenceStructuralThreshold}
                  min={1}
                  max={13}
                  suffix={copy.thresholdSuffix}
                  onChange={(value) => setState({ persistenceStructuralThreshold: value })}
                />
              )}
              <LayerOption selected={view2Layer === "structuralVsTemporal"} title={data.view2Layers.structuralVsTemporal.title} body={copy.bivariateBody} onClick={() => setState({ view2Layer: "structuralVsTemporal" })} />
            </PanelGroup>
            <PanelGroup
              label={copy.recentGroup}
              description={copy.recentDescription}
            >
              <LayerOption selected={view2Layer === "anomaly"} title={data.view2Layers.anomaly.title} body={copy.anomalyBody} onClick={() => setState({ view2Layer: "anomaly" })} />
              <LayerOption selected={view2Layer === "chronicVsAnomalous2025"} title={data.view2Layers.chronicVsAnomalous2025.title} body={copy.chronicVsAnomalousBody} onClick={() => setState({ view2Layer: "chronicVsAnomalous2025" })} />
            </PanelGroup>
          </PanelCard>
        </aside>
      </div>
    </>
  );
}
