import { fromArrayBuffer } from "geotiff";
import proj4 from "proj4";
import { appUrl } from "./appPaths.js";

proj4.defs(
  "EPSG:32632",
  "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs",
);

const dataCache = new Map();
const renderCache = new Map();
const boundaryCache = new Map();
const maskCache = new Map();
const BOLOGNA_BOUNDARY_URL = appUrl("data/webapp_vectors/bologna_boundary_outline.geojson");
const RASTER_FETCH_TIMEOUT_MS = 20000;
const RASTER_FETCH_RETRIES = 2;

const palettesByMode = {
  default: {
    surfaceHeat: ["#2c7bb6", "#00a6ca", "#7fd5d2", "#ffffbf", "#fdae61", "#f46d43", "#a50026"],
    habitualHeat: ["#355c7d", "#6c8fb0", "#b8c6bf", "#f1ead0", "#d9b26f", "#a86f4c", "#6f3f37"],
    thermal: ["#fff5c0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
    diverging: ["#2166ac", "#4393c3", "#92c5de", "#f7f7f7", "#f4a582", "#d6604d", "#b2182b"],
    green: ["#f5f0d0", "#d9e8a3", "#87c472", "#21a84a", "#004d19"],
    albedo: ["#111111", "#444444", "#808080", "#c0c0c0", "#f5f5f5"],
    uhei: ["#004d19", "#87c472", "#fed976", "#fd8d3c", "#e31a1c", "#b10026"],
    persistence: ["#fff5c0", "#feb24c", "#fc4e2a", "#e31a1c", "#b10026"],
  },
  accessible: {
    surfaceHeat: ["#00204d", "#174a7e", "#3f6f8f", "#728c8a", "#a69f72", "#d7b955", "#ffe604"],
    habitualHeat: ["#2d004b", "#542788", "#8073ac", "#b2abd2", "#d8daeb", "#fee08b", "#d95f0e"],
    thermal: ["#f7fcf0", "#ccebc5", "#7bccc4", "#43a2ca", "#0868ac", "#084081", "#00204d"],
    diverging: ["#5e4fa2", "#3288bd", "#66c2a5", "#ffffbf", "#fdae61", "#f46d43", "#9e0142"],
    green: ["#f7fcf0", "#ccebc5", "#7bccc4", "#2b8cbe", "#084081"],
    albedo: ["#3a1f0d", "#6b3e1c", "#9c6f3e", "#c8a070", "#f0dca9"],
    uhei: ["#f7fcf0", "#ccebc5", "#7bccc4", "#43a2ca", "#0868ac", "#00204d"],
    persistence: ["#f7fcf0", "#ccebc5", "#7bccc4", "#43a2ca", "#0868ac", "#00204d"],
  },
};

const categoryColorsByMode = {
  default: {
    hotspot: {
      1: [178, 0, 0, 205],
    },
    hotAnomalous: {
      0: [245, 241, 232, 255],
      1: [253, 174, 97, 255],
      2: [201, 148, 199, 255],
      3: [103, 0, 31, 255],
      10: [201, 148, 199, 255],
      11: [103, 0, 31, 255],
    },
  },
  accessible: {
    hotspot: {
      1: [213, 94, 0, 220],
    },
    hotAnomalous: {
      0: [245, 241, 232, 255],
      1: [230, 159, 0, 255],
      2: [0, 114, 178, 255],
      3: [117, 58, 136, 255],
      10: [0, 114, 178, 255],
      11: [117, 58, 136, 255],
    },
  },
};

function colorToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function getPaletteSet(colorMode) {
  return palettesByMode[colorMode] || palettesByMode.default;
}

function rgbToCss([red, green, blue]) {
  return `rgb(${red} ${green} ${blue})`;
}

function interpolateColor(paletteName, normalized, colorMode = "default") {
  const palettes = getPaletteSet(colorMode);
  const scale = palettes[paletteName] || palettes.thermal;
  const value = Math.max(0, Math.min(1, normalized));
  const scaled = value * (scale.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(scale.length - 1, index + 1);
  const t = scaled - index;
  const a = colorToRgb(scale[index]);
  const b = colorToRgb(scale[next]);
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function getInterpolatedPaletteCss(paletteName, normalized, colorMode = "default") {
  return rgbToCss(interpolateColor(paletteName, normalized, colorMode));
}

export function getPaletteGradientCss(paletteName, colorMode = "default") {
  const palettes = getPaletteSet(colorMode);
  const scale = palettes[paletteName] || palettes.thermal;
  return `linear-gradient(90deg, ${scale.join(", ")})`;
}

function interpolateRgb(scale, normalized) {
  const value = Math.max(0, Math.min(1, normalized));
  const scaled = value * (scale.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(scale.length - 1, index + 1);
  const t = scaled - index;
  const a = colorToRgb(scale[index]);
  const b = colorToRgb(scale[next]);
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function blendRgb(a, b) {
  return [
    Math.round((a[0] + b[0]) / 2),
    Math.round((a[1] + b[1]) / 2),
    Math.round((a[2] + b[2]) / 2),
  ];
}

function noDataPixelColor(index, width, colorMode = "default") {
  const row = Math.floor(index / width);
  const col = index % width;
  const stripe = (row + col) % 10 < 4;
  if (colorMode === "accessible") {
    return stripe ? [191, 200, 205, 245] : [232, 237, 240, 245];
  }
  return stripe ? [201, 206, 198, 245] : [236, 239, 232, 245];
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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

function parseCsvValue(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : trimmed;
}

function parseCsv(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, parseCsvValue(cells[index] ?? "")]));
  });
}

function isNoData(value, nodata) {
  return !Number.isFinite(value) || (nodata != null && value === nodata) || value <= -9990 || value > 1e20;
}

function isTransparentValue(value, transparentValues = []) {
  return transparentValues.some((transparentValue) => Math.abs(value - transparentValue) <= 0.000001);
}

function stats(values, nodata) {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (isNoData(value, nodata)) continue;
    sum += value;
    sumSq += value * value;
    count += 1;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const mean = count ? sum / count : 0;
  const variance = count ? sumSq / count - mean * mean : 0;
  return {
    count,
    min,
    max,
    mean,
    std: Math.sqrt(Math.max(variance, 0.000001)),
  };
}

function bboxToCoordinates(bbox) {
  const [minX, minY, maxX, maxY] = bbox;
  const topLeft = proj4("EPSG:32632", "EPSG:4326", [minX, maxY]);
  const topRight = proj4("EPSG:32632", "EPSG:4326", [maxX, maxY]);
  const bottomRight = proj4("EPSG:32632", "EPSG:4326", [maxX, minY]);
  const bottomLeft = proj4("EPSG:32632", "EPSG:4326", [minX, minY]);
  return [topLeft, topRight, bottomRight, bottomLeft];
}

function cellBoundsToCoordinates(bounds) {
  const { minX, minY, maxX, maxY } = bounds;
  const topLeft = proj4("EPSG:32632", "EPSG:4326", [minX, maxY]);
  const topRight = proj4("EPSG:32632", "EPSG:4326", [maxX, maxY]);
  const bottomRight = proj4("EPSG:32632", "EPSG:4326", [maxX, minY]);
  const bottomLeft = proj4("EPSG:32632", "EPSG:4326", [minX, minY]);
  return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
}

function cellVertexToCoordinate(bounds, scale, gridX, gridY) {
  const { minX, minY, maxX, maxY } = bounds;
  const x = minX + (((maxX - minX) * gridX) / scale);
  const y = maxY - (((maxY - minY) * gridY) / scale);
  return proj4("EPSG:32632", "EPSG:4326", [x, y]);
}

function subcellBoundsToCoordinates(bounds, scale, col, row) {
  const topLeft = cellVertexToCoordinate(bounds, scale, col, row);
  const topRight = cellVertexToCoordinate(bounds, scale, col + 1, row);
  const bottomRight = cellVertexToCoordinate(bounds, scale, col + 1, row + 1);
  const bottomLeft = cellVertexToCoordinate(bounds, scale, col, row + 1);
  return [topLeft, topRight, bottomRight, bottomLeft, topLeft];
}

function buildVisibleCellMask(renderMask, width, height, scale) {
  if (!renderMask) return null;
  if (scale <= 1) return renderMask;

  const mask = new Uint8Array(width * height);
  const renderWidth = width * scale;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const xStart = col * scale;
      const yStart = row * scale;
      let visible = 0;

      for (let localRow = 0; localRow < scale && !visible; localRow += 1) {
        const baseIndex = (yStart + localRow) * renderWidth;
        for (let localCol = 0; localCol < scale; localCol += 1) {
          if (renderMask[baseIndex + xStart + localCol]) {
            visible = 1;
            break;
          }
        }
      }

      mask[(row * width) + col] = visible;
    }
  }

  return mask;
}

