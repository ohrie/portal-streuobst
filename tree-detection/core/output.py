"""GeoJSON-Ausgabe und Debug-TIF-Export."""

import logging
from pathlib import Path
from datetime import datetime, timezone

import numpy as np

from .coords import RES_M

logger = logging.getLogger(__name__)


def build_geojson(points: list, bbox_str: str, params: dict) -> dict:
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [p[0], p[1]]},
            "properties": {
                "chm_height_m": round(p[2], 2),
                "source": "DOM1_minus_DGM1_blob_log",
                "detection_layer": "baeume_detected",
            },
        }
        for p in points
    ]
    return {
        "type": "FeatureCollection",
        "features": features,
        "properties": {
            "generated": datetime.now(timezone.utc).isoformat(),
            "source": "CHM = DOM1 − DGM1 (LGL-BW lokal) + LoG Blob Detection",
            "bbox": bbox_str,
            "total_detected": len(features),
            **params,
        },
    }


def save_tif(arr: np.ndarray, min_e: float, max_n: float, path: Path):
    """Speichert ein Array als georeferenziertes float32-GeoTIFF (EPSG:25832)."""
    try:
        import rasterio
        from rasterio.transform import from_origin
        with rasterio.open(path, "w", driver="GTiff",
                           height=arr.shape[0], width=arr.shape[1],
                           count=1, dtype="float32", crs="EPSG:25832",
                           transform=from_origin(min_e, max_n, RES_M, RES_M),
                           nodata=float("nan")) as dst:
            dst.write(arr, 1)
        logger.info(f"CHM GeoTIFF gespeichert: {path}")
    except Exception as exc:
        logger.warning(f"CHM GeoTIFF konnte nicht gespeichert werden: {exc}")
