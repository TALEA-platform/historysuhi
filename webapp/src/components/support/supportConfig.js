// Per-view list of UI elements the support overlay should highlight.
// Each entry is { selector, label: { it, en } } — the overlay uses
// document.querySelector(selector) at open time to find the target and
// measure its bounding box for the callout anchor.
// The list is intentionally short: we want the user to read every callout
// at a glance, not to hunt through a long tour.

export const supportConfig = {
  v1: [
    {
      selector: ".year-slider",
      label: {
        en: "Drag the slider to change the year.",
        it: "Trascina lo slider per cambiare anno.",
      },
    },
    {
      selector: ".map-below-controls .icon-button",
      label: {
        en: "Open a side-by-side comparison of two years.",
        it: "Apri il confronto fianco a fianco tra due anni.",
      },
    },
    {
      selector: ".info-jump-button",
      label: {
        en: "Read the full explanation of the active layer.",
        it: "Leggi la spiegazione completa del layer attivo.",
      },
    },
    {
      selector: ".map-floating-controls",
      label: {
        en: "Switch basemap, opacity and Inspect mode.",
        it: "Cambia mappa di base, opacità e modalità Ispeziona.",
      },
    },
    {
      selector: ".map-values-toggle",
      showOutline: false,
      calloutClassName: "support-callout--values",
      label: {
        en: "Use the 'Values' button to show the numeric value of the active layer in the legend or in Inspect mode. It is not always a temperature: it can represent degrees, differences, years or an index.",
        it: "Usa il bottone \"Valori\" per mostrare il valore numerico del layer attivo nella legenda o in modalità Ispeziona. Non è sempre una temperatura: può indicare gradi, differenze, anni o un indice.",
      },
    },
    {
      selector: ".legend",
      label: {
        en: "Legend for the colours on the map.",
        it: "Legenda dei colori della mappa.",
      },
    },
    {
      selector: ".side-panel .panel-card",
      label: {
        en: "Choose the base layer and optional overlays.",
        it: "Scegli il layer base e le sovrapposizioni opzionali.",
      },
    },
    {
      selector: ".nav-views",
      label: {
        en: "Navigation menu — the views follow a logical sequence. Exploring them in order is recommended for accurate understanding.",
        it: "Menu di navigazione — le sezioni seguono un ordine logico, si consiglia di procedere in sequenza per una corretta interpretazione.",
      },
    },
  ],
  v2: [
    {
      selector: ".info-jump-button",
      label: {
        en: "Read the full explanation of the active layer.",
        it: "Leggi la spiegazione completa del layer attivo.",
      },
    },
    {
      selector: ".map-floating-controls",
      label: {
        en: "Switch basemap, opacity and Inspect mode.",
        it: "Cambia mappa di base, opacità e modalità Ispeziona.",
      },
    },
    {
      selector: ".map-values-toggle",
      showOutline: false,
      calloutClassName: "support-callout--values",
      label: {
        en: "Use the 'Values' button to show the numeric value of the active layer in the legend or in Inspect mode. It is not always a temperature: it can represent degrees, differences, years or an index.",
        it: "Usa il bottone \"Valori\" per mostrare il valore numerico del layer attivo nella legenda o in modalità Ispeziona. Non è sempre una temperatura: può indicare gradi, differenze, anni o un indice.",
      },
    },
    {
      selector: ".legend",
      label: {
        en: "Legend for the active layer's classes.",
        it: "Legenda delle classi del layer attivo.",
      },
    },
    {
      selector: ".side-panel .panel-card",
      label: {
        en: "Pick what to compare: usual temperature, anomalies, chronic heat and combinations.",
        it: "Scegli cosa confrontare: temperatura abituale, anomalie, caldo cronico e combinazioni.",
      },
    },
    {
      selector: ".threshold",
      label: {
        en: "This slider filters the map: it keeps only the areas that exceed at least this number of summers. Keep it low for a broader picture, raise it to isolate the most recurring cases.",
        it: "Questo cursore filtra la mappa: mantiene solo le aree che superano almeno questo numero di estati. Tienilo basso per un quadro più ampio, alzalo per isolare i casi più ricorrenti.",
      },
    },
    {
      selector: ".nav-views",
      label: {
        en: "Navigation menu — the views follow a logical sequence. Exploring them in order is recommended for accurate understanding.",
        it: "Menu di navigazione — le sezioni seguono un ordine logico, si consiglia di procedere in sequenza per una corretta interpretazione.",
      },
    },
  ],
  v3: [
    {
      selector: ".info-jump-button",
      label: {
        en: "Read the full explanation of the active driver.",
        it: "Leggi la spiegazione completa del fattore attivo.",
      },
    },
    {
      selector: ".map-floating-controls",
      label: {
        en: "Switch basemap, opacity and Inspect mode.",
        it: "Cambia mappa di base, opacità e modalità Ispeziona.",
      },
    },
    {
      selector: ".map-values-toggle",
      showOutline: false,
      calloutClassName: "support-callout--values",
      label: {
        en: "Use the 'Values' button to show the numeric value of the active layer in the legend or in Inspect mode. It is not always a temperature: it can represent degrees, differences, years or an index.",
        it: "Usa il bottone \"Valori\" per mostrare il valore numerico del layer attivo nella legenda o in modalità Ispeziona. Non è sempre una temperatura: può indicare gradi, differenze, anni o un indice.",
      },
    },
    {
      selector: ".legend",
      label: {
        en: "Legend for the selected physical driver.",
        it: "Legenda del fattore fisico selezionato.",
      },
    },
    {
      selector: ".side-panel .panel-card",
      label: {
        en: "Choose the physical driver to map: heat exposure, vegetation, reflectance or combinations.",
        it: "Scegli il fattore da mappare: esposizione al caldo, verde, riflettanza o combinazioni.",
      },
    },
    {
      selector: ".nav-views",
      label: {
        en: "Navigation menu — the views follow a logical sequence. Exploring them in order is recommended for accurate understanding.",
        it: "Menu di navigazione — le sezioni seguono un ordine logico, si consiglia di procedere in sequenza per una corretta interpretazione.",
      },
    },
  ],
  v4: [
    {
      selector: ".info-jump-button",
      label: {
        en: "Read the full explanation of the day-night map.",
        it: "Leggi la spiegazione completa della mappa giorno-notte.",
      },
    },
    {
      selector: ".map-floating-controls",
      label: {
        en: "Switch basemap, opacity and Inspect mode.",
        it: "Cambia mappa di base, opacità e modalità Ispeziona.",
      },
    },
    {
      selector: ".map-values-toggle",
      showOutline: false,
      calloutClassName: "support-callout--values",
      label: {
        en: "Use the 'Values' button to show the numeric value of the active layer in the legend or in Inspect mode. It is not always a temperature: it can represent degrees, differences, years or an index.",
        it: "Usa il bottone \"Valori\" per mostrare il valore numerico del layer attivo nella legenda o in modalità Ispeziona. Non è sempre una temperatura: può indicare gradi, differenze, anni o un indice.",
      },
    },
    {
      selector: ".legend",
      label: {
        en: "Legend for the day-night temperature range.",
        it: "Legenda dell'escursione termica giorno-notte.",
      },
    },
    {
      selector: ".scatter-block",
      label: {
        en: "Chart: points are selectable and link to the corresponding 1 km cell on the map.",
        it: "Grafico: i punti sono selezionabili e richiamano sulla mappa la cella da 1 km corrispondente.",
      },
    },
    {
      selector: ".scatter-switch",
      label: {
        en: "Use these buttons to switch between the reflectance chart and the vegetation chart.",
        it: "Usa questi bottoni per passare tra il grafico della riflettanza e quello della presenza di verde.",
      },
    },
    {
      selector: ".nav-views",
      label: {
        en: "Navigation menu — the views follow a logical sequence. Exploring them in order is recommended for accurate understanding.",
        it: "Menu di navigazione — le sezioni seguono un ordine logico, si consiglia di procedere in sequenza per una corretta interpretazione.",
      },
    },
  ],
  v5: [
    {
      selector: ".map-search-button",
      calloutClassName: "support-callout--v5-map-button",
      label: {
        en: "Search a district or a statistical area by name.",
        it: "Cerca un quartiere o un'area statistica per nome.",
      },
    },
    {
      selector: ".district-map-shell .legend",
      label: {
        en: "Legend for the active 2025 metric shown on the map.",
        it: "Legenda della metrica 2025 attiva mostrata sulla mappa.",
      },
    },
    {
      selector: ".district-map-shell .mode-switch button:last-child",
      calloutClassName: "support-callout--values",
      label: {
        en: "Switch to Inspect to pick a district or a statistical area directly on the map — clicking it selects the area and updates the table and the card on the right.",
        it: "Attiva Ispeziona per selezionare un quartiere o un'area statistica direttamente sulla mappa — cliccandola la zona viene selezionata e si aggiornano la tabella e la scheda a destra.",
      },
    },
    {
      selector: ".area-finder",
      calloutClassName: "support-callout--v5-finder",
      label: {
        en: "The finder also updates the map, the table and the card on the right.",
        it: "La ricerca aggiorna anche mappa, tabella e scheda a destra.",
      },
    },
    {
      selector: ".table-card",
      calloutClassName: "support-callout--v5-table",
      label: {
        en: "Ranked table of the active metric — click a row to jump on the map.",
        it: "Classifica della metrica attiva — clicca una riga per volare sulla mappa.",
      },
    },
    {
      selector: ".aggregation-toggle",
      label: {
        en: "Read by districts or zoom down to statistical areas.",
        it: "Leggi per quartieri o scendi alle aree statistiche.",
      },
    },
    {
      selector: ".side-panel .panel-card",
      label: {
        en: "Choose which 2025 indicator to rank by.",
        it: "Scegli l'indicatore 2025 con cui ordinare.",
      },
    },
    {
      selector: ".nav-views",
      label: {
        en: "This is the final view — dedicated to summarizing the data.",
        it: "Questa è l'ultima sezione — dedicata alla sintesi dei dati.",
      },
    },
  ],
};
