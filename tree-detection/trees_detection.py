#!/usr/bin/env python3
"""
Baumdetektion via echtem CHM aus lokalen DOM1- + DGM1-GeoTIFFs (LGL-BW)
========================================================================

Methodik
--------
1. DOM1 laden  – Digitales Oberflächenmodell (1 m/px, float32, inkl. Bäume/Gebäude)
2. DGM1 laden  – Digitales Geländemodell     (1 m/px, float32, nur Boden)
3. CHM berechnen:  CHM = DOM1 − DGM1  → Vegetationshöhe in Metern
4. Höhenfilter: Pixel außerhalb [min_height_m … max_height_m] auf 0 setzen
5. Blob-Detektion: Laplacian-of-Gaussian (LoG) findet kreisförmige Erhebungen
   (= Baumkronen) im CHM als lokale Maxima.
6. Polygon-Filter: nur Bäume innerhalb kartierter Streuobstwiesen behalten.

Kachelbenennungsschema (LGL-BW):
    {dom1|dgm1}_32_{e_km}_{n_km}_1_bw_{year}.tif/.xyz
    → 1 km × 1 km Kachel, Südwest-Ecke bei (e_km*1000, n_km*1000) in UTM 32N

Parameter-Übersicht (→ CLI-Optionen, alle mit Standardwert):
    --min-height-m    Untergrenze CHM für Bäume (m)             Standard: 3.0
    --max-height-m    Obergrenze CHM (höhere Werte = Gebäude)   Standard: 18.0
    --min-sigma       Kleinste Kronenradius-Schätzung (px)      Standard: 2.0  → Ø ~5.6 m
    --max-sigma       Größte Kronenradius-Schätzung (px)        Standard: 8.0  → Ø ~22 m
    --blob-threshold  LoG-Kontrastschwelle (kleiner = mehr)     Standard: 0.05
"""

import sys
import logging
import json
from pathlib import Path

import click
import numpy as np

from core.coords import bbox_wgs84_to_utm, BW_LON_MIN, BW_LON_MAX, BW_LAT_MIN, BW_LAT_MAX
from core.tiles import find_tiles, load_mosaic
from core.detection import detect_blobs, blobs_to_points, deduplicate
from core.polygons import load_orchard_polygons, rasterize_polygons, filter_in_polygons
from core.output import build_geojson, save_tif

# ---------------------------------------------------------------------------
# Pfad-Konstanten
# ---------------------------------------------------------------------------

DOM1_DIR = Path(__file__).parent / "data" / "dom1"
DGM1_DIR = Path(__file__).parent / "data" / "dgm1"
DEFAULT_GEOJSON = (
    Path(__file__).parent.parent / "data-processing" / "output" / "all_streuobstwiesen.geojson"
)
OUTPUT_DIR = Path(__file__).parent / "data"

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
# CLI
# ---------------------------------------------------------------------------

@click.command()
@click.option("--bbox", required=True,
              help='WGS84: "min_lon,min_lat,max_lon,max_lat". '
                   'Verfügbare Daten ca. 9.426,49.274,9.482,49.328')
@click.option("--dom1-dir",  default=str(DOM1_DIR), show_default=True,
              help="Verzeichnis mit DOM1-Kacheln (TIF, rekursiv durchsucht).")
@click.option("--dgm1-dir",  default=str(DGM1_DIR), show_default=True,
              help="Verzeichnis mit DGM1-Kacheln (TIF oder XYZ in ZIPs).")
@click.option("--geojson",   default=str(DEFAULT_GEOJSON), show_default=True,
              help="Streuobstwiesen-GeoJSON für Polygon-Filter.")
@click.option("--output",    default=None,
              help="Ausgabepfad GeoJSON (Standard: data/detected_trees_chm_local_<bbox>.geojson).")
