"""Koordinaten-Hilfsfunktionen für UTM32N ↔ WGS84."""

from pyproj import Transformer

_wgs84_to_utm32 = Transformer.from_crs("EPSG:4326", "EPSG:25832", always_xy=True)
_utm32_to_wgs84 = Transformer.from_crs("EPSG:25832", "EPSG:4326", always_xy=True)

RES_M = 1.0  # Auflösung beider Modelle: 1 m/Pixel

BW_LON_MIN, BW_LON_MAX = 7.5, 10.5
BW_LAT_MIN, BW_LAT_MAX = 47.5, 49.8

BY_LON_MIN, BY_LON_MAX = 8.9, 13.9
BY_LAT_MIN, BY_LAT_MAX = 47.2, 50.6


def point_state(lon: float, lat: float) -> str | None:
    """Gibt 'bw' oder 'by' zurück, oder None wenn der Punkt außerhalb beider Bundesländer liegt.

    Im Überlappbereich der Bounding-Boxes hat BW Vorrang, da BW das geografisch kleinere
    Bundesland ist und die Datenquellen sich an der tatsächlichen Staatsgrenze teilen.
    """
    in_bw = BW_LON_MIN <= lon <= BW_LON_MAX and BW_LAT_MIN <= lat <= BW_LAT_MAX
    in_by = BY_LON_MIN <= lon <= BY_LON_MAX and BY_LAT_MIN <= lat <= BY_LAT_MAX
    if in_bw:
        return "bw"
    if in_by:
        return "by"
    return None


def get_state(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> str:
    """Gibt 'bw' oder 'by' für die Bbox zurück (anhand des Bbox-Mittelpunkts).

    Wirft ValueError wenn die Bbox vollständig außerhalb beider Bundesländer liegt.
    Grenzregionen werden korrekt behandelt: der Mittelpunkt entscheidet, welcher
    Datenanbieter für die Bbox-Validierung zuständig ist. Für den tatsächlichen
    Kachel-Download wird tile_state() pro Kachel verwendet.
    """
    center_lon = (min_lon + max_lon) / 2
    center_lat = (min_lat + max_lat) / 2
    state = point_state(center_lon, center_lat)
    if state is not None:
        return state
    # Fallback: prüfe ob die Bbox zumindest mit einem Bundesland überlappt
    bw_overlap = (min_lon < BW_LON_MAX and max_lon > BW_LON_MIN
                  and min_lat < BW_LAT_MAX and max_lat > BW_LAT_MIN)
    by_overlap = (min_lon < BY_LON_MAX and max_lon > BY_LON_MIN
                  and min_lat < BY_LAT_MAX and max_lat > BY_LAT_MIN)
    if bw_overlap:
        return "bw"
    if by_overlap:
        return "by"
    raise ValueError(
        f"Koordinaten ({min_lon:.4f},{min_lat:.4f},{max_lon:.4f},{max_lat:.4f}) liegen "
        f"außerhalb Baden-Württembergs und Bayerns."
    )


def bbox_wgs84_to_utm(min_lon, min_lat, max_lon, max_lat):
    min_e, min_n = _wgs84_to_utm32.transform(min_lon, min_lat)
    max_e, max_n = _wgs84_to_utm32.transform(max_lon, max_lat)
    return min_e, min_n, max_e, max_n


def utm_to_wgs84(easting, northing):
    return _utm32_to_wgs84.transform(easting, northing)


def wgs84_to_utm(lon, lat):
    return _wgs84_to_utm32.transform(lon, lat)
