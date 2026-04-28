import fs from "node:fs/promises";
import { fromFile } from "geotiff";

// One-shot data prep: extends the existing 1 km albedo / Δ°C pairs CSV with a per-cell
// mean NDVI computed by averaging the 30 m NDVI raster pixels whose centers fall inside
// each 1 km UTM cell. Output feeds the View 4 NDVI scatter and the 3D popup.

const pairsCsvPath = "data/csv_info/albedo_deltalst_2025_1km_pairs.csv";
const ndviPath = "data/webapp_rasters/NDVI_2025_summer_30m.tif";
const outputPath = "data/csv_info/albedo_ndvi_delta_2025_1km_pairs.csv";
const CELL_HALF = 500;

async function loadRaster(path) {
  const tiff = await fromFile(path);
  const image = await tiff.getImage();
  const [data] = await image.readRasters();
  const [originX, originY] = image.getOrigin();
  const [resX, resY] = image.getResolution();
  return {
    data,
    width: image.getWidth(),
    height: image.getHeight(),
    originX,
    originY,
    resX,
    resY,
    nodata: Number(image.getGDALNoData()),
  };
}

function validValue(value, nodata) {
  return Number.isFinite(value) && value !== nodata && value > -9000;
}

function meanInBox(raster, centerX, centerY, halfSize) {
  const minX = centerX - halfSize;
  const maxX = centerX + halfSize;
  const minY = centerY - halfSize;
  const maxY = centerY + halfSize;
  const absResY = Math.abs(raster.resY);
  const colMin = Math.max(0, Math.floor((minX - raster.originX) / raster.resX));
  const colMax = Math.min(raster.width - 1, Math.ceil((maxX - raster.originX) / raster.resX));
  const rowMin = Math.max(0, Math.floor((raster.originY - maxY) / absResY));
  const rowMax = Math.min(raster.height - 1, Math.ceil((raster.originY - minY) / absResY));
  let sum = 0;
  let count = 0;
  for (let row = rowMin; row <= rowMax; row += 1) {
    const pixelY = raster.originY + (row + 0.5) * raster.resY;
    if (pixelY < minY || pixelY > maxY) continue;
    for (let col = colMin; col <= colMax; col += 1) {
      const pixelX = raster.originX + (col + 0.5) * raster.resX;
      if (pixelX < minX || pixelX > maxX) continue;
      const value = raster.data[row * raster.width + col];
      if (!validValue(value, raster.nodata)) continue;
      sum += value;
      count += 1;
    }
  }
  return count ? sum / count : null;
}

function parseCsvLine(line) {
  return line.split(",").map((cell) => cell.trim());
}

const csvText = await fs.readFile(pairsCsvPath, "utf8");
const lines = csvText.split(/\r?\n/).filter((line) => line.length);
const header = parseCsvLine(lines[0]);
const headerIndex = Object.fromEntries(header.map((name, idx) => [name, idx]));

const ndvi = await loadRaster(ndviPath);
console.log(`NDVI raster: ${ndvi.width}x${ndvi.height}, origin=(${ndvi.originX}, ${ndvi.originY}), res=(${ndvi.resX}, ${ndvi.resY})`);

const outputRows = ["row,col,x,y,albedo_mean_1km,ndvi_mean_1km,delta_lst_1km"];
const ndviSamples = [];
let dropped = 0;

for (let i = 1; i < lines.length; i += 1) {
  const cells = parseCsvLine(lines[i]);
  const row = Number(cells[headerIndex.row]);
  const col = Number(cells[headerIndex.col]);
  const x = Number(cells[headerIndex.x]);
  const y = Number(cells[headerIndex.y]);
  const albedo = Number(cells[headerIndex.albedo_mean_1km]);
  const delta = Number(cells[headerIndex.delta_lst_1km]);
  const ndviMean = meanInBox(ndvi, x, y, CELL_HALF);
  if (ndviMean == null || !Number.isFinite(ndviMean)) {
    dropped += 1;
    continue;
  }
  ndviSamples.push(ndviMean);
  outputRows.push([row, col, x, y, albedo, ndviMean, delta].join(","));
}

await fs.writeFile(outputPath, `${outputRows.join("\n")}\n`, "utf8");

const sortedNdvi = [...ndviSamples].sort((a, b) => a - b);
const ndviMin = sortedNdvi[0];
const ndviMax = sortedNdvi[sortedNdvi.length - 1];
const ndviMean = ndviSamples.reduce((sum, value) => sum + value, 0) / ndviSamples.length;
const ndviMedian = sortedNdvi[Math.floor(sortedNdvi.length / 2)];

console.log(`Wrote ${ndviSamples.length} rows to ${outputPath} (${dropped} cells dropped due to NaN NDVI).`);
console.log(`NDVI mean ${ndviMean.toFixed(3)}, median ${ndviMedian.toFixed(3)}, range [${ndviMin.toFixed(3)}, ${ndviMax.toFixed(3)}].`);
