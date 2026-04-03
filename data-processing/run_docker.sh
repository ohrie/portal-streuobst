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
