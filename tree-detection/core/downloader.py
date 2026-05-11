"""Download DOM1/DGM1 Kacheln von LGL-BW OpenGeodata und BayernWolke."""

import math
import logging
import threading
from pathlib import Path

import requests

from .coords import bbox_wgs84_to_utm, utm_to_wgs84, point_state
from .tiles import _ensure_tifs_from_zips

logger = logging.getLogger(__name__)

LGL_BASE_URL  = "https://opengeodata.lgl-bw.de/"
LGL_DOM1_URL  = "https://opengeodata.lgl-bw.de/data/dom1/dom1_32_{e_km}_{n_km}_2_bw.zip"
LGL_DGM1_URL  = "https://opengeodata.lgl-bw.de/data/dgm/dgm1_32_{e_km}_{n_km}_2_bw.zip"

BY_DGM1_URL  = "https://download1.bayernwolke.de/a/dgm/dgm1/{e_km}_{n_km}.tif"
BY_DOM20_URL = "https://download1.bayernwolke.de/a/dom20/DOM/32{e_km}_{n_km}_20_DOM.tif"

_DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "de,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "close",
}

# Session wird beim ersten Download initialisiert und wiederverwendet
_session: requests.Session | None = None

# Per-Datei-Locks, damit jede ZIP nur einmal heruntergeladen wird
_download_locks: dict[str, threading.Lock] = {}
_download_locks_mutex = threading.Lock()


def _get_download_lock(filename: str) -> threading.Lock:
    with _download_locks_mutex:
        if filename not in _download_locks:
            _download_locks[filename] = threading.Lock()
        return _download_locks[filename]


def _get_session() -> requests.Session:
    """Gibt die gecachte Session zurück; initialisiert sie beim ersten Aufruf."""
    global _session
    if _session is None:
        s = requests.Session()
        s.headers.update(_DEFAULT_HEADERS)
        # HEAD-Request um Session-Cookies zu setzen
        try:
            s.head(LGL_BASE_URL, timeout=10)
            cookie_names = list(s.cookies.keys())
            logger.info(f"LGL-BW Session initialisiert (Cookies: {cookie_names})")
        except requests.RequestException as exc:
            logger.warning(f"Cookie-Init fehlgeschlagen (wird trotzdem versucht): {exc}")
        _session = s
    return _session


def _zip_base(e_km: int, n_km: int) -> tuple[int, int]:
    """
    LGL-BW liefert 2×2 km ZIPs. Jedes ZIP enthält vier 1km-Kacheln und ist nach
    seiner Südwest-Ecke benannt. Die Südwest-Ecken liegen auf dem Grid
    (ungerades e, gerades n). Gibt die ZIP-Basiskoordinaten für eine 1km-Kachel zurück.
    """
    e_zip = e_km if e_km % 2 == 1 else e_km - 1
    n_zip = n_km if n_km % 2 == 0 else n_km - 1
    return e_zip, n_zip


def tiles_for_bbox_utm(min_e: float, min_n: float, max_e: float, max_n: float):
    """Yields deduplizierte (e_zip, n_zip) 2km-ZIP-Koordinaten für alle 1km-Kacheln in der bbox."""
    seen = set()
    for e_km in range(math.floor(min_e / 1000), math.ceil(max_e / 1000)):
        for n_km in range(math.floor(min_n / 1000), math.ceil(max_n / 1000)):
            coord = _zip_base(e_km, n_km)
            if coord not in seen:
                seen.add(coord)
                yield coord


def download_tile(url_template: str, data_dir: Path, e_km: int, n_km: int) -> Path | None:
    """Lädt ein 2×2 km ZIP-Paket herunter, falls noch nicht vorhanden."""
    url = url_template.format(e_km=e_km, n_km=n_km)
    filename = url.split("/")[-1]
    zip_path = data_dir / filename
    if zip_path.exists():
        logger.debug(f"  ZIP bereits vorhanden: {filename}")
        return zip_path

    with _get_download_lock(filename):
        # Erneut prüfen: ein anderer Thread hat die Datei vielleicht schon heruntergeladen
        if zip_path.exists():
            logger.debug(f"  ZIP bereits vorhanden (von anderem Thread): {filename}")
            return zip_path

        logger.info(f"  Lade {filename} …")
        session = _get_session()
        try:
            resp = session.get(url, timeout=120, stream=True)
            if resp.status_code == 403:
                # Session abgelaufen — Cookie neu holen und einmal wiederholen
                logger.info("  403 erhalten — Session-Cookie wird erneuert …")
                global _session
                _session = None
                session = _get_session()
                resp = session.get(url, timeout=120, stream=True)
            if resp.status_code == 404:
                logger.info(f"  ZIP nicht verfügbar (404): {filename}")
                return None
            resp.raise_for_status()
            data_dir.mkdir(parents=True, exist_ok=True)
            zip_path.write_bytes(resp.content)
            logger.info(f"  → {filename} ({len(resp.content) / 1024 / 1024:.1f} MB)")
            return zip_path
        except requests.RequestException as exc:
            logger.warning(f"  Download fehlgeschlagen für {filename}: {exc}")
            return None


