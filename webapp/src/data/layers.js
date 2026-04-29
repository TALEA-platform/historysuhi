import { appUrl } from "../lib/appPaths.js";

const raster = (name) => appUrl(`data/webapp_rasters/${name}`);
const csvInfo = (name) => appUrl(`data/csv_info/${name}`);
const gee = (year) => appUrl(`data/gee_lst/Bologna_LST_${year}_summer_median_30m.tif`);
const hotspot = (year) => appUrl(`data/hotspots/hotspot_temporal_${year}_zgt1p0.tif`);
const hotspotData = (name) => appUrl(`data/hotspots/${name}`);

export const years = Array.from({ length: 13 }, (_, index) => 2013 + index);

export const yearlyStats = [
  { year: 2021, lst: 42.3, anomaly: 2.56, hotspot: 56.2 },
  { year: 2018, lst: 41.5, anomaly: 1.75, hotspot: 40.0 },
  { year: 2017, lst: 41.6, anomaly: 1.86, hotspot: 38.9 },
  { year: 2022, lst: 41.3, anomaly: 1.62, hotspot: 33.8 },
  { year: 2013, lst: 40.2, anomaly: 0.5, hotspot: 7.9 },
  { year: 2015, lst: 40.1, anomaly: 0.39, hotspot: 5.2 },
  { year: 2024, lst: 39.9, anomaly: 0.19, hotspot: 2.3 },
  { year: 2023, lst: 39.6, anomaly: -0.12, hotspot: 8.6 },
  { year: 2025, lst: 38.9, anomaly: -0.81, hotspot: 3.75 },
  { year: 2020, lst: 39.1, anomaly: -0.58, hotspot: 1.9 },
  { year: 2016, lst: 38.6, anomaly: -1.11, hotspot: 0.4 },
  { year: 2019, lst: 38.7, anomaly: -0.97, hotspot: 0.3 },
  { year: 2014, lst: 34.4, anomaly: -5.28, hotspot: 0 },
];