function buildSquareCellFeatureCollection(cell) {
  const geometry = {
    type: "Polygon",
    coordinates: [cellBoundsToCoordinates(cell.bounds)],
  };

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "fill", row: cell.row, col: cell.col, index: cell.index },
        geometry,
      },
      {
        type: "Feature",
        properties: { kind: "outline", row: cell.row, col: cell.col, index: cell.index },
        geometry,
      },
    ],
  };
}

function buildMaskedCellFeatureCollection(cell, renderMask, maskWidth, scale) {
  if (!renderMask || scale <= 1) return buildSquareCellFeatureCollection(cell);

  const xStart = cell.col * scale;
  const yStart = cell.row * scale;
  const fillPolygons = [];
  const outlineSegments = [];
  let visibleCount = 0;

  const isFilled = (localCol, localRow) => {
    if (localCol < 0 || localCol >= scale || localRow < 0 || localRow >= scale) return false;
    return renderMask[((yStart + localRow) * maskWidth) + xStart + localCol] === 1;
  };

  for (let localRow = 0; localRow < scale; localRow += 1) {
    for (let localCol = 0; localCol < scale; localCol += 1) {
      if (!isFilled(localCol, localRow)) continue;

      visibleCount += 1;
      fillPolygons.push([subcellBoundsToCoordinates(cell.bounds, scale, localCol, localRow)]);

      if (!isFilled(localCol, localRow - 1)) {
        outlineSegments.push([
          cellVertexToCoordinate(cell.bounds, scale, localCol, localRow),
          cellVertexToCoordinate(cell.bounds, scale, localCol + 1, localRow),
        ]);
      }
      if (!isFilled(localCol + 1, localRow)) {
        outlineSegments.push([
          cellVertexToCoordinate(cell.bounds, scale, localCol + 1, localRow),
          cellVertexToCoordinate(cell.bounds, scale, localCol + 1, localRow + 1),
        ]);
      }
      if (!isFilled(localCol, localRow + 1)) {
        outlineSegments.push([
          cellVertexToCoordinate(cell.bounds, scale, localCol + 1, localRow + 1),
          cellVertexToCoordinate(cell.bounds, scale, localCol, localRow + 1),
        ]);
      }
      if (!isFilled(localCol - 1, localRow)) {
        outlineSegments.push([
          cellVertexToCoordinate(cell.bounds, scale, localCol, localRow + 1),
          cellVertexToCoordinate(cell.bounds, scale, localCol, localRow),
        ]);
      }
    }
  }

  if (visibleCount === 0) return null;
  if (visibleCount === scale * scale) return buildSquareCellFeatureCollection(cell);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "fill", row: cell.row, col: cell.col, index: cell.index },
        geometry: {
          type: "MultiPolygon",
          coordinates: fillPolygons,
        },
      },
      {
        type: "Feature",
        properties: { kind: "outline", row: cell.row, col: cell.col, index: cell.index },
        geometry: outlineSegments.length === 1
          ? { type: "LineString", coordinates: outlineSegments[0] }
          : { type: "MultiLineString", coordinates: outlineSegments },
      },
    ],
  };
}

