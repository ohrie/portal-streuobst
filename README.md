# Streuobstwiesen-Karte

Interaktive Karte zur Visualisierung und Entdeckung von Streuobstwiesen in Deutschland. Das Projekt bereit OpenStreetMap-Daten als Karte auf, um Streuobstwiesen für viele Menschen zugänglich zu machen und Bewusstsein für diese wertvollen Kulturlandschaften zu schaffen.

## Kartenfeatures

- **Streuobstwiesen aus OSM** — Flächen aus OpenStreetMap, regelmäßig aktualisiert
- **Schutzgebiete (BfN)** — einblendbare Ebenen: Naturschutzgebiete, Landschaftsschutzgebiete, Nationalparke, Naturparke, Biosphärenreservate, Vogelschutzgebiete, FFH-Gebiete, Naturmonumente
- **Satellitenansicht** — Umschalten zwischen Karte und Satellitenbild
- **3D-Gelände & Hillshading** — Geländedarstellung mit Höhenrelief
- **Flächenmessung** — Flächen auf der Karte ausmessen
- **Baumerkennung** — KI-gestützte Erkennung einzelner Obstbäume im sichtbaren Kartenausschnitt
- **Suche** — Ortssuche mit Suchverlauf
- **Sidebar** — Detailinfos zu angeklickten Flächen inkl. OSM-Tags und Hinweis zu Erntebeschränkungen

## Projektstruktur

```
├── web/                   # Next.js Web-Anwendung
│   ├── src/               # Quellcode
│   │   ├── app/           # Next.js App Router (Seiten & Layouts)
│   │   ├── components/    # React Komponenten
│   │   ├── data/          # Statische Daten (Partner-Gärten)
│   │   └── types/         # TypeScript Typdefinitionen
│   ├── public/            # Statische Assets (Bilder, Icons)
│   └── Dockerfile         # Web Docker Image
├── data-processing/       # Python Pipeline für OSM-Datenverarbeitung
│   ├── process_streuobstwiesen.py  # Hauptskript
│   └── docker-compose.yml          # Eigenständige Pipeline
├── tree-detection/        # FastAPI Tree-Detection API
└── .github/workflows/     # CI/CD GitHub Actions
    └── ci-cd.yml          # Unified CI/CD pipeline
```

## Technologie-Stack

**Frontend:**
- Next.js 16 (Static Export)
- React 19
- Mapbox GL JS
- Tailwind CSS 4

**Backend/Data:**
- Python 3 (OSM-Datenverarbeitung)
- nginx (Statischer Webserver)
- Docker & Docker Compose

**Deployment:**
- Traefik (Reverse Proxy)
- GitHub Actions (CI/CD)
- Private Container Registry (via `DOCKER_REGISTRY`)

## Entwicklung

```bash
# In das Web-Verzeichnis wechseln
cd web

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build erstellen
npm run build
```

### Umgebungsvariablen

Erstelle eine `web/.env.local` Datei für lokale Entwicklung:

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=dein_mapbox_token
```

Hole deinen Mapbox Token von: https://account.mapbox.com/access-tokens/

Die App läuft unter [http://localhost:3000](http://localhost:3000).

## Deployment

Die Anwendung wird automatisch bei Push auf `main` gebaut und deployed:

1. **Change Detection**: Erkennt ob Web-App oder Data-Pipeline geändert wurde
2. **Build**: Docker Images werden zur Registry aus `DOCKER_REGISTRY` gepusht
3. **Deploy**: Container werden auf Server deployed
   - Web-App via Traefik unter `portal-streuobst.de`
   - Data-Pipeline läuft via Cron für regelmäßige Updates

### GitHub Secrets & Variablen

Folgende Secrets müssen in den GitHub Repository Settings konfiguriert sein:

- `DOCKER_REGISTRY` (als Variable) - Registry-Domain (z. B. `registry.example.com`)
- `DOCKER_REGISTRY_USERNAME` - Username für `DOCKER_REGISTRY`
- `DOCKER_REGISTRY_PASSWORD` - Password für `DOCKER_REGISTRY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Mapbox API Token
- `SSH_HOST` - Server Hostname
- `SSH_PASS` - Server SSH Passwort
- `SSH_USER` (als Variable) - SSH Username
- `WEB_DEPLOY_PATH` (als Variable) - Deployment Pfad für Web-App (`/srv/portal-streuobst`)
- `DEPLOY_PATH` (als Variable) - Deployment Pfad für Pipeline (`/srv/data-streuobst`)

## Lokaler Docker-Build

```bash
# Image bauen und starten
docker-compose up -d --build

# Logs ansehen
docker-compose logs -f

# Stoppen
docker-compose down
```

# Unterstützung

[![Japfel Logo](./web/public/partner/Japfel_Logo.png)](https://www.japfel.de)

Dieses Projekt wurde initiiert von [www.japfel.de](https://www.japfel.de). Weitere Unterstützer:innen sind willkommen.

Für Software Contributions bitte die [CONTRIBUTING.md](./CONTRIBUTING.md) beachten.