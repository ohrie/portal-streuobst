# IDs: Interne Feature-IDs und OSM-IDs

Im System gibt es keine separaten "internen IDs" — die OSM-IDs sind durchgängig die einzige Kennung für Flächen und Bäume.

## Herkunft der IDs

`osmium export` wird mit `--add-unique-id type_id` aufgerufen. Damit bekommt jedes GeoJSON-Feature ein `@id`-Feld mit dem Format **Typ-Präfix + numerische ID**:

| Präfix | OSM-Objekttyp | Beispiel |
|--------|--------------|---------|
| `n`    | Node         | `n123456` |
| `w`    | Way          | `w789012` |
| `a`    | Area         | `a46301568` |

## Area-IDs (Sonderfall)

Areas entstehen in osmium aus Ways oder Relations. Die numerische Area-ID ist **abgeleitet** vom ursprünglichen OSM-Objekt:

- **Aus einem Way**: `area_id = 2 × way_id` (gerade Zahl)
- **Aus einer Relation**: `area_id = 2 × relation_id + 1` (ungerade Zahl)

Rückrechnung zum Original:
- Gerade Area-ID → `way_id = area_id / 2`
- Ungerade Area-ID → `relation_id = (area_id − 1) / 2`

Die Frontend-Komponente `OSMPopup.tsx` nutzt genau diese Logik, um aus der `osm_id` die korrekte OpenStreetMap-URL zu bauen.