function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) <= 0.000001 && Math.abs(a[1] - b[1]) <= 0.000001;
}

function dedupeRingPoints(points) {
  const deduped = [];

  for (const point of points) {
    if (!deduped.length || !samePoint(deduped[deduped.length - 1], point)) {
      deduped.push(point);
    }
  }

  if (deduped.length > 1 && samePoint(deduped[0], deduped[deduped.length - 1])) {
    deduped.pop();
  }

  return deduped;
}

function closeRing(points) {
  if (!points.length) return [];
  return samePoint(points[0], points[points.length - 1]) ? points : [...points, points[0]];
}

function intersectVertical([ax, ay], [bx, by], x) {
  if (Math.abs(bx - ax) <= 0.000001) return [x, ay];
  const t = (x - ax) / (bx - ax);
  return [x, ay + (t * (by - ay))];
}

function intersectHorizontal([ax, ay], [bx, by], y) {
  if (Math.abs(by - ay) <= 0.000001) return [ax, y];
  const t = (y - ay) / (by - ay);
  return [ax + (t * (bx - ax)), y];
}

function clipRingToBounds(ring, bounds) {
  const normalized = dedupeRingPoints(ring);
  if (normalized.length < 3) return null;

  const clipEdges = [
    {
      isInside: ([x]) => x >= bounds.minX - 0.000001,
      intersect: (start, end) => intersectVertical(start, end, bounds.minX),
    },
    {
      isInside: ([x]) => x <= bounds.maxX + 0.000001,
      intersect: (start, end) => intersectVertical(start, end, bounds.maxX),
    },
    {
      isInside: ([, y]) => y >= bounds.minY - 0.000001,
      intersect: (start, end) => intersectHorizontal(start, end, bounds.minY),
    },
    {
      isInside: ([, y]) => y <= bounds.maxY + 0.000001,
      intersect: (start, end) => intersectHorizontal(start, end, bounds.maxY),
    },
  ];

  let output = normalized;

  for (const edge of clipEdges) {
    if (!output.length) return null;
    const input = output;
    output = [];
    let previous = input[input.length - 1];
    let previousInside = edge.isInside(previous);

    for (const current of input) {
      const currentInside = edge.isInside(current);

      if (currentInside) {
        if (!previousInside) output.push(edge.intersect(previous, current));
        output.push(current);
      } else if (previousInside) {
        output.push(edge.intersect(previous, current));
      }

      previous = current;
      previousInside = currentInside;
    }

    output = dedupeRingPoints(output);
  }

  if (output.length < 3) return null;
  return closeRing(output);
}

