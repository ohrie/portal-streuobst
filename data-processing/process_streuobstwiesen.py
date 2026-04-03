#!/usr/bin/env python3
"""
Streuobstwiesen Data Processing Pipeline
Extracts orchard areas and trees from OpenStreetMap data for Germany
"""

import os
import sys
import logging
import subprocess
import requests
from pathlib import Path
from datetime import datetime
import json
import tempfile
import shutil
import csv
import sqlite3
from shapely.geometry import shape
from shapely.ops import unary_union
import geopandas as gpd

# Setup logging
_log_dir = Path(__file__).parent / "logs"
_log_dir.mkdir(exist_ok=True)
_log_filename = _log_dir / f"processing_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(_log_filename),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class Config:
    """Configuration for the data processing pipeline"""
    
    # URLs and paths
    GEOFABRIK_GERMANY_URL = "https://download.geofabrik.de/europe/germany-latest.osm.pbf"
    GEOFABRIK_GERMANY_STATE_URL = "https://download.geofabrik.de/europe/germany-updates/state.txt"
    
    # Local paths
    BASE_DIR = Path(__file__).parent
    DATA_DIR = BASE_DIR / "data"
    TEMP_DIR = BASE_DIR / "temp"
    OUTPUT_DIR = BASE_DIR / "output"
    
    # File names
    GERMANY_PBF = "germany-latest.osm.pbf"
    ORCHARDS_OSM = "orchards.osm.pbf"
    STREUOBSTWIESEN_OSM = "streuobstwiesen.osm.pbf"
    TREES_OSM = "trees.osm.pbf"
    ORCHARDS_GEOJSON = "orchards.geojson"
    STREUOBSTWIESEN_GEOJSON = "streuobstwiesen.geojson"
    TREES_GEOJSON = "trees.geojson"
    COMBINED_GEOJSON = "all_streuobstwiesen.geojson"
    VECTOR_TILES = "streuobstwiesen.mbtiles"
    
    # Processing parameters
    MAX_ZOOM = 16
    MIN_ZOOM = 0         # Tiles start at zoom 0 (low-zoom aggregated tiles)
    LOW_ZOOM_MAX = 7     # Buffered/aggregated tiles up to this zoom
    HIGH_ZOOM_MIN = 8    # Normal tiles from this zoom onwards
    
    def __init__(self):
        # Create directories
        for directory in [self.DATA_DIR, self.TEMP_DIR, self.OUTPUT_DIR]:
            directory.mkdir(exist_ok=True)

def fetch_geofabrik_sequence(state_url: str) -> int | None:
    """Fetch the current sequenceNumber from a Geofabrik state.txt file"""
    try:
        response = requests.get(state_url, timeout=30)
        response.raise_for_status()
        for line in response.text.splitlines():
            if line.startswith("sequenceNumber="):
                return int(line.split("=", 1)[1].strip())
    except Exception as e:
        logger.warning(f"Could not fetch Geofabrik state.txt: {e}")
    return None


def read_local_sequence(sequence_file: Path) -> int | None:
    """Read the locally stored sequenceNumber"""
    try:
        return int(sequence_file.read_text().strip())
    except Exception:
        return None


def write_local_sequence(sequence_file: Path, sequence: int) -> None:
    """Persist the sequenceNumber after a successful download"""
    sequence_file.write_text(str(sequence))


