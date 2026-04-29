// Static copy and matching configuration for the five top-level views.
// Centralised here so view components can stay focused on layout and behaviour.

export const views = [
  { id: "v1", title: "Dove fa caldo", subtitle: "Temperatura di superficie osservata" },
  { id: "v2", title: "Cosa è normale, cosa è cambiato", subtitle: "Storia 2013-2025" },
  { id: "v3", title: "Perché fa caldo qui", subtitle: "Fattori fisici" },
  { id: "v4", title: "Giorno e notte", subtitle: "Raffreddamento" },
  { id: "v5", title: "Zoom sui quartieri", subtitle: "Sintesi per aree" },
];

export const viewCopy = {
  v1: {
    kicker: "Sezione 1",
    title: "Temperatura di superficie di Bologna in estate.",
    note: "Le mappe mostrano superfici osservate dai satelliti nei mesi estivi: strade, tetti, piazzali e verde.\nNon rappresentano la temperatura dell'aria.",
  },
  v2: {
    kicker: "Sezione 2",
    title: "Cosa è normale, cosa è cambiato rispetto alla storia.",
    note: "La sezione distingue condizioni abituali, anomalie e persistenze del caldo nel periodo 2013-2025.",
  },
  v3: {
    kicker: "Sezione 3",
    title: "Perché in alcune zone la temperatura di superficie è più alta.",
    note: "La sezione mette a fuoco i fattori fisici che aiutano a spiegare l'accumulo di calore, come verde, materiali e capacità delle superfici di riflettere la luce.",
  },
  v4: {
    kicker: "Sezione 4",
    title: "Dove la città si raffredda, e dove trattiene calore.",
    note: "Il dato giorno-notte è calcolato sul 2025 e ha risoluzione 1 km: utile per leggere zone della città, non singoli edifici.",
  },
  v5: {
    kicker: "Sezione 5",
    title: "Una lettura sintetica per quartieri e aree statistiche.",
    note: "La sezione aggrega i dati principali del 2025 per rendere confrontabili quartieri e aree statistiche.",
  },
};

// Words inside view titles that get the brand "underline" highlight treatment.
// Both regexes share the same word list — keep them in sync.
export const titleHighlightPattern = /^(Bologna|Temperatura|normale|cambiato|storia|caldo|città|quartieri|aree|statistiche|estate)$/i;
export const titleSplitPattern = /(Bologna|Temperatura|normale|cambiato|storia|caldo|città|quartieri|aree|statistiche|estate)/gi;

// View-2 layers whose readout is purely categorical: hide the "show numeric values"
// toggle on the floating controls because there is no continuous number to show.
export const view2LayersWithoutValuesToggle = new Set([
  "persistenceTemporal",
  "persistenceStructural",
  "structuralVsTemporal",
  "chronicVsAnomalous2025",
]);
