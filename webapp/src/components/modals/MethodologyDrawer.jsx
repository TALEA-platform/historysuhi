import { X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { dataAvailability } from "../../data/layers.js";
import { useI18n } from "../../i18n/useI18n.js";
import { ORTHOPHOTO_AVAILABLE_YEARS_LABEL } from "../../lib/orthophoto.js";
import { RichText } from "../ui/RichText.jsx";

export function MethodologyDrawer() {
  const { language } = useI18n();
  const setState = useAppStore((state) => state.setState);
  const close = () => setState({ methodologyOpen: false });
  const copy = language === "en"
    ? {
      close: "Close",
      kicker: "Methodology",
      title: "Method, satellites and limits",
      lead:
        "This section summarises which satellite datasets are used, at which resolution, how observations are selected and which limits should be kept in mind when interpreting the maps.",
      summary: {
        period: "Period",
        periodDetail: "13 summers observed",
        mainResolution: "Main resolution",
        mainResolutionDetail: "Landsat 8/9 maps",
        dayNight: "Day-night resolution",
        dayNightDetail: "MODIS maps",
      },
      sections: {
        satellite: {
          title: "What is measured",
          paragraphs: [
            "LST maps measure **surface temperature**: how warm surfaces appear from above, such as roads, roofs, paved areas and vegetation. They do not directly measure the air temperature.",
            "This distinction matters: on a summer day a dark or asphalted surface can be much hotter than the air, while a green area can stay at a lower temperature even if it is in the same district.",
          ],
        },
        satellites: {
          title: "Satellites and resolutions used",
          paragraphs: [
            "The most detailed maps in the app use **Landsat 8 and Landsat 9**, at **30 m resolution**. At this scale the data can read urban blocks, wide streets, paved areas, roofs and larger green spaces, but not small individual objects.",
            "Landsat supports the summer LST maps, historical anomalies, persistence layers and the main physical indices shown at 30 m. Only summer overpasses with readable data are kept after excluding clouds or unusable pixels.",
            "The day-night reading uses **MODIS**, at **1 km resolution**. This scale is much coarser: it is not meant for single blocks, but for broader patterns across the city, outskirts, green areas and hills.",
          ],
        },
        observations: {
          title: "How observations are selected",
          paragraphs: [
            "For each year, summer observations from 1 June to 31 August are used, selecting satellite passes in which Bologna is readable. Portions covered by clouds or unusable data are excluded.",
            "The yearly metadata report the period, the number of usable observations, the approximate overpass time and the share of the city that remained readable after cloud filtering.",
          ],
        },
        limits: {
          title: "Limits to keep in mind",
          items: [
            "The maps do not replace health or street-level microclimate measurements.",
            "The satellite looks at the surface from above: shade, facades, porticoes and perceived comfort are not fully described.",
            "The 30 m resolution reads city blocks and urban portions, not small single objects. The day-night map is even more general, at 1 km resolution.",
            "District and statistical-area data are averages: they help comparisons, but they do not remove internal differences within each area.",
            `The orthophoto basemap follows the closest available Bologna orthophoto year. Available years in the app are ${ORTHOPHOTO_AVAILABLE_YEARS_LABEL}: summers 2013-2016 use 2017, 2019 uses 2020, and aggregated or 2025-only views use 2025. Buildings, roofs and vegetation can therefore reflect a nearby year rather than the exact summer being analysed.`,
          ],
        },
        availableData: {
          title: "Data available in the app",
          yearlyLst: `${dataAvailability.yearlyLst.length} annual summer surface temperature maps`,
          yearlyHotspots: `${dataAvailability.yearlyTemporalHotspots.length} annual exceptionally hot area maps`,
          boundaries: "Municipal boundaries, districts and statistical areas used to make comparisons easier to read",
          metadata: "Dates, times, satellite and observation quality for every summer from 2013 to 2025",
          period: "Main period: summer, from 1 June to 31 August",
        },
      },
    }
    : {
      close: "Chiudi",
      kicker: "Metodologia",
      title: "Metodo, satelliti e limiti",
      lead:
        "Questa sezione riassume quali dati satellitari sono usati, a quale risoluzione, come vengono selezionate le osservazioni e quali limiti bisogna considerare nell'interpretazione delle mappe.",
      summary: {
        period: "Periodo",
        periodDetail: "13 estati osservate",
        mainResolution: "Risoluzione principale",
        mainResolutionDetail: "mappe Landsat 8/9",
        dayNight: "Risoluzione giorno-notte",
        dayNightDetail: "mappe MODIS",
      },
      sections: {
        satellite: {
          title: "Che cosa viene misurato",
          paragraphs: [
            "Le mappe LST misurano la **temperatura di superficie**: quanto sono calde le superfici viste dall'alto, come strade, tetti, piazzali e vegetazione. Non misurano direttamente la temperatura dell'aria.",
            "Questa distinzione è importante: in una giornata estiva una superficie scura o asfaltata può essere molto più calda dell'aria, mentre una zona verde può restare a una temperatura più bassa anche se si trova nello stesso quartiere.",
          ],
        },
        satellites: {
          title: "Satelliti e risoluzioni usati",
          paragraphs: [
            "Le mappe più dettagliate della webapp usano **Landsat 8 e Landsat 9**, con **risoluzione di 30 m**. A questa scala si leggono isolati, strade larghe, piazzali, tetti e grandi aree verdi, ma non piccoli oggetti singoli.",
            "Con Landsat sono costruite le mappe LST estive, le anomalie rispetto alla storia, le persistenze e i principali indici fisici mostrati nella webapp. Per ogni anno vengono tenuti solo i passaggi estivi leggibili, dopo avere escluso nuvole e dati non utilizzabili.",
            "La lettura giorno-notte usa **MODIS**, con **risoluzione di 1 km**. È una scala molto più grossolana: non descrive il singolo isolato, ma aiuta a confrontare tendenze più ampie tra centro, periferie, aree verdi e colline.",
          ],
        },
        observations: {
          title: "Come vengono selezionate le osservazioni",
          paragraphs: [
            "Per ogni anno vengono usate osservazioni estive, dal 1 giugno al 31 agosto, scegliendo passaggi satellitari in cui Bologna è leggibile. Le parti coperte da nuvole o da dati non utilizzabili vengono escluse.",
            "Nei metadati annuali sono riportati il periodo, il numero di osservazioni utilizzabili, l'orario indicativo del passaggio satellitare e la quota di città rimasta leggibile dopo il filtraggio delle nuvole.",
          ],
        },
        limits: {
          title: "Limiti da ricordare",
          items: [
            "Le mappe non sostituiscono misure sanitarie o microclimatiche a livello strada.",
            "Il satellite vede la superficie dall'alto: ombra, facciate, portici e comfort percepito dalle persone non sono descritti completamente.",
            "La risoluzione a 30 m legge isolati e porzioni urbane, non singoli oggetti piccoli. La mappa giorno-notte è ancora più generale, a 1 km di risoluzione.",
            "I dati per quartiere e per area statistica sono medie: aiutano il confronto, ma non cancellano le differenze interne a ogni zona.",
            `L'ortofoto di sfondo segue l'anno di ortofoto disponibile più vicino tra quelli pubblicati dal Comune di Bologna. Nell'app sono disponibili ${ORTHOPHOTO_AVAILABLE_YEARS_LABEL}: per le estati 2013-2016 viene usata l'ortofoto 2017, per il 2019 viene usata quella 2020, mentre nelle viste aggregate o centrate sul 2025 viene usata la 2025. Per questo edifici, tetti e vegetazione possono riflettere un anno vicino, ma non sempre esattamente l'estate analizzata.`,
          ],
        },
        availableData: {
          title: "Dati disponibili nell'app",
          yearlyLst: `${dataAvailability.yearlyLst.length} mappe annuali della temperatura di superficie estiva`,
          yearlyHotspots: `${dataAvailability.yearlyTemporalHotspots.length} mappe annuali delle aree eccezionalmente calde`,
          boundaries: "Confini comunali, quartieri e aree statistiche usati per rendere più leggibile il confronto",
          metadata: "Date, orari, satellite e qualità delle osservazioni per ogni estate dal 2013 al 2025",
          period: "Periodo principale: estate, dal 1 giugno al 31 agosto",
        },
      },
    };

  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-labelledby="methodology-title" onClick={close}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={close} aria-label={copy.close}>
          <X size={19} />
        </button>
        <span className="section-kicker">{copy.kicker}</span>
        <h2 id="methodology-title">{copy.title}</h2>
        <RichText
          as="p"
          className="methodology-lead"
          text={copy.lead}
        />
        <div className="methodology-summary">
          <div>
            <span>{copy.summary.period}</span>
            <strong>2013-2025</strong>
            <small>{copy.summary.periodDetail}</small>
          </div>
          <div>
            <span>{copy.summary.mainResolution}</span>
            <strong>30 m</strong>
            <small>{copy.summary.mainResolutionDetail}</small>
          </div>
          <div>
            <span>{copy.summary.dayNight}</span>
            <strong>1 km</strong>
            <small>{copy.summary.dayNightDetail}</small>
          </div>
        </div>
        <div className="methodology-list">
          <section>
            <h3>{copy.sections.satellite.title}</h3>
            {copy.sections.satellite.paragraphs.map((item) => (
              <RichText key={item} as="p" text={item} />
            ))}
          </section>
          <section>
            <h3>{copy.sections.satellites.title}</h3>
            {copy.sections.satellites.paragraphs.map((item) => (
              <RichText key={item} as="p" text={item} />
            ))}
          </section>
          <section>
            <h3>{copy.sections.observations.title}</h3>
            {copy.sections.observations.paragraphs.map((item) => (
              <RichText key={item} as="p" text={item} />
            ))}
          </section>
          <section>
            <h3>{copy.sections.limits.title}</h3>
            <ul>
              {copy.sections.limits.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>{copy.sections.availableData.title}</h3>
            <ul>
              <li>{copy.sections.availableData.yearlyLst}</li>
              <li>{copy.sections.availableData.yearlyHotspots}</li>
              <li>{copy.sections.availableData.boundaries}</li>
              <li>{copy.sections.availableData.metadata}</li>
              <li>{copy.sections.availableData.period}</li>
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
