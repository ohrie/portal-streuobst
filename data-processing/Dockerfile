# Dockerfile for Streuobstwiesen Data Processing Pipeline
# Stage 1: Build tippecanoe from the Felt fork
# The apt package (tippecanoe) is based on the abandoned mapbox/tippecanoe repo and is outdated.
# We need felt/tippecanoe (>2.49) for current PMTiles support and bug fixes.
FROM ubuntu:25.10 AS tippecanoe-builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libsqlite3-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 \
        https://github.com/felt/tippecanoe.git /tippecanoe-src \
    && cd /tippecanoe-src \
    && make -j$(nproc) \
    && make install PREFIX=/usr/local

# Stage 2: Runtime image (multi-stage keeps it lean, equivalent to slim)
FROM ubuntu:25.10

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    osmium-tool \
    gdal-bin \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    libsqlite3-0 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Copy tippecanoe binaries from builder stage
COPY --from=tippecanoe-builder \
    /usr/local/bin/tippecanoe \
    /usr/local/bin/tile-join \
    /usr/local/bin/tippecanoe-decode \
    /usr/local/bin/tippecanoe-json-tool \
    /usr/local/bin/

# Create app directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies (use --break-system-packages for Ubuntu 24.04 PEP 668)
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application files
COPY process_streuobstwiesen.py .
COPY *.sh .

# Make scripts executable
RUN chmod +x *.sh

# Create necessary directories
RUN mkdir -p data temp output

# Verify installations
RUN osmium --version && \
    ogr2ogr --version && \
    tippecanoe --version && \
    python3 --version

# Default command
CMD ["python3", "process_streuobstwiesen.py"]
