import proj4 from "proj4";
import { appUrl } from "./appPaths.js";

const GEOMETRY_EPSILON = 0.000001;
const VIEW4_HALF_CELL_SIZE = 500.0001;
const BOLOGNA_BOUNDARY_URL = appUrl("data/webapp_vectors/bologna_boundary_outline.geojson");

proj4.defs(
  "EPSG:32632",
  "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs",
);

export const csvInfoSources = {
  albedoDeltaPairs: appUrl("data/csv_info/albedo_ndvi_delta_2025_1km_pairs.csv"),
  albedoDeltaStats: appUrl("data/csv_info/albedo_deltalst_2025_1km_stats.csv"),
  compositeIndices: appUrl("data/csv_info/composite_indices_2025_summary.csv"),
  structuralTemporalYearly: appUrl("data/csv_info/hotspot_structural_vs_anomalous_2013_2025_yearly_counts.csv"),
  structuralTemporalYearlyNew: appUrl("data/csv_info/hotspot_structural_vs_anomalous_2013_2025_yearly_counts_new.csv"),
  chronicAnomalous2025: appUrl("data/csv_info/hotspot_structural_vs_anomalous_2025_summary.csv"),
  chronicAnomalous2025New: appUrl("data/csv_info/hotspot_structural_vs_anomalous_new_2025_summary.csv"),
  chronicAnomalousPersistence: appUrl("data/csv_info/hotspot_structural_vs_anomalous_persistence_2013_2025_summary.csv"),
  lstAnomalies: appUrl("data/csv_info/LST_summary_anomalies_median_30m.csv"),
  lstYearlyInput: appUrl("data/csv_info/LST_yearly_input_summary_median_30m.csv"),
  normalized2025: appUrl("data/csv_info/normalized_2025_summary.csv"),
  temporalPersistence: appUrl("data/csv_info/temporal_hotspot_persistence_summary.csv"),
  temporalHotspot: appUrl("data/csv_info/temporal_hotspot_summary.csv"),
  lstAcquisitions: appUrl("data/csv_data_download/Bologna_LST_metadata_2013_2025_v2.csv"),
  zscoreSpatial2025: appUrl("data/csv_info/zscore_spatial_2025_summary.csv"),
};

function projectRingToUtm(ring) {
  return ring.map(([lng, lat]) => proj4("EPSG:4326", "EPSG:32632", [lng, lat]));
}

function pointOnSegment([px, py], [ax, ay], [bx, by]) {
  const squaredLength = ((bx - ax) ** 2) + ((by - ay) ** 2);
  if (squaredLength <= GEOMETRY_EPSILON) return false;

  const cross = ((py - ay) * (bx - ax)) - ((px - ax) * (by - ay));
  if (Math.abs(cross) > GEOMETRY_EPSILON) return false;

  const dot = ((px - ax) * (bx - ax)) + ((py - ay) * (by - ay));
  if (dot < 0) return false;

  return dot <= squaredLength;
}

function pointInRing(point, ring) {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const current = ring[index];
    const prior = ring[previous];

    if (pointOnSegment(point, prior, current)) return true;

    const intersects = ((current[1] > point[1]) !== (prior[1] > point[1]))
      && (point[0] < (((prior[0] - current[0]) * (point[1] - current[1])) / ((prior[1] - current[1]) || GEOMETRY_EPSILON)) + current[0]);

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point, polygonRings) {
  if (!polygonRings.length || !pointInRing(point, polygonRings[0])) return false;
  return !polygonRings.slice(1).some((hole) => pointInRing(point, hole));
}

function pointInBounds([x, y], bounds) {
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

function segmentsIntersect(a1, a2, b1, b2) {
  const orientation = ([px, py], [qx, qy], [rx, ry]) => ((qx - px) * (ry - py)) - ((qy - py) * (rx - px));
  const first = orientation(a1, a2, b1);
  const second = orientation(a1, a2, b2);
  const third = orientation(b1, b2, a1);
  const fourth = orientation(b1, b2, a2);

  if (Math.abs(first) <= GEOMETRY_EPSILON && pointOnSegment(b1, a1, a2)) return true;
  if (Math.abs(second) <= GEOMETRY_EPSILON && pointOnSegment(b2, a1, a2)) return true;
  if (Math.abs(third) <= GEOMETRY_EPSILON && pointOnSegment(a1, b1, b2)) return true;
  if (Math.abs(fourth) <= GEOMETRY_EPSILON && pointOnSegment(a2, b1, b2)) return true;

  return ((first > 0) !== (second > 0)) && ((third > 0) !== (fourth > 0));
}

function buildCellBounds(centroidX, centroidY, halfSize = VIEW4_HALF_CELL_SIZE) {
  return {
    minX: centroidX - halfSize,
    minY: centroidY - halfSize,
    maxX: centroidX + halfSize,
    maxY: centroidY + halfSize,
  };
}

function cellIntersectsPolygon(bounds, polygonRings) {
  const corners = [
    [bounds.minX, bounds.minY],
    [bounds.minX, bounds.maxY],
    [bounds.maxX, bounds.maxY],
    [bounds.maxX, bounds.minY],
  ];
  const squareEdges = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]],
  ];

  if (corners.some((point) => pointInPolygon(point, polygonRings))) return true;
  if (polygonRings[0]?.some((point) => pointInBounds(point, bounds))) return true;

  return polygonRings.some((ring) => ring.some((point, index) => {
    const previous = ring[(index - 1 + ring.length) % ring.length];
    return squareEdges.some(([start, end]) => segmentsIntersect(previous, point, start, end));
  }));
}

