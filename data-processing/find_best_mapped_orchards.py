#!/usr/bin/env python3
"""
Ermittelt die am besten kartierten Obstwiesen: Flächen mit mehr als
MIN_CULTIVAR_TREES Obstbäumen, bei denen die Sorte eingetragen ist.

Die Liste wird auf der Karte (/karte) in der Seitenleiste angezeigt und ist
bewusst hart kodiert. Dieses Skript läuft nicht in der Pipeline, sondern wird
bei Bedarf manuell ausgeführt und schreibt die Datei neu:

    source venv/bin/activate
    python find_best_mapped_orchards.py

Liest:
  - output/all_streuobstwiesen.geojson  (Flächen + Bäume aus der Pipeline)

Schreibt:
  - ../web/src/data/bestMappedOrchards.ts

Namen: OSM-Name der Fläche, sonst Name einer umschließenden benannten
Obstfläche, sonst „Obstwiese bei <Ort>“ (Frontend). Ort und Bundesland kommen
per Reverse-Geocoding von Nominatim (max. 1 Anfrage/s).
"""

import json
import logging
import subprocess
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import geopandas as gpd
import requests
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
WIESEN_FILE = BASE_DIR / "output" / "all_streuobstwiesen.geojson"
OUTPUT_FILE = BASE_DIR / ".." / "web" / "src" / "data" / "bestMappedOrchards.ts"

MIN_CULTIVAR_TREES = 20  # strikt mehr als diese Anzahl
CULTIVAR_KEYS = ("taxon:cultivar", "taxon:cultivar:de", "cultivar")
PLACEHOLDERS = {"unbekannt", "unknown", "kulturform", "wildform"}

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "portal-streuobst.de best-mapped-orchards (https://portal-streuobst.de)"


def cultivar_of(props: dict) -> str | None:
    for key in CULTIVAR_KEYS:
        value = (props.get(key) or "").strip()
        if value and value.lower() not in PLACEHOLDERS:
            return value
    return None


def osm_ref(area_id: str) -> str:
    """osmium-Area-ID ("a<n>") -> "way/<id>" bzw. "relation/<id>"."""
    n = int(area_id[1:])
    return f"way/{n // 2}" if n % 2 == 0 else f"relation/{n // 2}"


def area_ha(geom) -> float:
    return gpd.GeoSeries([geom], crs=4326).to_crs(25832).area.iloc[0] / 10000


def reverse_geocode(lng: float, lat: float) -> tuple[str | None, str | None]:
    params = {"format": "jsonv2", "lat": lat, "lon": lng, "zoom": 14, "accept-language": "de"}
    try:
        r = requests.get(NOMINATIM_URL, params=params, headers={"User-Agent": USER_AGENT}, timeout=30)
        r.raise_for_status()
        address = r.json().get("address", {})
    except Exception as e:
        logger.warning(f"Nominatim-Fehler bei {lat},{lng}: {e}")
        return None, None
    finally:
        time.sleep(1.1)  # Nominatim Usage Policy
    place = next((address[k] for k in ("village", "town", "city", "municipality", "suburb") if address.get(k)), None)
    return place, address.get("state")


