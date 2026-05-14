#!/bin/bash
#
# Runs only the download_streuobst_routes.py script in Docker and deploys
# the resulting GeoJSON to the web portal data directory.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/download_routes_$(date +%Y%m%d_%H%M%S).log"
PORTAL_DATA_DIR="/srv/portal-streuobst/data"

mkdir -p "$LOG_DIR"

# Load .env (provides DOCKER_REGISTRY and DZT_API_KEY)
set -a
[ -f "${SCRIPT_DIR}/.env" ] && source "${SCRIPT_DIR}/.env"
set +a

if [ -z "$DOCKER_REGISTRY" ]; then
    echo "ERROR: DOCKER_REGISTRY not set in .env" | tee -a "$LOG_FILE"
    exit 1
fi
if [ -z "$DZT_API_KEY" ]; then
    echo "ERROR: DZT_API_KEY not set in .env" | tee -a "$LOG_FILE"
    exit 1
fi

IMAGE="${DOCKER_REGISTRY}/streuobstwiesen-pipeline:latest"

echo "$(date): Pulling latest image..." | tee -a "$LOG_FILE"
docker pull "$IMAGE" >> "$LOG_FILE" 2>&1

echo "$(date): Running routes download..." | tee -a "$LOG_FILE"
docker run --rm \
    --name streuobstwiesen-routes-download \
    -e DZT_API_KEY="$DZT_API_KEY" \
    -v "${SCRIPT_DIR}/output:/app/output" \
    -v "${SCRIPT_DIR}/logs:/app/logs" \
    "$IMAGE" \
    python3 download_streuobst_routes.py >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "$(date): Download completed successfully" | tee -a "$LOG_FILE"
    mkdir -p "$PORTAL_DATA_DIR"
    [ -d "$PORTAL_DATA_DIR/streuobst_routes.geojson" ] && rm -rf "$PORTAL_DATA_DIR/streuobst_routes.geojson"
    cp "${SCRIPT_DIR}/output/streuobst_routes.geojson" "$PORTAL_DATA_DIR/streuobst_routes.geojson"
    echo "$(date): streuobst_routes.geojson deployed to $PORTAL_DATA_DIR" | tee -a "$LOG_FILE"
else
    echo "$(date): Download failed" | tee -a "$LOG_FILE"
    exit 1
fi

find "$LOG_DIR" -name "download_routes_*.log" -mtime +30 -delete 2>/dev/null || true