def download_tiles_for_bbox(
    min_lon: float, min_lat: float, max_lon: float, max_lat: float,
    dom1_dir: Path, dgm1_dir: Path,
) -> None:
    """Lädt alle benötigten DOM1- und DGM1-Kacheln für die gegebene WGS84-bbox.

    Teilt die Kacheln kachelweise auf BW (LGL-BW) und Bayern (BayernWolke) auf,
    sodass Grenzregionen korrekt behandelt werden: jede 1-km-Kachel wird vom
    zuständigen Datenanbieter bezogen.
    """
    min_e, min_n, max_e, max_n = bbox_wgs84_to_utm(min_lon, min_lat, max_lon, max_lat)

    bw_zip_coords: set[tuple[int, int]] = set()
    by_tile_coords: list[tuple[int, int]] = []

    for e_km in range(math.floor(min_e / 1000), math.ceil(max_e / 1000)):
        for n_km in range(math.floor(min_n / 1000), math.ceil(max_n / 1000)):
            # Kachelzentrum → WGS84 → Bundesland
            tile_lon, tile_lat = utm_to_wgs84(e_km * 1000 + 500, n_km * 1000 + 500)
            state = point_state(tile_lon, tile_lat)
            if state == "bw":
                bw_zip_coords.add(_zip_base(e_km, n_km))
            elif state == "by":
                by_tile_coords.append((e_km, n_km))
            # Kacheln außerhalb beider Bundesländer werden übersprungen

    if bw_zip_coords:
        logger.info(f"[BW] Lade {len(bw_zip_coords)} ZIP-Paket(e)")
        for e_zip, n_zip in bw_zip_coords:
            download_tile(LGL_DOM1_URL, dom1_dir, e_zip, n_zip)
            download_tile(LGL_DGM1_URL, dgm1_dir, e_zip, n_zip)
        _ensure_tifs_from_zips(dom1_dir)
        _ensure_tifs_from_zips(dgm1_dir)

    if by_tile_coords:
        logger.info(f"[BY] Lade {len(by_tile_coords)} Kachel(n)")
        for e_km, n_km in by_tile_coords:
            dgm1_dest = dgm1_dir / f"dgm1_by_{e_km}_{n_km}.tif"
            _download_tile_direct(BY_DGM1_URL.format(e_km=e_km, n_km=n_km), dgm1_dest)
            _download_and_resample_dom20(e_km, n_km, dom1_dir)


# ---------------------------------------------------------------------------
# BayernWolke – direkte TIF-Downloads (1 km × 1 km, kein ZIP, keine Auth)
# ---------------------------------------------------------------------------

def _download_tile_direct(url: str, dest_path: Path) -> Path | None:
    """Lädt eine einzelne TIF-Datei direkt herunter. Gibt None bei 404."""
    if dest_path.exists():
        logger.debug(f"  TIF bereits vorhanden: {dest_path.name}")
        return dest_path

    with _get_download_lock(dest_path.name):
        if dest_path.exists():
            logger.debug(f"  TIF bereits vorhanden (von anderem Thread): {dest_path.name}")
            return dest_path

        logger.info(f"  Lade {dest_path.name} …")
        try:
            resp = requests.get(url, timeout=120, stream=True, headers=_DEFAULT_HEADERS)
            if resp.status_code == 404:
                logger.info(f"  TIF nicht verfügbar (404): {dest_path.name}")
                return None
            resp.raise_for_status()
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_bytes(resp.content)
            logger.info(f"  → {dest_path.name} ({len(resp.content) / 1024 / 1024:.1f} MB)")
            return dest_path
        except requests.RequestException as exc:
            logger.warning(f"  Download fehlgeschlagen für {dest_path.name}: {exc}")
            return None


def _download_and_resample_dom20(e_km: int, n_km: int, dom1_dir: Path) -> Path | None:
    """Lädt DOM20 (20 cm) herunter und resamplet auf 1 m. Gibt den 1-m-TIF-Pfad zurück."""
    try:
        import rasterio
        from rasterio.enums import Resampling
        from rasterio.transform import from_origin
    except ImportError:
        logger.error("rasterio fehlt. Venv aktivieren: source venv/bin/activate")
        return None

    dest_1m = dom1_dir / f"dom1_by_{e_km}_{n_km}.tif"
    if dest_1m.exists():
        logger.debug(f"  Resampled DOM1 bereits vorhanden: {dest_1m.name}")
        return dest_1m

    url = BY_DOM20_URL.format(e_km=e_km, n_km=n_km)
    raw_path = dom1_dir / f"dom20_by_{e_km}_{n_km}_raw.tif"

    if not _download_tile_direct(url, raw_path):
        return None

    with _get_download_lock(dest_1m.name):
        if dest_1m.exists():
            return dest_1m

        logger.info(f"  Resample {raw_path.name} → 1 m …")
        with rasterio.open(raw_path) as src:
            # DOM20 hat 20 cm Auflösung → Faktor 5 für 1 m
            new_width = src.width // 5
            new_height = src.height // 5
            data = src.read(
                1,
                out_shape=(1, new_height, new_width),
                resampling=Resampling.average,
            ).astype("float32")
            transform = src.transform * src.transform.scale(
                src.width / new_width,
                src.height / new_height,
            )
            with rasterio.open(
                dest_1m, "w", driver="GTiff",
                height=new_height, width=new_width,
                count=1, dtype="float32",
                crs=src.crs,
                transform=transform,
            ) as dst:
                dst.write(data, 1)

        # Rohdaten nicht mehr benötigt
        raw_path.unlink(missing_ok=True)
        logger.info(f"  → {dest_1m.name}")
    return dest_1m