def main() -> None:
    logger.info(f"Lade {WIESEN_FILE}")
    with open(WIESEN_FILE, encoding="utf-8") as f:
        features = json.load(f)["features"]

    areas = [ft for ft in features
             if ft["properties"].get("type") != "tree"
             and ft["geometry"]["type"] in ("Polygon", "MultiPolygon")]
    polys = [shape(a["geometry"]) for a in areas]
    index = STRtree(polys)
    logger.info(f"  {len(areas):,} Flächen, zähle Bäume mit Sorte …")

    # Bäume mit Sorte je Fläche (osm_id der Bäume, damit Duplikate erkennbar sind)
    cultivar_trees: dict[int, dict[str, str]] = defaultdict(dict)
    tree_counts: Counter = Counter()
    for ft in features:
        props = ft["properties"]
        if props.get("type") != "tree":
            continue
        pt = Point(ft["geometry"]["coordinates"][:2])
        cultivar = cultivar_of(props)
        for i in index.query(pt):
            if polys[i].contains(pt):
                tree_counts[i] += 1
                if cultivar:
                    cultivar_trees[i][props["osm_id"]] = cultivar

    selected = [i for i, trees in cultivar_trees.items() if len(trees) > MIN_CULTIVAR_TREES]
    # Benannte Flächen zuerst, damit sie bei identischem Baumbestand gewinnen
    selected.sort(key=lambda i: (-len(cultivar_trees[i]), not areas[i]["properties"].get("name")))

    result = []
    seen_tree_sets: set[frozenset] = set()
    for i in selected:
        tree_set = frozenset(cultivar_trees[i])
        if tree_set in seen_tree_sets:
            logger.info(f"  Übersprungen (gleiche Bäume wie andere Fläche): {osm_ref(areas[i]['properties']['osm_id'])}")
            continue
        seen_tree_sets.add(tree_set)

        props = areas[i]["properties"]
        geom = polys[i]
        center = geom.representative_point()

        name = props.get("name")
        if not name:
            # Name einer umschließenden, benannten Obstfläche übernehmen
            for j in index.query(center):
                if j != i and areas[j]["properties"].get("name") and polys[j].contains(center):
                    name = areas[j]["properties"]["name"]
                    break

        place, state = reverse_geocode(center.x, center.y)
        cultivars = Counter(cultivar_trees[i].values())
        entry = {
            "name": name,
            "place": place or "",
            "state": state or "",
            "cultivarTrees": len(tree_set),
            "trees": tree_counts[i],
            "cultivars": len(cultivars),
            "topCultivars": [c for c, _ in cultivars.most_common(3)],
            "areaHa": round(area_ha(geom), 2),
            "center": [round(center.x, 6), round(center.y, 6)],
            "bbox": [round(v, 6) for v in geom.bounds],
            "osm": osm_ref(props["osm_id"]),
        }
        result.append(entry)
        logger.info(f"  {entry['cultivarTrees']:>4}  {name or '–'} ({place}, {state})")

    write_ts(result, datetime.fromtimestamp(WIESEN_FILE.stat().st_mtime).strftime("%Y-%m-%d"))
    logger.info(f"Fertig: {len(result)} Flächen → {OUTPUT_FILE.resolve()}")


def write_ts(entries: list[dict], data_date: str) -> None:
    def js(value) -> str:
        return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))

    lines = [
        f"// Flächen mit mehr als {MIN_CULTIVAR_TREES} Obstbäumen, bei denen die Sorte eingetragen ist",
        "// (taxon:cultivar / taxon:cultivar:de / cultivar, ohne Platzhalter wie „unbekannt“).",
        "// Generiert von data-processing/find_best_mapped_orchards.py – nicht von Hand bearbeiten.",
        "export type BestMappedOrchard = {",
        "  /** OSM-Name der Fläche (oder einer umschließenden Fläche), falls vorhanden */",
        "  name: string | null;",
        "  place: string;",
        "  state: string;",
        "  /** Bäume mit eingetragener Sorte */",
        "  cultivarTrees: number;",
        "  /** Alle erfassten Bäume in der Fläche */",
        "  trees: number;",
        "  /** Anzahl verschiedener Sorten */",
        "  cultivars: number;",
        "  topCultivars: string[];",
        "  areaHa: number;",
        "  /** Punkt sicher innerhalb der Fläche [lng, lat] */",
        "  center: [number, number];",
        "  /** [west, south, east, north] */",
        "  bbox: [number, number, number, number];",
        '  /** OSM-Objekt, z. B. "way/1373324442" */',
        "  osm: string;",
        "};",
        "",
        f'export const BEST_MAPPED_ORCHARDS_DATE = "{data_date}";',
        "",
        "export const BEST_MAPPED_ORCHARDS: BestMappedOrchard[] = [",
    ]
    for e in entries:
        lines.append("  {")
        lines.extend(f"    {key}: {js(value)}," for key, value in e.items())
        lines.append("  },")
    lines += ["];", ""]
    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")

    # An den Code-Stil der Web-App anpassen (Biome), falls verfügbar
    web_dir = BASE_DIR / ".." / "web"
    try:
        subprocess.run(["npx", "biome", "format", "--write", str(OUTPUT_FILE.resolve())],
                       cwd=web_dir, check=True, capture_output=True)
    except (OSError, subprocess.CalledProcessError) as e:
        logger.warning(f"Biome-Formatierung übersprungen: {e}")


if __name__ == "__main__":
    main()
