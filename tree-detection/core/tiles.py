"""Kachel-Suche, XYZ→GeoTIFF-Konvertierung und Mosaik-Aufbau."""

import re
import sys
import logging
import threading
import zipfile
from pathlib import Path

import numpy as np

from .coords import RES_M

logger = logging.getLogger(__name__)

# Per-Datei-Locks, um Race Conditions bei parallelen Anfragen zu vermeiden
_file_locks: dict[str, threading.Lock] = {}
_file_locks_mutex = threading.Lock()


def _get_file_lock(name: str) -> threading.Lock:
    with _file_locks_mutex:
        if name not in _file_locks:
            _file_locks[name] = threading.Lock()
        return _file_locks[name]

# Regex zum Parsen der LGL-BW-Kachelnamen
_TILE_TIF_RE = re.compile(r"(?:dom1|dgm1)_32_(\d+)_(\d+)_1_bw_\d{4}\.tif$", re.IGNORECASE)
_TILE_XYZ_RE = re.compile(r"(?:dom1|dgm1)_32_(\d+)_(\d+)_1_bw_\d{4}\.xyz$", re.IGNORECASE)


def _xyz_to_tif(xyz_path: Path) -> Path:
    """
    Konvertiert eine DGM1-XYZ-Datei (1 Mio. Zeilen, Format 'x y z', reguläres 1-m-Raster)
    in ein float32-GeoTIFF neben der XYZ-Datei.
    """
    try:
        import rasterio
        from rasterio.transform import from_origin
    except ImportError:
        logger.error("rasterio fehlt. Venv aktivieren: source venv/bin/activate")
        sys.exit(1)

    tif_path = xyz_path.with_suffix(".tif")
    if tif_path.exists():
        return tif_path

    with _get_file_lock(xyz_path.name):
        # Erneut prüfen, nachdem der Lock erworben wurde
        if tif_path.exists():
            return tif_path

        logger.info(f"Konvertiere {xyz_path.name} → GeoTIFF …")
        data = np.loadtxt(xyz_path, dtype=np.float32)

        if data.ndim != 2 or data.shape[1] < 3:
            logger.warning(f"  Überspringe {xyz_path.name}: keine gültigen XYZ-Daten (shape={data.shape})")
            return tif_path

        xs = np.unique(data[:, 0])
        ys = np.unique(data[:, 1])
        n_cols, n_rows = len(xs), len(ys)
        x0 = xs.min() - 0.5
        y1 = ys.max() + 0.5

        x_idx = np.searchsorted(xs, data[:, 0])
        # y-Achse ist invertiert: größte y = Zeile 0
        y_idx = (n_rows - 1) - np.searchsorted(ys, data[:, 1])
        z = np.full((n_rows, n_cols), np.nan, dtype=np.float32)
        z[y_idx, x_idx] = data[:, 2]

        transform = from_origin(x0, y1, 1.0, 1.0)
        with rasterio.open(tif_path, "w", driver="GTiff",
                           height=n_rows, width=n_cols,
                           count=1, dtype="float32",
                           crs="EPSG:25832",
                           transform=transform) as dst:
            dst.write(z, 1)
        logger.info(f"  → {tif_path.name}")
    return tif_path


