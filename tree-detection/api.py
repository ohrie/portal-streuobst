"""
FastAPI-Server für Baumdetektierung per OSM-ID.

GET /api/trees/{osm_id}  →  GeoJSON FeatureCollection mit erkannten Bäumen.
"""

import asyncio
import json
import logging
from datetime import date
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi import Path as APIPath
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from core.coords import bbox_wgs84_to_utm, BW_LON_MIN, BW_LON_MAX, BW_LAT_MIN, BW_LAT_MAX
from core.tiles import find_tiles, load_mosaic
from core.detection import detect_blobs, blobs_to_points, deduplicate
from core.polygons import rasterize_polygons, filter_in_polygons
from core.output import build_geojson
from core.downloader import download_tiles_for_bbox
from core import polygon_lookup

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pfade
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).parent / "data"
TREES_DIR = DATA_DIR / "trees"
DOM1_DIR = DATA_DIR / "dom1"
DGM1_DIR = DATA_DIR / "dgm1"
GEOJSON_PATH = Path("/app/all_streuobstwiesen.geojson")

# Fallback für lokale Entwicklung
if not GEOJSON_PATH.exists():
    _local = Path(__file__).parent.parent / "data-processing" / "output" / "all_streuobstwiesen.geojson"
    if _local.exists():
        GEOJSON_PATH = _local

TREES_DIR.mkdir(parents=True, exist_ok=True)
DOM1_DIR.mkdir(parents=True, exist_ok=True)
DGM1_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Streuobst Tree Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "https://portal-streuobst.de",
        "https://www.portal-streuobst.de",
    ],
    allow_methods=["GET"],
    allow_headers=[],
)


@app.on_event("startup")
async def startup():
    """Polygon-Index beim Start laden."""
    if GEOJSON_PATH.exists():
        polygon_lookup.init(GEOJSON_PATH)
    else:
        logger.warning(f"GeoJSON nicht gefunden: {GEOJSON_PATH} – Polygon-Lookup deaktiviert")


# ---------------------------------------------------------------------------
# Detection Pipeline
# ---------------------------------------------------------------------------

# Default detection parameters
MIN_HEIGHT_M = 3.0
MAX_HEIGHT_M = 18.0
MIN_SIGMA = 2.0   # Kleinster Kronenradius (px): sigma=2 → Radius ≈ 2.8 m → Ø ~5.6 m Krone
MAX_SIGMA = 8.0   # Größter Kronenradius (px):  sigma=8 → Radius ≈ 11 m  → Ø ~22 m Krone
BLOB_THRESHOLD = 0.05


def _latest_cached(osm_id: str) -> Path | None:
    """Gibt den neuesten gecachten GeoJSON-Pfad zurück, oder None."""
    files = sorted(TREES_DIR.glob(f"{osm_id}_*.geojson"))
    return files[-1] if files else None


