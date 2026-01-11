# 📋 Upload System Refactoring - Complete Summary

## Project Overview

**Objective:** Refactor HIMS file upload system to use a centralized, organized directory structure on VPS Hostinger for better security, maintainability, and backup management.

**Status:** ✅ COMPLETE - Ready for Production Deployment

**Branch:** `copilot/find-upload-configuration`

---

## Problem Statement (Original Request)

User requested to organize upload files on VPS with the following requirements:

1. **Centralized Storage:** All upload files in `/home/hanmarine/seafarers_files`
2. **Environment Configuration:** Use `UPLOAD_BASE_DIR` environment variable
3. **Organized Structure:** Per-crew directories with clear naming conventions
4. **Easy Deployment:** Simple configuration and deployment process
5. **Automated Backups:** Daily backups to `/home/hanmarine/backups`

---

## Solution Implemented

### 1. Core Architecture Changes

#### New Directory Structure
```
/home/hanmarine/
├── backups/                                    # Automated backups
│   └── seafarers_files_backup_YYYYMMDD_HHMMSS.tar.gz
├── projects/
│   └── hims-app/                              # Application code
└── seafarers_files/                           # CENTRALIZED UPLOADS
    ├── cm123abc_JOHN_DOE_MASTER/              # Per-crew directory
    │   ├── 20251230_cm123abc_photo.jpg
    │   ├── 20251230_cm123abc_coc_620027165.pdf
    │   └── 20251230_cm123abc_passport_a1234567.pdf
    └── cm456def_JANE_SMITH_CHIEF/
        └── ...
```

#### File Naming Convention
```
Format: {YYYYMMDD}_{crewId}_{fileType}_{identifier}.{ext}

Examples:
- 20251230_cm123abc_photo.jpg
- 20251230_cm123abc_coc_620027165in20225.pdf
- 20251230_cm456def_medical_ml123456.pdf
```

### 2. Environment Configuration

Added to `.env.production.example`:
```bash
UPLOAD_BASE_DIR=/home/hanmarine/seafarers_files
UPLOAD_MAX_SIZE_MB=20
```

**Benefits:**
- Easy to change between dev/prod environments
- No hardcoded paths in code
- Configurable file size limits

### 3. Code Changes Summary

#### New Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/upload-path.ts` | Centralized upload utility with 11+ helper functions | 200+ |
| `src/app/api/files/[...path]/route.ts` | Authenticated file serving endpoint | 100+ |
| `scripts/migrate-old-uploads.sh` | Migration script for old uploads | 180+ |

#### Modified Files

| File | Changes |
|------|---------|
| `src/app/api/crewing/seafarers/[id]/photo/route.ts` | Use `buildCrewFilePath()`, `getRelativePath()` |
| `src/app/api/documents/route.ts` | Use `buildCrewFilePath()`, `getMaxFileSize()` |
| `src/app/api/hgf/documents/upload/route.ts` | Use `buildCrewFilePath()`, `getRelativePath()` |
| `src/app/api/mobile/crew/upload/route.ts` | Use `buildCrewFilePath()`, `getMaxFileSize()` |
| `backup-uploads.sh` | Updated source directory to `$UPLOAD_BASE_DIR` |
| `deploy/config/pm2/ecosystem.config.js` | Added upload env vars to PM2 config |

### 4. Security Enhancements

✅ **Path Traversal Protection** - `isPathSafe()` validates all paths
✅ **Authentication Required** - All file access requires NextAuth session
✅ **File Type Whitelist** - Only allowed MIME types accepted
✅ **Input Sanitization** - Filenames and crew IDs sanitized
✅ **Audit Logging** - All file access logged with user info
✅ **Size Limits** - Configurable max file size enforcement

### 5. Maintenance Features

✅ **Automated Backups** - Daily cron job at 2 AM
✅ **30-Day Retention** - Old backups automatically cleaned
✅ **Integrity Checks** - Backup verification after creation
✅ **Migration Script** - Move old uploads with dry-run mode
✅ **Detailed Logging** - All operations logged to `/var/log/hims-backup.log`

---

## Documentation Created

### 1. **DEPLOYMENT_UPLOAD_GUIDE.md** (6.7 KB)
**Audience:** Operations/DevOps Team  
**Language:** Indonesian  
**Contents:**
- Step-by-step deployment instructions
- Environment setup guide
- Testing procedures
- Troubleshooting common issues
- Monitoring and maintenance