function buildBolognaBoundaryPolygons(geojson) {
  const geometry = geojson?.features?.[0]?.geometry;
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return [geometry.coordinates.map(projectRingToUtm)];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon.map(projectRingToUtm));
  }

  return [];
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values, averageValue) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + ((value - averageValue) ** 2), 0) / values.length;
}

function standardDeviation(values, averageValue) {
  const varianceValue = variance(values, averageValue);
  return varianceValue == null ? null : Math.sqrt(varianceValue);
}

function covariance(points, meanX, meanY) {
  if (!points.length) return null;
  return points.reduce((sum, point) => sum + ((point.x - meanX) * (point.y - meanY)), 0) / points.length;
}

function buildFilteredAlbedoDeltaRows(tables, boundaryPolygons) {
  return (tables.albedoDeltaPairs || [])
    .map((row) => ({
      row: row.row,
      col: row.col,
      centroidX: row.x,
      centroidY: row.y,
      x: row.albedo_mean_1km,
      y: row.delta_lst_1km,
      z: row.ndvi_mean_1km,
    }))
    .filter((row) => (
      Number.isFinite(row.centroidX)
      && Number.isFinite(row.centroidY)
      && Number.isFinite(row.x)
      && Number.isFinite(row.y)
      && boundaryPolygons.some((polygon) => cellIntersectsPolygon(buildCellBounds(row.centroidX, row.centroidY), polygon))
    ));
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
      continue;
    }
    cell += char;
  }

  cells.push(cell);
  return cells;
}

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : trimmed;
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, parseValue(cells[index] ?? "")]));
  });
}

function buildYearlyStats(tables) {
  const lstRows = tables.lstAnomalies || [];
  const hotspotRows = new Map((tables.temporalHotspot || []).map((row) => [row.year, row]));
  return lstRows
    .map((row) => {
      const hotspot = hotspotRows.get(row.year);
      return {
        year: row.year,
        lst: row.lst_mean,
        anomaly: row.anom_mean,
        hotspot: hotspot ? hotspot.temporal_hotspot_fraction * 100 : 0,
      };
    })
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.lst))
    .sort((a, b) => a.year - b.year);
}

function buildYearlyDetails(tables) {
  const hotspotRows = new Map((tables.temporalHotspot || []).map((row) => [row.year, row]));
  const acquisitions = buildAcquisitionDetails(tables);
  return Object.fromEntries((tables.lstAnomalies || []).map((row) => {
    const hotspot = hotspotRows.get(row.year);
    const acquisition = acquisitions[row.year] || null;
    return [
      row.year,
      {
        year: row.year,
        period: row.label || "summer",
        lstCount: row.lst_count,
        lstMean: row.lst_mean,
        lstMedian: row.lst_p50,
        lstP95: row.lst_p95,
        anomalyMean: row.anom_mean,
        anomalyMedian: row.anom_p50,
        zMean: row.z_mean,
        hotspotFraction: hotspot ? hotspot.temporal_hotspot_fraction * 100 : null,
        strongHotspotFraction: hotspot ? hotspot.temporal_hotspot_strong_fraction * 100 : null,
        structuralThreshold: hotspot?.structural_hotspot_threshold ?? null,
        acquisition,
      },
    ];
  }));
}