function projectUtmRingToLngLat(ring) {
  return ring.map((point) => proj4("EPSG:32632", "EPSG:4326", point));
}

function buildClippedCellFeatureCollection(cell, boundaryPolygons) {
  if (!boundaryPolygons?.length) return null;

  const clippedPolygons = boundaryPolygons
    .map((polygon) => polygon
      .map((ring) => clipRingToBounds(ring, cell.bounds))
      .filter(Boolean))
    .filter((polygon) => polygon.length)
    .map((polygon) => polygon.map(projectUtmRingToLngLat));

  if (!clippedPolygons.length) return null;

  const geometry = clippedPolygons.length === 1
    ? { type: "Polygon", coordinates: clippedPolygons[0] }
    : { type: "MultiPolygon", coordinates: clippedPolygons };

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "fill", row: cell.row, col: cell.col, index: cell.index },
        geometry,
      },
      {
        type: "Feature",
        properties: { kind: "outline", row: cell.row, col: cell.col, index: cell.index },
        geometry,
      },
    ],
  };
}

function buildGridDataset(metadata) {
  const {
    url,
    values,
    width,
    height,
    bbox,
    nodata = null,
    rowOffset = 0,
    colOffset = 0,
    ...rest
  } = metadata;
  const [minX, minY, maxX, maxY] = bbox;
  const cellWidth = (maxX - minX) / width;
  const cellHeight = (maxY - minY) / height;

  return {
    url,
    values,
    width,
    height,
    bbox,
    nodata,
    coordinates: bboxToCoordinates(bbox),
    stats: stats(values, nodata),
    rowOffset,
    colOffset,
    ...rest,
    cellAt(lng, lat) {
      const [x, y] = proj4("EPSG:4326", "EPSG:32632", [lng, lat]);
      if (x < minX || x > maxX || y < minY || y > maxY) return null;
      const col = Math.floor(((x - minX) / (maxX - minX)) * width);
      const row = Math.floor(((maxY - y) / (maxY - minY)) * height);
      if (col < 0 || col >= width || row < 0 || row >= height) return null;
      const index = row * width + col;
      const cellMinX = minX + (col * cellWidth);
      const cellMaxX = cellMinX + cellWidth;
      const cellMaxY = maxY - (row * cellHeight);
      const cellMinY = cellMaxY - cellHeight;
      return {
        index,
        row,
        col,
        sourceRow: row + rowOffset,
        sourceCol: col + colOffset,
        value: values[index],
        bounds: {
          minX: cellMinX,
          minY: cellMinY,
          maxX: cellMaxX,
          maxY: cellMaxY,
        },
      };
    },
    sampleAt(lng, lat, transform) {
      const cell = this.cellAt(lng, lat);
      if (!cell) return null;
      const { value } = cell;
      if (isNoData(value, nodata)) return null;
      if (transform === "zscore") return (value - this.stats.mean) / this.stats.std;
      return value;
    },
  };
}

