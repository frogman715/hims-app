#!/bin/bash

###############################################################################
# HIMS Upload Migration Script
# Purpose: Migrate old upload files to new centralized structure
# 
# Old structure: /var/www/hims-app/public/uploads/{documents,photos}/
# New structure: /home/hanmarine/seafarers_files/{crewId}_{slug}/
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
OLD_UPLOADS_DIR="${OLD_UPLOADS_DIR:-/var/www/hims-app/public/uploads}"
NEW_UPLOADS_DIR="${UPLOAD_BASE_DIR:-/home/hanmarine/seafarers_files}"
LOG_FILE="/tmp/upload-migration-$(date +%Y%m%d_%H%M%S).log"
DRY_RUN="${DRY_RUN:-true}"

echo "========================================"
echo "HIMS Upload Migration Script"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Old directory: $OLD_UPLOADS_DIR"
echo "  New directory: $NEW_UPLOADS_DIR"
echo "  Dry run mode:  $DRY_RUN"
echo "  Log file:      $LOG_FILE"
echo ""

# Check if source directory exists
if [ ! -d "$OLD_UPLOADS_DIR" ]; then
    echo -e "${RED}❌ Error: Old uploads directory not found: $OLD_UPLOADS_DIR${NC}"
    exit 1
fi

# Create new directory if it doesn't exist
if [ ! -d "$NEW_UPLOADS_DIR" ]; then
    echo -e "${YELLOW}⚠️  New directory doesn't exist, creating: $NEW_UPLOADS_DIR${NC}"
    if [ "$DRY_RUN" = "false" ]; then
        mkdir -p "$NEW_UPLOADS_DIR"
    fi
fi

# Function to extract crew ID from filename
# Format: 20251230_{crewId}_{docType}_{docNumber}.ext
extract_crew_id() {
    local filename="$1"
    # Extract second field (crewId) after splitting by underscore
    echo "$filename" | cut -d'_' -f2
}

# Function to get crew name from database (placeholder - needs actual DB query)
get_crew_name() {
    local crew_id="$1"
    # TODO: Query from PostgreSQL database
    # For now, return placeholder
    echo "CREW_${crew_id^^}"
}

# Migration statistics
total_files=0
migrated_files=0
skipped_files=0
error_files=0

echo "Starting migration..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Migrate documents
if [ -d "$OLD_UPLOADS_DIR/documents" ]; then
    echo -e "${GREEN}📄 Processing documents...${NC}" | tee -a "$LOG_FILE"
    
    for file in "$OLD_UPLOADS_DIR/documents"/*; do
        if [ -f "$file" ]; then
            total_files=$((total_files + 1))
            filename=$(basename "$file")
            
            # Extract crew ID from filename
            crew_id=$(extract_crew_id "$filename")
            
            if [ -z "$crew_id" ] || [ "$crew_id" = "$filename" ]; then
                echo -e "${YELLOW}  ⚠️  Skipping file with unknown format: $filename${NC}" | tee -a "$LOG_FILE"
                skipped_files=$((skipped_files + 1))
                continue
            fi
            
            # Get crew name (placeholder)
            crew_slug=$(get_crew_name "$crew_id")
            
            # Create target directory
            target_dir="$NEW_UPLOADS_DIR/${crew_id}_${crew_slug}"
            target_file="$target_dir/$filename"
            
            if [ "$DRY_RUN" = "false" ]; then
                mkdir -p "$target_dir"
                
                # Copy file (preserve original)
                if cp "$file" "$target_file"; then
                    echo "  ✓ Migrated: $filename → ${crew_id}_${crew_slug}/" | tee -a "$LOG_FILE"
                    migrated_files=$((migrated_files + 1))
                else
                    echo -e "${RED}  ✗ Failed to migrate: $filename${NC}" | tee -a "$LOG_FILE"
                    error_files=$((error_files + 1))
                fi
            else
                echo "  [DRY RUN] Would migrate: $filename → ${crew_id}_${crew_slug}/" | tee -a "$LOG_FILE"
                migrated_files=$((migrated_files + 1))
            fi
        fi
    done
fi

# Migrate photos
if [ -d "$OLD_UPLOADS_DIR/photos" ]; then
    echo -e "${GREEN}📸 Processing photos...${NC}" | tee -a "$LOG_FILE"
    
    for file in "$OLD_UPLOADS_DIR/photos"/*; do
        if [ -f "$file" ]; then
            total_files=$((total_files + 1))
            filename=$(basename "$file")
            
            # Extract crew ID from filename
            crew_id=$(extract_crew_id "$filename")
            
            if [ -z "$crew_id" ] || [ "$crew_id" = "$filename" ]; then
                echo -e "${YELLOW}  ⚠️  Skipping file with unknown format: $filename${NC}" | tee -a "$LOG_FILE"
                skipped_files=$((skipped_files + 1))
                continue
            fi
            
            # Get crew name (placeholder)
            crew_slug=$(get_crew_name "$crew_id")
            
            # Create target directory
            target_dir="$NEW_UPLOADS_DIR/${crew_id}_${crew_slug}"
            target_file="$target_dir/$filename"
            
            if [ "$DRY_RUN" = "false" ]; then
                mkdir -p "$target_dir"
                
                # Copy file (preserve original)
                if cp "$file" "$target_file"; then
                    echo "  ✓ Migrated: $filename → ${crew_id}_${crew_slug}/" | tee -a "$LOG_FILE"
                    migrated_files=$((migrated_files + 1))
                else
                    echo -e "${RED}  ✗ Failed to migrate: $filename${NC}" | tee -a "$LOG_FILE"
                    error_files=$((error_files + 1))
                fi
            else
                echo "  [DRY RUN] Would migrate: $filename → ${crew_id}_${crew_slug}/" | tee -a "$LOG_FILE"
                migrated_files=$((migrated_files + 1))
            fi
        fi
    done
fi

# Summary
echo ""
echo "========================================"
echo "Migration Summary"
echo "========================================"
echo "Total files found:    $total_files"
echo "Files migrated:       $migrated_files"
echo "Files skipped:        $skipped_files"
echo "Files with errors:    $error_files"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}⚠️  DRY RUN MODE - No files were actually migrated${NC}"
    echo ""
    echo "To perform actual migration, run:"
    echo "  DRY_RUN=false $0"
else
    echo -e "${GREEN}✅ Migration completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify files in: $NEW_UPLOADS_DIR"
    echo "2. Test upload functionality in the app"
    echo "3. Update database file URLs if needed (manual SQL update)"
    echo "4. After verification, you can remove old files:"
    echo "   rm -rf $OLD_UPLOADS_DIR/{documents,photos}/*"
fi

echo ""
echo "Full log saved to: $LOG_FILE"
