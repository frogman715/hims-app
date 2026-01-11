#!/bin/bash
# ================================================================
# HIMS Upload Backup Script
# ================================================================
# Backup system for HIMS uploaded documents and photos
# 
# Usage:
#   ./scripts/backup-uploads.sh [OPTIONS]
#
# Options:
#   --remote          Upload backup to remote storage (S3/rclone)
#   --encrypt         Encrypt backup with GPG
#   --retention DAYS  Keep backups for N days (default: 30)
#   --help            Show this help message
#
# Example:
#   ./scripts/backup-uploads.sh
#   ./scripts/backup-uploads.sh --remote --encrypt --retention 60
# ================================================================

set -e  # Exit on error

# ================================================================
# CONFIGURATION
# ================================================================

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/hims/uploads}"
SOURCE_DIR="${SOURCE_DIR:-/var/www/data_staff/uploads}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="hims_uploads_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"
RETENTION_DAYS=30
ENABLE_REMOTE=false
ENABLE_ENCRYPTION=false

# Remote storage (S3/rclone) - Configure as needed
REMOTE_STORAGE=""  # Example: "s3://your-bucket/hims-backups/" or "remote:hims-backups/"
GPG_RECIPIENT=""   # Example: "admin@hanmarine.co" or GPG key ID

# Logging
LOG_FILE="/var/log/hims-backup.log"
BACKUP_LOG="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================================================
# FUNCTIONS
# ================================================================

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "$message" | tee -a "$LOG_FILE"
}

log_success() {
    log "${GREEN}✓ $1${NC}"
}

log_error() {
    log "${RED}✗ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠ $1${NC}"
}

show_help() {
    head -n 19 "$0" | tail -n 16
    exit 0
}

check_dependencies() {
    local missing_deps=()
    
    command -v tar >/dev/null 2>&1 || missing_deps+=("tar")
    command -v du >/dev/null 2>&1 || missing_deps+=("du")
    command -v find >/dev/null 2>&1 || missing_deps+=("find")
    
    if [ "$ENABLE_REMOTE" = true ]; then
        if [[ "$REMOTE_STORAGE" == s3://* ]]; then
            command -v aws >/dev/null 2>&1 || missing_deps+=("aws-cli")
        else
            command -v rclone >/dev/null 2>&1 || missing_deps+=("rclone")
        fi
    fi
    
    if [ "$ENABLE_ENCRYPTION" = true ]; then
        command -v gpg >/dev/null 2>&1 || missing_deps+=("gpg")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log "Install with: sudo apt install ${missing_deps[*]}"
        exit 1
    fi
}

check_source_directory() {
    if [ ! -d "$SOURCE_DIR" ]; then
        log_error "Source directory does not exist: $SOURCE_DIR"
        exit 1
    fi
    
    if [ ! -r "$SOURCE_DIR" ]; then
        log_error "Cannot read source directory: $SOURCE_DIR"
        exit 1
    fi
}

create_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR" || {
            log_error "Failed to create backup directory: $BACKUP_DIR"
            exit 1
        }
        log_success "Created backup directory: $BACKUP_DIR"
    fi
}

calculate_source_size() {
    local size=$(du -sh "$SOURCE_DIR" 2>/dev/null | cut -f1)
    log "Source directory size: $size"
    
    local docs_count=$(find "$SOURCE_DIR/documents" -type f 2>/dev/null | wc -l)
    local photos_count=$(find "$SOURCE_DIR/photos" -type f 2>/dev/null | wc -l)
    log "Documents: $docs_count files, Photos: $photos_count files"
}

create_backup() {
    log "Creating backup: $BACKUP_FILE"
    
    local start_time=$(date +%s)
    
    # Create backup with compression
    tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
        -C "$SOURCE_DIR" \
        --exclude='*.tmp' \
        --exclude='.DS_Store' \
        --exclude='Thumbs.db' \
        . 2>&1 | tee -a "$BACKUP_LOG"
    
    local exit_code=${PIPESTATUS[0]}
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        local backup_size=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
        log_success "Backup created successfully in ${duration}s: $backup_size"
        return 0
    else
        log_error "Backup creation failed with exit code: $exit_code"
        return 1
    fi
}

