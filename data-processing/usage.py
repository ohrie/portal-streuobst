#!/usr/bin/env python3
"""
Usage examples for the Streuobstwiesen Data Processing Pipeline
"""

import subprocess
import sys
from pathlib import Path

def show_usage():
    """Show usage information"""
    
    print("🍎 Streuobstwiesen Data Processing Pipeline")
    print("=" * 50)
    print()
    print("USAGE:")
    print("  python process_streuobstwiesen.py [OPTIONS]")
    print()
    print("OPTIONS:")
    print("  --dry-run, --test    Run pipeline without downloading/processing data")
    print("  (no options)         Run full pipeline with Germany data")
    print()
    print("EXAMPLES:")
    print("  # Test the pipeline")
    print("  python process_streuobstwiesen.py --dry-run")
    print()
    print("  # Run full processing (downloads ~3.5GB)")
    print("  python process_streuobstwiesen.py")
    print()
    print("  # Test with small Hamburg dataset")
    print("  python test_hamburg.py")
    print()
    print("SETUP:")
    print("  # Initial setup")
    print("  ./setup.sh")
    print()
    print("  # Setup cron job (weekly)")
    print("  ./setup_cron.sh")
    print()
    print("OUTPUT:")
    print("  output/streuobstwiesen.geojson    - GeoJSON data")
    print("  output/streuobstwiesen.mbtiles    - Vector tiles")
    print()
    print("MONITORING:")
    print("  tail -f processing.log            - Live processing log")
    print("  tail -f cron.log                 - Cron job log")
    print()

def check_environment():
    """Check if environment is properly set up"""
    
    print("🔍 Environment Check:")
    print("-" * 20)
    
    # Check virtual environment
    venv_dir = Path(__file__).parent / "venv"
    if venv_dir.exists():
        print("✅ Virtual environment: Found")
    else:
        print("❌ Virtual environment: Missing (run ./setup.sh)")
        return False
    
    # Check required tools
    tools = ["osmium", "ogr2ogr", "tippecanoe"]
    for tool in tools:
        try:
            subprocess.run([tool, "--version"], capture_output=True, check=True)
            print(f"✅ {tool}: Available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"❌ {tool}: Missing")
            return False
    
    # Check Python packages
    try:
        import osmium, geopandas, requests
        print("✅ Python packages: Available")
    except ImportError as e:
        print(f"❌ Python packages: Missing ({e})")
        return False
    
    print("✅ Environment is ready!")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ["--help", "-h", "help"]:
        show_usage()
    else:
        check_environment()
