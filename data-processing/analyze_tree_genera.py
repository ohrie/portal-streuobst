#!/usr/bin/env python3
"""
Analyse der Obstbaum-Gattungen in einem OSM-PBF (z.B. germany-latest von Geofabrik).

Hintergrund
-----------
Einzelbäume (``natural=tree``) außerhalb von Streuobstwiesen werden bisher nicht
auf der Karte dargestellt. Um künftig gezielt *Obstbäume* anzeigen zu können,
ermittelt dieses Skript, welche Gattungen (``genus`` / ``genus:de``) und Sorten
(``species`` / ``species:de`` / ``taxon``) in Deutschland überhaupt vorkommen,
und klassifiziert sie in Obstbäume und Nicht-Obstbäume.

Die OSM-Daten sind erfahrungsgemäß "schmutzig": gemischte wissenschaftliche und
deutsche Namen, Tippfehler, Klein-/Großschreibung. Deshalb werden die Rohwerte
auf eine kanonische (wissenschaftliche) Gattung normalisiert, bevor sie gezählt
werden.

Verwendung
----------
    python analyze_tree_genera.py <pfad/zur/germany-latest.osm.pbf> [output.json]

Ausgabe: aggregierte Zählung je kanonischer Gattung, getrennt nach Obst /
Nicht-Obst, sowie (optional) ein JSON mit allen Roh-Häufigkeiten.
"""

import sys
import json
from collections import Counter

import osmium

from tree_genera import FRUIT_GENERA, build_lookup, classify


# Grenzfälle: essbare Früchte, aber überwiegend Hecke/Wildgehölz/Zierde – im
# Streuobst-Kontext nur bedingt "Obstbaum". Nur im Analyse-Skript ausgewiesen
# (NICHT in der Pipeline), damit das Projekt selbst entscheiden kann.
BORDERLINE_GENERA = {
    "Amelanchier": ["amelanchier", "felsenbirne", "serviceberry", "amelanchier arborea"],
    "Crataegus": ["crataegus", "weissdorn", "weißdorn", "hawthorn"],
    "Sambucus": ["sambucus", "holunder", "holunderbaum", "elder", "elderberry"],
    "Ribes": ["ribes", "johannisbeere", "stachelbeere", "currant"],
    "Cornus": ["cornus", "kornelkirsche", "cornelian cherry"],  # Cornus mas; sonst Zierde
    "Olea": ["olea", "olive", "olivenbaum"],
    "Punica": ["punica", "punicea", "granatapfel", "pomegranate"],
    "Diospyros": ["diospyros", "kaki", "persimmon"],
    "Eriobotrya": ["eriobotrya", "loquat", "wollmispel"],
    "Asimina": ["asimina", "pawpaw", "indianerbanane"],
    "Hippophae": ["hippophae", "sanddorn", "sea buckthorn"],
    "Elaeagnus": ["elaeagnus", "oelweide", "ölweide"],
}


def scan_pbf(pbf_path: str):
    """Zähle alle natural=tree Nodes nach genus/species-Feldern."""
    counters = {k: Counter() for k in
               ("genus", "genus_de", "species", "species_de", "taxon")}
    total = with_genus = with_species = 0

    for obj in osmium.FileProcessor(pbf_path).with_filter(
            osmium.filter.KeyFilter("natural")):
        t = obj.tags
        if t.get("natural") != "tree":
            continue
        total += 1
        if "genus" in t:
            counters["genus"][t["genus"].strip()] += 1
            with_genus += 1
        if "genus:de" in t:
            counters["genus_de"][t["genus:de"].strip()] += 1
        if "species" in t:
            counters["species"][t["species"].strip()] += 1
            with_species += 1
        if "species:de" in t:
            counters["species_de"][t["species:de"].strip()] += 1
        if "taxon" in t:
            counters["taxon"][t["taxon"].strip()] += 1

    return counters, total, with_genus, with_species


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    pbf_path = sys.argv[1]
    out_json = sys.argv[2] if len(sys.argv) > 2 else None

    counters, total, with_genus, with_species = scan_pbf(pbf_path)

    fruit_lookup = build_lookup(FRUIT_GENERA)
    borderline_lookup = build_lookup(BORDERLINE_GENERA)

    # Aggregiere genus + genus:de auf kanonische Gattungen.
    fruit_counts = Counter()
    borderline_counts = Counter()
    unmatched = Counter()
    for field in ("genus", "genus_de"):
        for value, cnt in counters[field].items():
            canon = classify(value, fruit_lookup)
            if canon:
                fruit_counts[canon] += cnt
                continue
            canon = classify(value, borderline_lookup)
            if canon:
                borderline_counts[canon] += cnt
            else:
                unmatched[value] += cnt

    print(f"natural=tree Nodes gesamt: {total:,}")
    print(f"  mit genus:   {with_genus:,}")
    print(f"  mit species: {with_species:,}")
    print(f"  versch. genus-Rohwerte: {len(counters['genus']):,}")
    print()
    print("=== OBSTBAUM-GATTUNGEN (genus + genus:de aggregiert) ===")
    for canon, cnt in fruit_counts.most_common():
        print(f"{cnt:>8,}  {canon}")
    print(f"  Summe Obstbäume: {sum(fruit_counts.values()):,}")
    print()
    print("=== GRENZFÄLLE (essbar, aber meist Hecke/Wildgehölz/Zierde) ===")
    for canon, cnt in borderline_counts.most_common():
        print(f"{cnt:>8,}  {canon}")
    print()
    print("=== Top nicht zugeordnete genus-Werte (Nicht-Obst o. unklar) ===")
    for value, cnt in unmatched.most_common(25):
        print(f"{cnt:>8,}  {value}")

    if out_json:
        result = {
            "total_trees": total,
            "trees_with_genus": with_genus,
            "trees_with_species": with_species,
            "fruit_genera": fruit_counts.most_common(),
            "borderline_genera": borderline_counts.most_common(),
            "raw": {k: c.most_common() for k, c in counters.items()},
        }
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=1)
        print(f"\nJSON geschrieben: {out_json}")


if __name__ == "__main__":
    main()