export const view1Layers = {
  lst: {
    id: "lst",
    title: "Dove la superficie si scalda di più",
    subtitle: "Temperatura di superficie nell'anno scelto",
    description:
      "Mostra la temperatura di superficie osservata nell'anno scelto. È una lettura diretta: indica quanto risultano calde strade, tetti, piazzali e vegetazione nelle osservazioni satellitari estive.",
    explanation:
      "Usalo per capire dove le superfici raggiungono la temperatura più alta in valore assoluto. Una strada o un tetto possono avere una temperatura di superficie molto più alta della temperatura dell'aria respirata dalle persone (dato satellitare, misurato sulla superficie).",
    details: [
      "Blu e verde indicano superfici con temperatura più bassa; arancio e rosso indicano superfici con temperatura molto alta.",
      "Questa mappa permette di confrontare anni diversi con il cursore Confronta.",
      "È diversa dal secondo layer perché mostra il valore della temperatura, non il rapporto con la media urbana dell'anno.",
      "Le aree tratteggiate indicano dato non disponibile: in quel punto il satellite non ha raccolto osservazioni estive valide nell'anno scelto.",
    ],
    legendTitle: "Temperatura di superficie",
    legendType: "surfaceHeat",
    legend: ["tra le meno calde", "meno calda", "intermedia", "calda", "molto calda", "tra le più calde"],
    numericLegend: ["28", "32", "36", "40", "44", "48", "54 °C"],
    noDataLabel: "Dato non disponibile",
    noDataDescription:
      "In questo punto il satellite non ha raccolto osservazioni estive valide nell'anno selezionato, quindi la mappa lascia il punto come dato non disponibile.",
    dataUrl: gee(2025),
    dataUrlForYear: gee,
    raster: { palette: "surfaceHeat", range: [28, 54], alpha: 255, noDataStyle: "hatched", maskToBoundary: true },
    className: "layer-lst",
    method: "LST mediana estiva, Landsat 8/9, risoluzione 30 m.",
  },
  zspat: {
    id: "zspat",
    title: "Zone dove la temperatura cambia rispetto alla media",
    subtitle: "Quanto un punto si discosta dalla media urbana dell'anno",
    description:
      "Questa mappa mostra di quanto la temperatura di un punto è sopra o sotto la media di Bologna **nello stesso anno**. Non indica il valore assoluto della temperatura di superficie.",
    explanation: "Usala per leggere gli squilibri interni alla città: blu significa sotto la media urbana dell'anno, bianco circa in linea, rosso sopra la media urbana dell'anno.",
    details: [
      "In questa mappa, due anni non si confrontano direttamente: ogni anno viene ricalibrato sulla propria media urbana.",
      "Una zona può apparire rossa anche in un anno non estremo, se la sua temperatura è sopra la media del resto della città in quell'anno.",
      "Serve per capire le differenze tra quartieri e parti urbane nello stesso anno selezionato.",
      "Le aree tratteggiate indicano dato non disponibile: in quel punto il satellite non ha raccolto osservazioni estive valide nell'anno scelto.",
    ],
    valueInfo:
      "Quando attivi i valori, il numero non è una temperatura. È uno **scostamento standardizzato**: 0 significa vicino alla media urbana dell'anno, valori positivi indicano zone con temperatura sopra la media, valori negativi zone con temperatura sotto la media.",
    legendTitle: "Rispetto alla città",
    legendType: "diverging",
    legend: ["molto sotto media", "sotto media", "in linea", "sopra media", "molto sopra media"],
    numericLegend: ["-2σ", "-1σ", "0", "+1σ", "+2σ"],
    noDataLabel: "Dato non disponibile",
    noDataDescription:
      "In questo punto il satellite non ha raccolto osservazioni estive valide nell'anno selezionato, quindi la mappa lascia il punto come dato non disponibile.",
    dataUrl: gee(2025),
    dataUrlForYear: gee,
    raster: { palette: "diverging", range: [-2.5, 2.5], alpha: 255, transform: "zscore", noDataStyle: "hatched", maskToBoundary: true },
    className: "layer-zspat",
    method: "z-score spaziale anno per anno.",
  },
};