encrypt_backup() {
    if [ "$ENABLE_ENCRYPTION" = true ]; then
        log "Encrypting backup with GPG..."
        
        if [ -z "$GPG_RECIPIENT" ]; then
            log_error "GPG_RECIPIENT not configured"
            return 1
        fi
        
        gpg --encrypt \
            --recipient "$GPG_RECIPIENT" \
            --output "$BACKUP_DIR/${BACKUP_FILE}.gpg" \
            "$BACKUP_DIR/$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            # Remove unencrypted backup
            rm "$BACKUP_DIR/$BACKUP_FILE"
            BACKUP_FILE="${BACKUP_FILE}.gpg"
            log_success "Backup encrypted successfully"
            return 0
        else
            log_error "Backup encryption failed"
            return 1
        fi
    fi
}

upload_to_remote() {
    if [ "$ENABLE_REMOTE" = true ]; then
        log "Uploading backup to remote storage..."
        
        if [ -z "$REMOTE_STORAGE" ]; then
            log_error "REMOTE_STORAGE not configured"
            return 1
        fi
        
        if [[ "$REMOTE_STORAGE" == s3://* ]]; then
            # AWS S3
            aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "$REMOTE_STORAGE" || {
                log_error "Failed to upload to S3"
                return 1
            }
        else
            # Rclone (supports many cloud providers)
            rclone copy "$BACKUP_DIR/$BACKUP_FILE" "$REMOTE_STORAGE" || {
                log_error "Failed to upload with rclone"
                return 1
            }
        fi
        
        log_success "Backup uploaded to remote storage"
    fi
}

cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local pattern="hims_uploads_*.tar.gz"
    if [ "$ENABLE_ENCRYPTION" = true ]; then
        pattern="hims_uploads_*.tar.gz.gpg"
    fi
    
    local deleted_count=0
    while IFS= read -r file; do
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "$pattern" -mtime +$RETENTION_DAYS)
    
    if [ $deleted_count -gt 0 ]; then
        log_success "Deleted $deleted_count old backup(s)"
    else
        log "No old backups to delete"
    fi
}

verify_backup() {
    log "Verifying backup integrity..."
    
    if [[ "$BACKUP_FILE" == *.gpg ]]; then
        # Skip verification for encrypted files (requires decryption)
        log_warning "Skipping verification for encrypted backup"
        return 0
    fi
    
    # Test tar archive
    tar -tzf "$BACKUP_DIR/$BACKUP_FILE" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        local file_count=$(tar -tzf "$BACKUP_DIR/$BACKUP_FILE" | wc -l)
        log_success "Backup verified: $file_count files"
        return 0
    else
        log_error "Backup verification failed"
        return 1
    fi
}

generate_backup_report() {
    local report_file="${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt"
    
    cat > "$report_file" << EOF
========================================
HIMS UPLOAD BACKUP REPORT
========================================
Timestamp: $(date '+%Y-%m-%d %H:%M:%S')
Backup File: $BACKUP_FILE
Source Directory: $SOURCE_DIR
Backup Directory: $BACKUP_DIR

STATISTICS:
-----------
Source Size: $(du -sh "$SOURCE_DIR" 2>/dev/null | cut -f1)
Backup Size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null | cut -f1)
Documents: $(find "$SOURCE_DIR/documents" -type f 2>/dev/null | wc -l) files
Photos: $(find "$SOURCE_DIR/photos" -type f 2>/dev/null | wc -l) files

CONFIGURATION:
--------------
Retention: $RETENTION_DAYS days
Encryption: $ENABLE_ENCRYPTION
Remote Upload: $ENABLE_REMOTE
Remote Storage: $REMOTE_STORAGE

DISK USAGE:
-----------
$(df -h "$BACKUP_DIR" | tail -n 1)

========================================
EOF
    
    log "Backup report saved: $report_file"
}

# ================================================================
# MAIN SCRIPT
# ================================================================

main() {
    log "=========================================="
    log "HIMS Upload Backup Script Started"
    log "=========================================="
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --remote)
                ENABLE_REMOTE=true
                shift
                ;;
            --encrypt)
                ENABLE_ENCRYPTION=true
                shift
                ;;
            --retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                ;;
        esac
    done
    
    # Execute backup process
    check_dependencies
    check_source_directory
    create_backup_directory
    calculate_source_size
    
    if create_backup; then
        verify_backup
        encrypt_backup
        upload_to_remote
        cleanup_old_backups
        generate_backup_report
        
        log_success "=========================================="
        log_success "Backup process completed successfully"
        log_success "=========================================="
        exit 0
    else
        log_error "=========================================="
        log_error "Backup process failed"
        log_error "=========================================="
        exit 1
    fi
}

# Run main function
main "$@"
