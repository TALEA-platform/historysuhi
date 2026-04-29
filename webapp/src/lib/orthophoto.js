export const AVAILABLE_ORTHOPHOTO_YEARS = Object.freeze([2017, 2018, 2020, 2021, 2022, 2023, 2024, 2025]);
export const EARLIEST_ORTHOPHOTO_YEAR = AVAILABLE_ORTHOPHOTO_YEARS[0];
export const LATEST_ORTHOPHOTO_YEAR = AVAILABLE_ORTHOPHOTO_YEARS[AVAILABLE_ORTHOPHOTO_YEARS.length - 1];
export const ORTHOPHOTO_AVAILABLE_YEARS_LABEL = "2017, 2018, 2020-2025";

function normalizeOrthophotoYear(year) {
  const numericYear = Number(year);
  return Number.isFinite(numericYear) ? Math.round(numericYear) : LATEST_ORTHOPHOTO_YEAR;
}

export function resolveOrthophotoYear(requestedYear = LATEST_ORTHOPHOTO_YEAR) {
  const year = normalizeOrthophotoYear(requestedYear);
  if (year <= EARLIEST_ORTHOPHOTO_YEAR) return EARLIEST_ORTHOPHOTO_YEAR;

  const exactYear = AVAILABLE_ORTHOPHOTO_YEARS.find((item) => item === year);
  if (exactYear) return exactYear;

  const nextAvailableYear = AVAILABLE_ORTHOPHOTO_YEARS.find((item) => item > year);
  return nextAvailableYear || LATEST_ORTHOPHOTO_YEAR;
}

export function getOrthophotoConfig(requestedYear = LATEST_ORTHOPHOTO_YEAR) {
  const year = resolveOrthophotoYear(requestedYear);
  return {
    year,
    tiles: [`https://sitmappe.comune.bologna.it/tms/tileserver/Ortofoto${year}/{z}/{x}/{y}.png`],
    attribution: `SIT Comune di Bologna · Ortofoto ${year}`,
  };
}