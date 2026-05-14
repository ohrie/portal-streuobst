"""
Downloads Streuobst-related hiking and cycling routes from the DZT Knowledge Graph
via SPARQL and saves them as GeoJSON.

API key must be set in the project root .env file as DZT_API_KEY.

Output:
  output/streuobst_routes.geojson             – routes with geometry
  output/streuobst_routes_no_geometry.geojson – routes without geometry (for manual follow-up)

COPYRIGHT / LICENSE NOTE:
  Before reusing the exported data, the license of each route must be checked.
  The license is stored in the "license" property (short form) and "license_url" (full URL).
  Routes without a license statement must not be reused without explicit permission from the
  rights holder. For CC licenses (e.g. CC BY 4.0), attribution of the publisher
  ("publisher_name") is mandatory according to the license terms.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

API_KEY = os.environ.get("DZT_API_KEY")
if not API_KEY:
    print("ERROR: DZT_API_KEY not set in .env file.")
    sys.exit(1)

SPARQL_URL = "https://proxy.opendatagermany.io/api/ts/v1/kg/sparql"
OUTPUT_DIR = Path(__file__).parent / "output"

HEADERS = {
    "X-API-KEY": API_KEY,
    "Accept": "application/sparql-results+json",
}

TRAIL_TYPE_KEYWORDS = {"CyclingTrail", "HikingTrail", "WalkingTrail", "MountainBikingTrail"}

TRAIL_TYPE_URIS = [
    "https://odta.io/voc/Trail",
    "https://odta.io/voc/CyclingTrail",
    "https://odta.io/voc/HikingTrail",
    "https://odta.io/voc/WalkingTrail",
    "https://odta.io/voc/MountainBikingTrail",
]
LICENSE_PREFIXES = ("CC BY", "CC0", "PDM")

# Trails that are always included regardless of search parameters.
EXTRA_TRAIL_IDS = [
    # Traufblick-Tour: Am Albtrauf entlang rund um Mössingen
    "https://mein.toubiz.de/api/v1/article/1b6966d3-4473-4bba-960b-d16ccaf27d69",
    "https://mein.toubiz.de/api/v1/article/f23fce60-916c-4941-b1ea-90b7416f59e5",
]

# Weitere verfügbare Properties im DZT Knowledge Graph (aktuell nicht genutzt):
#   http://onlim.com/meta/dateModified         – letztes Änderungsdatum des Datensatzes
#   http://www.w3.org/1999/02/22-rdf-syntax-ns#type – Typen z.B. schema:Place, odta:Trail
#   https://odta.io/voc/startLocation          – URI des Startpunkt-Ortes
#   https://schema.org/containedInPlace        – administrative Gebiete (Bundesland, Landkreis,
#                                                Gemeinde usw.) als URIs, mehrfach vorhanden
#   https://schema.org/keywords                – weitere freie Tags (Monate, Regionen,
#                                                Schwierigkeitsgrad "mittel" usw.),
#                                                neben trail_type und license bereits extrahiert
#   https://schema.org/image → schema:thumbnailUrl  – Thumbnail-URL des Bildes (kleinere Vorschau)
#   https://schema.org/image → schema:copyrightNotice – Urheberrechtshinweis des Bildes (z.B. "CC BY-SA 4.0 Max Mustermann")
#   https://vocab.sti2.at/ds/compliesWith      – URI des verwendeten Datenschemas (ODTA Domain Spec)
#
# Bereits extrahierte Properties (in fetch_trail_details):
#   https://odta.io/voc/length → schema:value / schema:unitCode – Streckenlänge (QuantitativeValue)
#   https://odta.io/voc/uphillElevation → schema:value / schema:unitCode – Aufstieg (QuantitativeValue)
#   https://odta.io/voc/downhillElevation → schema:value / schema:unitCode – Abstieg (QuantitativeValue)
#   https://odta.io/voc/estimatedDuration      – geschätzte Dauer (Duration)


def sparql(query: str) -> list[dict]:
    resp = requests.get(SPARQL_URL, headers=HEADERS, params={"query": query}, timeout=60)
    resp.raise_for_status()
    return resp.json()["results"]["bindings"]


SEARCH_FIELD_URIS = {
    "name": "https://schema.org/name",
    "description": "https://schema.org/description",
    "keywords": "https://schema.org/keywords",
}


def fetch_trail_ids(search: str, field: str = "name") -> list[str]:
    """Get IDs of all trails where `field` contains `search` (case-insensitive).

    field: one of 'name', 'description', 'keywords', 'publisher'
    """
    s = search.lower()
    type_values = " ".join(f"<{u}>" for u in TRAIL_TYPE_URIS)
    if field == "publisher":
        # sdPublisher is a linked entity — join through its schema:name
        rows = sparql(f"""
            SELECT DISTINCT ?trail WHERE {{
                VALUES ?type {{ {type_values} }}
                ?trail a ?type .
                ?trail <https://schema.org/sdPublisher> ?pub .
                ?pub <https://schema.org/name> ?pubName .
                FILTER(CONTAINS(LCASE(STR(?pubName)), "{s}"))
            }}
        """)
    else:
        uri = SEARCH_FIELD_URIS[field]
        rows = sparql(f"""
            SELECT DISTINCT ?trail WHERE {{
                VALUES ?type {{ {type_values} }}
                ?trail a ?type .
                ?trail <{uri}> ?value .
                FILTER(CONTAINS(LCASE(STR(?value)), "{s}"))
            }}
        """)
    return [r["trail"]["value"] for r in rows]


def fetch_trail_details(trail_id: str) -> dict:
    """Fetch core metadata for one trail."""
    rows = sparql(f"""
        PREFIX schema: <https://schema.org/>
        PREFIX odta: <https://odta.io/voc/>
        SELECT ?name ?description ?url ?circular ?geo ?sdLicense ?sdPublisher
               ?length_value ?length_unit ?uphill_value ?uphill_unit ?downhill_value ?downhill_unit ?duration WHERE {{
            <{trail_id}> schema:name ?name .
            OPTIONAL {{ <{trail_id}> schema:description ?description }}
            OPTIONAL {{ <{trail_id}> schema:url ?url }}
            OPTIONAL {{ <{trail_id}> odta:circularTrail ?circular }}
            OPTIONAL {{ <{trail_id}> schema:geo ?geo }}
            OPTIONAL {{ <{trail_id}> schema:sdLicense ?sdLicense }}
            OPTIONAL {{ <{trail_id}> schema:sdPublisher ?sdPublisher }}
            OPTIONAL {{
                <{trail_id}> odta:length ?lengthNode .
                ?lengthNode schema:value ?length_value .
                OPTIONAL {{ ?lengthNode schema:unitCode ?length_unit }}
            }}
            OPTIONAL {{
                <{trail_id}> odta:uphillElevation ?uphillNode .
                ?uphillNode schema:value ?uphill_value .
                OPTIONAL {{ ?uphillNode schema:unitCode ?uphill_unit }}
            }}
            OPTIONAL {{
                <{trail_id}> odta:downhillElevation ?downhillNode .
                ?downhillNode schema:value ?downhill_value .
                OPTIONAL {{ ?downhillNode schema:unitCode ?downhill_unit }}
            }}
            OPTIONAL {{
                <{trail_id}> odta:estimatedDuration ?durNode .
                ?durNode schema:name ?duration
            }}
            FILTER(LANG(?name) = "de" || LANG(?name) = "")
        }}
        LIMIT 1
    """)
    return rows[0] if rows else {}


def fetch_keywords(trail_id: str) -> list[str]:
    rows = sparql(f"""
        SELECT ?keyword WHERE {{
            <{trail_id}> <https://schema.org/keywords> ?keyword
        }}
    """)
    return [r["keyword"]["value"] for r in rows]


def fetch_image_urls(trail_id: str) -> list[str]:
    """Return all image contentUrls for a trail in a single query."""
    rows = sparql(f"""
        PREFIX schema: <https://schema.org/>
        SELECT ?contentUrl WHERE {{
            <{trail_id}> schema:image ?img .
            ?img schema:contentUrl ?contentUrl .
        }}
    """)
    return [r["contentUrl"]["value"] for r in rows]


def fetch_publisher(publisher_id: str) -> tuple[str | None, str | None]:
    """Return (name, url) for a publisher entity."""
    rows = sparql(f"""
        PREFIX schema: <https://schema.org/>
        SELECT ?name ?url WHERE {{
            <{publisher_id}> schema:name ?name .
            OPTIONAL {{ <{publisher_id}> schema:url ?url }}
        }}
        LIMIT 1
    """)
    if not rows:
        return None, None
    row = rows[0]
    name = row["name"]["value"] if "name" in row else None
    url = row["url"]["value"] if "url" in row else None
    return name, url


def fetch_geo_line(geo_id: str) -> list[list[float]] | None:
    """Fetch coordinate line from a GeoShape entity. Returns [[lon, lat], ...] or None."""
    rows = sparql(f"""
        SELECT ?line WHERE {{
            <{geo_id}> <https://schema.org/line> ?line
        }}
    """)
    if not rows:
        return None
    line_str = rows[0]["line"]["value"]
    coords = []
    for pair in line_str.strip().split(" "):
        parts = pair.split(",")
        if len(parts) == 2:
            try:
                lon, lat = float(parts[0]), float(parts[1])
                coords.append([lon, lat])
            except ValueError:
                continue
    return coords if len(coords) >= 2 else None


def extract_trail_type(keywords: list[str]) -> str | None:
    for kw in keywords:
        if kw in TRAIL_TYPE_KEYWORDS:
            return kw
    return None


def extract_license(keywords: list[str]) -> str | None:
    for kw in keywords:
        if any(kw.startswith(prefix) for prefix in LICENSE_PREFIXES):
            return kw
    return None


def val(binding: dict, key: str) -> str | None:
    return binding[key]["value"] if key in binding else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Nur 5 Trails laden (zum Testen)")
    parser.add_argument("--search", default="streuobst", help="Suchbegriff (Standard: streuobst)")
    parser.add_argument(
        "--search-field",
        default="name",
        choices=[*SEARCH_FIELD_URIS, "publisher"],
        help="Feld, in dem gesucht wird: name (Standard), description, keywords, publisher",
    )
    parser.add_argument(
        "--ids",
        nargs="+",
        metavar="ID",
        default=[],
        help="Zusätzliche Trail-IDs (URIs), die unabhängig vom Suchbegriff eingeschlossen werden",
    )
    args = parser.parse_args()

    slug = args.search.lower().replace(" ", "_")
    output_file = OUTPUT_DIR / f"{slug}_routes.geojson"
    output_file_no_geo = OUTPUT_DIR / f"{slug}_routes_no_geometry.geojson"

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching trails where {args.search_field} contains '{args.search}' via SPARQL...")
    trail_ids = fetch_trail_ids(args.search, args.search_field)
    print(f"Found {len(trail_ids)} trails.")

    extra_ids = [tid for tid in EXTRA_TRAIL_IDS + args.ids if tid not in trail_ids]
    if extra_ids:
        print(f"Adding {len(extra_ids)} extra ID(s) (hardcoded + --ids).")
    trail_ids = trail_ids + extra_ids
    print()

    if args.test:
        trail_ids = trail_ids[:5]
        print(f"[--test] Beschränkt auf {len(trail_ids)} Trails.\n")

    publisher_cache: dict[str, tuple[str | None, str | None]] = {}
    features = []
    no_geometry = []

    for i, trail_id in enumerate(trail_ids, 1):
        try:
            details = fetch_trail_details(trail_id)
            if not details:
                print(f"  [{i}/{len(trail_ids)}] No details: {trail_id}")
                continue

            keywords = fetch_keywords(trail_id)
            time.sleep(0.1)

            trail_type = extract_trail_type(keywords)
            license_str = extract_license(keywords)

            publisher_id = val(details, "sdPublisher")
            publisher_name, publisher_url = None, None
            if publisher_id:
                if publisher_id not in publisher_cache:
                    publisher_cache[publisher_id] = fetch_publisher(publisher_id)
                    time.sleep(0.1)
                publisher_name, publisher_url = publisher_cache[publisher_id]

            image_urls = fetch_image_urls(trail_id)
            time.sleep(0.1)

            geo_id = val(details, "geo")
            geometry = None
            if geo_id:
                coords = fetch_geo_line(geo_id)
                if coords:
                    geometry = {"type": "LineString", "coordinates": coords}
                time.sleep(0.1)

            name = val(details, "name")

            def quantitative_to_meters(value_key: str, unit_key: str) -> float | None:
                v = val(details, value_key)
                if v is None:
                    return None
                try:
                    num = float(v)
                    unit = (val(details, unit_key) or "").upper()
                    if unit == "KMT":
                        num = num * 1000
                    return num
                except ValueError:
                    return None

            length_m = quantitative_to_meters("length_value", "length_unit")
            uphill_m = quantitative_to_meters("uphill_value", "uphill_unit")
            downhill_m = quantitative_to_meters("downhill_value", "downhill_unit")

            feature = {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "source_id": trail_id,
                    "name": name,
                    "description": val(details, "description"),
                    "url": val(details, "url"),
                    "trail_type": trail_type,
                    "circular": val(details, "circular"),
                    "length_m": length_m,
                    "uphill_m": uphill_m,
                    "downhill_m": downhill_m,
                    "duration": val(details, "duration"),
                    "license": license_str,
                    "license_url": val(details, "sdLicense"),
                    "publisher_name": publisher_name,
                    "publisher_url": publisher_url,
                    "image_urls": image_urls or None,
                },
            }
            features.append(feature)

            geo_info = f"{len(geometry['coordinates'])} pts" if geometry else "no geometry"
            img_info = f"{len(image_urls)} img" if image_urls else "no img"
            dist_info = f"{length_m:.0f}m" if length_m is not None else "?"
            elev_info = f"+{uphill_m:.0f}m" if uphill_m is not None else ""
            print(f"  [{i}/{len(trail_ids)}] {name} | {trail_type or '?'} | {dist_info} {elev_info} | {license_str or '?'} | {img_info} ({geo_info})")

            if not geometry:
                no_geometry.append(name or trail_id)

        except requests.HTTPError as e:
            print(f"  [{i}/{len(trail_ids)}] HTTP ERROR {e}")

        time.sleep(0.15)

    features_with_geo = [ft for ft in features if ft["geometry"]]
    features_no_geo = [ft for ft in features if not ft["geometry"]]

    geojson = {"type": "FeatureCollection", "features": features_with_geo}
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)

    geojson_no_geo = {"type": "FeatureCollection", "features": features_no_geo}
    with open(output_file_no_geo, "w", encoding="utf-8") as f:
        json.dump(geojson_no_geo, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(features_with_geo)} routes with geometry to {output_file}")
    print(f"Saved {len(features_no_geo)} routes without geometry to {output_file_no_geo}")

    if no_geometry:
        print("\nTouren ohne Geometrie:")
        for name in no_geometry:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