async function loadCsvGrid(url, raster = {}) {
  const cacheKey = JSON.stringify({
    url,
    sourceType: raster.sourceType,
    rowKey: raster.rowKey,
    colKey: raster.colKey,
    xKey: raster.xKey,
    yKey: raster.yKey,
    valueKey: raster.valueKey,
    cellSize: raster.cellSize,
  });
  if (dataCache.has(cacheKey)) return dataCache.get(cacheKey);

  const promise = (async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cannot load grid ${url}`);

    const rowKey = raster.rowKey || "row";
    const colKey = raster.colKey || "col";
    const xKey = raster.xKey || "x";
    const yKey = raster.yKey || "y";
    const valueKey = raster.valueKey || "value";
    const cellSize = Number.isFinite(raster.cellSize) ? raster.cellSize : 1000;
    const rows = parseCsv(await response.text())
      .map((row) => ({
        row: row[rowKey],
        col: row[colKey],
        x: row[xKey],
        y: row[yKey],
        value: row[valueKey],
      }))
      .filter((row) => (
        Number.isFinite(row.row)
        && Number.isFinite(row.col)
        && Number.isFinite(row.x)
        && Number.isFinite(row.y)
        && Number.isFinite(row.value)
      ));

    if (!rows.length) {
      throw new Error(`Grid ${url} does not contain any numeric cells`);
    }

    const minRow = Math.min(...rows.map((row) => row.row));
    const maxRow = Math.max(...rows.map((row) => row.row));
    const minCol = Math.min(...rows.map((row) => row.col));
    const maxCol = Math.max(...rows.map((row) => row.col));
    const width = (maxCol - minCol) + 1;
    const height = (maxRow - minRow) + 1;
    const values = new Float32Array(width * height);
    values.fill(Number.NaN);

    for (const row of rows) {
      const index = ((row.row - minRow) * width) + (row.col - minCol);
      values[index] = row.value;
    }

    const minX = Math.min(...rows.map((row) => row.x));
    const maxX = Math.max(...rows.map((row) => row.x));
    const minY = Math.min(...rows.map((row) => row.y));
    const maxY = Math.max(...rows.map((row) => row.y));

    return buildGridDataset({
      url,
      values,
      width,
      height,
      bbox: [minX - (cellSize / 2), minY - (cellSize / 2), maxX + (cellSize / 2), maxY + (cellSize / 2)],
      nodata: null,
      rowOffset: minRow,
      colOffset: minCol,
    });
  })().catch((error) => {
    dataCache.delete(cacheKey);
    throw error;
  });

  dataCache.set(cacheKey, promise);
  return promise;
}

async function loadRaster(url, raster = {}) {
  if (raster.sourceType === "csvGrid") {
    return loadCsvGrid(url, raster);
  }

  if (dataCache.has(url)) return dataCache.get(url);

  const promise = (async () => {
    const arrayBuffer = await fetchRasterArrayBuffer(url);
    const tiff = await fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const values = await image.readRasters({ interleave: true });
    const bbox = image.getBoundingBox();
    const rawNoData = image.getGDALNoData();
    const nodata = rawNoData == null ? null : Number(rawNoData);
    return buildGridDataset({
      url,
      image,
      values,
      width: image.getWidth(),
      height: image.getHeight(),
      bbox,
      nodata,
    });
  })().catch((error) => {
    dataCache.delete(url);
    throw error;
  });

  dataCache.set(url, promise);
  return promise;
}

async function fetchRasterArrayBuffer(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= RASTER_FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), RASTER_FETCH_TIMEOUT_MS);
    const requestUrl = attempt === 0 ? url : `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}`;

    try {
      const response = await fetch(requestUrl, {
        signal: controller.signal,
        cache: attempt === 0 ? "default" : "no-store",
      });
      if (!response.ok) {
        throw new Error(`Cannot load raster ${url}: ${response.status}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      lastError = error;
      if (attempt < RASTER_FETCH_RETRIES) {
        await delay(180 * (attempt + 1));
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error(`Cannot load raster ${url}`);
}

function geometryToPolygons(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function projectRing(ring) {
  return ring.map(([lng, lat]) => proj4("EPSG:4326", "EPSG:32632", [lng, lat]));
}

async function loadBoundaryPolygons(url = BOLOGNA_BOUNDARY_URL) {
  if (boundaryCache.has(url)) return boundaryCache.get(url);

  const promise = (async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cannot load boundary ${url}`);
    const geojson = await response.json();
    return (geojson.features || [])
      .flatMap((feature) => geometryToPolygons(feature.geometry))
      .map((polygon) => polygon.map(projectRing));
  })().catch((error) => {
    boundaryCache.delete(url);
    throw error;
  });

  boundaryCache.set(url, promise);
  return promise;
}

function toPixel(point, bbox, width, height) {
  const [minX, minY, maxX, maxY] = bbox;
  const x = ((point[0] - minX) / (maxX - minX)) * width;
  const y = ((maxY - point[1]) / (maxY - minY)) * height;
  return [x, y];
}

async function createBoundaryMask(data, url = BOLOGNA_BOUNDARY_URL, scale = 1) {
  const width = data.width * scale;
  const height = data.height * scale;
  const key = JSON.stringify({ url, width, height, bbox: data.bbox });
  if (maskCache.has(key)) return maskCache.get(key);

  const polygons = await loadBoundaryPolygons(url);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#000";

  for (const polygon of polygons) {
    context.beginPath();
    for (const ring of polygon) {
      ring.forEach((point, index) => {
        const [x, y] = toPixel(point, data.bbox, width, height);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
    }
    context.fill("evenodd");
  }

  const alpha = context.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  for (let index = 0; index < mask.length; index += 1) {
    mask[index] = alpha[index * 4 + 3] > 0 ? 1 : 0;
  }
  maskCache.set(key, mask);
  return mask;
}

function categoricalColor(value, mode, colorMode = "default") {
  if (mode === "structuralTemporal") {
    const anomalousYears = Math.floor(value / 100);
    const chronicYears = Math.round(value % 100);
    if (anomalousYears === 0 && chronicYears === 0) return [245, 241, 232, 255];

    const chronicScale = colorMode === "accessible"
      ? ["#fff7bc", "#fee391", "#fec44f", "#d95f0e", "#8c2d04"]
      : ["#fff7ec", "#fdd49e", "#fc8d59", "#d7301f", "#7f0000"];
    const anomalousScale = colorMode === "accessible"
      ? ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"]
      : ["#f7f4f9", "#d4b9da", "#c994c7", "#807dba", "#54278f"];
    const chronicColor = chronicYears > 0
      ? interpolateRgb(chronicScale, chronicYears / 13)
      : null;
    const anomalousColor = anomalousYears > 0
      ? interpolateRgb(anomalousScale, anomalousYears / 5)
      : null;
    const color = chronicColor && anomalousColor
      ? blendRgb(chronicColor, anomalousColor)
      : chronicColor || anomalousColor;
    return [...color, 255];
  }
  if (mode === "structuralTemporalFlat") {
    if (value >= 300) return [103, 0, 31, 230];
    if (value >= 200) return [201, 148, 199, 220];
    if (value >= 100) return [253, 174, 97, 210];
    return null;
  }
  const categoryColors = categoryColorsByMode[colorMode] || categoryColorsByMode.default;
  return categoryColors[mode]?.[Math.round(value)] || null;
}

export async function renderRasterImage({ url, raster = {}, threshold, colorMode = "default" }) {
  const cacheKey = JSON.stringify({ url, raster, threshold, colorMode });
  if (renderCache.has(cacheKey)) return renderCache.get(cacheKey);

  const promise = (async () => {
    const data = await loadRaster(url, raster);
    // renderScale supersamples the output canvas so boundary masks on coarse rasters
    // (e.g. 1 km day-night delta) don't show a staircase edge. Values are nearest-neighbor
    // on the native grid; the polygon mask is painted at the higher resolution.
    const scale = Math.max(1, Math.round(raster.renderScale || 1));
    const outWidth = data.width * scale;
    const outHeight = data.height * scale;
    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const context = canvas.getContext("2d", { willReadFrequently: false });
    const imageData = context.createImageData(outWidth, outHeight);
    const output = imageData.data;
    const range = raster.range || [data.stats.min, data.stats.max];
    const alpha = raster.alpha ?? 255;
    const boundaryPolygons = raster.maskToBoundary
      ? await loadBoundaryPolygons(raster.maskUrl || BOLOGNA_BOUNDARY_URL)
      : null;
    const renderMask = scale > 1 && raster.maskToBoundary
      ? await createBoundaryMask(data, raster.maskUrl || BOLOGNA_BOUNDARY_URL, scale)
      : (raster.maskToBoundary ? await createBoundaryMask(data, raster.maskUrl || BOLOGNA_BOUNDARY_URL) : null);
    const visibleCellMask = raster.maskToBoundary
      ? buildVisibleCellMask(renderMask, data.width, data.height, scale)
      : null;

    for (let j = 0; j < outHeight; j += 1) {
      const nativeY = Math.floor(j / scale);
      for (let i = 0; i < outWidth; i += 1) {
        const outIndex = j * outWidth + i;
        const nativeX = Math.floor(i / scale);
        const nativeIndex = nativeY * data.width + nativeX;
        const value = data.values[nativeIndex];
        const out = outIndex * 4;

        if (visibleCellMask && !visibleCellMask[nativeIndex]) {
          output[out + 3] = 0;
          continue;
        }
        if (renderMask && !renderMask[outIndex]) {
          output[out + 3] = 0;
          continue;
        }
        if (isNoData(value, data.nodata)) {
          if (raster.noDataStyle === "hatched") {
            const color = noDataPixelColor(outIndex, outWidth, colorMode);
            output[out] = color[0];
            output[out + 1] = color[1];
            output[out + 2] = color[2];
            output[out + 3] = color[3];
          } else {
            output[out + 3] = 0;
          }
          continue;
        }
        if (isTransparentValue(value, raster.transparentValues)) {
          output[out + 3] = 0;
          continue;
        }

        let renderedValue = value;
        if (raster.transform === "zscore") {
          renderedValue = (value - data.stats.mean) / data.stats.std;
        }

        if (threshold != null && renderedValue < threshold) {
          output[out + 3] = 0;
          continue;
        }

        if (raster.mode === "categorical" || raster.mode === "hotspot" || raster.mode === "structuralTemporal") {
          const color = categoricalColor(renderedValue, raster.category || raster.mode, colorMode);
          if (!color) {
            output[out + 3] = 0;
            continue;
          }
          output[out] = color[0];
          output[out + 1] = color[1];
          output[out + 2] = color[2];
          output[out + 3] = color[3];
          continue;
        }

        const normalized = (renderedValue - range[0]) / Math.max(0.000001, range[1] - range[0]);
        const color = interpolateColor(raster.palette || "thermal", normalized, colorMode);
        output[out] = color[0];
        output[out + 1] = color[1];
        output[out + 2] = color[2];
        output[out + 3] = alpha;
      }
    }

    context.putImageData(imageData, 0, 0);

    function getVisibleCell(lng, lat) {
      const cell = data.cellAt(lng, lat);
      if (!cell) return null;
      if (visibleCellMask && !visibleCellMask[cell.index]) return null;
      if (isNoData(cell.value, data.nodata)) return null;
      if (isTransparentValue(cell.value, raster.transparentValues)) return null;
      const value = data.sampleAt(lng, lat, raster.transform);
      if (value == null) return null;
      if (threshold != null && value < threshold) return null;
      return {
        ...cell,
        renderedValue: value,
      };
    }

    function getVisibleCellFeature(lng, lat) {
      const cell = getVisibleCell(lng, lat);
      if (!cell) return null;
      return buildClippedCellFeatureCollection(cell, boundaryPolygons)
        || buildMaskedCellFeatureCollection(cell, renderMask, outWidth, scale);
    }

    return {
      url: canvas.toDataURL("image/png"),
      coordinates: data.coordinates,
      stats: data.stats,
      cellAt: getVisibleCell,
      cellFeatureAt: getVisibleCellFeature,
      sampleAt: (lng, lat) => {
        const cell = data.cellAt(lng, lat);
        if (!cell) return null;
        if (visibleCellMask && !visibleCellMask[cell.index]) return null;
        if (isNoData(cell.value, data.nodata)) {
          return raster.noDataStyle === "hatched" ? { kind: "nodata", cell } : null;
        }
        const value = data.sampleAt(lng, lat, raster.transform);
        if (value == null) return null;
        if (isTransparentValue(value, raster.transparentValues)) return null;
        if (threshold != null && value < threshold) return null;
        return {
          kind: "value",
          value,
          cell: getVisibleCell(lng, lat),
        };
      },
    };
  })().catch((error) => {
    renderCache.delete(cacheKey);
    throw error;
  });

  renderCache.set(cacheKey, promise);
  return promise;
}
