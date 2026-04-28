import { Info } from "lucide-react";
import { useI18n } from "../../i18n/useI18n.js";
import { PanelCard } from "../ui/PanelCard.jsx";
import {
  formatDateRange,
  formatDecimal,
  formatIsoDate,
  formatLocalSummerTime,
  formatPercent,
} from "../../utils/format.js";

// Sidebar card showing the satellite acquisition summary for the year selected in View 1.
// The CSV may not be loaded yet; in that case `detail` is undefined and we render a
// lightweight placeholder.

export function YearDataCard({ year, detail }) {
  const { language } = useI18n();
  const copy = language === "en"
    ? {
      title: "Year data",
      loading: "The selected year's metadata is loading.",
      intro: `Summary of the summer satellite overpasses used to build the ${year} map.`,
      period: "Period",
      overpasses: "Overpasses",
      time: "Time",
      meanSurface: "Mean surface temperature",
      exceptionalAreas: "Exceptional areas",
      moreDetails: "Additional details",
      clearCoverage: "Usable coverage",
      clearCoverageText: (value) => `${value} city average readable`,
      clouds: "Clouds",
      cloudsText: (count) => `${count} overpasses with less than 50% of the city readable`,
      bestCoverage: "Best coverage",
      bestCoverageText: (value) => `${value} of the city readable`,
      medianSurface: "Median surface temperature",
      usedDates: "Dates used",
      coverageNote:
        "Usable coverage indicates how much of the city was readable in the satellite overpasses after excluding clouds and unusable measurements.",
      observations: (count, satelliteLabel, missingValue) => `${count ?? missingValue} observations ${satelliteLabel}`,
      missingValue: "n/a",
    }
    : {
      title: "Dati dell'anno",
      loading: "Le informazioni dell'anno selezionato sono in caricamento.",
      intro: `Sintesi dei passaggi satellitari estivi usati per costruire la mappa del ${year}.`,
      period: "Periodo",
      overpasses: "Passaggi",
      time: "Ora",
      meanSurface: "Media superficiale",
      exceptionalAreas: "Aree eccezionali",
      moreDetails: "Dettagli aggiuntivi",
      clearCoverage: "Copertura utile",
      clearCoverageText: (value) => `${value} in media della città leggibile`,
      clouds: "Nuvole",
      cloudsText: (count) => `${count} passaggi con meno del 50% della città leggibile`,
      bestCoverage: "Picco migliore",
      bestCoverageText: (value) => `${value} della città leggibile`,
      medianSurface: "Mediana superficiale",
      usedDates: "Date usate",
      coverageNote:
        "La copertura utile indica quanta parte della città era leggibile nei passaggi satellitari, dopo avere escluso nuvole e misure non utilizzabili.",
      observations: (count, satelliteLabel, missingValue) => `${count ?? missingValue} osservazioni ${satelliteLabel}`,
      missingValue: "n.d.",
    };
  if (!detail) {
    return (
      <PanelCard title={copy.title} icon={<Info size={16} />}>
        <div className="source-list">
          <p>{copy.loading}</p>
        </div>
      </PanelCard>
    );
  }

  const acquisition = detail.acquisition;
  const satelliteLabel = acquisition?.satellites?.length ? acquisition.satellites.join(", ") : "Landsat";
  const dateList = acquisition?.dates?.map((date) => formatIsoDate(date, language)).join(", ");
  const cloudyPassages = acquisition?.cloudyPassages || 0;

  return (
    <PanelCard title={copy.title} icon={<Info size={16} />}>
      <div className="source-list">
        <p>{copy.intro}</p>
        <dl className="primary-data-list">
          <div>
            <dt>{copy.period}</dt>
            <dd>{formatDateRange(acquisition, year, detail.period, language)}</dd>
          </div>
          <div>
            <dt>{copy.overpasses}</dt>
            <dd>{copy.observations(acquisition?.sceneCount, satelliteLabel, copy.missingValue)}</dd>
          </div>
          <div>
            <dt>{copy.time}</dt>
            <dd>{formatLocalSummerTime(acquisition?.utcTimes, language)}</dd>
          </div>
          <div>
            <dt>{copy.meanSurface}</dt>
            <dd>{formatDecimal(detail.lstMean, 1, language)} °C</dd>
          </div>
          <div>
            <dt>{copy.exceptionalAreas}</dt>
            <dd>{formatPercent(detail.hotspotFraction, 2, language)}</dd>
          </div>
        </dl>
        <details className="detail-disclosure">
          <summary>{copy.moreDetails}</summary>
          <dl>
            <div>
              <dt>{copy.clearCoverage}</dt>
              <dd>{copy.clearCoverageText(formatPercent(acquisition?.clearCoverageMean, 1, language))}</dd>
            </div>
            {cloudyPassages > 0 && (
              <div>
                <dt>{copy.clouds}</dt>
                <dd>{copy.cloudsText(cloudyPassages)}</dd>
              </div>
            )}
            <div>
              <dt>{copy.bestCoverage}</dt>
              <dd>{copy.bestCoverageText(formatPercent(acquisition?.clearCoverageMax, 1, language))}</dd>
            </div>
            <div>
              <dt>{copy.medianSurface}</dt>
              <dd>{formatDecimal(detail.lstMedian, 1, language)} °C</dd>
            </div>
          </dl>
          {dateList && (
            <div className="date-list-block">
              <strong>{copy.usedDates}</strong>
              <p>{dateList}</p>
            </div>
          )}
          <small>
            {copy.coverageNote}
          </small>
        </details>
      </div>
    </PanelCard>
  );
}
