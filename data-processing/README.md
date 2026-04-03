# Streuobstwiesen Data Processing

Dieses Verzeichnis enthält die Pipeline zur Verarbeitung von OpenStreetMap-Daten für Streuobstwiesen in Deutschland.

## Was die Pipeline macht

1. Lädt den Deutschland-Extrakt von Geofabrik herunter, falls er noch nicht vorhanden ist.
2. Extrahiert mit osmium Flächen mit `landuse=orchard` und `landuse=meadow` plus `meadow=meadow_orchard`.
3. Filtert Bäume (`natural=tree`) innerhalb der Orchard-Flächen.
4. Konvertiert die OSM-Daten mit ogr2ogr zu GeoJSON.
5. Erzeugt mit tippecanoe Vector Tiles mit den Layern `wiesen`, `streuobstwiesen` und `baeume`.

## Ausgabe

- `output/all_streuobstwiesen.geojson`
- `output/streuobstwiesen.mbtiles`

## Setup und Start

Empfohlen ist Docker:

```bash
chmod +x run_docker.sh
./run_docker.sh
```

Manuell auf Ubuntu:

```bash
sudo apt-get update
sudo apt-get install osmium-tool gdal-bin python3 python3-pip

git clone https://github.com/felt/tippecanoe.git
cd tippecanoe && make && sudo make install

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python process_streuobstwiesen.py
```

Für einen automatischen Lauf kann `setup_cron.sh` verwendet werden.
