#!/bin/bash

# Cron Job Setup for Streuobstwiesen Data Processing
# This script sets up automated weekly data processing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROCESS_SCRIPT="$SCRIPT_DIR/process_streuobstwiesen.py"
VENV_DIR="$SCRIPT_DIR/venv"
LOG_FILE="$SCRIPT_DIR/cron.log"

# Create wrapper script for cron
cat > "$SCRIPT_DIR/run_processing.sh" << EOF
#!/bin/bash

# Set PATH for cron environment
export PATH="/usr/local/bin:/usr/bin:/bin:\$PATH"

# Change to script directory
cd "$SCRIPT_DIR"

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Run processing with logging
echo "\$(date): Starting Streuobstwiesen data processing" >> "$LOG_FILE"
python "$PROCESS_SCRIPT" >> "$LOG_FILE" 2>&1
EXIT_CODE=\$?

if [ \$EXIT_CODE -eq 0 ]; then
    echo "\$(date): Processing completed successfully" >> "$LOG_FILE"
else
    echo "\$(date): Processing failed with exit code \$EXIT_CODE" >> "$LOG_FILE"
fi

# Deactivate virtual environment
deactivate

exit \$EXIT_CODE
EOF

# Make wrapper script executable
chmod +x "$SCRIPT_DIR/run_processing.sh"

echo "🕐 Setting up cron job for weekly data processing"

# Create cron job entry
CRON_ENTRY="0 2 * * 0 $SCRIPT_DIR/run_processing.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_DIR/run_processing.sh"; then
    echo "⚠️  Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "✅ Cron job added successfully"
fi

echo ""
echo "📅 Cron job configuration:"
echo "   Schedule: Every Sunday at 2:00 AM"
echo "   Command: $SCRIPT_DIR/run_processing.sh"
echo "   Log file: $LOG_FILE"
echo ""
echo "To modify the schedule, edit the cron job:"
echo "   crontab -e"
echo ""
echo "To view current cron jobs:"
echo "   crontab -l"
echo ""
echo "To monitor the log:"
echo "   tail -f $LOG_FILE"
