#!/bin/bash

# ============================================
# POSTGRESQL DATABASE BACKUP SCRIPT
# For HIMS Production on Niagahoster VPS
# ============================================
# Schedule with cron: 0 2 * * * /var/www/hims-app/backup-database.sh
# (Daily backup at 2 AM)

set -e

# Configuration
DB_NAME="hims_prod"
DB_USER="hims_user"
DB_HOST="localhost"
BACKUP_DIR="/var/backups/hims-db"
BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hims_prod_$BACKUP_DATE.sql.gz"
LOG_FILE="/var/log/hims-backup.log"

# Get password from environment or .env
if [ -z "$DB_PASSWORD" ]; then
    # Try to get from .env.production.local
    if [ -f "/var/www/hims-app/.env.production.local" ]; then
        DB_PASSWORD=$(grep "DATABASE_URL" /var/www/hims-app/.env.production.local | cut -d: -f3 | cut -d@ -f1)
    fi
fi

# ============================================
# BACKUP PROCEDURE
# ============================================

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting database backup..." >> $LOG_FILE

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h $DB_HOST \
    -U $DB_USER \
    $DB_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ✓ Backup created: $BACKUP_FILE ($SIZE)" >> $LOG_FILE
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ✗ Backup FAILED!" >> $LOG_FILE
    exit 1
fi

# ============================================
# CLEANUP OLD BACKUPS (Keep last 30 days)
# ============================================

echo "$(date '+%Y-%m-%d %H:%M:%S') - Cleaning up old backups (30+ days old)..." >> $LOG_FILE

DELETED=0
find $BACKUP_DIR -name "hims_prod_*.sql.gz" -mtime +30 -delete && DELETED=$?

if [ $DELETED -eq 0 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ✓ Old backups cleaned up" >> $LOG_FILE
fi

# ============================================
# BACKUP SUMMARY
# ============================================

TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
BACKUP_COUNT=$(find $BACKUP_DIR -name "hims_prod_*.sql.gz" | wc -l)

echo "$(date '+%Y-%m-%d %H:%M:%S') - Summary: $BACKUP_COUNT backups, $TOTAL_SIZE total size" >> $LOG_FILE
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup complete" >> $LOG_FILE
echo "" >> $LOG_FILE

# ============================================
# DISK SPACE ALERT
# ============================================

AVAILABLE=$(df $BACKUP_DIR | tail -1 | awk '{print $4}')
THRESHOLD=$((1024*1024))  # 1 GB in KB

if [ $AVAILABLE -lt $THRESHOLD ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ⚠ WARNING: Low disk space for backups!" >> $LOG_FILE
fi

echo "Backup complete: $BACKUP_FILE"