function getYearFromDate(date) {
  const year = Number(String(date).slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatSatelliteName(value) {
  return String(value || "")
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildAcquisitionDetails(tables) {
  const rowsByYear = new Map();
  for (const row of tables.lstAcquisitions || []) {
    const year = getYearFromDate(row.date);
    if (!year) continue;
    const rows = rowsByYear.get(year) || [];
    rows.push(row);
    rowsByYear.set(year, rows);
  }

  return Object.fromEntries([...rowsByYear.entries()].map(([year, rows]) => {
    const sorted = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const clearCoverage = sorted.map((row) => row.valid_pixels_percent).filter(Number.isFinite);
    return [
      year,
      {
        year,
        sceneCount: sorted.length,
        startDate: sorted[0]?.date ?? null,
        endDate: sorted[sorted.length - 1]?.date ?? null,
        dates: sorted.map((row) => row.date).filter(Boolean),
        utcTimes: sorted.map((row) => row.time_UTC).filter(Boolean),
        satellites: unique(sorted.map((row) => formatSatelliteName(row.satellite))),
        clearCoverageMean: average(clearCoverage),
        clearCoverageMin: clearCoverage.length ? Math.min(...clearCoverage) : null,
        clearCoverageMax: clearCoverage.length ? Math.max(...clearCoverage) : null,
        cloudyPassages: clearCoverage.filter((value) => value < 50).length,
      },
    ];
  }));
}

function buildDeltaStats(rows) {
  if (!rows.length) return null;

  const xValues = rows.map((row) => row.x);
  const yValues = rows.map((row) => row.y);
  const albedoMean = mean(xValues);
  const deltaMean = mean(yValues);
  const varianceX = Math.max(GEOMETRY_EPSILON, variance(xValues, albedoMean));
  const varianceY = Math.max(GEOMETRY_EPSILON, variance(yValues, deltaMean));
  const albedoStd = Math.sqrt(varianceX);
  const deltaStd = Math.sqrt(varianceY);
  const covarianceValue = covariance(rows, albedoMean, deltaMean);
  const slope = covarianceValue / varianceX;

  return {
    count: rows.length,
    deltaMean,
    deltaStd,
    albedoMean,
    albedoStd,
    pearson: covarianceValue / Math.sqrt(varianceX * varianceY),
    slope,
    intercept: deltaMean - (slope * albedoMean),
  };
}

function buildAlbedoDeltaPairs(rows) {
  return rows
    .map((row) => {
      const [lng, lat] = proj4("EPSG:32632", "EPSG:4326", [row.centroidX, row.centroidY]);
      return {
        key: `${row.centroidX}:${row.centroidY}`,
        row: row.row,
        col: row.col,
        centroidX: row.centroidX,
        centroidY: row.centroidY,
        lng,
        lat,
        x: row.x,
        y: row.y,
        z: row.z,
      };
    })
    .filter((row) => (
      Number.isFinite(row.x)
      && Number.isFinite(row.y)
      && Number.isFinite(row.centroidX)
      && Number.isFinite(row.centroidY)
      && Number.isFinite(row.lng)
      && Number.isFinite(row.lat)
    ));
}

function buildNdviDeltaStats(rows) {
  const filtered = rows.filter((row) => Number.isFinite(row.z));
  if (!filtered.length) return null;

  const zValues = filtered.map((row) => row.z);
  const yValues = filtered.map((row) => row.y);
  const ndviMean = mean(zValues);
  const deltaMean = mean(yValues);
  const varianceZ = Math.max(GEOMETRY_EPSILON, variance(zValues, ndviMean));
  const varianceY = Math.max(GEOMETRY_EPSILON, variance(yValues, deltaMean));
  const ndviStd = Math.sqrt(varianceZ);
  const deltaStd = Math.sqrt(varianceY);
  const covarianceValue = filtered.reduce(
    (sum, row) => sum + ((row.z - ndviMean) * (row.y - deltaMean)),
    0,
  ) / filtered.length;
  const slope = covarianceValue / varianceZ;

  return {
    count: filtered.length,
    ndviMean,
    ndviStd,
    deltaMean,
    deltaStd,
    pearson: covarianceValue / Math.sqrt(varianceZ * varianceY),
    slope,
    intercept: deltaMean - (slope * ndviMean),
  };
}

export async function loadCsvInfo() {
  const [entries, boundaryResponse] = await Promise.all([
    Promise.all(
      Object.entries(csvInfoSources).map(async ([key, url]) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Cannot load ${url}`);
        return [key, parseCsv(await response.text())];
      }),
    ),
    fetch(BOLOGNA_BOUNDARY_URL),
  ]);

  if (!boundaryResponse.ok) {
    throw new Error(`Cannot load ${BOLOGNA_BOUNDARY_URL}`);
  }

  const tables = Object.fromEntries(entries);
  const boundaryPolygons = buildBolognaBoundaryPolygons(await boundaryResponse.json());
  const filteredAlbedoDeltaRows = buildFilteredAlbedoDeltaRows(tables, boundaryPolygons);

  return {
    tables,
    yearlyStats: buildYearlyStats(tables),
    yearlyDetails: buildYearlyDetails(tables),
    acquisitionDetails: buildAcquisitionDetails(tables),
    deltaStats: buildDeltaStats(filteredAlbedoDeltaRows),
    ndviDeltaStats: buildNdviDeltaStats(filteredAlbedoDeltaRows),
    albedoDeltaPairs: buildAlbedoDeltaPairs(filteredAlbedoDeltaRows),
  };
}