def _run_pipeline(osm_id: str, polygon) -> Path:
    """Führt die komplette Detektions-Pipeline für ein Polygon aus."""
    import geopandas as gpd

    bounds = polygon.bounds  # (min_lon, min_lat, max_lon, max_lat)
    min_lon, min_lat, max_lon, max_lat = bounds

    # 1. Tiles downloaden (überspringt bereits vorhandene)
    logger.info(f"[{osm_id}] Download tiles für bbox {bounds}")
    download_tiles_for_bbox(min_lon, min_lat, max_lon, max_lat, DOM1_DIR, DGM1_DIR)

    # 2. Mosaike laden
    min_e, min_n, max_e, max_n = bbox_wgs84_to_utm(min_lon, min_lat, max_lon, max_lat)

    dom1_tiles = find_tiles(DOM1_DIR, min_e, min_n, max_e, max_n)
    dgm1_tiles = find_tiles(DGM1_DIR, min_e, min_n, max_e, max_n)
    if not dom1_tiles or not dgm1_tiles:
        raise RuntimeError(f"Keine Kacheln für {osm_id} verfügbar (DOM1: {len(dom1_tiles)}, DGM1: {len(dgm1_tiles)})")

    logger.info(f"[{osm_id}] Lade Mosaike (DOM1: {len(dom1_tiles)}, DGM1: {len(dgm1_tiles)} Kacheln)")
    dom1 = load_mosaic(dom1_tiles, min_e, min_n, max_e, max_n)
    dgm1 = load_mosaic(dgm1_tiles, min_e, min_n, max_e, max_n)

    # 3. CHM berechnen
    chm = dom1 - dgm1
    chm[np.isnan(dom1) | np.isnan(dgm1)] = np.nan

    # 4. Polygon-Maske aus der Overpass-Geometrie
    gdf = gpd.GeoDataFrame(geometry=[polygon], crs="EPSG:4326")
    h_px, w_px = chm.shape
    mask = rasterize_polygons(gdf, min_e, max_n, w_px, h_px)
    chm[~mask] = np.nan

    # 5. Blob-Detektion
    logger.info(f"[{osm_id}] Blob-Detektion …")
    blobs = detect_blobs(chm, MIN_HEIGHT_M, MAX_HEIGHT_M, MIN_SIGMA, MAX_SIGMA, BLOB_THRESHOLD)
    points = blobs_to_points(blobs, chm, min_e, max_n)
    points = deduplicate(points)

    # 6. Punkt-in-Polygon-Check
    points = filter_in_polygons(points, gdf)
    logger.info(f"[{osm_id}] {len(points)} Bäume erkannt")

    # 7. Speichern
    params = dict(
        osm_id=osm_id,
        min_height_m=MIN_HEIGHT_M, max_height_m=MAX_HEIGHT_M,
        min_sigma=MIN_SIGMA, max_sigma=MAX_SIGMA, blob_threshold=BLOB_THRESHOLD,
    )
    geojson = build_geojson(points, str(bounds), params)
    out_path = TREES_DIR / f"{osm_id}_{date.today().isoformat()}.geojson"
    out_path.write_text(json.dumps(geojson, ensure_ascii=False), encoding="utf-8")
    logger.info(f"[{osm_id}] Gespeichert: {out_path}")
    return out_path


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.get("/api/trees/{osm_id}")
async def get_trees(osm_id: str = APIPath(..., pattern=r'^[nwa]\d+$')):
    """Gibt erkannte Bäume als GeoJSON zurück. Gecachte Ergebnisse werden sofort geliefert."""
    # 1. Cache prüfen
    cached = _latest_cached(osm_id)
    if cached:
        logger.info(f"[{osm_id}] Cache-Hit: {cached.name}")
        return FileResponse(cached, media_type="application/geo+json")

    # 2. Polygon aus Index holen
    polygon = polygon_lookup.get_polygon(osm_id)
    if polygon is None:
        raise HTTPException(status_code=404, detail=f"OSM-ID {osm_id} nicht gefunden")

    # 3. BW-Bounds-Check (LGL-BW liefert nur Daten für Baden-Württemberg)
    min_lon, min_lat, max_lon, max_lat = polygon.bounds
    if not (BW_LON_MIN <= min_lon <= BW_LON_MAX and BW_LON_MIN <= max_lon <= BW_LON_MAX
            and BW_LAT_MIN <= min_lat <= BW_LAT_MAX and BW_LAT_MIN <= max_lat <= BW_LAT_MAX):
        raise HTTPException(
            status_code=422,
            detail=f"Diese Fläche liegt außerhalb Baden-Württembergs "
                   f"(bounds: {min_lon:.4f},{min_lat:.4f},{max_lon:.4f},{max_lat:.4f}). "
                   f"LGL-BW Höhendaten sind nur für BW verfügbar."
        )

    # 4. Pipeline in Thread-Pool ausführen (CPU-intensiv), max. 180 Sekunden
    loop = asyncio.get_event_loop()
    try:
        out_path = await asyncio.wait_for(
            loop.run_in_executor(None, _run_pipeline, osm_id, polygon),
            timeout=180.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Zeitüberschreitung: Baumdetektierung dauerte länger als 3 Minuten.",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return FileResponse(out_path, media_type="application/geo+json")