export const view2Layers = {
  anomaly: {
    id: "anomaly",
    title: "Quanto il 2025 si discosta dalla temperatura abituale",
    subtitle: "Quanto il 2025 si discosta dalla temperatura abituale della stessa zona",
    description:
      "Mostra dove il 2025 è stato diverso dal comportamento abituale negli anni 2013-2025. Non risponde a 'dove fa più caldo?', ma a 'dove il 2025 è stato **anomalo rispetto alla propria storia**?'.",
    explanation: "Blu indica zone con temperatura sotto la propria media storica, bianco zone in linea, rosso zone con temperatura sopra la propria media storica. Ogni punto viene confrontato con la propria storia, non con il resto della città.",
    details: [
      "Una zona abitualmente calda può risultare bianca se nel 2025 si è comportata come al solito.",
      "Una zona non molto calda in assoluto può risultare rossa se nel 2025 ha avuto temperature sopra la sua media storica.",
    ],
    inspectNote: "Il valore indica la differenza fra il 2025 e il comportamento abituale dello stesso punto.",
    legendTitle: "Scostamento dal normale",
    legendType: "diverging",
    legend: [
      "sotto la media storica",
      "leggermente sotto",
      "in linea",
      "leggermente sopra",
      "sopra la media storica",
      "molto sopra",
    ],
    numericLegend: ["-10", "-5", "-2", "0", "+2", "+5", "+10 °C"],
    dataUrl: raster("anomaly_2025_summer_30m.tif"),
    raster: { palette: "diverging", range: [-6, 6], alpha: 255 },
    className: "layer-anomaly",
    method: "",
  },
  climatology: {
    id: "climatology",
    title: "Temperatura abituale",
    subtitle: "Media storica 2013-2025: il riferimento con cui leggere gli altri layer",
    description:
      "Mostra la **media storica** della temperatura di superficie nelle estati 2013-2025. È la mappa di base della seconda sezione: aiuta a capire dove la temperatura media è alta o bassa.",
    explanation: "Questa mappa descrive il comportamento abituale della superficie. Un'area industriale, un grande parcheggio o parti del centro possono avere temperature alte anche quando non sono anomale: significa che la loro temperatura è alta in modo ricorrente.",
    details: [
      "È diversa dal layer della prima sezione: non mostra un anno selezionato, ma una media su 13 estati.",
      "Serve per distinguere il caldo abituale dal caldo anomalo.",
    ],
    moreInfo: [
      "Se una zona è calda in questa mappa significa che quella zona tende a essere calda nella serie 2013-2025.",
      "Questa mappa è il punto di partenza per capire le mappe successive: prima viene mostrato il comportamento medio, poi si distinguono le aree in cui il caldo è cronico o anomalo.",
    ],
    inspectNote: "Calcolato sulla superficie osservata.",
    legendTitle: "Media storica 2013-2025",
    legendType: "habitualHeat",
    legend: ["storicamente bassa", "bassa", "intermedia", "alta", "molto alta", "storicamente tra le più alte"],
    numericLegend: ["28", "32", "36", "40", "44", "48", "54 °C"],
    dataUrl: raster("climatology_mean_2013_2025_30m.tif"),
    raster: { palette: "habitualHeat", range: [28, 54], alpha: 255 },
    className: "layer-climatology",
  },
  persistenceTemporal: {
    id: "persistenceTemporal",
    title: "Aree spesso anomale",
    subtitle: "Zone che in più anni si sono scaldate oltre il loro comportamento abituale",
    description:
      "Questa mappa mostra quante volte una zona è stata **anomala rispetto alla propria storia**. Non cerca le zone sempre calde: cerca le zone che, in alcuni anni, diventano più calde di quanto siano di solito.",
    explanation:
      "Un'area può essere molto calda ma avere poche anomalie se è calda quasi sempre nello stesso modo. Per esempio, una zona centrale può essere costantemente calda ma variare poco da un anno all'altro.",
    details: [
      "Il numero indica in quante estati il punto è stato anomalo rispetto a se stesso.",
      "Anomalia rara non significa automaticamente temperatura bassa: può indicare anche temperatura alta in modo costante e poco variabile.",
      "Il massimo osservato in questo dato è 5 anni: non tutte le 13 estati hanno prodotto anomalie nello stesso punto.",
    ],
    moreInfo: [
      "Questa mappa va letta insieme ad **Aree cronicamente calde**. Se una zona ha poche anomalie ma molti anni cronici, probabilmente è una criticità stabile più che un'eccezione temporanea.",
      "Se una zona ha molte anomalie ma non è cronica, può essere un luogo dove il comportamento cambia in alcuni anni specifici.",
    ],
    inspectNote: "Poche anomalie non indicano per forza temperatura bassa: controlla anche il layer delle aree cronicamente calde.",
    legendTitle: "Persistenza anomalie",
    legendType: "persistence",
    legendLayout: "compact",
    legend: ["0 anni", "1 anno", "2 anni", "3 anni", "4 anni", "5 anni"],
    numericLegend: ["0", "1", "2", "3", "4", "5 anni"],
    legendStops: [
      { label: "0 anni", color: "#fffdf0", accessibleColor: "#f7fcf0" },
      { label: "1 anno", color: "#fee391", accessibleColor: "#ccebc5" },
      { label: "2 anni", color: "#fec44f", accessibleColor: "#7bccc4" },
      { label: "3 anni", color: "#fe9929", accessibleColor: "#43a2ca" },
      { label: "4 anni", color: "#e31a1c", accessibleColor: "#0868ac" },
      { label: "5 anni", color: "#b10026", accessibleColor: "#00204d" },
    ],
    dataUrl: raster("hotspot_temporal_persistence_2013_2025.tif"),
    raster: { palette: "persistence", range: [0, 5], alpha: 255 },
    className: "layer-pers-temp",
  },
  persistenceStructural: {
    id: "persistenceStructural",
    title: "Aree cronicamente calde",
    subtitle: "Zone che in molti anni rientrano tra quelle con la temperatura di superficie più alta della città",
    description:
      "Mostra quante volte ogni punto è rientrato nel **top 5% delle aree con la temperatura di superficie più alta** di Bologna. In questa lettura, 'cronico' indica una criticità ripetuta nello spazio urbano, anno dopo anno.",
    explanation: "Serve a riconoscere le zone che spesso hanno la temperatura di superficie più alta della città, anche quando non risultano anomale rispetto alla propria storia.",
    details: [
      "Il numero può arrivare a 13 perché la visualizzazione copre 13 estati, dal 2013 al 2025.",
      "Confrontala con 'Caldo cronico e caldo anomalo' per capire se una criticità è stabile, ricorrente o entrambe.",
    ],
    moreInfo: [
      "Per capire perché una zona è cronica, passa alla terza sezione e guarda la presenza di verde e quanto le superfici riflettono la luce: poco verde e superfici scure o assorbenti spesso aiutano a spiegare il comportamento.",
    ],
    followUps: [
      { label: "Vai a Presenza di verde", view: "v3", stateKey: "view3Layer", layer: "ndvi" },
      { label: "Vai a Superfici riflettenti", view: "v3", stateKey: "view3Layer", layer: "albedo" },
    ],
    inspectNote: "",
    legendTitle: "Persistenza strutturale",
    legendType: "persistence",
    legendLayout: "compact",
    legend: ["0 anni", "1 anno", "2-4 anni", "5-8 anni", "9-12 anni", "13 anni"],
    numericLegend: ["0", "1", "2-4", "5-8", "9-12", "13 anni"],
    legendStops: [
      { label: "0 anni", color: "#fffdf0", accessibleColor: "#f7fcf0" },
      { label: "1 anno", color: "#fee391", accessibleColor: "#ccebc5" },
      { label: "2-4 anni", color: "#fec44f", accessibleColor: "#7bccc4" },
      { label: "5-8 anni", color: "#fc4e2a", accessibleColor: "#43a2ca" },
      { label: "9-12 anni", color: "#bd0026", accessibleColor: "#0868ac" },
      { label: "13 anni", color: "#800026", accessibleColor: "#00204d" },
    ],
    dataUrl: raster("hotspot_structural_persistence_2013_2025.tif"),
    raster: { palette: "persistence", range: [0, 13], alpha: 255 },
    className: "layer-pers-struct",
  },
  chronicVsAnomalous2025: {
    id: "chronicVsAnomalous2025",
    title: "Caldo cronico e anomalie 2025",
    subtitle: "Distingue criticità storiche e criticità emerse nel 2025",
    description: "Incrocia il caldo cronico multi-anno con l'anomalia del 2025. Serve a distinguere le criticità storiche da quelle emerse nell'ultimo anno disponibile.",
    explanation:
      "Arancio indica caldo cronico; viola indica anomalia del 2025; il colore più scuro indica entrambe le condizioni nello stesso luogo.",
    details: [
      "Cronico significa che il punto è nel **top 5% delle aree con la temperatura di superficie più alta** dell'anno selezionato (2025).",
      "Anomalo 2025 significa che nel 2025 il punto è stato **anomalo rispetto alla propria storia**.",
      "La classe entrambe segnala luoghi già critici che nel 2025 sono stati anche fuori dal normale.",
    ],
    inspectNote: "Questa classe combina due letture: caldo strutturale rispetto alla città e anomalia del 2025 rispetto alla storia del punto.",
    legendTitle: "4 classi",
    legendType: "categorical",
    legendLayout: "compact",
    legend: ["nessuna criticità", "cronico", "anomalo 2025", "cronico e anomalo"],
    dataUrl: raster("hotspot_structural_vs_anomalous_2025.tif"),
    raster: { mode: "categorical", category: "hotAnomalous", maskToBoundary: true },
    className: "layer-cat",
  },
  structuralVsTemporal: {
    id: "structuralVsTemporal",
    title: "Caldo cronico e caldo anomalo",
    subtitle: "Distingue le zone da sempre calde da quelle spesso anomale",
    description: "Incrocia, sull'intero periodo 2013-2025, quante volte una zona è stata nel **top 5% delle aree con la temperatura di superficie più alta** e quante volte è stata **anomala rispetto alla propria storia**.",
    explanation: "",
    details: [
      "La tinta arancio aumenta con gli anni di caldo cronico.",
      "La tinta viola aumenta con gli anni di caldo anomalo.",
      "Dove le due condizioni convivono, il colore è una miscela: indica sia criticità strutturale sia ricorrenza di anomalie.",
      "Cronico arriva a 13 anni perché la serie copre 13 estati. Anomalo arriva a 5 anni perché questo è il massimo presente nell'attuale dato di persistenza delle anomalie.",
    ],
    moreInfo: [
      "Bassa anomalia non significa necessariamente area con temperatura bassa. Può anche indicare una zona con temperatura sempre alta e stabile, come alcune parti del centro storico.",
      "Una prevalenza di arancio con poco viola indica una criticità soprattutto strutturale. Una prevalenza di viola indica un comportamento che cambia più spesso rispetto alla storia locale.",
      "Per capire le cause fisiche, esplora la terza sezione: vegetazione, superfici riflettenti e materiali aiutano a leggere perché una zona trattiene o accumula calore.",
    ],
    followUps: [
      { label: "Vai a Presenza di verde", view: "v3", stateKey: "view3Layer", layer: "ndvi" },
      { label: "Vai a Superfici riflettenti", view: "v3", stateKey: "view3Layer", layer: "albedo" },
    ],
    inspectNote: "",
    legendTitle: "Intensità cronica/anomala",
    legendType: "bivariate",
    legend: ["cronico: 1-13 anni", "anomalo: 1-5 anni", "entrambi: colori miscelati"],
    dataUrl: hotspotData("hotspot_structural_vs_anomalous_persistence_new_2013_2025.tif"),
    raster: { mode: "structuralTemporal", maskToBoundary: true },
    className: "layer-cat",
  },
};

