import {
  titleHighlightPattern as italianTitleHighlightPattern,
  titleSplitPattern as italianTitleSplitPattern,
  view2LayersWithoutValuesToggle,
  viewCopy as italianViewCopy,
  views as italianViews,
} from "../data/viewsCopy.js";
import {
  dataAvailability,
  deltaLayer as italianDeltaLayer,
  districtMetrics as italianDistrictMetrics,
  districts,
  rasterOverlays as italianRasterOverlays,
  view1Layers as italianView1Layers,
  view2Layers as italianView2Layers,
  view3Layers as italianView3Layers,
  yearlyStats,
  years,
} from "../data/layers.js";
import { normalizeLanguage } from "./config.js";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Set);
}

function mergeLocalized(baseValue, overrideValue) {
  if (overrideValue === undefined) return baseValue;
  if (!isPlainObject(baseValue) || !isPlainObject(overrideValue)) return overrideValue;

  const merged = { ...baseValue };
  for (const key of Object.keys(overrideValue)) {
    merged[key] = mergeLocalized(baseValue?.[key], overrideValue[key]);
  }
  return merged;
}

function localizeCollection(baseCollection, overrides = {}) {
  return Object.fromEntries(
    Object.entries(baseCollection).map(([key, value]) => [key, mergeLocalized(value, overrides[key])]),
  );
}

const englishViews = [
  { id: "v1", title: "Where it gets hot", subtitle: "Observed heat" },
  { id: "v2", title: "What is normal, what changed", subtitle: "2013-2025 history" },
  { id: "v3", title: "Why it gets hot here", subtitle: "Physical drivers" },
  { id: "v4", title: "Day and night", subtitle: "Cooling" },
  { id: "v5", title: "Zoom into districts", subtitle: "Area summaries" },
];

const englishViewCopy = {
  v1: {
    kicker: "View 1",
    title: "Where Bologna's surface heats up the most in summer.",
    note: "These maps show surfaces observed by satellite during the summer months: roads, roofs, paved areas and vegetation. They do not represent air temperature.",
  },
  v2: {
    kicker: "View 2",
    title: "What is normal, what has changed over time.",
    note: "This section distinguishes usual conditions, anomalies and heat persistence across 2013-2025.",
  },
  v3: {
    kicker: "View 3",
    title: "Why some areas accumulate more heat.",
    note: "This section focuses on the physical factors that help explain heat accumulation: greenery, materials and how surfaces reflect light.",
  },
  v4: {
    kicker: "View 4",
    title: "Where the city cools down, and where it holds heat.",
    note: "The day-night dataset is calculated for 2025 at 1 km resolution: useful for reading city zones, not individual buildings.",
  },
  v5: {
    kicker: "View 5",
    title: "A summary reading for districts and statistical areas.",
    note: "This view aggregates the main 2025 data so districts and statistical areas can be compared.",
  },
};

