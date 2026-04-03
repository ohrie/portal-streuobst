# Streuobstwiesen-Karte

Interactive map platform for traditional orchard meadows (Streuobstwiesen) in Germany. Combines OpenStreetMap data with a Next.js frontend, automated OSM data pipeline, and AI-powered tree detection.

## Architecture

### Projekt-Module
- [Overview](README.md): project overview, deployment, and architecture
- Web: Next.js frontend and map application
- [Data Pipeline](data-processing/README.md): OSM extraction, processing, and tile generation
- [Tree Detection](tree-detection/README.md): tree detection and API

### Website (`web/`)
- **Stack**: Next.js 16, React 19, Tailwind CSS 4, Mapbox GL JS
- **Build**: Static export (`output: 'export'`) - no server-side features
- **Deployment**: Docker container with nginx, deployed via Traefik to `portal-streuobst.de`

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

```bash
cd web
npm install
npm run dev          # Dev server at localhost:3000
npm run build        # Static export to web/out
```

**Never use Turbopack** — always webpack: `next dev --webpack`

**Critical files:**
- `web/next.config.ts` — static export config
- `web/src/app/layout.tsx` — root layout with fonts
- `web/src/components/layouts/` — MinimalLayout / StandardLayout

## Data Pipeline

```bash
cd data-processing
./run_docker.sh      # Recommended: runs in Docker
```

**Steps:** Download Germany OSM (~4.5 GB) → extract orchards/meadows/trees with osmium → convert to GeoJSON with ogr2ogr → generate vector tiles with tippecanoe

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

## Docker & Deployment

**Container Registry:** from `DOCKER_REGISTRY`

- Website: `${DOCKER_REGISTRY}/streuobstwiesen-karte`
- Pipeline: `${DOCKER_REGISTRY}/streuobstwiesen-pipeline`

**GitHub Actions** (`.github/workflows/ci-cd.yml`):
- `detect-changes` → `build-web` / `deploy-web` → `build-pipeline` / `deploy-pipeline`

**Required Secrets/Variables:**
- `DOCKER_REGISTRY` (variable)
- `DOCKER_REGISTRY_USERNAME` / `DOCKER_REGISTRY_PASSWORD`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `SSH_PASS`, `SSH_HOST`, `SSH_USER`
- `WEB_DEPLOY_PATH`, `DEPLOY_PATH`

## Common Pitfalls

- No Next.js API routes (static export)
- No server components with dynamic data
- No embedded SVGs in JSX
- No missing `'use client'` on interactive components
- No Turbopack

## Git Workflow

- **main** — production, auto-deploys on push
- Feature branches for development