def download_file(url: str, filepath: Path, force_download: bool = False,
                  state_url: str | None = None) -> bool:
    """Download a file with progress tracking and freshness check"""

    if filepath.exists() and not force_download:
        file_age_days = (datetime.now().timestamp() - filepath.stat().st_mtime) / (24 * 3600)

        if file_age_days > 1:
            logger.info(f"File {filepath} is {file_age_days:.1f} days old, checking for updates...")

            if state_url:
                try:
                    logger.info("Checking remote sequence number via state.txt...")
                    remote_seq = fetch_geofabrik_sequence(state_url)
                    sequence_file = filepath.with_suffix(filepath.suffix + ".sequence")
                    local_seq = read_local_sequence(sequence_file)

                    logger.info(f"Remote sequenceNumber: {remote_seq}")
                    logger.info(f"Local sequenceNumber:  {local_seq}")

                    if remote_seq is not None and local_seq is not None and remote_seq <= local_seq:
                        logger.info("Local file is up-to-date, skipping download")
                        size_mb = filepath.stat().st_size / (1024 * 1024)
                        logger.info(f"Using existing file: {filepath} ({size_mb:.1f} MB)")
                        return True
                    else:
                        logger.info("Remote data is newer, downloading update...")
                        filepath.unlink()
                except Exception as e:
                    logger.warning(f"Could not check remote sequence: {e}")
                    logger.info("Using existing local file")
                    size_mb = filepath.stat().st_size / (1024 * 1024)
                    logger.info(f"Using existing file: {filepath} ({size_mb:.1f} MB)")
                    return True
            else:
                logger.warning("No state_url provided, skipping update check")
                size_mb = filepath.stat().st_size / (1024 * 1024)
                logger.info(f"Using existing file: {filepath} ({size_mb:.1f} MB)")
                return True
        else:
            size_mb = filepath.stat().st_size / (1024 * 1024)
            logger.info(f"File {filepath} is fresh ({file_age_days:.1f} days old, {size_mb:.1f} MB), skipping download")
            return True
    
    # Download file if it doesn't exist or was determined to be outdated
    if not filepath.exists() or force_download:
        logger.info(f"Downloading {url} to {filepath}")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        with open(filepath, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {percent:.1f}%", end='', flush=True)
        
        print()  # New line after progress
        logger.info(f"Download completed: {filepath}")

        # Persist the remote sequence number so future runs can compare
        if state_url:
            remote_seq = fetch_geofabrik_sequence(state_url)
            if remote_seq is not None:
                sequence_file = filepath.with_suffix(filepath.suffix + ".sequence")
                write_local_sequence(sequence_file, remote_seq)
                logger.info(f"Saved sequenceNumber {remote_seq} to {sequence_file}")

        return True

    except Exception as e:
        logger.error(f"Download failed: {e}")
        if filepath.exists():
            filepath.unlink()
        return False

def run_command(cmd: list, description: str) -> bool:
    """Run a shell command with logging"""
    
    logger.info(f"Running: {description}")
    logger.debug(f"Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=True
        )
        
        if result.stdout:
            logger.debug(f"STDOUT: {result.stdout}")
            
        logger.info(f"✅ {description} completed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ {description} failed with exit code {e.returncode}")
        logger.error(f"STDERR: {e.stderr}")
        return False
    except FileNotFoundError:
        logger.error(f"❌ Command not found. Please install required tools.")
        return False

def extract_orchards(input_file: Path, output_file: Path) -> bool:
    """Extract orchard areas using osmium"""
    
    cmd = [
        "osmium", "tags-filter",
        str(input_file),
        "-o", str(output_file),
        "--overwrite",
        "landuse=orchard"
    ]
    
    return run_command(cmd, "Extracting orchard areas")

def extract_streuobstwiesen(input_file: Path, output_file: Path) -> bool:
    """Extract meadow orchards using osmium (landuse=meadow AND meadow=meadow_orchard)"""
    
    cmd = [
        "osmium", "tags-filter",
        str(input_file),
        "-o", str(output_file),
        "--overwrite",
        "meadow=meadow_orchard"
    ]
    
    return run_command(cmd, "Extracting meadow orchards (Streuobstwiesen)")

def extract_trees_in_all_areas(germany_file: Path, orchards_file: Path, streuobstwiesen_file: Path, output_file: Path) -> bool:
    """Extract trees that are within orchard areas or streuobstwiesen"""
    
    # First extract all trees
    trees_temp = output_file.with_suffix('.trees_temp.osm.pbf')
    
    cmd_trees = [
        "osmium", "tags-filter",
        str(germany_file),
        "-o", str(trees_temp),
        "--overwrite",
        "natural=tree"
    ]
    
    if not run_command(cmd_trees, "Extracting all trees"):
        return False
    
    # Create combined polygon file for intersection
    combined_polygons = output_file.with_suffix('.combined_polygons.osm.pbf')
    
    # Merge orchard and streuobstwiesen files
    cmd_merge = [
        "osmium", "merge",
        str(orchards_file),
        str(streuobstwiesen_file),
        "-o", str(combined_polygons),
        "--overwrite"
    ]
    
    if not run_command(cmd_merge, "Merging orchard and streuobstwiesen areas"):
        return False
    
    # Then use osmium to find trees within combined polygons
    cmd_intersect = [
        "osmium", "extract",
        "--polygon", str(combined_polygons),
        str(trees_temp),
        "-o", str(output_file),
        "--overwrite"
    ]
    
    success = run_command(cmd_intersect, "Finding trees within all orchard areas")
    
    # Cleanup
    for temp_file in [trees_temp, combined_polygons]:
        if temp_file.exists():
            temp_file.unlink()
    
    return success

def convert_to_geojson(input_file: Path, output_file: Path, layer_name: str = None) -> bool:
    """Convert OSM PBF to GeoJSON using osmium export"""
    
    # osmium export automatically includes all tags as properties
    # layer_name determines which OSM geometry types to export:
    # - "multipolygons" -> areas/polygons (for orchards, streuobstwiesen)
    # - "points" -> point features (for trees)
    
    if not layer_name:
        layer_name = "multipolygons"
    
    # Map layer names to osmium export geometry types
    # Valid types: point, linestring, polygon
    geometry_types = {
        "multipolygons": "polygon",
        "points": "point"
    }
    
    geometry_type = geometry_types.get(layer_name, "polygon")
    
    cmd = [
        "osmium", "export",
        str(input_file),
        "-f", "geojson",
        "-o", str(output_file),
        "--geometry-types", geometry_type,
        "--add-unique-id", "type_id",  # This adds @id field with OSM type and ID
        "--overwrite"
    ]
    
    return run_command(cmd, f"Converting {input_file.name} to GeoJSON with all tags and OSM IDs")

def combine_geojson_files(orchards_file: Path, streuobstwiesen_file: Path, trees_file: Path, output_file: Path) -> bool:
    """Combine orchard, streuobstwiesen and tree GeoJSON files"""
    
    try:
        combined_features = []
        
        # Read orchards
        if orchards_file.exists():
            with open(orchards_file, 'r') as f:
                orchards_data = json.load(f)
                for feature in orchards_data.get('features', []):
                    feature['properties']['layer'] = 'wiesen'
                    feature['properties']['type'] = 'orchard'
                    # Copy ID to properties for tippecanoe
                    if 'id' in feature:
                        feature['properties']['osm_id'] = feature['id']
                    combined_features.append(feature)
            logger.info(f"Added {len(orchards_data.get('features', []))} orchard features")
        
        # Read streuobstwiesen (meadow orchards)
        if streuobstwiesen_file.exists():
            with open(streuobstwiesen_file, 'r') as f:
                streuobstwiesen_data = json.load(f)
                for feature in streuobstwiesen_data.get('features', []):
                    feature['properties']['layer'] = 'streuobstwiesen'
                    feature['properties']['type'] = 'meadow_orchard'
                    # Copy ID to properties for tippecanoe
                    if 'id' in feature:
                        feature['properties']['osm_id'] = feature['id']
                    combined_features.append(feature)
            logger.info(f"Added {len(streuobstwiesen_data.get('features', []))} streuobstwiesen features")
        
        # Read trees
        if trees_file.exists():
            with open(trees_file, 'r') as f:
                trees_data = json.load(f)
                for feature in trees_data.get('features', []):
                    feature['properties']['layer'] = 'baeume'
                    feature['properties']['type'] = 'tree'
                    # Copy ID to properties for tippecanoe
                    if 'id' in feature:
                        feature['properties']['osm_id'] = feature['id']
                    combined_features.append(feature)
            logger.info(f"Added {len(trees_data.get('features', []))} tree features")
        
        # Create combined GeoJSON
        combined_geojson = {
            "type": "FeatureCollection",
            "features": combined_features,
            "properties": {
                "generated": datetime.now().isoformat(),
                "description": "Orchards, Streuobstwiesen and trees in Germany from OpenStreetMap"
            }
        }
        
        with open(output_file, 'w') as f:
            json.dump(combined_geojson, f, separators=(',', ':'))
        
        logger.info(f"✅ Combined {len(combined_features)} features into {output_file}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to combine GeoJSON files: {e}")
        return False

def generate_statistics(orchards_file: Path, streuobstwiesen_file: Path, trees_file: Path) -> dict:
    """Generate statistics about orchards, streuobstwiesen, and trees"""
    
    stats = {
        'orchards_count': 0,
        'orchards_area_ha': 0,
        'orchard_meadow_count': 0,
        'orchard_meadow_area_ha': 0,
        'streuobstwiesen_count': 0,
        'streuobstwiesen_area_ha': 0,
        'trees_count': 0,
        'trees_in_streuobstwiesen': 0,
        'generated': datetime.now().isoformat()
    }
    
    try:
        # Count orchards and calculate area
        if orchards_file.exists():
            with open(orchards_file, 'r') as f:
                orchards_data = json.load(f)
                stats['orchards_count'] = len(orchards_data.get('features', []))
                
                # Calculate total area
                total_area_sqm = 0
                for feature in orchards_data.get('features', []):
                    try:
                        geom = shape(feature['geometry'])
                        # Convert to hectares (assuming WGS84, rough approximation)
                        # For better accuracy, should project to equal-area projection
                        area_sqm = geom.area * 111320 * 111320  # degrees to meters approximation
                        total_area_sqm += area_sqm
                    except:
                        pass
                
                stats['orchards_area_ha'] = round(total_area_sqm / 10000, 2)

                # Count orchard=meadow_orchard subset within landuse=orchard
                meadow_area_sqm = 0
                for feature in orchards_data.get('features', []):
                    if feature.get('properties', {}).get('orchard') == 'meadow_orchard':
                        stats['orchard_meadow_count'] += 1
                        try:
                            geom = shape(feature['geometry'])
                            meadow_area_sqm += geom.area * 111320 * 111320
                        except:
                            pass
                stats['orchard_meadow_area_ha'] = round(meadow_area_sqm / 10000, 2)

        # Count streuobstwiesen and calculate area
        if streuobstwiesen_file.exists():
            with open(streuobstwiesen_file, 'r') as f:
                streuobstwiesen_data = json.load(f)
                stats['streuobstwiesen_count'] = len(streuobstwiesen_data.get('features', []))
                
                # Calculate total area
                total_area_sqm = 0
                for feature in streuobstwiesen_data.get('features', []):
                    try:
                        geom = shape(feature['geometry'])
                        area_sqm = geom.area * 111320 * 111320
                        total_area_sqm += area_sqm
                    except:
                        pass
                
                stats['streuobstwiesen_area_ha'] = round(total_area_sqm / 10000, 2)
        
        # Count trees
        if trees_file.exists():
            with open(trees_file, 'r') as f:
                trees_data = json.load(f)
                stats['trees_count'] = len(trees_data.get('features', []))
        
        logger.info(f"📊 Statistics generated:")
        logger.info(f"   - Obstgärten: {stats['orchards_count']} ({stats['orchards_area_ha']} ha)")
        logger.info(f"   - davon orchard=meadow_orchard: {stats['orchard_meadow_count']} ({stats['orchard_meadow_area_ha']} ha)")
        logger.info(f"   - Streuobstwiesen: {stats['streuobstwiesen_count']} ({stats['streuobstwiesen_area_ha']} ha)")
        logger.info(f"   - Bäume: {stats['trees_count']}")
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Failed to generate statistics: {e}")
        return stats

def save_statistics(stats: dict, output_file: Path) -> bool:
    """Save statistics to a text file"""
    
    try:
        with open(output_file, 'w') as f:
            f.write("=" * 60 + "\n")
            f.write("STREUOBSTWIESEN STATISTIKEN\n")
            f.write("=" * 60 + "\n\n")
            
            f.write(f"Generiert am: {stats['generated']}\n\n")
            
            f.write("ALLE OBSTGÄRTEN (landuse=orchard)\n")
            f.write(f"  Anzahl: {stats['orchards_count']:,}\n")
            f.write(f"  Fläche: {stats['orchards_area_ha']:,.2f} Hektar\n\n")

            f.write("STREUOBSTWIESEN (landuse=orchard + orchard=meadow_orchard)\n")
            f.write(f"  Anzahl: {stats['orchard_meadow_count']:,}\n")
            f.write(f"  Fläche: {stats['orchard_meadow_area_ha']:,.2f} Hektar\n\n")

            f.write("WIESEN mit OBSTBÄUMEN (landuse=meadow + meadow=meadow_orchard)\n")
            f.write(f"  Anzahl: {stats['streuobstwiesen_count']:,}\n")
            f.write(f"  Fläche: {stats['streuobstwiesen_area_ha']:,.2f} Hektar\n\n")
            
            f.write("BÄUME (natural=tree in Obstgärten)\n")
            f.write(f"  Anzahl: {stats['trees_count']:,}\n\n")
            
            f.write("GESAMTFLÄCHE\n")
            total_area = stats['orchards_area_ha'] + stats['streuobstwiesen_area_ha']
            f.write(f"  {total_area:,.2f} Hektar\n\n")
            
            # Add some context
            f.write("HINWEISE\n")
            f.write("  - Flächenberechnungen sind Näherungswerte (WGS84 Approximation)\n")
            f.write("  - Baumanzahl basiert nur auf erfassten natural=tree Nodes\n")
            f.write("  - Datenquelle: OpenStreetMap via Geofabrik\n")
            
            f.write("\n" + "=" * 60 + "\n")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to save statistics: {e}")
        return False


def append_stats_csv(stats: dict, csv_file: Path) -> bool:
    """Append statistics as a new row to the cumulative CSV file"""

    try:
        fieldnames = [
            'date',
            'orchards_count',
            'orchards_area_ha',
            'orchard_meadow_count',
            'orchard_meadow_area_ha',
            'streuobstwiesen_count',
            'streuobstwiesen_area_ha',
            'trees_count',
            'total_area_ha',
        ]

        write_header = not csv_file.exists()

        with open(csv_file, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if write_header:
                writer.writeheader()

            total_area = stats.get('orchards_area_ha', 0) + stats.get('streuobstwiesen_area_ha', 0)
            writer.writerow({
                'date': stats.get('generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                'orchards_count': stats.get('orchards_count', 0),
                'orchards_area_ha': stats.get('orchards_area_ha', 0),
                'orchard_meadow_count': stats.get('orchard_meadow_count', 0),
                'orchard_meadow_area_ha': stats.get('orchard_meadow_area_ha', 0),
                'streuobstwiesen_count': stats.get('streuobstwiesen_count', 0),
                'streuobstwiesen_area_ha': stats.get('streuobstwiesen_area_ha', 0),
                'trees_count': stats.get('trees_count', 0),
                'total_area_ha': round(total_area, 2),
            })

        return True

    except Exception as e:
        logger.error(f"❌ Failed to append to stats CSV: {e}")
        return False


def create_buffered_geojson(input_file: Path, output_file: Path, buffer_m: float = 50) -> bool:
    """Buffer polygon features and dissolve overlapping results for low-zoom aggregation.

    Projects to EPSG:25832 (UTM Zone 32N, meters), buffers each feature by buffer_m,
    dissolves all overlapping results into single polygons, then reprojects to WGS84.
    """
    try:
        gdf = gpd.read_file(input_file)
        if gdf.empty:
            logger.warning(f"Input file {input_file.name} is empty, writing empty GeoJSON")
            gpd.GeoDataFrame(geometry=[], crs="EPSG:4326").to_file(output_file, driver='GeoJSON')
            return True

        input_count = len(gdf)
        gdf_proj = gdf.to_crs("EPSG:25832")
        gdf_proj = gdf_proj.copy()
        gdf_proj['geometry'] = gdf_proj.buffer(buffer_m)
        dissolved_geom = gdf_proj.unary_union
        dissolved = gpd.GeoDataFrame(geometry=[dissolved_geom], crs="EPSG:25832").explode(index_parts=False).reset_index(drop=True)
        dissolved = dissolved.to_crs("EPSG:4326")
        dissolved.to_file(output_file, driver='GeoJSON')

        logger.info(f"Buffered {input_count} features → {len(dissolved)} dissolved polygons (buffer={buffer_m}m)")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create buffered GeoJSON from {input_file.name}: {e}")
        return False


def create_vector_tiles(orchards_file: Path, streuobstwiesen_file: Path, trees_file: Path, output_file: Path, config: Config) -> bool:
    """Create vector tiles with two zoom-range sets merged via tile-join.

    Zoom 0–LOW_ZOOM_MAX: buffered/dissolved aggregated tiles (no individual features).
    Zoom HIGH_ZOOM_MIN–MAX_ZOOM: normal tiles with individual orchard polygons and trees.
    Both sets are merged into a single MBTiles file using tile-join.
    """

    # Temp GeoJSON files for individual layers
    wiesen_temp = output_file.with_suffix('.wiesen.geojson')
    streuobstwiesen_temp = output_file.with_suffix('.streuobstwiesen.geojson')
    baeume_temp = output_file.with_suffix('.baeume.geojson')
    wiesen_buffered_temp = output_file.with_suffix('.wiesen_buffered.geojson')
    streuobstwiesen_buffered_temp = output_file.with_suffix('.streuobstwiesen_buffered.geojson')

    # Temp MBTiles files for each zoom range
    low_zoom_mbtiles = output_file.with_name('_low_zoom.mbtiles')
    high_zoom_mbtiles = output_file.with_name('_high_zoom.mbtiles')

    all_temp_files = [
        wiesen_temp, streuobstwiesen_temp, baeume_temp,
        wiesen_buffered_temp, streuobstwiesen_buffered_temp,
        low_zoom_mbtiles, high_zoom_mbtiles,
    ]

    try:
        # Prepare normal layer files with osm_id copied to properties
        if orchards_file.exists():
            with open(orchards_file, 'r') as f:
                orchards_data = json.load(f)
            for feature in orchards_data.get('features', []):
                if 'id' in feature:
                    feature['properties']['osm_id'] = feature['id']
            wiesen_count = len(orchards_data.get('features', []))
            with open(wiesen_temp, 'w') as f:
                json.dump(orchards_data, f, separators=(',', ':'))
            logger.info(f"Created 'wiesen' layer with {wiesen_count} features (landuse=orchard)")

        if streuobstwiesen_file.exists():
            with open(streuobstwiesen_file, 'r') as f:
                streuobstwiesen_data = json.load(f)
            for feature in streuobstwiesen_data.get('features', []):
                if 'id' in feature:
                    feature['properties']['osm_id'] = feature['id']
            streuobstwiesen_count = len(streuobstwiesen_data.get('features', []))
            with open(streuobstwiesen_temp, 'w') as f:
                json.dump(streuobstwiesen_data, f, separators=(',', ':'))
            logger.info(f"Created 'streuobstwiesen' layer with {streuobstwiesen_count} features (meadow orchards)")

        if trees_file.exists():
            with open(trees_file, 'r') as f:
                trees_data = json.load(f)
            for feature in trees_data.get('features', []):
                if 'id' in feature:
                    feature['properties']['osm_id'] = feature['id']
            baeume_count = len(trees_data.get('features', []))
            with open(baeume_temp, 'w') as f:
                json.dump(trees_data, f, separators=(',', ':'))
            logger.info(f"Created 'baeume' layer with {baeume_count} features")

        # Create buffered/dissolved GeoJSONs for low zoom levels
        logger.info(f"🔵 Creating buffered GeoJSONs for low-zoom tiles (zoom 0–{config.LOW_ZOOM_MAX})")
        if wiesen_temp.exists():
            if not create_buffered_geojson(wiesen_temp, wiesen_buffered_temp):
                return False
        if streuobstwiesen_temp.exists():
            if not create_buffered_geojson(streuobstwiesen_temp, streuobstwiesen_buffered_temp):
                return False

        # Step 1: Low-zoom tiles (zoom 0–LOW_ZOOM_MAX) with buffered/aggregated data
        low_zoom_cmd = [
            "tippecanoe",
            "-o", str(low_zoom_mbtiles),
            "-Z", "0",
            "-z", str(config.LOW_ZOOM_MAX),
            "--force",
            "--drop-densest-as-needed",
            "--name=Streuobstwiesen",
            "--description=Streuobstwiesen mit Bäumen in Deutschland aus OpenStreetMap"
        ]
        if wiesen_buffered_temp.exists():
            low_zoom_cmd.extend(["-L", f"wiesen:{wiesen_buffered_temp}"])
        if streuobstwiesen_buffered_temp.exists():
            low_zoom_cmd.extend(["-L", f"streuobstwiesen:{streuobstwiesen_buffered_temp}"])

        if not run_command(low_zoom_cmd, f"Creating low-zoom tiles (zoom 0–{config.LOW_ZOOM_MAX}, buffered)"):
            return False

        # Step 2: High-zoom tiles (zoom HIGH_ZOOM_MIN–MAX_ZOOM) with normal individual features
        high_zoom_cmd = [
            "tippecanoe",
            "-o", str(high_zoom_mbtiles),
            "-Z", str(config.HIGH_ZOOM_MIN),
            "-z", str(config.MAX_ZOOM),
            "--force",
            "--drop-densest-as-needed",
            "--extend-zooms-if-still-dropping",
            "--use-attribute-for-id=osm_id",
            "--name=Streuobstwiesen",
            "--description=Streuobstwiesen mit Bäumen in Deutschland aus OpenStreetMap"
        ]
        if wiesen_temp.exists():
            high_zoom_cmd.extend(["-L", f"wiesen:{wiesen_temp}"])
        if streuobstwiesen_temp.exists():
            high_zoom_cmd.extend(["-L", f"streuobstwiesen:{streuobstwiesen_temp}"])
        if baeume_temp.exists():
            baeume_layer_config = json.dumps({
                "file": str(baeume_temp),
                "layer": "baeume",
                "minzoom": 14,
                "no-feature-limit": True,
                "no-tile-size-limit": True
            })
            high_zoom_cmd.extend(["-L", baeume_layer_config])

        if not run_command(high_zoom_cmd, f"Creating high-zoom tiles (zoom {config.HIGH_ZOOM_MIN}–{config.MAX_ZOOM}, normal)"):
            return False

        # Step 3: Merge both zoom ranges into a single MBTiles
        tile_join_cmd = [
            "tile-join",
            "-o", str(output_file),
            "--force",
            str(low_zoom_mbtiles),
            str(high_zoom_mbtiles),
        ]
        if not run_command(tile_join_cmd, "Merging low and high zoom tiles with tile-join"):
            return False

        # Remove generator_options from metadata (contains full CLI with file paths)
        if output_file.exists():
            try:
                conn = sqlite3.connect(str(output_file))
                conn.execute("DELETE FROM metadata WHERE name = 'generator_options'")
                conn.commit()
                conn.close()
                logger.info("Removed generator_options from MBTiles metadata")
            except Exception as e:
                logger.warning(f"Could not remove generator_options from metadata: {e}")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to create vector tiles: {e}")
        return False
    finally:
        for temp_file in all_temp_files:
            if temp_file.exists():
                temp_file.unlink()

def check_dependencies() -> bool:
    """Check if all required tools are installed"""
    
    required_tools = ["osmium", "ogr2ogr", "tippecanoe"]
    missing_tools = []
    
    for tool in required_tools:
        if not shutil.which(tool):
            missing_tools.append(tool)
    
    if missing_tools:
        logger.error(f"❌ Missing required tools: {', '.join(missing_tools)}")
        logger.error("Please install them:")
        logger.error("- osmium: apt-get install osmium-tool")
        logger.error("- ogr2ogr: apt-get install gdal-bin")
        logger.error("- tippecanoe: https://github.com/felt/tippecanoe")
        return False
    
    logger.info("✅ All required tools are available")
    return True

def main(dry_run: bool = False):
    """Main processing pipeline"""
    
    if dry_run:
        logger.info("🧪 Starting Streuobstwiesen data processing pipeline (DRY RUN)")
    else:
        logger.info("🚀 Starting Streuobstwiesen data processing pipeline")
    
    # Initialize configuration
    config = Config()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # File paths
    germany_pbf = config.DATA_DIR / config.GERMANY_PBF
    orchards_osm = config.TEMP_DIR / config.ORCHARDS_OSM
    streuobstwiesen_osm = config.TEMP_DIR / config.STREUOBSTWIESEN_OSM
    trees_osm = config.TEMP_DIR / config.TREES_OSM
    orchards_geojson = config.TEMP_DIR / config.ORCHARDS_GEOJSON
    streuobstwiesen_geojson = config.TEMP_DIR / config.STREUOBSTWIESEN_GEOJSON
    trees_geojson = config.TEMP_DIR / config.TREES_GEOJSON
    combined_geojson = config.OUTPUT_DIR / config.COMBINED_GEOJSON
    vector_tiles = config.OUTPUT_DIR / config.VECTOR_TILES
    
    try:
        # Step 1: Download Germany OSM data
        logger.info("📥 Step 1: Downloading Germany OSM data")
        if dry_run:
            logger.info("   🧪 DRY RUN: Skipping download")
        elif not download_file(config.GEOFABRIK_GERMANY_URL, germany_pbf,
                               state_url=config.GEOFABRIK_GERMANY_STATE_URL):
            raise Exception("Failed to download Germany OSM data")
        
        # Step 2: Extract orchards
        logger.info("🍎 Step 2: Extracting orchard areas (landuse=orchard)")
        if dry_run:
            logger.info("   🧪 DRY RUN: Skipping orchard extraction")
        elif not extract_orchards(germany_pbf, orchards_osm):
            raise Exception("Failed to extract orchards")
        
        # Step 3: Extract streuobstwiesen (meadow orchards)
        logger.info("🌳 Step 3: Extracting streuobstwiesen (landuse=meadow + meadow=meadow_orchard)")
        if dry_run:
            logger.info("   🧪 DRY RUN: Skipping streuobstwiesen extraction")
        elif not extract_streuobstwiesen(germany_pbf, streuobstwiesen_osm):
            raise Exception("Failed to extract streuobstwiesen")
        
        # Step 4: Extract trees in all orchard areas
        logger.info("� Step 4: Extracting trees within all orchard areas")
        if dry_run:
            logger.info("   🧪 DRY RUN: Skipping tree extraction")
        elif not extract_trees_in_all_areas(germany_pbf, orchards_osm, streuobstwiesen_osm, trees_osm):
            raise Exception("Failed to extract trees")
        
        # Step 5: Convert to GeoJSON
        logger.info("📄 Step 5: Converting to GeoJSON")
        if dry_run:
            logger.info("   🧪 DRY RUN: Skipping GeoJSON conversion")
        else:
            if not convert_to_geojson(orchards_osm, orchards_geojson, "multipolygons"):
                raise Exception("Failed to convert orchards to GeoJSON")
            
            if not convert_to_geojson(streuobstwiesen_osm, streuobstwiesen_geojson, "multipolygons"):
                raise Exception("Failed to convert streuobstwiesen to GeoJSON")
            
            if not convert_to_geojson(trees_osm, trees_geojson, "points"):
                raise Exception("Failed to convert trees to GeoJSON")
        
        # Step 6: Combine GeoJSON files
        logger.info("🔗 Step 6: Combining GeoJSON files")
        if dry_run:
            logger.info("   🧪 DRY RUN: Skipping GeoJSON combination")
        elif not combine_geojson_files(orchards_geojson, streuobstwiesen_geojson, trees_geojson, combined_geojson):
            raise Exception("Failed to combine GeoJSON files")
        
        # Step 7: Create vector tiles
        logger.info("🗺️  Step 7: Creating vector tiles with three separate layers")
        if dry_run:
            logger.info("   🧪 DRY RUN: Skipping vector tile creation")
        elif not create_vector_tiles(orchards_geojson, streuobstwiesen_geojson, trees_geojson, vector_tiles, config):
            raise Exception("Failed to create vector tiles")
        
        # Success!
        if dry_run:
            logger.info("✅ DRY RUN completed successfully!")
            logger.info("📋 Pipeline steps verified:")
            logger.info("   1. ✅ Download check passed")
            logger.info("   2. ✅ Osmium tools available")  
            logger.info("   3. ✅ ogr2ogr available")
            logger.info("   4. ✅ tippecanoe available")
            logger.info("   5. ✅ Directory structure created")
            logger.info("   6. ✅ Three-layer structure ready (wiesen, streuobstwiesen, baeume)")
        else:
            logger.info("✅ Pipeline completed successfully!")
            logger.info(f"📊 Output files:")
            logger.info(f"   - GeoJSON: {combined_geojson}")
            logger.info(f"   - Vector tiles: {vector_tiles}")
            
            # File sizes
            if combined_geojson.exists():
                size_mb = combined_geojson.stat().st_size / (1024 * 1024)
                logger.info(f"   - GeoJSON size: {size_mb:.1f} MB")
            
            if vector_tiles.exists():
                size_mb = vector_tiles.stat().st_size / (1024 * 1024)
                logger.info(f"   - Vector tiles size: {size_mb:.1f} MB")

            # Write processing date into MBTiles metadata
            if vector_tiles.exists():
                try:
                    last_updated = datetime.now().strftime('%Y-%m-%d')
                    conn = sqlite3.connect(vector_tiles)
                    conn.execute(
                        "INSERT OR REPLACE INTO metadata (name, value) VALUES ('last_updated', ?)",
                        (last_updated,)
                    )
                    conn.commit()
                    conn.close()
                    logger.info(f"   ✅ Processing date written to MBTiles metadata: {last_updated}")
                except Exception as e:
                    logger.warning(f"   ⚠️  Could not write processing date to MBTiles: {e}")

            # Generate statistics
            logger.info("📈 Generating statistics...")
            stats = generate_statistics(orchards_geojson, streuobstwiesen_geojson, trees_geojson)
            if stats:
                date_str = datetime.now().strftime('%Y-%m-%d')
                dated_stats_file = config.OUTPUT_DIR / f"stats_{date_str}.txt"
                save_statistics(stats, dated_stats_file)
                logger.info(f"   ✅ Statistics saved to {dated_stats_file}")

                csv_file = config.OUTPUT_DIR / "stats.csv"
                append_stats_csv(stats, csv_file)
                logger.info(f"   ✅ Statistics appended to {csv_file}")

        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        sys.exit(1)
    
    finally:
        # Cleanup temporary files
        if not dry_run:
            logger.info("🧹 Cleaning up temporary files")
            for temp_file in config.TEMP_DIR.glob("*"):
                if temp_file.is_file():
                    temp_file.unlink()
                    logger.debug(f"Deleted {temp_file}")

if __name__ == "__main__":
    import sys
    dry_run = "--dry-run" in sys.argv or "--test" in sys.argv
    main(dry_run=dry_run)
