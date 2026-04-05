#!/usr/bin/env python3
"""
DBSCAN-Clustering für Streuobstwiesen-Polygone.

Identifiziert räumlich zusammenhängende Regionen aus den Einzelflächen
in all_streuobstwiesen.geojson und schreibt eine Cluster-Region pro Feature.

Verwendung:
    python cluster_streuobstwiesen.py [--eps 500] [--min-samples 3]
                                      [--input output/all_streuobstwiesen.geojson]
                                      [--output output/streuobst_regions.geojson]
                                      [--layer wiesen,streuobstwiesen]
                                      [--annotate]
"""

import argparse
import json
import logging
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
from shapely import concave_hull
from shapely.ops import unary_union
from sklearn.cluster import DBSCAN

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="DBSCAN-Clustering für Streuobstwiesen")
    parser.add_argument(
        "--input",
        default="output/all_streuobstwiesen.geojson",
        help="Pfad zur Input-GeoJSON-Datei (default: output/all_streuobstwiesen.geojson)",
    )
    parser.add_argument(
        "--output",
        default="output/streuobst_regions.geojson",
        help="Pfad zur Output-GeoJSON-Datei (default: output/streuobst_regions.geojson)",
    )
    parser.add_argument(
        "--eps",
        type=float,
        default=500.0,
        help="Max. Abstand in Metern zwischen Nachbar-Polygonen (default: 500)",
    )
    parser.add_argument(
        "--min-samples",
        type=int,
        default=3,
        help="Mindestanzahl Polygone für einen Cluster (default: 3)",
    )
    parser.add_argument(
        "--layer",
        default="wiesen,streuobstwiesen",
        help="Kommagetrennte Layer-Namen (default: wiesen,streuobstwiesen)",
    )
    parser.add_argument(
        "--outline-ratio",
        type=float,
        default=0.3,
        help="Concave-Hull ratio für Regionsumrisse: 0=eng, 1=konvex (default: 0.3)",
    )
    parser.add_argument(
        "--annotate",
        action="store_true",
        help="Zusätzlich annotierte Einzelflächen mit cluster_id ausgeben",
    )
    return parser.parse_args()


def load_polygons(input_path: Path, layers: list[str]) -> gpd.GeoDataFrame:
    log.info(f"Lade {input_path} ...")
    gdf = gpd.read_file(input_path)
    log.info(f"  {len(gdf):,} Features geladen")

    gdf = gdf[gdf["layer"].isin(layers)].copy()
    log.info(f"  {len(gdf):,} Features nach Layer-Filter ({', '.join(layers)})")

    if gdf.empty:
        log.error(f"Keine Features für Layer {layers} gefunden.")
        sys.exit(1)

    return gdf


def run_dbscan(gdf_utm: gpd.GeoDataFrame, eps: float, min_samples: int) -> np.ndarray:
    centroids = gdf_utm.geometry.centroid
    coords = np.column_stack([centroids.x, centroids.y])

    log.info(f"Starte DBSCAN (eps={eps}m, min_samples={min_samples}) ...")
    db = DBSCAN(eps=eps, min_samples=min_samples, metric="euclidean", n_jobs=-1)
    labels = db.fit_predict(coords)

    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = (labels == -1).sum()
    log.info(f"  {n_clusters} Cluster gefunden, {n_noise:,} Noise-Polygone")

    return labels


