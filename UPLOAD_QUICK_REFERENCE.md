# 📤 QUICK REFERENCE - File Upload System

## Framework
**Next.js 16 API Routes** (bukan Express/NestJS/Laravel)

## Upload Endpoints

| Endpoint | Purpose | File Location |
|----------|---------|---------------|
| `POST /api/documents` | Upload crew documents | `src/app/api/documents/route.ts` |
| `POST /api/crewing/seafarers/[id]/photo` | Upload seafarer photos | `src/app/api/crewing/seafarers/[id]/photo/route.ts` |
| `POST /api/mobile/crew/upload` | Mobile app uploads | `src/app/api/mobile/crew/upload/route.ts` |
| `POST /api/hgf/documents/upload` | HGF form documents | `src/app/api/hgf/documents/upload/route.ts` |

## Upload Directory Structure

```bash
/var/www/hims-app/public/uploads/     # Default path
├── documents/                         # Crew documents (certificates, passports)
└── photos/                            # Seafarer photos

/var/www/data_staff/uploads/          # Recommended for production
├── documents/
│   └── 2025/01/                      # Organized by date (optional)
└── photos/
    └── 2025/01/
```

## File Naming Convention

```
{date}_{userid}_{category}_{identifier}.{ext}

Examples:
- 20251230_clxuser001_coc_620027165in20225.pdf
- 20251230_cm123abc_medical_a7f2e.jpg
- 20251230_cm123abc_a7f2e.jpg (photos)
```

## Validation Rules

| Validation | Value |
|------------|-------|
| Max file size | 5-10 MB (depends on endpoint) |
| Allowed types | PDF, JPEG, PNG, DOC, DOCX, HEIC, HEIF |
| MIME validation | ✅ Enabled |
| Extension check | ✅ Enabled |
| Path traversal protection | ✅ Enabled |

## VPS Deployment Setup

### 1. Create Upload Directory
```bash
sudo mkdir -p /var/www/data_staff/uploads/documents
sudo mkdir -p /var/www/data_staff/uploads/photos
sudo chown -R hanmarine:hanmarine /var/www/data_staff
sudo chmod -R 755 /var/www/data_staff
```

### 2. Create Symbolic Link
```bash
cd /var/www/hims-app/public
sudo ln -s /var/www/data_staff/uploads uploads
```

### 3. Configure Nginx
```nginx
location /uploads/ {
    alias /var/www/data_staff/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
client_max_body_size 50M;
```

### 4. Environment Variable (Optional)
```bash
# .env.production
UPLOADS_DIR="/var/www/data_staff/uploads/documents"
```

## Backup & Restore

### Daily Backup (Automated)
```bash
# Setup cron job
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /var/www/hims-app/scripts/backup-uploads.sh >> /var/log/hims-backup.log 2>&1
```

### Manual Backup
```bash
# Basic backup
./scripts/backup-uploads.sh

# With encryption
./scripts/backup-uploads.sh --encrypt

# With remote upload
./scripts/backup-uploads.sh --remote

# Custom retention
./scripts/backup-uploads.sh --retention 60
```

### Restore
```bash
# Restore from backup
./scripts/restore-uploads.sh /var/backups/hims/uploads/hims_uploads_20251230_020000.tar.gz

# Dry run (test without actually restoring)
./scripts/restore-uploads.sh backup.tar.gz --dry-run

# Restore to custom location
./scripts/restore-uploads.sh backup.tar.gz --target /tmp/restore_test

# Decrypt and restore
./scripts/restore-uploads.sh backup.tar.gz.gpg --decrypt
```

## Security Features

✅ **Role-Based Access Control (RBAC)**
- RED data: DIRECTOR, CDMO only
- AMBER data: OPERATIONAL, HR, ACCOUNTING
- GREEN data: All authenticated users

✅ **File Validation**
- MIME type whitelist
- Extension matching
- Size limits
- Directory traversal prevention

✅ **Secure Naming**
- No special characters
- No user-supplied filenames
- Timestamped + hashed
- No sensitive info in filename

## Monitoring

### Check Disk Usage
```bash
du -sh /var/www/data_staff/uploads/
du -sh /var/www/data_staff/uploads/documents/
du -sh /var/www/data_staff/uploads/photos/
```

### Count Files
```bash
find /var/www/data_staff/uploads/documents/ -type f | wc -l
find /var/www/data_staff/uploads/photos/ -type f | wc -l
```

### Check Permissions
```bash
ls -la /var/www/data_staff/uploads/
ls -la /var/www/hims-app/public/uploads  # Should be symlink
```

## Troubleshooting

### "Failed to save file to disk"
```bash
# Fix permissions
sudo chown -R hanmarine:hanmarine /var/www/data_staff/uploads
sudo chmod -R 755 /var/www/data_staff/uploads

# Check disk space
df -h /var/www/data_staff/
```

### "File not found" when accessing
```bash
# Verify symbolic link
ls -la /var/www/hims-app/public/uploads

# Recreate if broken
sudo rm /var/www/hims-app/public/uploads
sudo ln -s /var/www/data_staff/uploads /var/www/hims-app/public/uploads

# Test nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Upload succeeds but file not visible
```bash
# Fix file permissions
sudo chmod 644 /var/www/data_staff/uploads/documents/*

# Clear Next.js cache
rm -rf /var/www/hims-app/.next/cache

# Restart app
sudo systemctl restart hims-app
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/file-operations.ts` | Centralized file utilities |
| `src/app/api/documents/route.ts` | Main document upload API |
| `scripts/backup-uploads.sh` | Automated backup script |
| `scripts/restore-uploads.sh` | Restore from backup |
| `UPLOAD_SYSTEM_GUIDE_ID.md` | Complete documentation (Indonesian) |

## Environment Variables

```bash
# File uploads directory (optional)
UPLOADS_DIR="public/uploads/documents"

# Alternative: Absolute path for production
UPLOADS_DIR="/var/www/data_staff/uploads/documents"
```

---

**For detailed information, see:** `UPLOAD_SYSTEM_GUIDE_ID.md`

**Framework:** Next.js 16 + React 19
**Last Updated:** 2025-01-11
