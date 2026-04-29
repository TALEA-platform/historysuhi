// Helpers that translate raw raster pixel values (returned by the renderer's sampleAt)
// into the human-readable strings the UI shows in tooltips, inspection cards and legends.
//
// The renderer can hand back three shapes:
//   - { kind: "value", value: number } — a real measurement
//   - { kind: "nodata" }               — the pixel exists but has no data
//   - a bare number                    — legacy/back-compat
// numericRasterValue() collapses all three into a number-or-null.

const rasterCopy = {
  it: {
    noDataLabel: "Dato non disponibile",
    noDataDescription: "In questo punto non ci sono osservazioni estive valide del satellite, quindi la mappa non mostra un valore.",
    noCriticality: "Nessuna criticità",
    hotspotArea: "Area eccezionalmente calda",
    chronicHeat: "Caldo cronico",
    anomalous2025: "Anomalia 2025",
    chronicAndAnomalous: "Cronico e anomalo",
    anomalousHeat: "Caldo anomalo",
    yearsValue: (value) => `${value} anni`,
    structuralValue: (chronicYears, anomalousYears) => `${chronicYears} cronici, ${anomalousYears} anomali`,
    anomalousYearsLabel: (yearsCount) => yearsCount === 0 ? "0 anni anomali" : `${yearsCount} ${yearsCount === 1 ? "anno anomalo" : "anni anomali"}`,
    chronicYearsLabel: (yearsCount) => {
      if (yearsCount === 0) return "0 anni cronici";
      if (yearsCount === 1) return "1 anno cronico";
      if (yearsCount <= 4) return "2-4 anni cronici";
      if (yearsCount <= 8) return "5-8 anni cronici";
      if (yearsCount <= 12) return "9-12 anni cronici";
      return "13 anni cronici";
    },
    hoverHint: "Passa su una zona della mappa per leggere cosa indica quel punto.",
    structuralDetail: (chronicYears, anomalousYears) => `${chronicYears} anni cronici, ${anomalousYears} anni anomali.`,
    detailByLayer: {
      lst: "Temperatura di superficie osservata dal satellite.",
      zspat: "Confronto con la media urbana dello stesso anno.",
      anomaly: "Scostamento del 2025 rispetto alla storia dello stesso punto.",
      climatology: "**Media storica** estiva dello stesso punto: riferimento 2013-2025.",
      persistenceTemporal: "Numero di estati in cui il punto è stato **anomalo rispetto alla propria storia**.",
      persistenceStructural: "Numero di estati in cui il punto è rientrato nel **top 5% delle aree con la temperatura di superficie più alta** della città.",
      uhei: "Indice sintetico: più alto significa maggiore esposizione a temperature di superficie elevate.",
      ndvi: "Indice di vegetazione: più alto significa più verde osservabile.",
      albedo: "Riflettanza: più alto significa superfici riflettenti.",
      hvi: "Rapporto tra temperatura di superficie e mancanza di verde.",
      hri: "Rapporto tra temperatura di superficie e superfici poco riflettenti.",
      delta: "Differenza giorno-notte a scala 1 km.",
      default: "Lettura del punto selezionato.",
    },
  },
  en: {
    noDataLabel: "No data",
    noDataDescription: "There are no valid summer satellite observations at this point, so the map does not show a value.",
    noCriticality: "No critical pattern",
    hotspotArea: "Exceptionally hot area",
    chronicHeat: "Chronic heat",
    anomalous2025: "2025 anomaly",
    chronicAndAnomalous: "Chronic and anomalous",
    anomalousHeat: "Anomalous heat",
    yearsValue: (value) => `${value} years`,
    structuralValue: (chronicYears, anomalousYears) => `${chronicYears} chronic, ${anomalousYears} anomalous`,
    anomalousYearsLabel: (yearsCount) => yearsCount === 0 ? "0 anomalous years" : `${yearsCount} anomalous ${yearsCount === 1 ? "year" : "years"}`,
    chronicYearsLabel: (yearsCount) => {
      if (yearsCount === 0) return "0 chronic years";
      if (yearsCount === 1) return "1 chronic year";
      if (yearsCount <= 4) return "2-4 chronic years";
      if (yearsCount <= 8) return "5-8 chronic years";
      if (yearsCount <= 12) return "9-12 chronic years";
      return "13 chronic years";
    },
    hoverHint: "Hover over an area of the map to read what that point indicates.",
    structuralDetail: (chronicYears, anomalousYears) => `${chronicYears} chronic years, ${anomalousYears} anomalous years.`,
    detailByLayer: {
      lst: "Surface temperature observed by satellite.",
      zspat: "Comparison with the urban average of the same year.",
      anomaly: "Departure of 2025 from the history of the same point.",
      climatology: "**Historical mean** summer value for the same point: 2013-2025 reference.",
      persistenceTemporal: "Number of summers in which the point was **anomalous compared with its own history**.",
      persistenceStructural: "Number of summers in which the point ranked within the city's **top 5% by surface temperature**.",
      uhei: "Synthetic index: higher values mean greater exposure to high surface temperatures.",
      ndvi: "Vegetation index: higher values mean more observable greenery.",
      albedo: "Reflectance: higher values mean reflective surfaces.",
      hvi: "Relationship between surface temperature and lack of vegetation.",
      hri: "Relationship between surface temperature and poorly reflective surfaces.",
      delta: "Day-night difference at 1 km scale.",
      default: "Reading of the selected point.",
    },
  },
};