export const view3Layers = {
  uhei: {
    id: "uhei",
    title: "Esposizione complessiva al caldo",
    subtitle: "Dove caldo, poco verde e superfici scure si presentano insieme",
    description: "Mostra dove tre condizioni si sommano nello stesso posto: temperatura di superficie più alta, poco verde e superfici che riflettono poco la luce solare. Quando le tre coincidono, l'esposizione complessiva al caldo è più alta — non perché una di queste cause basti da sola, ma perché si rinforzano a vicenda.",
    explanation: "È il layer guida della terza sezione. Serve per individuare dove gli interventi dovrebbero essere integrati: non solo alberi, non solo materiali, ma combinazione dei fattori.",
    details: [
      "Valori più alti indicano maggiore esposizione complessiva alla temperatura di superficie elevata.",
      "Non è una misura sanitaria o sociale: descrive condizioni fisiche osservate da satellite.",
      "Va letto insieme ai layer della vegetazione e dell'albedo per capire quale fattore pesa di più.",
    ],
    valueInfo:
      "Questo valore è un **indice sintetico, non una temperatura in °C**. Il numero combina temperatura di superficie, poca vegetazione e superfici poco riflettenti: valori più alti indicano condizioni fisiche più esposte al caldo.",
    legendTitle: "Esposizione al caldo",
    legendType: "uhei",
    legend: ["molto favorita", "favorita", "intermedia", "esposta", "molto esposta"],
    numericLegend: ["0.78", "1.2", "1.45", "1.88", "2.39"],
    dataUrl: raster("UHEI_2025_summer_30m.tif"),
    raster: { palette: "uhei", range: [0.78, 2.39], alpha: 255, transparentValues: [0] },
    className: "layer-uhei",
  },
  ndvi: {
    id: "ndvi",
    title: "Presenza di verde",
    subtitle: "Aiuta a riconoscere dove il verde può contribuire di più a mitigare il caldo",
    description: "Mostra dove la vegetazione è più presente. In termini pratici aiuta a leggere parchi, filari, aree agricole e zone dove il verde può contribuire a mitigare il caldo.",
    explanation: "Beige significa poca vegetazione osservabile, verde scuro vegetazione più presente e vitale.",
    details: [
      "Questo è un indice satellitare: distingue superfici vegetate da superfici minerali o costruite.",
    ],
    valueInfo:
      "Questo è un **indice di vegetazione**, non una percentuale e non una temperatura. In questa lettura va da 0 a 1: vicino a 0 significa poco verde osservabile, vicino a 1 vegetazione più presente e vitale.",
    legendTitle: "Verde",
    legendType: "green",
    legend: ["poco verde", "verde intermedio", "verde denso"],
    numericLegend: ["0", "0.5", "1"],
    dataUrl: raster("NDVI_2025_summer_30m.tif"),
    raster: { palette: "green", range: [0, 1], alpha: 255, maskToBoundary: true },
    className: "layer-ndvi",
  },
  albedo: {
    id: "albedo",
    title: "Superfici più riflettenti e più assorbenti",
    subtitle: "Utile per distinguere superfici più riflettenti da quelle che assorbono più calore",
    description: "Indica quanto le superfici riflettono la luce solare invece di assorbirla come calore. Superfici scure tendono ad accumulare più calore; superfici più riflettenti possono contribuire a ridurlo.",
    explanation: "La scala è a quantili perché a Bologna l'albedo varia poco: piccole differenze possono comunque essere utili per leggere tetti, piazzali e materiali urbani.",
    details: [
      "Valori bassi indicano superfici più assorbenti; valori alti superfici più riflettenti.",
      "Non basta avere albedo alta per risolvere il caldo: contano anche verde, ventilazione, ombra e materiali.",
    ],
    valueInfo:
      "L'albedo è la **quota di luce solare riflessa** dalla superficie, non una temperatura. Un valore 0,20 significa circa il 20% della luce riflessa: valori più bassi indicano superfici più assorbenti.",
    legendTitle: "Albedo",
    legendType: "albedo",
    legend: ["assorbente", "intermedia", "riflettente"],
    numericLegend: ["0.15", "0.20", "0.26"],
    dataUrl: raster("Albedo_2025_summer_30m.tif"),
    raster: { palette: "albedo", range: [0.15, 0.26], alpha: 255, maskToBoundary: true },
    className: "layer-albedo",
  },
  hvi: {
    id: "hvi",
    title: "Temperatura di superficie e mancanza di verde",
    subtitle: "Aiuta a capire dove una maggiore presenza di verde potrebbe fare più differenza",
    description: "Layer di approfondimento: mette insieme temperatura di superficie e mancanza di verde. È utile quando vuoi capire dove il verde potrebbe avere maggiore impatto.",
    explanation: "Rosso significa temperatura alta con poco verde; blu significa temperatura più bassa e più vegetato. Non sostituisce l'indice di esposizione complessiva al caldo: ne spiega una componente.",
    details: [
      "Serve a leggere il rapporto tra temperatura di superficie e vegetazione.",
      "È più utile per ragionare su priorità di mitigazione che per descrivere una temperatura.",
    ],
    valueInfo:
      "Questo è un **indice di confronto**, non una misura in °C. Valori positivi indicano situazioni dove temperatura di superficie elevata e poca vegetazione pesano di più; valori negativi indicano condizioni con temperatura relativamente più bassa o con più vegetazione.",
    legendTitle: "Temperatura e verde",
    legendType: "diverging",
    legend: ["bassa e verde", "intermedio", "alta e poco verde"],
    numericLegend: ["-0.98", "0", "+0.52"],
    dataUrl: raster("HVI_2025_summer_30m.tif"),
    raster: { palette: "diverging", range: [-0.98, 0.52], alpha: 255 },
    className: "layer-hvi",
  },
  hri: {
    id: "hri",
    title: "Temperatura di superficie e superfici poco riflettenti",
    subtitle: "Aiuta a leggere il peso di tetti, pavimentazioni e materiali che assorbono calore",
    description: "Layer di approfondimento: mette insieme temperatura di superficie e superfici poco riflettenti. Aiuta a leggere dove materiali, tetti e pavimentazioni possono pesare sul caldo.",
    explanation: "Rosso significa temperatura alta con superfici scure o assorbenti; blu significa temperatura più bassa e più riflettente. Non sostituisce l'indice di esposizione complessiva al caldo: ne spiega una componente.",
    details: [
      "Serve a leggere il rapporto tra temperatura di superficie e materiali assorbenti.",
      "È un supporto per ragionare su pavimentazioni, tetti, piazzali e superfici minerali.",
    ],
    valueInfo:
      "Questo è un **indice di confronto**, non una temperatura. Valori positivi indicano temperatura alta associata a superfici poco riflettenti; valori negativi indicano condizioni con temperatura più bassa o superfici più riflettenti.",
    legendTitle: "Temperatura e superfici",
    legendType: "diverging",
    legend: ["temp. bassa, riflettente", "intermedio", "temp. alta, assorbente"],
    numericLegend: ["-0.46", "0", "+0.90"],
    dataUrl: raster("HRI_2025_summer_30m.tif"),
    raster: { palette: "diverging", range: [-0.46, 0.9], alpha: 255 },
    className: "layer-hri",
  },
};

