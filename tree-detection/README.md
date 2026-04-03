# tree-detection — Automatische Baumkartierung in Streuobstwiesen

Erkennt Einzelbäume in Streuobstwiesen anhand eines **Canopy Height Model (CHM)** aus lokalen LGL-BW Höhendaten:

```
CHM = DOM1 (Oberflächenmodell) − DGM1 (Geländemodell)
```

Baumkronen werden per **Laplacian-of-Gaussian (LoG) Blob-Detektion** im CHM gefunden und als GeoJSON ausgegeben.

---

## Struktur

```
tree-detection/
  core/                        # Bibliotheksmodule
    coords.py                  # UTM32 ↔ WGS84
    tiles.py                   # Kachel-Suche, XYZ→TIF, Mosaik-Aufbau
    detection.py               # LoG Blob-Detektion
    polygons.py                # Polygon-Filter (Streuobstwiesen)
    output.py                  # GeoJSON-Ausgabe
    downloader.py              # DOM1/DGM1 Download von LGL-BW
    polygon_lookup.py          # Polygon-Lookup aus all_streuobstwiesen.geojson
  trees_detection.py           # CLI-Einstiegspunkt
  api.py                       # FastAPI-Server (GET /api/trees/{osm_id})
  data/
    dom1/                      # DOM1-Kacheln (lokal oder heruntergeladen)
    dgm1/                      # DGM1-Kacheln
    trees/                     # Gecachte Ergebnisse {osm_id}_{datum}.geojson
```

---

## CLI

```bash
# Venv aktivieren
source venv/bin/activate

# Baumdetektion für eine bbox (lokale Kacheln müssen vorhanden sein)
python trees_detection.py --bbox "9.426,49.274,9.482,49.328"
```

| Option | Standard | Beschreibung |
|---|---|---|
| `--bbox` | — | Pflicht: `min_lon,min_lat,max_lon,max_lat` |
| `--dom1-dir` | `data/dom1` | Verzeichnis mit DOM1-Kacheln |
| `--dgm1-dir` | `data/dgm1` | Verzeichnis mit DGM1-Kacheln |
| `--geojson` | `../data-processing/output/all_streuobstwiesen.geojson` | Polygon-Referenz |
| `--output` | `data/detected_trees_chm_local_<bbox>.geojson` | Ausgabepfad |
| `--min-height-m` | `3.0` | Untergrenze CHM (m) |
| `--max-height-m` | `18.0` | Obergrenze CHM (m) |
| `--min-sigma` | `2.0` | Kleinste LoG-Sigma (px) |
| `--max-sigma` | `8.0` | Größte LoG-Sigma (px) |
| `--blob-threshold` | `0.05` | LoG-Kontrastschwelle |
| `--no-filter` | false | Polygon-Filter überspringen |
| `--save-chm` | false | CHM als GeoTIFF speichern (QGIS-Inspektion) |

---

## API-Server

Der Server liefert Bäume per OSM-ID. Kacheln werden bei Bedarf automatisch von LGL-BW heruntergeladen.

### Lokal starten

```bash
source venv/bin/activate
pip install -r requirements.api.txt
uvicorn api:app --host 0.0.0.0 --port 8000
```

### Via Docker

```bash
# Im Projekt-Root:
docker compose up tree-api --build
```

Der Server ist dann unter `http://localhost:8000` erreichbar (Port 8000 wird auf den Host gemappt).
Setzt voraus, dass `data-processing/output/all_streuobstwiesen.geojson` vorhanden ist (wird read-only gemountet).

Kacheln werden bei Bedarf automatisch von LGL-BW heruntergeladen — der Downloader holt sich die Session-Cookies beim ersten Request selbstständig.

### Endpoint

```
GET /api/trees/{osm_id}
```

- `osm_id` im Format `a12345` (osmium area ID aus den Kartenfeatures)
- Gibt GeoJSON FeatureCollection mit erkannten Bäumen zurück
- Gecachte Ergebnisse werden sofort geliefert (`data/trees/{osm_id}_{datum}.geojson`)
- Mehrere Flächen können gleichzeitig angefragt werden

```bash
curl http://localhost:8000/api/trees/a46301568
```


## Abhängigkeiten

- `rasterio` — GeoTIFF-Handling
- `scikit-image` — LoG Blob-Detektion
- `geopandas` / `shapely` — Geodatenverarbeitung
- `pyproj` — Koordinatentransformation
- `numpy` — Rasteroperationen
- `fastapi` / `uvicorn` — API-Server
- `requests` — Tile-Downloads