function getRasterCopy(language = "it") {
  return language === "en" ? rasterCopy.en : rasterCopy.it;
}

function describeStructuralTemporalAnomalousSignal(anomalousYears, language = "it") {
  const isEnglish = language === "en";

  if (anomalousYears <= 1) {
    return isEnglish ? "a limited anomalous signal" : "un segnale anomalo limitato";
  }
  if (anomalousYears <= 2) {
    return isEnglish ? "a medium anomalous signal" : "un segnale anomalo medio";
  }
  if (anomalousYears < 4) {
    return isEnglish ? "a recurring anomalous signal" : "un segnale anomalo ricorrente";
  }
  return isEnglish ? "a strong recurring anomalous signal" : "un forte segnale anomalo ricorrente";
}

export function numericRasterValue(value) {
  if (value?.kind === "value") return value.value;
  if (value?.kind === "nodata") return null;
  return value;
}

export function getFormattedRasterValue(layer, value, language = "it") {
  if (value?.kind === "nodata") return null;
  const numericValue = numericRasterValue(value);
  if (numericValue == null) return null;
  return formatRasterValue(layer, numericValue, language);
}

export function getRasterValueLabel(layer, value, language = "it") {
  const copy = getRasterCopy(language);
  if (value?.kind === "nodata") return layer.noDataLabel || copy.noDataLabel;
  return rasterLabel(layer, numericRasterValue(value), language);
}

export function getRasterValueDetail(layer, value, language = "it") {
  const copy = getRasterCopy(language);
  if (value?.kind === "nodata") {
    return layer.noDataDescription || copy.noDataDescription;
  }
  return rasterDetail(layer, numericRasterValue(value), language);
}

export function getRasterValueContext(layer, value, language = "it") {
  if (value?.kind === "nodata") return null;
  const numericValue = numericRasterValue(value);
  if (numericValue == null) return null;
  return rasterContext(layer, numericValue, language);
}