export const deltaLayer = {
  id: "delta",
  title: "Differenza tra giorno e notte",
  subtitle: "Dove la temperatura di superficie scende molto la notte e dove tende a restare alta",
  description:
    "Mostra quanto cambia la temperatura tra giorno e notte sulla superficie osservata. Un valore alto significa che la superficie è molto più calda di giorno rispetto alla notte; un valore basso significa che cambia meno.",
  explanation: "Questa mappa non dice semplicemente dove fa più caldo. Aiuta a capire il comportamento giornaliero delle superfici. Il centro può raffreddarsi intorno alla media durante la notte, ma durante il giorno può assorbire molto calore perché ha molte superfici assorbenti. Le colline possono mostrare una differenza più bassa perché hanno già una temperatura più bassa e accumulano meno calore da perdere.",
  details: [
    "La griglia è più grossolana dei layer Landsat: ogni cella rappresenta un'area ampia di circa 1 km.",
    "Un valore basso non va letto automaticamente come problema: può indicare una zona che resta calda, ma anche una zona che non si scalda molto durante il giorno.",
  ],
  moreInfo: [
    "Per leggerla bene bisogna tenere insieme due domande: quanto si scalda la zona di giorno e quanto cambia durante la notte.",
    "Per questo questa sezione va letta insieme alle mappe del caldo diurno e dei fattori fisici: verde, albedo e materiali aiutano a capire perché zone diverse hanno comportamenti diversi.",
  ],
  inspectNote: "",
  legendTitle: "Raffreddamento",
  legendType: "thermal",
  legend: ["si raffredda poco", "medio", "si raffredda molto"],
  numericLegend: ["6", "9.4", "14 °C"],
  dataUrl: csvInfo("albedo_deltalst_2025_1km_pairs.csv"),
  raster: {
    sourceType: "csvGrid",
    rowKey: "row",
    colKey: "col",
    xKey: "x",
    yKey: "y",
    valueKey: "delta_lst_1km",
    cellSize: 1000,
    palette: "thermal",
    range: [6, 14],
    alpha: 255,
    maskToBoundary: true,
    renderScale: 16,
  },
  className: "layer-delta",
};

