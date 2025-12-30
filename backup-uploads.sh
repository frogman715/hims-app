#!/bin/bash

###############################################################################
# HIMS APP - Uploads Backup Script
# Purpose: Daily backup of uploads folder to S3/Local storage
# Schedule: Run via cron (0 2 * * * /var/www/hims-app/backup-uploads.sh)
###############################################################################

set -e

# Configuration
UPLOADS_DIR="/var/www/hims-app/public/uploads"
BACKUP_DIR="/var/backups/hims-app-uploads"
BACKUP_RETENTION_DAYS=30
LOG_FILE="/var/log/hims-backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="uploads_backup_${TIMESTAMP}.tar.gz"

echo "[$(date)] Starting uploads backup..." >> "$LOG_FILE"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Create compressed backup
cd "$UPLOADS_DIR"
tar --exclude='.gitkeep' -czf "$BACKUP_DIR/$BACKUP_FILE" . 2>> "$LOG_FILE" || {
  echo "[$(date)] ❌ Backup failed!" >> "$LOG_FILE"
  exit 1
}

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "[$(date)] ✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)" >> "$LOG_FILE"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
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