def _ensure_tifs_from_zips(data_dir: Path) -> None:
    """
    Durchsucht alle ZIP-Archive im Verzeichnis nach Kacheln und stellt TIF-Dateien bereit:
    - TIF-Dateien werden direkt ins Verzeichnis extrahiert
    - XYZ-Dateien werden extrahiert und in TIF konvertiert
    """
    for zip_path in sorted(data_dir.glob("*.zip")):
        with zipfile.ZipFile(zip_path) as zf:
            for member in zf.namelist():
                name = Path(member).name
                if _TILE_TIF_RE.search(name):
                    # TIF direkt entpacken, falls noch nicht vorhanden
                    dest = data_dir / name
                    if not dest.exists():
                        with _get_file_lock(name):
                            if not dest.exists():
                                logger.info(f"Entpacke {name} aus {zip_path.name} …")
                                dest.write_bytes(zf.read(member))
                elif _TILE_XYZ_RE.search(name):
                    # XYZ flach ins data_dir schreiben (nicht in ZIP-Unterordner)
                    tif_name = Path(name).stem + ".tif"
                    if next(data_dir.rglob(tif_name), None):
                        continue
                    xyz_path = data_dir / name
                    if not xyz_path.exists():
                        with _get_file_lock(name):
                            if not xyz_path.exists():
                                logger.info(f"Entpacke {name} aus {zip_path.name} …")
                                xyz_path.write_bytes(zf.read(member))
                    _xyz_to_tif(xyz_path)


def find_tiles(data_dir: Path, min_e: float, min_n: float, max_e: float, max_n: float):
    """
    Sucht alle GeoTIFF-Kacheln im Verzeichnis (rekursiv), die mit der bbox überlappen.
    XYZ-Dateien in ZIPs werden bei Bedarf automatisch konvertiert.
    """
    _ensure_tifs_from_zips(data_dir)

    results = []
    for tif in sorted(data_dir.rglob("*.tif")):
        m = _TILE_TIF_RE.search(tif.name)
        if not m:
            continue
        tile_e = int(m.group(1)) * 1000
        tile_n = int(m.group(2)) * 1000
        if tile_e + 1000 <= min_e or tile_e >= max_e:
            continue
        if tile_n + 1000 <= min_n or tile_n >= max_n:
            continue
        results.append((tif, tile_e, tile_n))
    return results


def load_mosaic(tile_infos: list, min_e: float, min_n: float, max_e: float, max_n: float) -> np.ndarray:
    """
    Fügt alle Kacheln zu einem zusammenhängenden float32-Array (Mosaik) zusammen.
    Zeile 0 = Norden (= max_n). Bereiche ohne Daten werden mit NaN gefüllt.
    """
    try:
        import rasterio
    except ImportError:
        logger.error("rasterio fehlt. Venv aktivieren: source venv/bin/activate")
        sys.exit(1)

    width_px = round(max_e - min_e)
    height_px = round(max_n - min_n)
    mosaic = np.full((height_px, width_px), np.nan, dtype=np.float32)

    for tif_path, tile_e, tile_n in tile_infos:
        with rasterio.open(tif_path) as src:
            data = src.read(1).astype(np.float32)
            if src.nodata is not None:
                data[data == src.nodata] = np.nan
            tile_h, tile_w = data.shape

            int_e0 = max(tile_e, round(min_e))
            int_e1 = min(tile_e + tile_w, round(max_e))
            int_n0 = max(tile_n, round(min_n))
            int_n1 = min(tile_n + tile_h, round(max_n))
            if int_e0 >= int_e1 or int_n0 >= int_n1:
                continue

            dst_col0 = int_e0 - round(min_e)
            dst_col1 = int_e1 - round(min_e)
            dst_row0 = round(max_n) - int_n1
            dst_row1 = round(max_n) - int_n0

            dc0 = max(0, dst_col0); dc1 = min(width_px, dst_col1)
            dr0 = max(0, dst_row0); dr1 = min(height_px, dst_row1)

            sc0 = dc0 - dst_col0 + (int_e0 - tile_e)
            sc1 = sc0 + (dc1 - dc0)
            sr0 = dr0 - dst_row0 + ((tile_n + tile_h) - int_n1)
            sr1 = sr0 + (dr1 - dr0)

            if dc0 >= dc1 or dr0 >= dr1:
                continue

            mosaic[dr0:dr1, dc0:dc1] = data[sr0:sr1, sc0:sc1]

    pct = 100 * np.count_nonzero(~np.isnan(mosaic)) / mosaic.size
    logger.info(f"  Mosaik {width_px}×{height_px} px, {pct:.1f}% belegt")
    return mosaic
