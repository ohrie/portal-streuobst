"""Polygon-Filter: nur Bäume innerhalb von Streuobstwiesen."""

import sys
import logging
from pathlib import Path

import numpy as np

from .coords import RES_M

logger = logging.getLogger(__name__)


def load_orchard_polygons(geojson_path: Path, bbox_wgs84: tuple):
    """
    Lädt Streuobstwiesen-Polygone aus dem GeoJSON, räumlich auf bbox vorgefiltert.
    """
    import geopandas as gpd
    if not geojson_path.exists():
        logger.error(f"GeoJSON nicht gefunden: {geojson_path}")
        sys.exit(1)
    logger.info(f"Lade Streuobstwiesen aus {geojson_path} …")
    gdf = gpd.read_file(str(geojson_path), bbox=bbox_wgs84)
    if "layer" in gdf.columns:
        gdf = gdf[gdf["layer"].isin(["wiesen", "streuobstwiesen"])]
    gdf = gdf[gdf.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    logger.info(f"  {len(gdf)} Polygone in bbox")
    return gdf


def rasterize_polygons(gdf, min_e: float, max_n: float, width_px: int, height_px: int) -> np.ndarray:
    """
    Rasterisiert Polygone in eine boolean-Maske der CHM-Größe.
    True = Pixel liegt innerhalb eines Polygons.
    """
    from rasterio.transform import from_origin
    from rasterio.features import rasterize as rio_rasterize

    if gdf.empty:
        return np.zeros((height_px, width_px), dtype=bool)

    gdf_utm = gdf.to_crs("EPSG:25832")
    transform = from_origin(min_e, max_n, RES_M, RES_M)
    shapes = ((geom, 1) for geom in gdf_utm.geometry if geom is not None)
    mask = rio_rasterize(
        shapes,
        out_shape=(height_px, width_px),
        transform=transform,
        fill=0,
        dtype=np.uint8,
    )
    return mask.astype(bool)


def filter_in_polygons(points: list, gdf) -> list:
    """
    Nachträglicher Punkt-in-Polygon-Check als zweite Sicherheitsstufe.
    """
    import geopandas as gpd
    from shapely.geometry import Point
    if gdf.empty:
        return []
    trees = gpd.GeoDataFrame(
        geometry=[Point(p[0], p[1]) for p in points],
        crs="EPSG:4326",
    )
    joined = gpd.sjoin(trees, gdf[["geometry"]], how="inner", predicate="within")
    idx = joined[~joined.index.duplicated(keep="first")].index.tolist()
    return [points[i] for i in idx]