export const districtMetrics = {
  uhei: {
    label: "Esposizione al caldo",
    unit: "",
    description: "Sintesi dell'esposizione complessiva al caldo.",
    valueInfo:
      "È un **indice sintetico medio dell'area selezionata**, non una temperatura e non una misura diretta del rischio per la salute. Riassume tre condizioni fisiche: **temperatura di superficie**, **presenza di verde** e **capacità delle superfici di riflettere la luce**. Il numero non ha unità: serve soprattutto per confrontare le aree selezionate tra loro. Valori più alti indicano una combinazione più sfavorevole; valori più bassi non significano assenza di caldo, ma condizioni medie meno critiche.",
  },
  lst: {
    label: "Temperatura di superficie",
    unit: "°C",
    description: "Temperatura di superficie media.",
    valueInfo:
      "È la **temperatura di superficie media** dell'area selezionata, espressa in °C. Descrive quanto si scaldano tetti, strade, piazzali e vegetazione osservati dal satellite.",
  },
  anomaly: {
    label: "Scostamento dal normale",
    unit: "°C",
    description: "Quanto il 2025 si discosta dal comportamento abituale dell'area.",
    valueInfo:
      "È lo **scostamento medio del 2025** rispetto al comportamento abituale della stessa area selezionata. Si misura in °C perché confronta due temperature di superficie. Un valore positivo indica che nel 2025 l'area ha avuto una temperatura sopra il suo normale; un valore negativo indica che ha avuto una temperatura sotto il suo normale. Non dice se l'area è calda in assoluto: dice quanto il 2025 si è discostato dalla sua storia.",
  },
  hotspotPercent: {
    label: "Quota area critica",
    unit: "%",
    description: "Percentuale di superficie dell'area classificata come critica.",
    valueInfo:
      "È la **percentuale di superficie dell'area selezionata** che rientra nelle aree critiche della mappa selezionata. Non è una temperatura e non indica quante persone sono esposte: misura quanta superficie è coinvolta. Un valore alto significa che il fenomeno è diffuso; un valore basso può indicare criticità più localizzate.",
  },
};