# ── Höhen-Parameter ──────────────────────────────────────────────────────────
@click.option("--min-height-m", default=3.0,  show_default=True,
              help="Untergrenze CHM: Pixel darunter gelten nicht als Baum. "
                   "Streuobstbäume typisch 3–18 m.")
@click.option("--max-height-m", default=18.0, show_default=True,
              help="Obergrenze CHM: höhere Pixel (Gebäude, Masten) werden ignoriert.")
# ── Blob-Parameter ───────────────────────────────────────────────────────────
@click.option("--min-sigma",      default=2.0,  show_default=True,
              help="Kleinste LoG-Sigma (px). sigma=2 → Kronenradius ≈ 2.8 m (Ø 5.6 m).")
@click.option("--max-sigma",      default=8.0,  show_default=True,
              help="Größte LoG-Sigma (px).  sigma=8 → Kronenradius ≈ 11 m  (Ø 22 m).")
@click.option("--blob-threshold", default=0.05, show_default=True,
              help="LoG-Kontrastschwelle. Kleiner = mehr Detektionen, mehr Rauschen.")
# ── Debug ────────────────────────────────────────────────────────────────────
@click.option("--no-filter", is_flag=True, default=False,
              help="Polygon-Filter überspringen (Debug: zeigt alle Detektionen).")
@click.option("--save-chm",  is_flag=True, default=False,
              help="CHM als GeoTIFF speichern für Inspektion in QGIS (data/chm_<bbox>.tif).")
@click.option("--verbose",   is_flag=True, default=False,
              help="DEBUG-Logging aktivieren.")
