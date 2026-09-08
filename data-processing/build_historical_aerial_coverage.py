#!/usr/bin/env python3
"""Build per-year coverage masks for the LGL-BW historical aerial imagery WMS.

The WMS GetCapabilities documents only one bounding box for the whole service
(all of Baden-Wuerttemberg), even though every year covers just the strips that
were flown that year. To know upfront which years actually show something at a
given map position, we probe the service: one GetMap request per year over the
full BW extent, then reduce the alpha channel to a coarse boolean grid.

Output: web/public/data/historical-aerial-coverage.json
The grid is stored row-major as run-length encoded runs of equal values,
starting with a run of "not covered" cells (possibly of length 0).

Usage:
    python build_historical_aerial_coverage.py [--cell-size 1000] [--out PATH]
"""

import argparse
import json
import sys
import time
import xml.etree.ElementTree as ET
from io import BytesIO
from pathlib import Path

import numpy as np
import requests
from PIL import Image

WMS_BASE = "https://owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_HIST_DOP_"

# Decade services offered in the map UI (see HistoricalAerialsButton.tsx)
ENDPOINTS = [
    "1960-1969",
    "1970-1979",
    "1980-1989",
    "1990-1999",
    "2010-2019",
]

# Full BW extent in EPSG:3857, as advertised by the services' capabilities
BW_BBOX_3857 = (801500.0, 6007610.0, 1191118.0, 6446275.0)

# Probe resolution: sub-cells sampled per grid cell in each direction. A cell
# counts as covered when any of its sub-pixels is opaque.
SUBSAMPLES = 4

WMS_NS = {"w": "http://www.opengis.net/wms"}
REQUEST_TIMEOUT = 300
RETRIES = 3
PAUSE_SECONDS = 1.0


def fetch(url: str, params: dict) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(1, RETRIES + 1):
        try:
            response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response
        except Exception as error:  # noqa: BLE001 - retry on any transport error
            last_error = error
            print(f"    attempt {attempt}/{RETRIES} failed: {error}", file=sys.stderr)
            time.sleep(2 * attempt)
    raise RuntimeError(f"request failed after {RETRIES} attempts: {last_error}")


def list_year_layers(endpoint: str) -> list[str]:
    """Return the named year layers of a decade service that hold data.

    Years without imagery are titled "<year> noch nicht verfuegbar" and are
    skipped, which saves a probe request each.
    """
    response = fetch(
        WMS_BASE + endpoint,
        {"SERVICE": "WMS", "VERSION": "1.3.0", "REQUEST": "GetCapabilities"},
    )
    root = ET.fromstring(response.content)
    years: list[str] = []
    for layer in root.iter("{http://www.opengis.net/wms}Layer"):
        name = layer.find("w:Name", WMS_NS)
        title = layer.find("w:Title", WMS_NS)
        if name is None or not name.text:
            continue
        if title is not None and title.text and "nicht verf" in title.text:
            print(f"    {name.text}: {title.text.strip()} - skipped")
            continue
        years.append(name.text.strip())
    return years


def probe_year(endpoint: str, year: str, cols: int, rows: int) -> np.ndarray:
    """Fetch one transparent GetMap for a year and reduce it to a cell grid."""
    minx, miny, maxx, maxy = BW_BBOX_3857
    response = fetch(
        WMS_BASE + endpoint,
        {
            "SERVICE": "WMS",
            "VERSION": "1.3.0",
            "REQUEST": "GetMap",
            "FORMAT": "image/png",
            "TRANSPARENT": "true",
            "LAYERS": year,
            "CRS": "EPSG:3857",
            "STYLES": "",
            "WIDTH": cols * SUBSAMPLES,
            "HEIGHT": rows * SUBSAMPLES,
            "BBOX": f"{minx},{miny},{maxx},{maxy}",
        },
    )
    content_type = response.headers.get("Content-Type", "")
    if "image" not in content_type:
        raise RuntimeError(f"expected an image, got {content_type}: {response.text[:300]}")

    alpha = np.array(Image.open(BytesIO(response.content)).convert("RGBA"))[..., 3]
    # Max-pool the sub-pixels: a cell is covered as soon as one pixel is opaque
    pooled = alpha.reshape(rows, SUBSAMPLES, cols, SUBSAMPLES).max(axis=(1, 3))
    return pooled > 0


def encode_runs(mask: np.ndarray) -> list[int]:
    """Run-length encode a boolean grid, row-major, starting with False."""
    flat = mask.reshape(-1)
    if flat.size == 0:
        return []
    change_points = np.flatnonzero(np.diff(flat)) + 1
    bounds = np.concatenate(([0], change_points, [flat.size]))
    runs = np.diff(bounds).tolist()
    if flat[0]:
        runs.insert(0, 0)  # leading run is always the "not covered" one
    return runs


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cell-size",
        type=int,
        default=1000,
        help="grid cell size in EPSG:3857 metres (default: 1000)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=repo_root / "web/public/data/historical-aerial-coverage.json",
        help="output JSON path",
    )
    args = parser.parse_args()

    minx, miny, maxx, maxy = BW_BBOX_3857
    cols = round((maxx - minx) / args.cell_size)
    rows = round((maxy - miny) / args.cell_size)
    print(f"Grid: {cols} x {rows} cells of {args.cell_size} m (EPSG:3857)")

    years: dict[str, dict] = {}
    for endpoint in ENDPOINTS:
        print(f"\n{endpoint}")
        for year in list_year_layers(endpoint):
            mask = probe_year(endpoint, year, cols, rows)
            covered = int(mask.sum())
            if covered == 0:
                print(f"    {year}: no coverage - skipped")
                continue
            print(f"    {year}: {covered} cells ({covered / mask.size:.1%} of extent)")
            years[year] = {"endpoint": endpoint, "runs": encode_runs(mask)}
            time.sleep(PAUSE_SECONDS)

    payload = {
        "note": (
            "Generated by data-processing/build_historical_aerial_coverage.py - "
            "per-year coverage of the LGL-BW historical orthophoto WMS."
        ),
        "crs": "EPSG:3857",
        "bbox": list(BW_BBOX_3857),
        "cellSize": args.cell_size,
        "cols": cols,
        "rows": rows,
        "years": years,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    size_kb = args.out.stat().st_size / 1024
    print(f"\nWrote {args.out} ({len(years)} years, {size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