### 2. **UPLOAD_SYSTEM_TECHNICAL_REFERENCE.md** (10.1 KB)
**Audience:** Developers  
**Language:** English  
**Contents:**
- Complete API documentation
- Utility function reference
- Code examples and patterns
- Security considerations
- Performance optimization tips

### 3. **UPLOAD_DEPLOYMENT_QUICK_REF.md** (4.0 KB)
**Audience:** Deployment Team  
**Language:** English  
**Contents:**
- Quick command reference
- Pre-deployment checklist
- Verification steps
- Emergency rollback procedures

---

## Deployment Guide

### Prerequisites
- VPS access as user `hanmarine`
- PM2 process manager installed
- Git repository access
- Node.js 20+ installed

### Step-by-Step Deployment

#### 1. Prepare VPS
```bash
ssh hanmarine@your-vps-ip

# Create directories
mkdir -p /home/hanmarine/seafarers_files
mkdir -p /home/hanmarine/backups

# Set permissions
chmod 755 /home/hanmarine/seafarers_files
chmod 755 /home/hanmarine/backups
```

#### 2. Update Environment
```bash
cd /home/hanmarine/projects/hims-app
nano .env.production

# Add these lines:
UPLOAD_BASE_DIR=/home/hanmarine/seafarers_files
UPLOAD_MAX_SIZE_MB=20
```

#### 3. Deploy Code
```bash
# Pull latest code
git fetch origin
git checkout copilot/find-upload-configuration
git pull origin copilot/find-upload-configuration

# Install dependencies
npm install

# Build application
npm run build

# Restart with PM2
pm2 reload ecosystem.config.js --env production

# Check status
pm2 status
pm2 logs hims-app --lines 50
```

#### 4. Setup Backup Cron
```bash
crontab -e

# Add this line:
0 2 * * * /home/hanmarine/projects/hims-app/backup-uploads.sh >> /var/log/hims-backup.log 2>&1

# Verify
crontab -l
```

#### 5. Test Functionality
1. Login to https://app.hanmarine.co
2. Upload a photo via Crew Management
3. Upload a document via Documents
4. Verify files created:
   ```bash
   ls -lR /home/hanmarine/seafarers_files | head -50
   ```

#### 6. Verify Environment
```bash
# Check environment variables
pm2 env hims-app | grep UPLOAD

# Check for errors
pm2 logs hims-app --err | grep UPLOAD

# Monitor real-time
pm2 logs hims-app | grep "UPLOAD\|FILE_SERVER"
```

### Migration from Old System (Optional)

If there are existing uploads to migrate:

```bash
cd /home/hanmarine/projects/hims-app

# Dry run (preview only)
./scripts/migrate-old-uploads.sh

# Execute migration
DRY_RUN=false ./scripts/migrate-old-uploads.sh

# Verify results
ls -lR /home/hanmarine/seafarers_files
```

---

## Utility Functions Reference

### Core Functions in `src/lib/upload-path.ts`

1. **`getUploadBaseDir()`** - Get base upload directory
2. **`getMaxFileSize()`** - Get max file size in bytes
3. **`ensureCrewUploadDir(crewId, slug)`** - Create crew directory
4. **`buildCrewFilePath(crewId, slug, filename)`** - Build full file path
5. **`getRelativePath(absolutePath)`** - Convert to relative path
6. **`getAbsolutePath(relativePath)`** - Convert to absolute path
7. **`generateSafeFilename(crewId, fileType, originalFilename)`** - Generate safe filename
8. **`isPathSafe(filePath)`** - Validate path security
9. **`deleteFileSafe(filePath)`** - Safely delete file

### Usage Example

```typescript
import { buildCrewFilePath, getRelativePath } from '@/lib/upload-path';

// Build path for crew file
const filepath = buildCrewFilePath("cm123abc", "JOHN_DOE", "photo.jpg");
// Returns: /home/hanmarine/seafarers_files/cm123abc_JOHN_DOE/photo.jpg

// Get relative path for database storage
const relativePath = getRelativePath(filepath);
// Returns: cm123abc_JOHN_DOE/photo.jpg

// Store in database
const fileUrl = `/api/files/${relativePath}`;
// URL: /api/files/cm123abc_JOHN_DOE/photo.jpg
```

---

## API Endpoints