export const districts = [
  { id: "san-donato", name: "San Donato-San Vitale", uhei: 1.65, lst: 42.2, anomaly: -0.56, hotspotPercent: 4.0, persistenceMean: 1.4 },
  { id: "navile", name: "Navile", uhei: 1.62, lst: 41.6, anomaly: -0.2, hotspotPercent: 2.4, persistenceMean: 0.9 },
  { id: "borgo-panigale", name: "Borgo Panigale-Reno", uhei: 1.58, lst: 41.4, anomaly: -0.28, hotspotPercent: 4.7, persistenceMean: 0.9 },
  { id: "savena", name: "Savena", uhei: 1.4, lst: 37.4, anomaly: -2.35, hotspotPercent: 0, persistenceMean: 0.1 },
  { id: "porto-saragozza", name: "Porto-Saragozza", uhei: 1.4, lst: 37.5, anomaly: -1.03, hotspotPercent: 0.8, persistenceMean: 0.6 },
  { id: "santo-stefano", name: "Santo Stefano", uhei: 1.27, lst: 35.7, anomaly: -1.18, hotspotPercent: 0.3, persistenceMean: 0.1 },
];

export const dataAvailability = {
  yearlyLst: years.map((year) => ({ year, url: gee(year) })),
  yearlyTemporalHotspots: years.map((year) => ({ year, url: hotspot(year) })),
  districts: appUrl("data/webapp_vectors/districts_enriched_2025.geojson"),
};

export const rasterOverlays = {
  temporalHotspot: {
    id: "temporal-hotspot",
    title: "Aree eccezionalmente calde",
    dataUrlForYear: hotspot,
    raster: { mode: "hotspot", category: "hotspot" },
    opacity: 0.78,
  },
};
