# Mapbox Vector Tiles - Layer Struktur

Die vom Processing erstellte Vector Tiles Datei (`streuobstwiesen.mbtiles`) enthält 3 separate Layer mit verschiedenen Obstgarten-Kategorien und Bäumen.

## Layer Übersicht

### 1. `streuobstwiesen`
**Geometrie:** Polygon  
**Inhalt:** Streuobstwiesen im eigentlichen Sinne  
**OSM-Tags:**
- `landuse=orchard` + `orchard=meadow_orchard` ODER
- `landuse=meadow` + `meadow=meadow_orchard`

**Eigenschaften:**
- `osm_id`: OpenStreetMap ID
- Alle weiteren OSM-Tags

---

### 2. `wiesen`
**Geometrie:** Polygon  
**Inhalt:** Alle Obstgärten, die keine Streuobstwiesen sind  
**OSM-Tags:**
- `landuse=orchard` (ohne `orchard=meadow_orchard`)
- Enthält implizit auch `landuse=orchard` + `orchard=plantation` (Kommerzielle Obstplantagen)

**Eigenschaften:**
- `osm_id`: OpenStreetMap ID
- Alle weiteren OSM-Tags

---

### 4. `baeume`
**Geometrie:** Point  
**Inhalt:** Einzelne Obstbäume innerhalb von Obstgärten  
**OSM-Tags:**
- `natural=tree` (innerhalb der Polygone Geometrie von `wiesen`, oder `streuobstwiesen`)

**Eigenschaften:**
- `osm_id`: OpenStreetMap ID
- Baumart-Tags wie `genus`, `species`, `taxon`

**Zoom-Level:** Sichtbar ab Zoom 10
