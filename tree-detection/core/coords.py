"""Koordinaten-Hilfsfunktionen für UTM32N ↔ WGS84."""

from pyproj import Transformer

_wgs84_to_utm32 = Transformer.from_crs("EPSG:4326", "EPSG:25832", always_xy=True)
_utm32_to_wgs84 = Transformer.from_crs("EPSG:25832", "EPSG:4326", always_xy=True)

RES_M = 1.0  # Auflösung beider Modelle: 1 m/Pixel

BW_LON_MIN, BW_LON_MAX = 7.5, 10.5
BW_LAT_MIN, BW_LAT_MAX = 47.5, 49.8


def bbox_wgs84_to_utm(min_lon, min_lat, max_lon, max_lat):
    min_e, min_n = _wgs84_to_utm32.transform(min_lon, min_lat)
    max_e, max_n = _wgs84_to_utm32.transform(max_lon, max_lat)
    return min_e, min_n, max_e, max_n


def utm_to_wgs84(easting, northing):
    return _utm32_to_wgs84.transform(easting, northing)


def wgs84_to_utm(lon, lat):
    return _wgs84_to_utm32.transform(lon, lat)
