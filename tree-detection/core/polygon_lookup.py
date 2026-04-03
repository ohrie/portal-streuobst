"""Polygon-Lookup aus all_streuobstwiesen.geojson per osm_id."""

import json
import logging
from pathlib import Path

from shapely.geometry import shape

logger = logging.getLogger(__name__)

_INDEX: dict[str, object] | None = None
_GEOJSON_PATH: Path | None = None


def init(geojson_path: Path) -> None:
    """Lädt das GeoJSON und baut den Index auf (einmalig)."""
    global _INDEX, _GEOJSON_PATH
    if _INDEX is not None and _GEOJSON_PATH == geojson_path:
        return

    logger.info(f"Lade Streuobstwiesen-Index aus {geojson_path} …")
    with open(geojson_path, encoding="utf-8") as f:
        data = json.load(f)

    _INDEX = {}
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        layer = props.get("layer", "")
        if layer not in ("wiesen", "streuobstwiesen"):
            continue
        osm_id = props.get("osm_id")
        if not osm_id:
            continue
        geom = feat.get("geometry")
        if geom:
            _INDEX[str(osm_id)] = shape(geom)

    _GEOJSON_PATH = geojson_path
    logger.info(f"  {len(_INDEX)} Polygone indexiert")


def get_polygon(osm_id: str):
    """Gibt die Shapely-Geometrie für eine osm_id zurück, oder None."""
    if _INDEX is None:
        raise RuntimeError("polygon_lookup.init() wurde nicht aufgerufen")
    return _INDEX.get(str(osm_id))
