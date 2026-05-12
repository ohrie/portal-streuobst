"""
Berechnet Streuobstwiesen-Statistiken je Bundesland.

Liest:
  - geodata/bundeslaender.geojson  (16 Bundesland-Polygone)
  - output/all_streuobstwiesen.geojson  (alle erfassten Flächen)

Schreibt:
  - output/stats_laender.json
  - ../web/public/stats_laender.json
"""

import json
import logging
import shutil
from datetime import datetime
from pathlib import Path

from shapely.geometry import shape, Point
from shapely.ops import unary_union

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
WEB_PUBLIC_DIR = BASE_DIR / ".." / "web" / "public"

BUNDESLAENDER_FILE = BASE_DIR / "geodata" / "bundeslaender.geojson"
WIESEN_FILE = OUTPUT_DIR / "all_streuobstwiesen.geojson"
OUTPUT_FILE = OUTPUT_DIR / "stats_laender.json"


def area_ha(geom) -> float:
    """WGS84-Näherung: Fläche in Hektar (konsistent mit process_streuobstwiesen.py)."""
    return geom.area * 111320 * 111320 / 10000


VALID_KUERZEL = {"BB", "BE", "BW", "BY", "HB", "HE", "HH", "MV", "NI", "NW", "RP", "SH", "SL", "SN", "ST", "TH"}

def load_bundeslaender(path: Path) -> list[dict]:
    """Lädt die 16 Bundesländer und vereint mehrfach vorhandene Polygone (Bodensee etc.)."""
    logger.info(f"Lade Bundesländer aus {path}")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    by_kuerzel: dict[str, dict] = {}
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        kuerzel = props.get("Länderkürzel_LKZ", "")
        if kuerzel not in VALID_KUERZEL:
            continue
        try:
            geom = shape(feature["geometry"])
        except Exception as e:
            logger.warning(f"Geometrie-Fehler für {props.get('GeografischerName_GEN')}: {e}")
            continue
        if kuerzel not in by_kuerzel:
            by_kuerzel[kuerzel] = {
                "name": props.get("GeografischerName_GEN", "Unbekannt"),
                "kuerzel": kuerzel,
                "ars": props.get("Regionalschlüssel_ARS", ""),
                "geoms": [],
                "wiesen_count": 0,
                "wiesen_area_ha": 0.0,
                "trees_count": 0,
            }
        by_kuerzel[kuerzel]["geoms"].append(geom)

    laender = []
    for entry in by_kuerzel.values():
        geoms = entry.pop("geoms")
        entry["geom"] = unary_union(geoms) if len(geoms) > 1 else geoms[0]
        laender.append(entry)

    logger.info(f"  → {len(laender)} Bundesländer geladen")
    return laender


def assign_wiesen_to_laender(laender: list[dict], wiesen_path: Path) -> None:
    logger.info(f"Lade Streuobstwiesen aus {wiesen_path}")
    with open(wiesen_path, encoding="utf-8") as f:
        data = json.load(f)
    features = data.get("features", [])
    logger.info(f"  → {len(features)} Features geladen, starte Zuordnung …")

    unassigned = 0
    for i, feature in enumerate(features):
        if i % 5000 == 0 and i > 0:
            logger.info(f"  … {i}/{len(features)} verarbeitet")
        try:
            geom = shape(feature["geometry"])
            is_tree = geom.geom_type == "Point"
            centroid = geom if is_tree else geom.centroid
            ha = 0.0 if is_tree else area_ha(geom)
        except Exception:
            unassigned += 1
            continue

        matched = False
        for land in laender:
            if land["geom"].contains(centroid):
                if is_tree:
                    land["trees_count"] += 1
                else:
                    land["wiesen_count"] += 1
                    land["wiesen_area_ha"] += ha
                matched = True
                break

        if not matched:
            # Fallback: nächste Bundesland-Grenze via Distanz
            min_dist = float("inf")
            nearest = None
            for land in laender:
                d = land["geom"].distance(centroid)
                if d < min_dist:
                    min_dist = d
                    nearest = land
            if nearest is not None:
                if is_tree:
                    nearest["trees_count"] += 1
                else:
                    nearest["wiesen_count"] += 1
                    nearest["wiesen_area_ha"] += ha
            else:
                unassigned += 1

    if unassigned:
        logger.warning(f"  {unassigned} Features konnten nicht zugeordnet werden")
    logger.info("  Zuordnung abgeschlossen")


def build_output(laender: list[dict]) -> dict:
    result_laender = [
        {
            "name": l["name"],
            "kuerzel": l["kuerzel"],
            "ars": l["ars"],
            "wiesen_count": l["wiesen_count"],
            "wiesen_area_ha": round(l["wiesen_area_ha"], 2),
            "trees_count": l["trees_count"],
        }
        for l in laender
    ]
    result_laender.sort(key=lambda x: x["wiesen_count"], reverse=True)
    return {
        "generated": datetime.now().isoformat(),
        "laender": result_laender,
    }


def write_output(data: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"Geschrieben: {path}")


def main() -> None:
    if not BUNDESLAENDER_FILE.exists():
        logger.error(f"Datei nicht gefunden: {BUNDESLAENDER_FILE}")
        raise SystemExit(1)
    if not WIESEN_FILE.exists():
        logger.error(f"Datei nicht gefunden: {WIESEN_FILE}")
        raise SystemExit(1)

    laender = load_bundeslaender(BUNDESLAENDER_FILE)
    assign_wiesen_to_laender(laender, WIESEN_FILE)
    output = build_output(laender)

    write_output(output, OUTPUT_FILE)

    web_target = WEB_PUBLIC_DIR / "stats_laender.json"
    if WEB_PUBLIC_DIR.exists():
        shutil.copy(OUTPUT_FILE, web_target)
        logger.info(f"Kopiert nach: {web_target}")
    else:
        logger.warning(f"Web-public-Verzeichnis nicht gefunden: {WEB_PUBLIC_DIR}")

    logger.info("Fertig!")
    for l in output["laender"]:
        logger.info(f"  {l['name']}: {l['wiesen_count']} Wiesen, {l['wiesen_area_ha']} ha, {l['trees_count']} Bäume")


if __name__ == "__main__":
    main()
