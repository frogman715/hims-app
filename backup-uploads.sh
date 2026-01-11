#!/bin/bash

###############################################################################
# HIMS APP - Uploads Backup Script
# Purpose: Daily backup of uploads folder to local storage
# Schedule: Run via cron (0 2 * * * /home/hanmarine/projects/hims-app/backup-uploads.sh)
###############################################################################

set -e

# Configuration - Using centralized upload directory
UPLOADS_DIR="${UPLOAD_BASE_DIR:-/home/hanmarine/seafarers_files}"
BACKUP_DIR="/home/hanmarine/backups"
BACKUP_RETENTION_DAYS=30
LOG_FILE="/var/log/hims-backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="seafarers_files_backup_${TIMESTAMP}.tar.gz"

echo "[$(date)] Starting uploads backup from $UPLOADS_DIR..." >> "$LOG_FILE"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Check if upload directory exists
if [ ! -d "$UPLOADS_DIR" ]; then
  echo "[$(date)] ⚠️  Upload directory not found: $UPLOADS_DIR" >> "$LOG_FILE"
  echo "[$(date)] Creating directory..." >> "$LOG_FILE"
  mkdir -p "$UPLOADS_DIR"
fi

# Create compressed backup
cd "$UPLOADS_DIR"
tar --exclude='.gitkeep' -czf "$BACKUP_DIR/$BACKUP_FILE" . 2>> "$LOG_FILE" || {
  echo "[$(date)] ❌ Backup failed!" >> "$LOG_FILE"
  exit 1
}

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "[$(date)] ✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)" >> "$LOG_FILE"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "seafarers_files_backup_*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
echo "[$(date)] 🧹 Cleaned backups older than $BACKUP_RETENTION_DAYS days" >> "$LOG_FILE"

# Verify backup integrity
if tar -tzf "$BACKUP_DIR/$BACKUP_FILE" &>/dev/null; then
  echo "[$(date)] ✅ Backup integrity verified" >> "$LOG_FILE"
else
  echo "[$(date)] ❌ Backup integrity check failed!" >> "$LOG_FILE"
  rm "$BACKUP_DIR/$BACKUP_FILE"
  exit 1
fi

echo "[$(date)] ✅ Backup completed successfully" >> "$LOG_FILE"