const englishLayerOverrides = {
  view1Layers: {
    lst: {
      title: "Where the surface heats up the most",
      subtitle: "Surface temperature in the selected year",
      description:
        "Shows the surface temperature observed in the selected year. It is a direct reading: it indicates how hot roads, roofs, paved areas and vegetation appear in summer satellite observations.",
      explanation:
        "Use it to understand where the surface temperature is highest in absolute terms. A road or a roof can have a surface temperature much higher than the air temperature people breathe (satellite-observed surface data).",
      details: [
        "Blue and green indicate surfaces with lower temperatures; orange and red indicate surfaces with very high temperatures.",
        "This map lets you compare different years with the Compare slider.",
        "It differs from the second layer because here you read the temperature value itself, not the relationship with the city's annual average.",
        "Hatched areas mean data not available: at that location the satellite did not collect valid summer observations in the selected year.",
      ],
      legendTitle: "Surface temperature",
      legend: ["among the least hot", "less hot", "mid-range", "hot", "very hot", "among the hottest"],
      noDataLabel: "No data",
      noDataDescription:
        "At this location the satellite did not collect valid summer observations in the selected year, so the map leaves it as no data.",
      method: "Summer median LST, Landsat 8/9, 30 m resolution.",
    },
    zspat: {
      title: "Areas where the temperature differs from the average",
      subtitle: "How much a place differs from the urban average in the same year",
      description:
        "This map shows by how much a point's temperature is above or below Bologna's average **in the same year**. It does not show the absolute value of the surface temperature.",
      explanation:
        "Use it to read internal imbalances across the city: blue means below the city's annual average, white roughly in line, red above the city's annual average.",
      details: [
        "Different years are not compared directly here: each year is recalibrated to its own urban average.",
        "An area can appear red even in a non-extreme year if its temperature is above the rest of the city's average in that year.",
        "Use it to understand differences between districts and urban zones within the same selected year.",
        "Hatched areas mean data not available: at that location the satellite did not collect valid summer observations in the selected year.",
      ],
      valueInfo:
        "When you enable values, the number is not a temperature. It is a **standardized deviation**: 0 means close to the city's annual average, positive values indicate areas with temperature above the average, negative values areas with temperature below the average.",
      legendTitle: "Compared with the city",
      legend: ["well below average", "below average", "in line", "above average", "well above average"],
      noDataLabel: "No data",
      noDataDescription:
        "At this location the satellite did not collect valid summer observations in the selected year, so the map leaves it as no data.",
      method: "Year-by-year spatial z-score.",
    },
  },
  view2Layers: {
    anomaly: {
      title: "How much 2025 differs from the usual temperature",
      subtitle: "How much 2025 differs from this area's usual temperature",
      description:
        "Shows where 2025 behaved differently from the usual pattern across 2013-2025. It does not answer 'where is it hottest?', but rather 'where was 2025 **anomalous compared with its own history**?'.",
      explanation:
        "Blue indicates places with temperature below their usual pattern, white places in line, red places with temperature above their usual pattern. Each point is compared with its own history, not with the rest of the city.",
      details: [
        "A location that is usually hot can appear white if in 2025 it behaved as usual.",
        "A place that is not especially hot in absolute terms can appear red if in 2025 its temperature was above its own history.",
      ],
      inspectNote: "Here the value indicates the difference between 2025 and the usual behaviour of the same location.",
      legendTitle: "Departure from normal",
      legend: [
        "below the usual",
        "slightly below",
        "in line",
        "slightly above",
        "above the usual",
        "well above",
      ],
      method: "",
    },
    climatology: {
      title: "Usual temperature",
      subtitle: "Historical mean 2013-2025: the reference for reading the other layers",
      description:
        "Shows the **historical mean** of surface temperature across summers 2013-2025. It is the baseline map for View 2: it helps you see where the mean surface temperature is normally high or low.",
      explanation:
        "Read it as the usual behaviour of the surface. An industrial area, a large parking lot or parts of the historic centre can show a high surface temperature here even when they are not anomalous: that means the temperature is recurrently high.",
      details: [
        "It differs from the layer in View 1: here you are not reading a selected year, but an average across 13 summers.",
        "It helps separate usual heat from anomalous heat.",
      ],
      moreInfo: [
        "If an area shows a high temperature on this map it means that area tends to have a high surface temperature across the 2013-2025 series.",
        "This map is the starting point for understanding the following maps: first you see the average behaviour, then you read where heat is chronic or anomalous.",
      ],
      inspectNote: "Computed on the observed surface.",
      legendTitle: "Historical mean 2013-2025",
      legend: ["historically lowest", "low", "intermediate", "high", "very high", "historically among the highest"],
    },
    persistenceTemporal: {
      title: "Areas often anomalous",
      subtitle: "Places that heated beyond their usual pattern in several years",
      description:
        "This map shows how many times an area was **anomalous compared with its own history**. It does not look for places that are always hot: it looks for places that, in some years, become hotter than they usually are.",
      explanation:
        "An area can be very hot yet show few anomalies if it is hot in almost the same way every year. A central urban area, for example, can be constantly hot but vary little from year to year.",
      details: [
        "The number indicates in how many summers that point was anomalous compared with itself.",
        "Rare anomalies do not automatically mean low temperatures: they can also indicate stable, consistently high temperatures.",
        "The highest value observed in this dataset is 5 years: not all 13 summers produced anomalies in the same location.",
      ],
      moreInfo: [
        "Read this map together with **Chronically hot areas**. If an area has few anomalies but many chronic years, it is probably a stable critical area rather than a temporary exception.",
        "If an area has many anomalies but is not chronic, it may be a place whose behaviour changes in specific years.",
      ],
      inspectNote: "Few anomalies do not necessarily mean low temperatures: also check the chronically hot areas layer.",
      legendTitle: "Anomaly persistence",
      legend: ["0 years", "1 year", "2 years", "3 years", "4 years", "5 years"],
      numericLegend: ["0", "1", "2", "3", "4", "5 years"],
      legendStops: [
        { label: "0 years", color: "#fffdf0", accessibleColor: "#f7fcf0" },
        { label: "1 year", color: "#fee391", accessibleColor: "#ccebc5" },
        { label: "2 years", color: "#fec44f", accessibleColor: "#7bccc4" },
        { label: "3 years", color: "#fe9929", accessibleColor: "#43a2ca" },
        { label: "4 years", color: "#e31a1c", accessibleColor: "#0868ac" },
        { label: "5 years", color: "#b10026", accessibleColor: "#00204d" },
      ],
    },
    persistenceStructural: {
      title: "Chronically hot areas",
      subtitle: "Places that rank among the city's areas with the highest surface temperature in many years",
      description:
        "Shows how many times each point ranked within the **top 5% of areas with the highest surface temperature** in Bologna. Here 'chronic' means a repeated critical condition in urban space, year after year.",
      explanation:
        "Use it to identify places that often have the highest surface temperature in the city, even when they are not anomalous compared with their own history.",
      details: [
        "The number can reach 13 because the display covers 13 summers, from 2013 to 2025.",
        "Compare it with 'Chronic heat and anomalous heat' to understand whether a critical condition is stable, recurring or both.",
      ],
      moreInfo: [
        "To understand why an area is chronic, move to View 3 and look at vegetation and how reflective the surfaces are: little greenery and dark or absorbent surfaces often help explain the pattern.",
      ],
      followUps: [
        { label: "Go to Vegetation presence", view: "v3", stateKey: "view3Layer", layer: "ndvi" },
        { label: "Go to Reflective surfaces", view: "v3", stateKey: "view3Layer", layer: "albedo" },
      ],
      inspectNote: "",
      legendTitle: "Structural persistence",
      legend: ["0 years", "1 year", "2-4 years", "5-8 years", "9-12 years", "13 years"],
      numericLegend: ["0", "1", "2-4", "5-8", "9-12", "13 years"],
      legendStops: [
        { label: "0 years", color: "#fffdf0", accessibleColor: "#f7fcf0" },
        { label: "1 year", color: "#fee391", accessibleColor: "#ccebc5" },
        { label: "2-4 years", color: "#fec44f", accessibleColor: "#7bccc4" },
        { label: "5-8 years", color: "#fc4e2a", accessibleColor: "#43a2ca" },
        { label: "9-12 years", color: "#bd0026", accessibleColor: "#0868ac" },
        { label: "13 years", color: "#800026", accessibleColor: "#00204d" },
      ],
    },
    chronicVsAnomalous2025: {
      title: "Chronic heat and 2025 anomalies",
      subtitle: "Separates long-term critical areas from those that emerged in 2025",
      description:
        "Crosses multi-year chronic heat with the 2025 anomaly. It helps distinguish long-standing critical areas from those that emerged in the latest available year.",
      explanation:
        "Orange indicates chronic heat; purple indicates a 2025 anomaly; the darker colour indicates both conditions in the same location.",
      details: [
        "Chronic means that the point falls within the **top 5% of areas with the highest surface temperature** of the selected year (2025).",
        "Anomalous 2025 means that in 2025 the point was **anomalous compared with its own history**.",
        "The both class marks places that were already critical and in 2025 also behaved outside the norm.",
      ],
      inspectNote: "This class combines two readings: structural heat compared with the city and the 2025 anomaly compared with the point's own history.",
      legendTitle: "4 classes",
      legend: ["no critical pattern", "chronic", "2025 anomaly", "chronic and anomalous"],
    },
    structuralVsTemporal: {
      title: "Chronic heat and anomalous heat",
      subtitle: "Separates places that are always hot from those often anomalous",
      description:
        "Crosses, for the full 2013-2025 period, how many times an area ranked in the **top 5% of areas with the highest surface temperature** and how many times it was **anomalous compared with its own history**.",
      explanation:
        "",
      details: [
        "Orange increases with the years of chronic heat.",
        "Purple increases with the years of anomalous heat.",
        "Where the two conditions coexist, the colour is mixed: it signals both structural criticality and recurring anomalies.",
        "Chronic reaches 13 years because the series covers 13 summers. Anomalous reaches 5 years because that is the maximum currently present in the anomaly persistence dataset.",
      ],
      moreInfo: [
        "Low anomaly does not necessarily mean low temperatures. It can also indicate a place that is always hot and stable, such as some parts of the historic centre.",
        "If you see a lot of orange and little purple, the issue is mainly structural. If you see a lot of purple, the behaviour changes more often relative to local history.",
        "To understand the physical causes, explore View 3: vegetation, reflective surfaces and materials help explain why an area holds or accumulates heat.",
      ],
      followUps: [
        { label: "Go to Vegetation presence", view: "v3", stateKey: "view3Layer", layer: "ndvi" },
        { label: "Go to Reflective surfaces", view: "v3", stateKey: "view3Layer", layer: "albedo" },
      ],
      inspectNote: "",
      legendTitle: "Chronic/anomalous intensity",
      legend: ["chronic: 1-13 years", "anomalous: 1-5 years", "both: mixed colours"],
    },
  },
  view3Layers: {
    uhei: {
      title: "Overall heat exposure",
      subtitle: "Where high surface temperature, little vegetation and dark surfaces show up together",
      description:
        "Shows where three conditions overlap in the same place: higher surface temperatures, limited vegetation and surfaces that reflect little sunlight. When all three meet, overall heat exposure is higher — not because any single cause is enough on its own, but because they reinforce each other.",
      explanation:
        "It is the guiding layer in View 3. Use it to identify where interventions should be integrated: not only trees, not only materials, but a combination of factors.",
      details: [
        "Higher values indicate greater overall exposure to high surface temperatures.",
        "It is not a health or social measure: it describes physical conditions observed by satellite.",
        "Read it together with the vegetation and albedo layers to understand which factor weighs more.",
      ],
      valueInfo:
        "This value is a **synthetic index, not a temperature in °C**. The number combines surface temperature, limited vegetation and poorly reflective surfaces: higher values indicate physical conditions that are more exposed to heat.",
      legendTitle: "Heat exposure",
      legend: ["very favorable", "favorable", "intermediate", "exposed", "very exposed"],
    },
    ndvi: {
      title: "Vegetation presence",
      subtitle: "Helps identify where greenery can contribute more to heat mitigation",
      description:
        "Shows where vegetation is more present. In practical terms it helps identify parks, tree lines, agricultural areas and places where greenery can help mitigate heat.",
      explanation:
        "Beige means little observable vegetation, dark green means denser and healthier vegetation.",
      details: [
        "This is a satellite index: it separates vegetated surfaces from mineral or built surfaces.",
      ],
      valueInfo:
        "This is a **vegetation index**, not a percentage and not a temperature. In this reading it ranges from 0 to 1: close to 0 means little observable greenery, close to 1 means more present and healthier vegetation.",
      legendTitle: "Vegetation",
      legend: ["little vegetation", "intermediate vegetation", "dense vegetation"],
    },
    albedo: {
      title: "More reflective and more absorbent surfaces",
      subtitle: "Useful for separating more reflective surfaces from those that absorb more heat",
      description:
        "Indicates how much surfaces reflect sunlight instead of absorbing it as heat. Dark surfaces tend to accumulate more heat; more reflective surfaces can help reduce it.",
      explanation:
        "The scale uses quantiles because albedo varies only slightly across Bologna: small differences can still help read roofs, paved areas and urban materials.",
      details: [
        "Lower values indicate more absorbent surfaces; higher values more reflective surfaces.",
        "High albedo alone is not enough to solve heat: vegetation, ventilation, shade and materials all matter.",
      ],
      valueInfo:
        "Albedo is the **share of sunlight reflected** by the surface, not a temperature. A value of 0.20 means roughly 20% of light is reflected: lower values indicate more absorbent surfaces.",
      legend: ["absorbent", "intermediate", "reflective"],
    },
    hvi: {
      title: "Surface temperature and lack of vegetation",
      subtitle: "Helps show where additional greenery could make a bigger difference",
      description:
        "A deeper-reading layer: it combines surface temperature and lack of greenery. It is useful when you want to see where vegetation could have the greatest impact.",
      explanation:
        "Red means high temperature with little vegetation; blue means lower temperature and greener. It does not replace the overall heat exposure index: it explains one of its components.",
      details: [
        "Use it to read the relationship between surface temperature and vegetation.",
        "It is more useful for reasoning about mitigation priorities than for describing a temperature.",
      ],
      valueInfo:
        "This is a **comparative index**, not a measure in °C. Positive values indicate situations where high surface temperature and limited vegetation weigh more; negative values indicate conditions with lower temperatures or more vegetation.",
      legendTitle: "Temperature and vegetation",
      legend: ["low and green", "intermediate", "high and low vegetation"],
    },
    hri: {
      title: "Surface temperature and poorly reflective surfaces",
      subtitle: "Helps read the weight of roofs, pavements and materials that absorb heat",
      description:
        "A deeper-reading layer: it combines surface temperature and poorly reflective surfaces. It helps show where materials, roofs and pavements may contribute to heat.",
      explanation:
        "Red means high temperature with dark or absorbent surfaces; blue means lower temperature and more reflective. It does not replace the overall heat exposure index: it explains one of its components.",
      details: [
        "Use it to read the relationship between surface temperature and absorbent materials.",
        "It supports reasoning about pavements, roofs, paved areas and mineral surfaces.",
      ],
      valueInfo:
        "This is a **comparative index**, not a temperature. Positive values indicate high temperature associated with poorly reflective surfaces; negative values indicate lower temperatures or more reflective surfaces.",
      legendTitle: "Temperature and surfaces",
      legend: ["low temp., reflective", "intermediate", "high temp., absorbent"],
    },
  },
  deltaLayer: {
    title: "Difference between day and night",
    subtitle: "Where the surface temperature drops a lot at night and where it tends to stay high",
    description:
      "Shows how much temperature changes between day and night on the observed surface. A high value means the surface is much hotter by day than at night; a low value means it changes less.",
    explanation:
      "This map does not simply say where it is hottest. It helps read the daily behaviour of surfaces. The centre can cool around the average at night, but during the day it can absorb a lot of heat because it has many absorbent surfaces. Hills can show a lower difference because their temperature is already lower and they accumulate less heat to lose.",
    details: [
      "The grid is coarser than the Landsat layers: each cell represents a broad area of about 1 km.",
      "A low value should not automatically be read as a problem: it can indicate a place that stays warm, but also a place that does not heat up much during the day.",
    ],
    moreInfo: [
      "To read it well you need to keep two questions together: how much the area heats up during the day and how much it changes overnight.",
      "That is why this view should be read alongside the daytime heat maps and the physical drivers: vegetation, albedo and materials help explain why different areas behave differently.",
    ],
    inspectNote: ".",
    legendTitle: "Cooling",
    legend: ["little cooling", "medium", "strong cooling"],
  },
  districtMetrics: {
    uhei: {
      label: "Heat exposure",
      description: "Summary of overall heat exposure.",
      valueInfo:
        "It is the **mean synthetic index of the selected area**, not a temperature and not a direct measure of health risk. It summarizes three physical conditions: **surface temperature**, **vegetation presence** and **the ability of surfaces to reflect light**. The number has no unit: it is mainly used to compare selected areas with one another. Higher values indicate a less favorable combination; lower values do not mean there is no heat, only that average conditions are less critical.",
    },
    lst: {
      label: "Surface temperature",
      description: "Mean surface temperature.",
      valueInfo:
        "It is the **mean surface temperature** of the selected area, expressed in °C. It describes how much roofs, roads, paved areas and vegetation observed by satellite heat up.",
    },
    anomaly: {
      label: "Departure from normal",
      description: "How much 2025 differs from the area's usual behaviour.",
      valueInfo:
        "It is the **mean 2025 departure** from the usual behaviour of the same selected area. It is measured in °C because it compares two surface temperatures. A positive value means the area's temperature was above its usual pattern in 2025; a negative value means it was below the usual pattern. It does not say whether the area is hot in absolute terms: it says how much 2025 diverged from its own history.",
    },
    hotspotPercent: {
      label: "Critical area share",
      description: "Percentage of the area classified as critical.",
      valueInfo:
        "It is the **percentage of the selected area's surface** that falls within the critical areas of the currently selected map. It is not a temperature and it does not say how many people are exposed: it measures how much surface is involved. A high value means the phenomenon is widespread; a low value can indicate more localized critical spots.",
    },
  },
  rasterOverlays: {
    temporalHotspot: {
      title: "Exceptionally hot areas",
    },
  },
};

