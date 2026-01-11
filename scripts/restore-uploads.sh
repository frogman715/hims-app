#!/bin/bash
# ================================================================
# HIMS Upload Restore Script
# ================================================================
# Restore system for HIMS uploaded documents and photos
# 
# Usage:
#   ./scripts/restore-uploads.sh BACKUP_FILE [OPTIONS]
#
# Options:
#   --decrypt         Decrypt backup with GPG before restore
#   --target DIR      Target directory (default: /var/www/data_staff/uploads)
#   --dry-run         Show what would be restored without actually restoring
#   --no-backup       Skip backing up current files
#   --help            Show this help message
#
# Example:
#   ./scripts/restore-uploads.sh /var/backups/hims/uploads/hims_uploads_20251230_020000.tar.gz
#   ./scripts/restore-uploads.sh backup.tar.gz.gpg --decrypt --target /tmp/restore_test
#   ./scripts/restore-uploads.sh backup.tar.gz --dry-run
# ================================================================

set -e  # Exit on error

# ================================================================
# CONFIGURATION
# ================================================================

# Restore configuration
TARGET_DIR="/var/www/data_staff/uploads"
BACKUP_CURRENT=true
DRY_RUN=false
ENABLE_DECRYPTION=false
BACKUP_FILE=""

# Logging
LOG_FILE="/var/log/hims-restore.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_info() {
    log "${BLUE}ℹ $1${NC}"
}

show_help() {
    head -n 20 "$0" | tail -n 17
    exit 0
}

check_dependencies() {
    local missing_deps=()
    
    command -v tar >/dev/null 2>&1 || missing_deps+=("tar")
    command -v rsync >/dev/null 2>&1 || missing_deps+=("rsync")
    
    if [ "$ENABLE_DECRYPTION" = true ]; then
        command -v gpg >/dev/null 2>&1 || missing_deps+=("gpg")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log "Install with: sudo apt install ${missing_deps[*]}"
        exit 1
    fi
}

validate_backup_file() {
    if [ -z "$BACKUP_FILE" ]; then
        log_error "No backup file specified"
        show_help
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    if [ ! -r "$BACKUP_FILE" ]; then
        log_error "Cannot read backup file: $BACKUP_FILE"
        exit 1
    fi
    
    local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup file: $BACKUP_FILE ($file_size)"
}

decrypt_backup() {
    if [ "$ENABLE_DECRYPTION" = true ]; then
        log "Decrypting backup with GPG..."
        
        local decrypted_file="${BACKUP_FILE%.gpg}"
        
        gpg --decrypt --output "$decrypted_file" "$BACKUP_FILE" || {
            log_error "Failed to decrypt backup"
            exit 1
        }
        
        BACKUP_FILE="$decrypted_file"
        log_success "Backup decrypted successfully"
    fi
}

verify_backup_integrity() {
    log "Verifying backup integrity..."
    
    # Test tar archive
    tar -tzf "$BACKUP_FILE" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        local file_count=$(tar -tzf "$BACKUP_FILE" | wc -l)
        log_success "Backup verified: $file_count files"
    else
        log_error "Backup file is corrupted or invalid"
        exit 1
    fi
}

list_backup_contents() {
    log_info "Backup contents preview:"
    echo ""
    
    # Show directory structure
    tar -tzf "$BACKUP_FILE" | head -n 20
    
    local total_files=$(tar -tzf "$BACKUP_FILE" | wc -l)
    if [ $total_files -gt 20 ]; then
        echo "... and $((total_files - 20)) more files"
    fi
    
    echo ""
}

backup_current_files() {
    if [ "$BACKUP_CURRENT" = true ] && [ -d "$TARGET_DIR" ]; then
        log "Backing up current files..."
        
        local backup_name="${TARGET_DIR}.backup_${TIMESTAMP}"
        
        if [ "$DRY_RUN" = false ]; then
            mv "$TARGET_DIR" "$backup_name" || {
                log_error "Failed to backup current files"
                exit 1
            }
            log_success "Current files backed up to: $backup_name"
        else
            log_info "[DRY RUN] Would backup to: $backup_name"
        fi
    fi
}

create_target_directory() {
    if [ ! -d "$TARGET_DIR" ]; then
        log "Creating target directory: $TARGET_DIR"
        
        if [ "$DRY_RUN" = false ]; then
            mkdir -p "$TARGET_DIR" || {
                log_error "Failed to create target directory"
                exit 1
            }
        else
            log_info "[DRY RUN] Would create: $TARGET_DIR"
        fi
    fi
}

restore_backup() {
    log "Restoring backup to: $TARGET_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Files that would be restored:"
        tar -tzf "$BACKUP_FILE" | head -n 50
        log_info "[DRY RUN] Restore operation skipped"
        return 0
    fi
    
    local start_time=$(date +%s)
    
    # Extract backup
    tar -xzf "$BACKUP_FILE" -C "$TARGET_DIR" || {
        log_error "Failed to extract backup"
        exit 1
    }
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Backup restored successfully in ${duration}s"
}

