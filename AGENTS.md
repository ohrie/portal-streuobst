# Streuobstwiesen-Karte

Interactive map platform for traditional orchard meadows (Streuobstwiesen) in Germany. Combines OpenStreetMap data with a Next.js frontend, automated OSM data pipeline, and AI-powered tree detection.

## Architecture

### Projekt-Module
- [Overview](README.md): project overview, deployment, and architecture
- Web: Next.js frontend and map application
- [Data Pipeline](data-processing/README.md): OSM extraction, processing, and tile generation
- [Tree Detection](tree-detection/README.md): tree detection and API

### Website (`web/`)
- **Build**: Static export (`output: 'export'`) - no server-side features

## File Structure

```
web/
├── src/
│   ├── app/               # Next.js pages (page.tsx, layout.tsx per route)
│   │   ├── karte/         # Full-screen map page
│   │   ├── about/
│   │   ├── bewirtschaftung/
│   │   ├── data/
│   │   ├── datenschutz/
│   │   ├── impressum/
│   │   └── wissen/
│   ├── components/
│   │   ├── map/           # Map UI (SearchBox, MapLegend, OSMPopup, TreeDetectionToggle, …)
│   │   ├── icons/         # SVG icon components
│   │   └── layouts/       # MinimalLayout.tsx, StandardLayout.tsx
│   ├── data/              # Static JSON (partner-orchards.json)
│   ├── lib/               # Utilities (geoArea, measureSession, treeDetectionCache)
│   └── types/             # TypeScript types

data-processing/
├── process_streuobstwiesen.py  # Main pipeline script
├── run_docker.sh               # Run pipeline in Docker
└── output/                     # GeoJSON + MBTiles

tree-detection/
├── core/                  # Library modules
│   ├── coords.py          # UTM32 ↔ WGS84
│   ├── tiles.py           # Tile search, XYZ→TIF, mosaic
│   ├── detection.py       # LoG blob detection
│   ├── polygons.py        # Polygon filter
│   ├── output.py          # GeoJSON output
│   ├── downloader.py      # DOM1/DGM1 download from LGL-BW
│   └── polygon_lookup.py  # Lookup from all_streuobstwiesen.geojson
├── trees_detection.py     # CLI entry point
├── api.py                 # FastAPI server
└── data/trees/            # Cached results {osm_id}_{date}.geojson
```

## Code Conventions

### Component Guidelines
- Tailwind CSS only — no inline styles or CSS modules
- Icons from `lucide-react`: `import { Map } from 'lucide-react'`
- **Never embed SVGs** — always import: `import Icon from './icon.svg'`
- Next.js `<Link>` for navigation, `<Image>` with `unoptimized: true`

### Naming
- Components: `PascalCase` (Header.tsx)
- Routes: `kebab-case` (/bewirtschaftung/page.tsx)
- Variables: `camelCase`

### Styling
- Theme colors: `bg-primary`, `text-foreground`, `bg-accent`
- Fonts: `font-body` (Roboto), `font-heading` (Epunda Slab)
- Mobile-first responsive: `md:`, `lg:` breakpoints

### Layout
- Map page (`/karte`): Full-screen via `MinimalLayout.tsx`
- Other pages: Standard layout via `StandardLayout.tsx` (Header + Footer)

## Development

**Never use Turbopack** — always webpack: `next dev --webpack`

**Critical files:**
- `web/next.config.ts` — static export config
- `web/src/app/layout.tsx` — root layout with fonts
- `web/src/components/layouts/` — MinimalLayout / StandardLayout

## Tree Detection API

```bash
# Local
cd tree-detection && source venv/bin/activate
uvicorn api:app --host 0.0.0.0 --port 8000

# Via Docker (from project root)
docker compose up tree-api --build
```

- Endpoint: `GET /api/trees/{osm_id}` (e.g. `a46301568`)
- Tiles auto-downloaded from LGL-BW on demand
- Results cached at `data/trees/{osm_id}_{date}.geojson`
- Requires `data-processing/output/all_streuobstwiesen.geojson`

## Server Structure

The file tree on the server differs from the local file tree.
There are two separate directories under `/srv/`:

```
/srv/portal-streuobst/     # Web application stack
├── docker-compose.yml     # Web + tileserver + tree-detection
├── data/
│   └── stats.json         # Copied from data pipeline, mounted into web container
├── data-processing/
│   └── output/
│       └── all_streuobstwiesen.geojson
├── tileserver/            # Tileserver config & data
└── tree-detection/        # Tree detection data

/srv/data-streuobst/       # Data pipeline (standalone)
├── docker-compose.yml
├── docker-compose.override.yml
├── Dockerfile
├── process_streuobstwiesen.py
├── cluster_streuobstwiesen.py
├── run_docker.sh
├── setup.sh / setup_cron.sh
├── data/                  # Raw downloaded OSM data
├── output/                # Generated GeoJSON + MBTiles
├── logs/
└── temp/
```

### Data Update Cron Job

Every 3 days at 02:30, the pipeline runs, copies the generated tiles, and updates stats.json for the web container:

```
30 2 */3 * * cd /srv/data-streuobst && docker compose up -d && cp /srv/data-streuobst/output/streuobstwiesen.mbtiles /srv/wiesen-tiles/data/ && cp /srv/data-streuobst/output/stats.json /srv/portal-streuobst/data/stats.json
```

`stats.json` is mounted read-only into the web container at `/usr/share/nginx/html/stats.json` via the volume defined in `docker-compose.yml`. On first server setup, create the directory: `mkdir -p /srv/portal-streuobst/data`

## Common Pitfalls

- No Next.js API routes (static export)
- No server components with dynamic data
- No embedded SVGs in JSX
- No missing `'use client'` on interactive components
- No Turbopack