const englishTitlePatterns = {
  highlight: /^(Bologna|surface|normal|changed|time|heat|city|districts|statistical|areas|summer)$/i,
  split: /(Bologna|surface|normal|changed|time|heat|city|districts|statistical|areas|summer)/gi,
};

const localizedData = {
  it: {
    views: italianViews,
    viewCopy: italianViewCopy,
    titlePatterns: {
      highlight: italianTitleHighlightPattern,
      split: italianTitleSplitPattern,
    },
    view2LayersWithoutValuesToggle,
    years,
    yearlyStats,
    view1Layers: italianView1Layers,
    view2Layers: italianView2Layers,
    view3Layers: italianView3Layers,
    deltaLayer: italianDeltaLayer,
    districtMetrics: italianDistrictMetrics,
    districts,
    dataAvailability,
    rasterOverlays: italianRasterOverlays,
  },
  en: {
    views: englishViews,
    viewCopy: englishViewCopy,
    titlePatterns: englishTitlePatterns,
    view2LayersWithoutValuesToggle,
    years,
    yearlyStats,
    view1Layers: localizeCollection(italianView1Layers, englishLayerOverrides.view1Layers),
    view2Layers: localizeCollection(italianView2Layers, englishLayerOverrides.view2Layers),
    view3Layers: localizeCollection(italianView3Layers, englishLayerOverrides.view3Layers),
    deltaLayer: mergeLocalized(italianDeltaLayer, englishLayerOverrides.deltaLayer),
    districtMetrics: localizeCollection(italianDistrictMetrics, englishLayerOverrides.districtMetrics),
    districts,
    dataAvailability,
    rasterOverlays: localizeCollection(italianRasterOverlays, englishLayerOverrides.rasterOverlays),
  },
};

export function getLocalizedData(language) {
  return localizedData[normalizeLanguage(language)];
}