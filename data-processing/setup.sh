#!/bin/bash

# Streuobstwiesen Data Processing Setup Script
# This script installs all required dependencies for the data processing pipeline

set -e

echo "🚀 Setting up Streuobstwiesen data processing environment"

# Update package list
echo "📦 Updating package list..."
sudo apt-get update

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    osmium-tool \
    gdal-bin \
    build-essential \
    git \
    curl \
    wget

# Install tippecanoe
echo "🗺️  Installing tippecanoe..."
if ! command -v tippecanoe &> /dev/null; then
    # Install tippecanoe from source
    cd /tmp
    git clone https://github.com/felt/tippecanoe.git
    cd tippecanoe
    make -j$(nproc)
    sudo make install
    cd ..
    rm -rf tippecanoe
    echo "✅ tippecanoe installed successfully"
else
    echo "✅ tippecanoe already installed"
fi

# Create Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd "$(dirname "$0")"
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Setup completed successfully!"
echo ""
echo "To run the data processing pipeline:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the script: python process_streuobstwiesen.py"
echo ""
echo "For cron job setup, see setup_cron.sh"