set_permissions() {
    log "Setting permissions..."
    
    if [ "$DRY_RUN" = false ]; then
        # Set ownership (adjust username as needed)
        if id "hanmarine" >/dev/null 2>&1; then
            chown -R hanmarine:hanmarine "$TARGET_DIR" || {
                log_warning "Failed to set ownership (may need sudo)"
            }
        fi
        
        # Set directory permissions
        find "$TARGET_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || {
            log_warning "Failed to set directory permissions (may need sudo)"
        }
        
        # Set file permissions
        find "$TARGET_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || {
            log_warning "Failed to set file permissions (may need sudo)"
        }
        
        log_success "Permissions set successfully"
    else
        log_info "[DRY RUN] Would set ownership to hanmarine:hanmarine"
        log_info "[DRY RUN] Would set directory permissions to 755"
        log_info "[DRY RUN] Would set file permissions to 644"
    fi
}

verify_restore() {
    log "Verifying restored files..."
    
    local docs_count=$(find "$TARGET_DIR/documents" -type f 2>/dev/null | wc -l)
    local photos_count=$(find "$TARGET_DIR/photos" -type f 2>/dev/null | wc -l)
    local total_size=$(du -sh "$TARGET_DIR" 2>/dev/null | cut -f1)
    
    log_info "Restored statistics:"
    log_info "  - Documents: $docs_count files"
    log_info "  - Photos: $photos_count files"
    log_info "  - Total size: $total_size"
    
    if [ $docs_count -eq 0 ] && [ $photos_count -eq 0 ]; then
        log_warning "No files found after restore - something may be wrong"
    else
        log_success "Restore verified successfully"
    fi
}

cleanup_temp_files() {
    # Clean up decrypted files if we decrypted
    if [ "$ENABLE_DECRYPTION" = true ] && [ -f "$BACKUP_FILE" ]; then
        if [[ "$BACKUP_FILE" != *.gpg ]]; then
            log "Cleaning up temporary decrypted file..."
            rm -f "$BACKUP_FILE"
        fi
    fi
}

ask_confirmation() {
    if [ "$DRY_RUN" = false ]; then
        echo ""
        log_warning "=========================================="
        log_warning "WARNING: This will restore files to:"
        log_warning "  $TARGET_DIR"
        
        if [ "$BACKUP_CURRENT" = true ] && [ -d "$TARGET_DIR" ]; then
            log_warning "Current files will be backed up to:"
            log_warning "  ${TARGET_DIR}.backup_${TIMESTAMP}"
        fi
        
        log_warning "=========================================="
        echo ""
        read -p "Continue with restore? (yes/no): " -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Restore cancelled by user"
            exit 0
        fi
    fi
}

generate_restore_report() {
    local report_file="/tmp/hims_restore_report_${TIMESTAMP}.txt"
    
    cat > "$report_file" << EOF
========================================
HIMS UPLOAD RESTORE REPORT
========================================
Timestamp: $(date '+%Y-%m-%d %H:%M:%S')
Backup File: $BACKUP_FILE
Target Directory: $TARGET_DIR
Dry Run: $DRY_RUN

STATISTICS:
-----------
Documents: $(find "$TARGET_DIR/documents" -type f 2>/dev/null | wc -l) files
Photos: $(find "$TARGET_DIR/photos" -type f 2>/dev/null | wc -l) files
Total Size: $(du -sh "$TARGET_DIR" 2>/dev/null | cut -f1)

DISK USAGE:
-----------
$(df -h "$TARGET_DIR" | tail -n 1)

========================================
EOF
    
    log "Restore report saved: $report_file"
    cat "$report_file"
}

# ================================================================
# MAIN SCRIPT
# ================================================================

main() {
    log "=========================================="
    log "HIMS Upload Restore Script Started"
    log "=========================================="
    
    # Parse arguments
    if [ $# -eq 0 ]; then
        show_help
    fi
    
    BACKUP_FILE="$1"
    shift
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --decrypt)
                ENABLE_DECRYPTION=true
                shift
                ;;
            --target)
                TARGET_DIR="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-backup)
                BACKUP_CURRENT=false
                shift
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
    
    # Execute restore process
    check_dependencies
    validate_backup_file
    decrypt_backup
    verify_backup_integrity
    list_backup_contents
    ask_confirmation
    backup_current_files
    create_target_directory
    restore_backup
    set_permissions
    verify_restore
    cleanup_temp_files
    
    if [ "$DRY_RUN" = false ]; then
        generate_restore_report
    fi
    
    log_success "=========================================="
    log_success "Restore process completed successfully"
    log_success "=========================================="
    
    if [ "$DRY_RUN" = false ]; then
        log_warning "Note: You may need to restart the HIMS application:"
        log_warning "  sudo systemctl restart hims-app"
    fi
    
    exit 0
}

# Run main function
main "$@"