def build_regions(gdf_utm: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    cluster_ids = sorted(gdf_utm["cluster_id"].unique())
    cluster_ids = [c for c in cluster_ids if c != -1]

    log.info(f"Erstelle {len(cluster_ids)} Cluster-Regionen ...")

    records = []
    for cid in cluster_ids:
        mask = gdf_utm["cluster_id"] == cid
        subset = gdf_utm[mask]

        merged_geom = unary_union(subset.geometry)
        area_ha = merged_geom.area / 10_000

        layer_counts = subset["layer"].value_counts().to_dict()

        records.append(
            {
                "geometry": merged_geom,
                "cluster_id": int(cid),
                "polygon_count": int(mask.sum()),
                "area_ha": round(area_ha, 2),
                "layer_breakdown": json.dumps(layer_counts),
            }
        )

    regions = gpd.GeoDataFrame(records, crs=gdf_utm.crs)
    return regions


def build_outlines(gdf_utm: gpd.GeoDataFrame, ratio: float) -> gpd.GeoDataFrame:
    cluster_ids = sorted(c for c in gdf_utm["cluster_id"].unique() if c != -1)
    log.info(f"Erstelle {len(cluster_ids)} Concave-Hull-Regionen (ratio={ratio}) ...")

    records = []
    for cid in cluster_ids:
        subset = gdf_utm[gdf_utm["cluster_id"] == cid]
        merged = unary_union(subset.geometry)
        hull = concave_hull(merged, ratio=ratio)
        records.append(
            {
                "geometry": hull,
                "cluster_id": int(cid),
                "polygon_count": len(subset),
                "area_ha": round(hull.area / 10_000, 2),
                "layer_breakdown": json.dumps(subset["layer"].value_counts().to_dict()),
            }
        )

    return gpd.GeoDataFrame(records, crs=gdf_utm.crs)


def print_stats(regions: gpd.GeoDataFrame) -> None:
    if regions.empty:
        log.info("Keine Regionen gefunden.")
        return

    largest = regions.loc[regions["area_ha"].idxmax()]
    smallest = regions.loc[regions["area_ha"].idxmin()]

    log.info("--- Statistik ---")
    log.info(f"  Regionen gesamt:    {len(regions):,}")
    log.info(f"  Gesamtfläche:       {regions['area_ha'].sum():,.1f} ha")
    log.info(
        f"  Größte Region:      {largest['area_ha']:,.1f} ha"
        f" ({largest['polygon_count']} Polygone, cluster_id={largest['cluster_id']})"
    )
    log.info(
        f"  Kleinste Region:    {smallest['area_ha']:,.1f} ha"
        f" ({smallest['polygon_count']} Polygone, cluster_id={smallest['cluster_id']})"
    )
    log.info(
        f"  Ø Polygone/Region:  {regions['polygon_count'].mean():.1f}"
    )


def main() -> None:
    args = parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    layers = [l.strip() for l in args.layer.split(",")]

    if not input_path.exists():
        log.error(f"Input-Datei nicht gefunden: {input_path}")
        sys.exit(1)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    gdf = load_polygons(input_path, layers)

    log.info("Projiziere nach EPSG:25832 ...")
    gdf_utm = gdf.to_crs("EPSG:25832")

    labels = run_dbscan(gdf_utm, eps=args.eps, min_samples=args.min_samples)
    gdf_utm["cluster_id"] = labels

    regions = build_regions(gdf_utm)
    print_stats(regions)

    log.info(f"Schreibe Regionen nach {output_path} ...")
    regions_wgs84 = regions.to_crs("EPSG:4326")
    regions_wgs84.to_file(output_path, driver="GeoJSON")
    log.info(f"  {len(regions_wgs84)} Regionen geschrieben.")

    outlines_path = output_path.parent / (output_path.stem + "_outlines.geojson")
    outlines = build_outlines(gdf_utm, ratio=args.outline_ratio)
    outlines.to_crs("EPSG:4326").to_file(outlines_path, driver="GeoJSON")
    log.info(f"  {len(outlines)} Umriss-Regionen → {outlines_path}")

    if args.annotate:
        annotate_path = output_path.parent / (output_path.stem + "_annotated.geojson")
        log.info(f"Schreibe annotierte Einzelflächen nach {annotate_path} ...")
        gdf_annotated = gdf_utm[["geometry", "osm_id", "layer", "cluster_id"]].to_crs("EPSG:4326")
        gdf_annotated.to_file(annotate_path, driver="GeoJSON")
        log.info(f"  {len(gdf_annotated):,} Features geschrieben.")


if __name__ == "__main__":
    main()
