"""Clip the native Sentinel-2 NDVI for display, without resampling thermal inputs."""
import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.warp import transform_geom

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / "data_historysuhi_bologna_2026/raw/gee_ndvi/Bologna_NDVI_2026_summer_JJA_median.tif"
BOUNDARY = ROOT / "data/webapp_vectors/bologna_boundary_outline.geojson"
OUTPUT = ROOT / "data/webapp_rasters/NDVI_2026_summer_10m.tif"

with rasterio.open(SOURCE) as src:
    boundary = json.loads(BOUNDARY.read_text(encoding="utf-8"))
    geometries = [transform_geom("EPSG:4326", src.crs, f["geometry"]) for f in boundary["features"]]
    values, transform = mask(src, geometries, crop=True, filled=False)
    data = values.filled(-9999).astype("float32")
    data[~np.isfinite(data)] = -9999
    profile = src.profile.copy()
    profile.update(height=data.shape[1], width=data.shape[2], transform=transform,
                   nodata=-9999, dtype="float32", compress="deflate")
    with rasterio.open(OUTPUT, "w", **profile) as dest:
        dest.write(data)
        dest.update_tags(source=SOURCE.name, purpose="Native 10 m NDVI display; no resampling")
    valid = data[data != -9999]
    print(f"Wrote {OUTPUT.name}: {src.res}, {valid.size} valid pixels; P05/P95={np.percentile(valid, [5, 95])}")
