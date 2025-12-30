#!/bin/bash

###############################################################################
# HIMS APP - Disk Space Monitoring Script
# Purpose: Monitor disk usage and alert if threshold exceeded
# Schedule: Run every hour via cron (0 * * * * /var/www/hims-app/monitor-disk.sh)
###############################################################################

set -e

# Configuration
UPLOADS_DIR="/var/www/hims-app/public/uploads"
LOG_FILE="/var/log/hims-monitoring.log"
ALERT_THRESHOLD=80  # Alert if usage exceeds 80%
WARN_THRESHOLD=70   # Warn if usage exceeds 70%

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Get disk usage percentage
DISK_USAGE=$(df "$UPLOADS_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_USED=$(df "$UPLOADS_DIR" -h | awk 'NR==2 {print $3}')
DISK_TOTAL=$(df "$UPLOADS_DIR" -h | awk 'NR==2 {print $2}')

# Get uploads folder size
UPLOADS_SIZE=$(du -sh "$UPLOADS_DIR" | cut -f1)

echo "[$TIMESTAMP] Disk Usage: ${DISK_USAGE}% (${DISK_USED}/${DISK_TOTAL})" >> "$LOG_FILE"
echo "[$TIMESTAMP] Uploads Folder Size: $UPLOADS_SIZE" >> "$LOG_FILE"

# Check thresholds
if [ "$DISK_USAGE" -ge "$ALERT_THRESHOLD" ]; then
  echo "[$TIMESTAMP] 🚨 ALERT: Disk usage is ${DISK_USAGE}% (CRITICAL!)" >> "$LOG_FILE"
  
  # Get file count and top 10 largest files
  FILE_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
  echo "[$TIMESTAMP] File count: $FILE_COUNT" >> "$LOG_FILE"
  echo "[$TIMESTAMP] Top 10 largest files:" >> "$LOG_FILE"
  find "$UPLOADS_DIR" -type f -exec ls -lh {} + | sort -k5 -rh | head -10 >> "$LOG_FILE"
  
elif [ "$DISK_USAGE" -ge "$WARN_THRESHOLD" ]; then
  echo "[$TIMESTAMP] ⚠️  WARNING: Disk usage is ${DISK_USAGE}% (approaching limit)" >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] ✅ OK: Disk usage is ${DISK_USAGE}% (normal)" >> "$LOG_FILE"
fi

# Count files by type
echo "[$TIMESTAMP] --- File Statistics ---" >> "$LOG_FILE"
echo "[$TIMESTAMP] PDF files: $(find "$UPLOADS_DIR" -name "*.pdf" | wc -l)" >> "$LOG_FILE"
echo "[$TIMESTAMP] JPG files: $(find "$UPLOADS_DIR" -name "*.jpg" -o -name "*.jpeg" | wc -l)" >> "$LOG_FILE"
echo "[$TIMESTAMP] PNG files: $(find "$UPLOADS_DIR" -name "*.png" | wc -l)" >> "$LOG_FILE"
echo "[$TIMESTAMP] DOCX files: $(find "$UPLOADS_DIR" -name "*.docx" | wc -l)" >> "$LOG_FILE"
echo "[$TIMESTAMP] ===================" >> "$LOG_FILE"
