#!/bin/bash
#
# Docker-based processing script for Streuobstwiesen data
# This script runs the data processing pipeline in a Docker container
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/processing_$(date +%Y%m%d_%H%M%S).log"
IMAGE_NAME="streuobstwiesen-pipeline"

# Create logs directory
mkdir -p "$LOG_DIR"

echo -e "${GREEN}🐳 Starting Streuobstwiesen Data Processing (Docker)${NC}"
echo "Log file: $LOG_FILE"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    exit 1
fi

# Build Docker image if it doesn't exist or if Dockerfile changed
echo -e "${YELLOW}🔨 Building Docker image...${NC}" | tee -a "$LOG_FILE"
cd "$SCRIPT_DIR"
docker build -t "$IMAGE_NAME" . 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}" | tee -a "$LOG_FILE"

# Run the processing in Docker
echo -e "${YELLOW}▶️  Running data processing...${NC}" | tee -a "$LOG_FILE"

docker rm -f streuobstwiesen-processing 2>/dev/null || true

docker run --rm \
    --name streuobstwiesen-processing \
    -v "${SCRIPT_DIR}/data:/app/data" \
    -v "${SCRIPT_DIR}/temp:/app/temp" \
    -v "${SCRIPT_DIR}/output:/app/output" \
    -v "${SCRIPT_DIR}/logs:/app/logs" \
    --memory=16g \
    --cpus=4 \
    "$IMAGE_NAME" 2>&1 | tee -a "$LOG_FILE"

# Check exit status
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Processing completed successfully!${NC}" | tee -a "$LOG_FILE"

    # Run Bundesland statistics
    echo -e "${YELLOW}▶️  Running Bundesland statistics...${NC}" | tee -a "$LOG_FILE"
    docker run --rm \
        --name streuobstwiesen-laender-stats \
        -v "${SCRIPT_DIR}/output:/app/output" \
        "$IMAGE_NAME" \
        python3 process_laender_stats.py 2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✅ Bundesland statistics completed${NC}" | tee -a "$LOG_FILE"
        PORTAL_DATA_DIR="/srv/portal-streuobst/data"
        mkdir -p "$PORTAL_DATA_DIR"
        # Docker creates a directory at the bind-mount path if the file didn't exist at compose-up time
        [ -d "$PORTAL_DATA_DIR/stats_laender.json" ] && rm -rf "$PORTAL_DATA_DIR/stats_laender.json"
        cp "${SCRIPT_DIR}/output/stats_laender.json" "$PORTAL_DATA_DIR/stats_laender.json"
        echo -e "${GREEN}✅ stats_laender.json deployed to $PORTAL_DATA_DIR${NC}" | tee -a "$LOG_FILE"
        [ -d "$PORTAL_DATA_DIR/stats.json" ] && rm -rf "$PORTAL_DATA_DIR/stats.json"
        cp "${SCRIPT_DIR}/output/stats.json" "$PORTAL_DATA_DIR/stats.json"
        echo -e "${GREEN}✅ stats.json deployed to $PORTAL_DATA_DIR${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}❌ Bundesland statistics failed!${NC}" | tee -a "$LOG_FILE"
    fi

    # Copy tiles if needed
    if [ -f "${SCRIPT_DIR}/output/streuobstwiesen.mbtiles" ]; then
        # Uncomment and configure your deployment method:

        # Option 1: Copy to web server directory
        # cp "${SCRIPT_DIR}/output/streuobstwiesen.mbtiles" /var/www/tiles/

        # Option 2: Upload via rsync
        # rsync -avz "${SCRIPT_DIR}/output/streuobstwiesen.mbtiles" user@server:/var/www/tiles/

        # Option 3: Upload to cloud storage with rclone
        # rclone sync "${SCRIPT_DIR}/output/streuobstwiesen.mbtiles" r2:tiles/

        echo -e "${GREEN}✅ Tiles ready for deployment${NC}"
    fi

    # Cleanup old logs (keep last 30 days)
    find "$LOG_DIR" -name "processing_*.log" -mtime +30 -delete 2>/dev/null || true

    exit 0
else
    echo -e "${RED}❌ Processing failed!${NC}" | tee -a "$LOG_FILE"
    exit 1
fi