export function formatRasterValue(layer, value, language = "it") {
  const copy = getRasterCopy(language);
  const numericValue = numericRasterValue(value);
  if (numericValue == null) return null;
  if (layer.raster?.category === "hotAnomalous") return rasterLabel(layer, numericValue, language);
  if (layer.raster?.mode === "structuralTemporal") {
    // Bivariate code packed as anomalousYears*100 + chronicYears.
    const anomalousYears = Math.floor(numericValue / 100);
    const chronicYears = Math.round(numericValue % 100);
    return copy.structuralValue(chronicYears, anomalousYears);
  }
  if (layer.id === "lst" || layer.id === "climatology") return `${value.toFixed(1)} °C`;
  if (layer.id === "anomaly") return `${value > 0 ? "+" : ""}${value.toFixed(1)} °C`;
  if (layer.id === "zspat") return `${value > 0 ? "+" : ""}${value.toFixed(2)} σ`;
  if (layer.id?.toLowerCase().includes("persistence")) return copy.yearsValue(Math.round(value));
  if (layer.id === "ndvi" || layer.id === "albedo" || layer.id === "uhei" || layer.id === "hvi" || layer.id === "hri") {
    return value.toFixed(2);
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function rasterLabel(layer, value, language = "it") {
  const copy = getRasterCopy(language);
  if (value == null) return layer.legend[Math.min(3, layer.legend.length - 1)];
  if (layer.raster?.mode === "hotspot") return value ? copy.hotspotArea : copy.noCriticality;
  if (layer.raster?.category === "hotAnomalous") {
    const rounded = Math.round(value);
    if (rounded === 1) return copy.chronicHeat;
    if (rounded === 2 || rounded === 10) return copy.anomalous2025;
    if (rounded === 3 || rounded === 11) return copy.chronicAndAnomalous;
    return copy.noCriticality;
  }
  if (layer.raster?.mode === "structuralTemporal") {
    const anomalousYears = Math.floor(value / 100);
    const chronicYears = Math.round(value % 100);
    if (anomalousYears && chronicYears) return copy.chronicAndAnomalous;
    if (chronicYears) return copy.chronicHeat;
    if (anomalousYears) return copy.anomalousHeat;
    return copy.noCriticality;
  }
  if (layer.id === "persistenceTemporal") {
    const yearsCount = Math.round(value);
    return copy.anomalousYearsLabel(yearsCount);
  }
  if (layer.id === "persistenceStructural") {
    const yearsCount = Math.round(value);
    return copy.chronicYearsLabel(yearsCount);
  }
  if (layer.raster?.range && layer.legend?.length) {
    // Rescale value into [0,1] using the layer's declared min/max, then bucket
    // it into the matching legend entry. Math.max(.000001, ...) guards a
    // degenerate range with min === max from triggering a divide-by-zero.
    const [min, max] = layer.raster.range;
    const normalized = Math.max(0, Math.min(1, (value - min) / Math.max(0.000001, max - min)));
    const index = Math.min(layer.legend.length - 1, Math.floor(normalized * layer.legend.length));
    return layer.legend[index];
  }
  return layer.legend[Math.min(3, layer.legend.length - 1)];
}

export function rasterDetail(layer, value, language = "it") {
  const copy = getRasterCopy(language);
  if (value == null) return copy.hoverHint;
  if (layer.raster?.mode === "structuralTemporal") {
    const anomalousYears = Math.floor(value / 100);
    const chronicYears = Math.round(value % 100);
    return copy.structuralDetail(chronicYears, anomalousYears);
  }
  return copy.detailByLayer[layer.id] || copy.detailByLayer.default;
}

function rasterContext(layer, value, language = "it") {
  const isEnglish = language === "en";

  if (layer.raster?.category === "hotAnomalous") {
    const rounded = Math.round(value);
    if (rounded === 1) {
      return isEnglish
        ? "This point shows a structural heat signal compared with the rest of Bologna, but not a specific anomalous signal in 2025."
        : "Questo punto mostra un segnale di caldo strutturale rispetto al resto di Bologna, ma non un segnale anomalo specifico nel 2025.";
    }
    if (rounded === 2 || rounded === 10) {
      return isEnglish
        ? "This point stands out in 2025 compared with its own history, even if it is not among Bologna's areas with the structurally highest surface temperature."
        : "Questo punto emerge nel 2025 rispetto alla propria storia, anche se non rientra tra le aree strutturalmente con la temperatura di superficie più alta di Bologna.";
    }
    if (rounded === 3 || rounded === 11) {
      return isEnglish
        ? "This point combines a long-term structural heat signal with an anomalous behaviour in 2025."
        : "Questo punto combina un segnale di caldo strutturale di lungo periodo con un comportamento anomalo nel 2025.";
    }
    return isEnglish
      ? "This point does not show a chronic or anomalous critical pattern in the selected classification."
      : "Questo punto non mostra una criticità cronica o anomala nella classificazione selezionata.";
  }

  if (layer.raster?.mode === "structuralTemporal") {
    const anomalousYears = Math.floor(value / 100);
    const chronicYears = Math.round(value % 100);
    const anomalousSignal = describeStructuralTemporalAnomalousSignal(anomalousYears, language);
    if (chronicYears && anomalousYears) {
      return isEnglish
        ? `This point is structurally hot compared with the city and shows ${anomalousSignal} compared with its own history.`
        : `Questo punto è strutturalmente caldo rispetto alla città e mostra ${anomalousSignal} rispetto alla propria storia.`;
    }
    if (chronicYears) {
      return isEnglish
        ? "This point is repeatedly among Bologna's areas with the highest surface temperature, even if it does not often behave anomalously compared with itself."
        : "Questo punto rientra ripetutamente tra le aree con la temperatura di superficie più alta di Bologna, anche se non si comporta spesso in modo anomalo rispetto a se stesso.";
    }
    if (anomalousYears) {
      return isEnglish
        ? `This point shows ${anomalousSignal} compared with its own history, without being one of Bologna's areas with the structurally highest surface temperature.`
        : `Questo punto mostra ${anomalousSignal} rispetto alla propria storia, senza essere una delle aree strutturalmente con la temperatura di superficie più alta di Bologna.`;
    }
    return isEnglish
      ? "This point does not show a chronic or anomalous signal in the available period."
      : "Questo punto non mostra un segnale cronico o anomalo nel periodo disponibile.";
  }

  switch (layer.id) {
    case "lst":
      return isEnglish
        ? "This is the surface temperature reading at the selected point in the chosen year: paved areas and roofs can be much warmer than the surrounding air."
        : "Questa è la temperatura di superficie del punto selezionato nell'anno scelto: aree pavimentate e tetti possono risultare molto più caldi dell'aria circostante.";
    case "zspat":
      if (Math.abs(value) < 0.2) {
        return isEnglish
          ? "This point is close to the city average for the selected year."
          : "Questo punto è vicino alla media urbana per l'anno selezionato.";
      }
      return value > 0
        ? (isEnglish
          ? "This point's surface temperature is above Bologna's average in the selected year."
          : "Questo punto ha una temperatura di superficie sopra la media di Bologna nell'anno selezionato.")
        : (isEnglish
          ? "This point's surface temperature is below Bologna's average in the selected year."
          : "Questo punto ha una temperatura di superficie sotto la media di Bologna nell'anno selezionato.");
    case "anomaly":
      if (Math.abs(value) < 0.5) {
        return isEnglish
          ? "In 2025 this point stayed broadly in line with its own historical behaviour."
          : "Nel 2025 questo punto è rimasto nel complesso in linea con il proprio comportamento storico.";
      }
      return value > 0
        ? (isEnglish
          ? "In 2025 this point's surface temperature was above its own historical pattern."
          : "Nel 2025 questo punto ha avuto una temperatura sopra il proprio comportamento storico.")
        : (isEnglish
          ? "In 2025 this point's surface temperature was below its own historical pattern."
          : "Nel 2025 questo punto ha avuto una temperatura sotto il proprio comportamento storico.");
    case "climatology":
      return isEnglish
        ? "This value represents the usual summer surface behaviour of this point across the 2013-2025 series."
        : "Questo valore rappresenta il comportamento superficiale estivo abituale di questo punto nella serie 2013-2025.";
    case "persistenceTemporal":
      if (value <= 0) {
        return isEnglish
          ? "This point does not show anomalous summers in the available series."
          : "Questo punto non mostra estati anomale nella serie disponibile.";
      }
      if (value < 2) {
        return isEnglish
          ? "This point shows an occasional anomalous signal rather than a strongly repeated one."
          : "Questo punto mostra un segnale anomalo occasionale più che fortemente ripetuto.";
      }
      if (value < 4) {
        return isEnglish
          ? "This point shows a recurring anomalous pattern compared with its own history."
          : "Questo punto mostra un pattern anomalo ricorrente rispetto alla propria storia.";
      }
      return isEnglish
        ? "This point shows a strong recurring anomalous pattern across the observed summers."
        : "Questo punto mostra un forte pattern anomalo ricorrente nelle estati osservate.";
    case "persistenceStructural":
      if (value <= 0) {
        return isEnglish
          ? "This point does not enter Bologna's top 5% by surface temperature in the available series."
          : "Questo punto non entra nel 5% di Bologna con la temperatura di superficie più alta nella serie disponibile.";
      }
      if (value < 2) {
        return isEnglish
          ? "This point appears among Bologna's areas with the highest surface temperature only occasionally."
          : "Questo punto compare tra le aree con la temperatura di superficie più alta di Bologna solo occasionalmente.";
      }
      if (value < 9) {
        return isEnglish
          ? "This point shows a recurring structural heat pattern over several summers."
          : "Questo punto mostra un pattern di caldo strutturale ricorrente in diverse estati.";
      }
      return isEnglish
        ? "This point is persistently among Bologna's areas with the highest surface temperature across much of the observed period."
        : "Questo punto rientra in modo persistente tra le aree con la temperatura di superficie più alta di Bologna in gran parte del periodo osservato.";
    case "uhei":
      return isEnglish
        ? "Higher values at this point indicate a more unfavourable combination of high surface temperature, little greenery and weak reflectance."
        : "Valori più alti in questo punto indicano una combinazione più sfavorevole di temperatura di superficie alta, poco verde e bassa riflettanza.";
    case "ndvi":
      return value >= 0.45
        ? (isEnglish
          ? "This point shows a comparatively strong vegetation presence in the current map."
          : "Questo punto mostra una presenza di vegetazione relativamente forte nella mappa corrente.")
        : (isEnglish
          ? "This point shows limited vegetation presence in the current map."
          : "Questo punto mostra una presenza limitata di vegetazione nella mappa corrente.");
    case "albedo":
      return value >= 0.2
        ? (isEnglish
          ? "This point is on the more reflective side of the mapped surfaces."
          : "Questo punto si colloca sul lato più riflettente delle superfici mappate.")
        : (isEnglish
          ? "This point is on the more absorbent side of the mapped surfaces."
          : "Questo punto si colloca sul lato più assorbente delle superfici mappate.");
    case "hvi":
      if (Math.abs(value) < 0.08) {
        return isEnglish
          ? "At this point the balance between surface temperature and vegetation is close to the middle of the scale."
          : "In questo punto l'equilibrio tra temperatura di superficie e vegetazione è vicino al centro della scala.";
      }
      return value > 0
        ? (isEnglish
          ? "At this point surface temperature weighs more than vegetation in the combined reading."
          : "In questo punto la temperatura di superficie pesa più della vegetazione nella lettura combinata.")
        : (isEnglish
          ? "At this point vegetation and lower-temperature conditions weigh more in the combined reading."
          : "In questo punto vegetazione e condizioni con temperatura più bassa pesano di più nella lettura combinata.");
    case "hri":
      if (Math.abs(value) < 0.08) {
        return isEnglish
          ? "At this point the balance between surface temperature and reflectance is close to the middle of the scale."
          : "In questo punto l'equilibrio tra temperatura di superficie e riflettanza è vicino al centro della scala.";
      }
      return value > 0
        ? (isEnglish
          ? "At this point high surface temperature is associated more with dark or absorbent surfaces."
          : "In questo punto la temperatura di superficie elevata è più associata a superfici scure o assorbenti.")
        : (isEnglish
          ? "At this point lower-temperature or more reflective surfaces weigh more in the combined reading."
          : "In questo punto superfici con temperatura più bassa o più riflettenti pesano di più nella lettura combinata.");
    case "delta":
      if (value >= 11) {
        return isEnglish
          ? "This point shows a strong day-night surface swing, with much higher daytime surface temperatures than nighttime ones."
          : "Questo punto mostra una forte escursione superficiale giorno-notte, con temperature di superficie diurne molto più alte di quelle notturne.";
      }
      if (value <= 8) {
        return isEnglish
          ? "This point shows a limited day-night surface swing compared with the rest of the map."
          : "Questo punto mostra un'escursione superficiale giorno-notte limitata rispetto al resto della mappa.";
      }
      return isEnglish
        ? "This point shows an intermediate day-night surface swing."
        : "Questo punto mostra un'escursione superficiale giorno-notte intermedia.";
    default:
      return null;
  }
}
