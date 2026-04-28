// Locale-aware formatters for the Italian UI.
// Kept pure (no React, no DOM) so they can be reused across components and tested.

function getLocale(language = "it") {
  return language === "en" ? "en-GB" : "it-IT";
}

function getMissingValue(language = "it") {
  return language === "en" ? "n/a" : "n.d.";
}

export function formatPeriod(label, year, language = "it") {
  if (label === "summer") {
    return language === "en" ? `Summer ${year} (1 June - 31 August)` : `Estate ${year} (1 giugno - 31 agosto)`;
  }
  return `${label || (language === "en" ? "Aggregated period" : "Periodo aggregato")} ${year}`;
}

export function formatDecimal(value, digits = 1, language = "it") {
  return Number.isFinite(value)
    ? value.toLocaleString(getLocale(language), { maximumFractionDigits: digits, minimumFractionDigits: digits })
    : getMissingValue(language);
}

export function formatPercent(value, digits = 1, language = "it") {
  return Number.isFinite(value) ? `${formatDecimal(value, digits, language)}%` : getMissingValue(language);
}

export function formatIsoDate(date, language = "it") {
  if (!date) return getMissingValue(language);
  const parsed = new Date(`${date}T00:00:00Z`);
  const formatted = new Intl.DateTimeFormat(getLocale(language), { day: "numeric", month: "short" }).format(parsed);
  return language === "en" ? formatted : formatted.replace(".", "");
}

export function formatDateRange(acquisition, year, period, language = "it") {
  if (!acquisition?.startDate || !acquisition?.endDate) return formatPeriod(period, year, language);
  return `${formatIsoDate(acquisition.startDate, language)} - ${formatIsoDate(acquisition.endDate, language)} ${year}`;
}

function parseUtcTimeToMinutes(time) {
  const match = String(time || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatClock(minutes) {
  // Wrap into [0, 1440) so a +120 minute shift past midnight folds back into a valid clock face.
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatLocalSummerTime(utcTimes = [], language = "it") {
  const minutes = utcTimes.map(parseUtcTimeToMinutes).filter(Number.isFinite);
  if (!minutes.length) return getMissingValue(language);
  const averageMinutes = minutes.reduce((sum, value) => sum + value, 0) / minutes.length;
  // +120 = UTC -> CEST (Italian summer time). Round to 5-minute buckets.
  const roundedToFiveMinutes = Math.round((averageMinutes + 120) / 5) * 5;
  return language === "en"
    ? `around ${formatClock(roundedToFiveMinutes)} (local summer time)`
    : `circa le ${formatClock(roundedToFiveMinutes)} (ora locale estiva)`;
}
