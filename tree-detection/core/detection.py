"""CHM-Blob-Detektion und Koordinatenumrechnung."""

import sys
import logging

import numpy as np

from .coords import RES_M, utm_to_wgs84, wgs84_to_utm

logger = logging.getLogger(__name__)


def detect_blobs(
    chm: np.ndarray,
    min_height_m: float,
    max_height_m: float,
    min_sigma: float,
    max_sigma: float,
    threshold: float,
) -> np.ndarray:
    """
    Erkennt Baumkronen im CHM als kreisförmige Erhebungen via Laplacian-of-Gaussian (LoG).
    Rückgabe: Array (N, 3) mit (Zeile, Spalte, sigma) pro erkanntem Blob.
    """
    try:
        from skimage.feature import blob_log
    except ImportError:
        logger.error("scikit-image fehlt. Run: pip install scikit-image")
        sys.exit(1)

    arr = chm.copy()
    arr[np.isnan(arr)] = 0.0
    arr[arr < min_height_m] = 0.0
    arr[arr > max_height_m] = 0.0

    if arr.max() < 1e-6:
        return np.empty((0, 3), dtype=np.float64)

    arr /= arr.max()

    return blob_log(arr, min_sigma=min_sigma, max_sigma=max_sigma, num_sigma=6, threshold=threshold)


def blobs_to_points(blobs: np.ndarray, chm: np.ndarray, min_e: float, max_n: float) -> list:
    """
    Rechnet (Zeile, Spalte, sigma) in geografische Koordinaten um.
    Gibt Liste von (lon, lat, chm_height_m) zurück.
    """
    h, w = chm.shape
    results = []
    for row, col, _sigma in blobs:
        easting = min_e + (col + 0.5) * RES_M
        northing = max_n - (row + 0.5) * RES_M
        lon, lat = utm_to_wgs84(easting, northing)

        r_i, c_i = int(row), int(col)
        chm_h = (float(chm[r_i, c_i])
                 if (0 <= r_i < h and 0 <= c_i < w and not np.isnan(chm[r_i, c_i]))
                 else 0.0)
        results.append((lon, lat, chm_h))
    return results


def deduplicate(points: list, grid_m: float = 3.0) -> list:
    """Entfernt Duplikate durch Rasterisierung auf grid_m-Gitter."""
    cell_map: dict = {}
    for item in points:
        lon, lat = item[0], item[1]
        e, n = wgs84_to_utm(lon, lat)
        cell = (round(e / grid_m), round(n / grid_m))
        if cell not in cell_map:
            cell_map[cell] = item
    return list(cell_map.values())
