"""Build the View 3 albedo products from the 10 m Sentinel-2 raster.

The standalone albedo layer keeps its native 10 m grid. HRI and UHEI stay on
the 30 m Landsat temperature grid: the 10 m albedo is aggregated with an area
mean before the two indices are recomputed. The existing normalized LST and
NDVI components are reconstructed from the unchanged LST, HVI, and published
normalization limits so that changing the albedo does not alter the other inputs.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import numpy as np
import rasterio
from affine import Affine
from rasterio.warp import Resampling, reproject
from rasterio.windows import Window


NODATA = -9999.0
YEAR = 2025


def read_raster(path: Path) -> tuple[np.ndarray, dict]:
    with rasterio.open(path) as src:
        data = src.read(1).astype("float32")
        mask = src.read_masks(1) > 0
        profile = src.profile.copy()
        nodata = src.nodata

    valid = mask & np.isfinite(data)
    if nodata is not None:
        valid &= data != nodata
    return np.where(valid, data, np.nan).astype("float32"), profile


def assert_same_grid(profiles: list[dict]) -> None:
    reference = profiles[0]
    for profile in profiles[1:]:
        if (
            profile["width"] != reference["width"]
            or profile["height"] != reference["height"]
            or profile["transform"] != reference["transform"]
            or profile["crs"] != reference["crs"]
        ):
            raise ValueError("The published 30 m indices do not share one grid.")


def aligned_10m_profile(reference_30m: dict) -> dict:
    transform = reference_30m["transform"]
    if not np.isclose(abs(transform.a), 30.0) or not np.isclose(abs(transform.e), 30.0):
        raise ValueError("The thermal reference raster is not on a 30 m grid.")

    profile = reference_30m.copy()
    profile.update(
        width=reference_30m["width"] * 3,
        height=reference_30m["height"] * 3,
        transform=Affine(10.0, 0.0, transform.c, 0.0, -10.0, transform.f),
    )
    return profile


def crop_native_albedo(source_path: Path, target_profile: dict) -> np.ndarray:
    """Read the aligned target window without resampling the 10 m values."""

    with rasterio.open(source_path) as src:
        if src.crs != target_profile["crs"]:
            raise ValueError("The Sentinel-2 albedo and thermal rasters use different CRSs.")
        if not np.isclose(abs(src.transform.a), 10.0) or not np.isclose(abs(src.transform.e), 10.0):
            raise ValueError("The Sentinel-2 albedo is not on a 10 m grid.")

        target_transform = target_profile["transform"]
        col_offset = (target_transform.c - src.transform.c) / src.transform.a
        row_offset = (src.transform.f - target_transform.f) / abs(src.transform.e)
        rounded_col = round(col_offset)
        rounded_row = round(row_offset)
        if not np.isclose(col_offset, rounded_col) or not np.isclose(row_offset, rounded_row):
            raise ValueError("The Sentinel-2 albedo is not aligned to the requested 10 m output grid.")

        window = Window(
            rounded_col,
            rounded_row,
            target_profile["width"],
            target_profile["height"],
        )
        if (
            window.col_off < 0
            or window.row_off < 0
            or window.col_off + window.width > src.width
            or window.row_off + window.height > src.height
        ):
            raise ValueError("The Sentinel-2 albedo does not cover the thermal reference extent.")

        data = src.read(1, window=window).astype("float32")
        valid = np.isfinite(data)
        if src.nodata is not None:
            valid &= data != src.nodata

    return np.where(valid, data, np.nan).astype("float32")


def aggregate_albedo_to_30m(
    albedo_10m: np.ndarray,
    profile_10m: dict,
    profile_30m: dict,
) -> np.ndarray:
    source = np.where(np.isfinite(albedo_10m), albedo_10m, NODATA).astype("float32")
    destination = np.full(
        (profile_30m["height"], profile_30m["width"]),
        NODATA,
        dtype="float32",
    )
    reproject(
        source=source,
        destination=destination,
        src_transform=profile_10m["transform"],
        src_crs=profile_10m["crs"],
        src_nodata=NODATA,
        dst_transform=profile_30m["transform"],
        dst_crs=profile_30m["crs"],
        dst_nodata=NODATA,
        resampling=Resampling.average,
    )
    destination[destination == NODATA] = np.nan
    return destination


def minmax_normalize(data: np.ndarray) -> np.ndarray:
    valid = data[np.isfinite(data)]
    if not valid.size:
        raise ValueError("Cannot normalize an empty raster.")
    minimum = float(valid.min())
    maximum = float(valid.max())
    if np.isclose(minimum, maximum):
        raise ValueError("Cannot normalize a constant raster.")
    normalized = (data - minimum) / (maximum - minimum)
    normalized[~np.isfinite(data)] = np.nan
    return normalized.astype("float32")


def write_raster(path: Path, data: np.ndarray, profile: dict, source_label: str) -> None:
    output_profile = profile.copy()
    output_profile.update(
        driver="GTiff",
        dtype="float32",
        count=1,
        nodata=NODATA,
        compress="deflate",
        predictor=3,
        tiled=True,
        blockxsize=256,
        blockysize=256,
    )
    output = np.where(np.isfinite(data), data, NODATA).astype("float32")
    with rasterio.open(path, "w", **output_profile) as dst:
        dst.write(output, 1)
        dst.update_tags(
            AREA_OR_POINT="Area",
            source=source_label,
            processing="Albedo native at 10 m; albedo contribution to thermal indices area-averaged to 30 m",
        )


def raster_stats(name: str, data: np.ndarray) -> dict[str, float | int | str]:
    values = data[np.isfinite(data)].astype("float64")
    return {
        "name": name,
        "count": int(values.size),
        "mean": float(values.mean()),
        "std": float(values.std()),
        "min": float(values.min()),
        "p05": float(np.percentile(values, 5)),
        "p25": float(np.percentile(values, 25)),
        "p50": float(np.percentile(values, 50)),
        "p75": float(np.percentile(values, 75)),
        "p95": float(np.percentile(values, 95)),
        "max": float(values.max()),
    }


def write_summary(path: Path, rows: list[dict[str, float | int | str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def read_summary(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    with path.open(newline="", encoding="utf-8") as handle:
        return {row["name"]: row for row in csv.DictReader(handle)}


def lst_normalization_limits(path: Path, year: int) -> tuple[np.float32, np.float32]:
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if int(row["year"]) == year:
                return np.float32(row["min"]), np.float32(row["max"])
    raise ValueError(f"No LST normalization limits found for {year} in {path}.")


def build(source_path: Path, webapp_root: Path) -> None:
    raster_dir = webapp_root / "data" / "webapp_rasters"
    summary_dir = webapp_root / "data" / "csv_info"

    hvi, hvi_profile = read_raster(raster_dir / f"HVI_{YEAR}_summer_30m.tif")
    lst, lst_profile = read_raster(raster_dir / f"LST_{YEAR}_summer_30m.tif")
    assert_same_grid([hvi_profile, lst_profile])

    lst_minimum, lst_maximum = lst_normalization_limits(
        summary_dir / "LST_yearly_input_summary_median_30m.csv",
        YEAR,
    )
    common_baseline = np.isfinite(hvi) & np.isfinite(lst)
    lst_normalized = np.full_like(hvi, np.nan)
    ndvi_normalized = np.full_like(hvi, np.nan)
    lst_normalized[common_baseline] = (
        (lst[common_baseline] - lst_minimum) / (lst_maximum - lst_minimum)
    )
    ndvi_normalized[common_baseline] = lst_normalized[common_baseline] - hvi[common_baseline]

    profile_10m = aligned_10m_profile(hvi_profile)
    albedo_10m = crop_native_albedo(source_path, profile_10m)
    albedo_30m = aggregate_albedo_to_30m(albedo_10m, profile_10m, hvi_profile)
    albedo_normalized = minmax_normalize(albedo_30m)

    common = common_baseline & np.isfinite(albedo_normalized)
    hri = np.full_like(hvi, np.nan)
    uhei = np.full_like(hvi, np.nan)
    hri[common] = lst_normalized[common] - albedo_normalized[common]
    uhei[common] = (
        lst_normalized[common]
        + (1.0 - ndvi_normalized[common])
        + (1.0 - albedo_normalized[common])
    )

    source_label = "Sentinel-2 summer 2025 albedo, 10 m (20 m bands interpolated upstream)"
    write_raster(
        raster_dir / f"Albedo_{YEAR}_summer_10m.tif",
        albedo_10m,
        profile_10m,
        source_label,
    )
    write_raster(
        raster_dir / f"HRI_{YEAR}_summer_30m.tif",
        hri,
        hvi_profile,
        source_label,
    )
    write_raster(
        raster_dir / f"UHEI_{YEAR}_summer_30m.tif",
        uhei,
        hvi_profile,
        source_label,
    )

    normalized_summary_path = summary_dir / f"normalized_{YEAR}_summary.csv"
    existing_normalized = read_summary(normalized_summary_path)
    normalized_rows = [
        existing_normalized.get(
            f"LST_norm_{YEAR}_30m",
            raster_stats(f"LST_norm_{YEAR}_30m", lst_normalized),
        ),
        existing_normalized.get(
            f"NDVI_norm_{YEAR}_30m",
            raster_stats(f"NDVI_norm_{YEAR}_30m", ndvi_normalized),
        ),
        raster_stats(f"Albedo_norm_{YEAR}_30m_from10m", albedo_normalized),
    ]
    composite_summary_path = summary_dir / f"composite_indices_{YEAR}_summary.csv"
    existing_composites = read_summary(composite_summary_path)
    composite_rows = [
        existing_composites.get(
            f"HVI_{YEAR}_summer_30m",
            raster_stats(f"HVI_{YEAR}_summer_30m", hvi),
        ),
        raster_stats(f"HRI_{YEAR}_summer_30m", hri),
        raster_stats(f"UHEI_{YEAR}_summer_30m", uhei),
    ]
    write_summary(normalized_summary_path, normalized_rows)
    write_summary(composite_summary_path, composite_rows)

    for row in [raster_stats(f"Albedo_{YEAR}_summer_10m", albedo_10m), *composite_rows[1:]]:
        print(
            f"{row['name']}: count={row['count']}, min={row['min']:.6f}, "
            f"p05={row['p05']:.6f}, p50={row['p50']:.6f}, "
            f"p95={row['p95']:.6f}, max={row['max']:.6f}"
        )


def parse_args() -> argparse.Namespace:
    script_path = Path(__file__).resolve()
    workspace_root = script_path.parents[3]
    default_source = (
        workspace_root
        / "new_albedo"
        / "Bologna_Albedo_2025_summer_JJA_mean_Sentinel2_10m.tif"
    )
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=default_source)
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    build(arguments.source.resolve(), Path(__file__).resolve().parents[1])