def main(bbox, dom1_dir, dgm1_dir, geojson, output,
         min_height_m, max_height_m, min_sigma, max_sigma, blob_threshold,
         no_filter, save_chm, verbose):
    """Baumdetektion via echtem CHM = DOM1 − DGM1 aus lokalen LGL-BW GeoTIFFs."""
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # bbox parsen
    try:
        parts = [float(x.strip()) for x in bbox.split(",")]
        assert len(parts) == 4
        min_lon, min_lat, max_lon, max_lat = parts
    except Exception:
        raise click.BadParameter('Format: "min_lon,min_lat,max_lon,max_lat"', param_hint="--bbox")

    if not (BW_LON_MIN <= min_lon <= BW_LON_MAX and BW_LON_MIN <= max_lon <= BW_LON_MAX
            and BW_LAT_MIN <= min_lat <= BW_LAT_MAX and BW_LAT_MIN <= max_lat <= BW_LAT_MAX):
        logger.warning("bbox liegt außerhalb Baden-Württembergs.")

    bbox_wgs84 = (min_lon, min_lat, max_lon, max_lat)
    bbox_str   = bbox.replace(" ", "")
    safe_bbox  = bbox_str.replace(",", "_")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = Path(output) if output else OUTPUT_DIR / f"detected_trees_chm_local_{safe_bbox}.geojson"
    logger.info(f"bbox: {bbox_str}  →  {out_path}")

    min_e, min_n, max_e, max_n = bbox_wgs84_to_utm(min_lon, min_lat, max_lon, max_lat)
    logger.info(f"UTM32: E {min_e:.0f}–{max_e:.0f}, N {min_n:.0f}–{max_n:.0f}")

    # ── 1. DOM1 laden (Oberflächenmodell) ────────────────────────────────────
    dom1_path  = Path(dom1_dir)
    dom1_tiles = find_tiles(dom1_path, min_e, min_n, max_e, max_n)
    if not dom1_tiles:
        logger.error(f"Keine DOM1-Kacheln in {dom1_path}")
        sys.exit(1)
    logger.info(f"DOM1: {len(dom1_tiles)} Kachel(n)")
    dom1  = load_mosaic(dom1_tiles, min_e, min_n, max_e, max_n)
    valid = dom1[~np.isnan(dom1)]
    logger.info(f"  Höhe: {valid.min():.1f} – {valid.max():.1f} m (Ø {valid.mean():.1f} m)")

    # ── 2. DGM1 laden (Geländemodell, reiner Boden) ──────────────────────────
    dgm1_path  = Path(dgm1_dir)
    dgm1_tiles = find_tiles(dgm1_path, min_e, min_n, max_e, max_n)
    if not dgm1_tiles:
        logger.error(f"Keine DGM1-Kacheln in {dgm1_path}")
        sys.exit(1)
    logger.info(f"DGM1: {len(dgm1_tiles)} Kachel(n)")
    dgm1  = load_mosaic(dgm1_tiles, min_e, min_n, max_e, max_n)
    valid = dgm1[~np.isnan(dgm1)]
    logger.info(f"  Höhe: {valid.min():.1f} – {valid.max():.1f} m (Ø {valid.mean():.1f} m)")

    # ── 3. CHM berechnen ─────────────────────────────────────────────────────
    chm = dom1 - dgm1
    chm[np.isnan(dom1) | np.isnan(dgm1)] = np.nan
    valid_chm = chm[~np.isnan(chm)]
    n_in_range = ((valid_chm >= min_height_m) & (valid_chm <= max_height_m)).sum()
    logger.info(f"CHM: {valid_chm.min():.2f} – {valid_chm.max():.2f} m  "
                f"(Pixel {min_height_m}–{max_height_m} m: {n_in_range})")

    if save_chm:
        save_tif(chm, min_e, max_n, out_path.parent / f"chm_{safe_bbox}.tif")

    # ── 4. Polygon-Maske anwenden (Detektion NUR innerhalb Streuobstwiesen) ──
    h_px, w_px = chm.shape
    if not no_filter:
        gdf = load_orchard_polygons(Path(geojson), bbox_wgs84)
        if not gdf.empty:
            poly_mask = rasterize_polygons(gdf, min_e, max_n, w_px, h_px)
            chm_masked = chm.copy()
            chm_masked[~poly_mask] = np.nan
            logger.info(f"  Polygon-Maske: {poly_mask.sum()} von {poly_mask.size} Pixeln aktiv "
                        f"({100*poly_mask.mean():.1f}%)")
        else:
            logger.warning("Keine Streuobstwiesen-Polygone in bbox – Detektion im gesamten Bereich.")
            chm_masked = chm
            gdf = None
    else:
        logger.info("Polygon-Filter übersprungen (--no-filter) – Detektion im gesamten Bereich.")
        chm_masked = chm
        gdf = None

    # ── 5. Blob-Detektion nur im maskierten CHM ──────────────────────────────
    logger.info(f"Blob-Detektion (CHM {min_height_m}–{max_height_m} m, "
                f"sigma {min_sigma}–{max_sigma}, threshold {blob_threshold}) …")
    blobs  = detect_blobs(chm_masked, min_height_m, max_height_m, min_sigma, max_sigma, blob_threshold)
    logger.info(f"  Rohe Detektionen: {len(blobs)}")

    points = blobs_to_points(blobs, chm_masked, min_e, max_n)
    points = deduplicate(points)
    logger.info(f"  Nach Deduplizierung: {len(points)}")

    # ── 6. Nachgelagerter Punkt-in-Polygon-Check (Randpixel) ─────────────────
    if not no_filter and gdf is not None and not gdf.empty:
        points = filter_in_polygons(points, gdf)
        logger.info(f"  Nach Polygon-Check: {len(points)} Bäume in Streuobstwiesen")

    # ── 7. GeoJSON schreiben ─────────────────────────────────────────────────
    params = dict(min_height_m=min_height_m, max_height_m=max_height_m,
                  min_sigma=min_sigma, max_sigma=max_sigma, blob_threshold=blob_threshold)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(build_geojson(points, bbox_str, params), f, ensure_ascii=False, indent=2)
    logger.info(f"Ausgabe: {len(points)} Bäume → {out_path}")


if __name__ == "__main__":
    main()