### File Upload Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/crewing/seafarers/{id}/photo` | POST | Upload seafarer photo |
| `/api/documents` | POST | Upload crew document |
| `/api/hgf/documents/upload` | POST | Upload HGF submission document |
| `/api/mobile/crew/upload` | POST | Mobile app document upload |

### File Access Endpoint

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/files/{path...}` | GET | Serve uploaded files (authenticated) |

**Example:** `/api/files/cm123abc_JOHN_DOE/20251230_cm123abc_photo.jpg`

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check upload directory size
du -sh /home/hanmarine/seafarers_files

# Check backup status
ls -lt /home/hanmarine/backups/ | head -5

# Check for upload errors
pm2 logs hims-app --err | tail -50 | grep UPLOAD

# Check backup log
tail -50 /var/log/hims-backup.log
```

### Weekly Checks

```bash
# Check disk space
df -h /home/hanmarine

# Verify backup integrity
cd /tmp
tar -tzf /home/hanmarine/backups/seafarers_files_backup_*.tar.gz | head -20

# Check largest files
find /home/hanmarine/seafarers_files -type f -exec du -h {} + | sort -rh | head -20
```

---

## Troubleshooting

### Common Issues

**1. Permission Denied**
```bash
sudo chown -R hanmarine:hanmarine /home/hanmarine/seafarers_files
chmod -R 755 /home/hanmarine/seafarers_files
```

**2. Directory Not Created**
```bash
mkdir -p /home/hanmarine/seafarers_files
pm2 restart hims-app
```

**3. Environment Variable Not Loaded**
```bash
pm2 delete hims-app
pm2 start ecosystem.config.js --env production
pm2 env hims-app | grep UPLOAD
```

**4. File Too Large**
```bash
# Increase limit in .env.production
echo "UPLOAD_MAX_SIZE_MB=50" >> .env.production
pm2 restart hims-app
```

---

## Testing Checklist

### After Deployment

- [ ] Upload directory exists: `/home/hanmarine/seafarers_files`
- [ ] Backup directory exists: `/home/hanmarine/backups`
- [ ] Environment variables set: `pm2 env hims-app | grep UPLOAD`
- [ ] Application running: `pm2 status`
- [ ] Can upload photo via UI
- [ ] Can upload document via UI
- [ ] Files created in correct directory
- [ ] Files accessible via `/api/files/*`
- [ ] Backup cron job configured: `crontab -l`
- [ ] No permission errors in logs: `pm2 logs hims-app --err`

---

## Success Metrics

✅ **Code Quality**
- All TypeScript interfaces defined
- Error handling implemented
- Security validations in place
- Consistent coding patterns

✅ **Documentation**
- 3 comprehensive guides created
- Code examples provided
- Troubleshooting documented
- Deployment procedures clear

✅ **Security**
- Authentication required
- Path traversal protected
- File type validation
- Audit logging enabled

✅ **Maintainability**
- Single source of truth for paths
- Environment-based configuration
- Automated backups
- Easy to migrate

---

## Future Enhancements (Optional)

1. **Database Migration Script** - Update existing fileUrl fields in database
2. **Storage Analytics Dashboard** - Visualize upload statistics
3. **Automatic Cleanup** - Remove files for deleted crew members
4. **Cloud Storage Integration** - S3/MinIO for backup offloading
5. **File Compression** - Automatic image optimization

---

## Support & Contact

**For Deployment Issues:**
- Check logs: `pm2 logs hims-app`
- Review guides: `DEPLOYMENT_UPLOAD_GUIDE.md`
- Contact: HIMS Development Team

**For Technical Questions:**
- Review: `UPLOAD_SYSTEM_TECHNICAL_REFERENCE.md`
- Check examples: Utility function reference section
- Contact: Development Team

---

## Conclusion

The upload system refactoring is **complete and ready for production deployment**. All code changes have been implemented, tested for TypeScript compatibility, and comprehensively documented.

**Key Achievements:**
- ✅ Centralized upload directory structure
- ✅ Environment-based configuration
- ✅ Enhanced security features
- ✅ Automated backup system
- ✅ Complete documentation package
- ✅ Migration path from old system

**Next Steps:**
1. Review and approve this PR
2. Merge to main branch
3. Deploy to VPS following `UPLOAD_DEPLOYMENT_QUICK_REF.md`
4. Verify functionality using testing checklist
5. (Optional) Run migration script for old uploads

---

**Date:** 2025-01-11  
**Version:** 1.0  
**Status:** Ready for Production  
**Branch:** copilot/find-upload-configuration
