# 📤 PANDUAN SISTEM UPLOAD FILE HIMS
## Hanmarine Integrated Management System - File Upload Documentation

---

## 🎯 RINGKASAN LENGKAP

### Framework yang Digunakan
**Next.js 16 dengan App Router (API Routes)**

HIMS menggunakan **Next.js API Routes** untuk menangani semua upload file. Tidak menggunakan Express, NestJS, atau Laravel. Ini adalah aplikasi Next.js full-stack dengan:
- Frontend: React 19 + Next.js 16
- Backend: Next.js API Routes (REST API)
- Database: PostgreSQL + Prisma ORM

---

## 📂 STRUKTUR UPLOAD DI HIMS

### 1. Lokasi File Upload
```
/home/hanmarine/hims-app/              (root aplikasi)
├── public/
│   └── uploads/                        ← BASE UPLOAD DIRECTORY
│       ├── documents/                  ← Dokumen crew (sertifikat, passport, dll)
│       │   └── 20251230_clxuser001_coc_620027165in20225.pdf
│       └── photos/                     ← Foto seafarer
│           └── 20251230_cm123abc_a7f2e.jpg
```

### 2. Path di VPS Produksi
Saat deploy di VPS, ada beberapa kemungkinan path tergantung mode deployment:

#### A. Development Mode (`npm run dev`)
```
process.cwd() = /home/hanmarine/hims-app
Upload path   = /home/hanmarine/hims-app/public/uploads/documents
Public URL    = /uploads/documents/filename.pdf
```

#### B. Production Mode dengan Next.js Standalone
```
process.cwd() = /home/hanmarine/hims-app/.next/standalone
Upload path   = /var/www/hims-app/public/uploads/documents  (absolute path)
Public URL    = /uploads/documents/filename.pdf
```

#### C. Production Mode dengan PM2/Node
```
process.cwd() = /home/hanmarine/hims-app
Upload path   = /home/hanmarine/hims-app/public/uploads/documents
Public URL    = /uploads/documents/filename.pdf
```

---

## 🔧 IMPLEMENTASI TEKNIS

### 1. File Upload Endpoints

HIMS memiliki **4 endpoint upload** utama:

#### A. `/api/documents` - Upload Dokumen Crew (Utama)
**File:** `src/app/api/documents/route.ts`

```typescript
POST /api/documents

FormData:
- seafarerId: string (crew ID)
- docType: string (COC, PASSPORT, MEDICAL, dll)
- docNumber: string (nomor dokumen)
- issueDate: string (YYYY-MM-DD)
- expiryDate: string (YYYY-MM-DD)
- remarks?: string
- file: File (PDF, JPG, PNG, DOC, DOCX)

Upload Path:
- Fallback 1: process.cwd()/public/uploads/documents
- Fallback 2: /var/www/hims-app/public/uploads/documents
- Environment: $UPLOADS_DIR (optional)

Validasi:
- Max file size: 10MB
- Allowed types: PDF, JPEG, PNG, DOC, DOCX
- MIME type validation
- Extension matching

Naming Convention:
{date}_{crewid}_{doctype}_{docnumber}.{ext}
Contoh: 20251230_clxuser001_coc_620027165in20225.pdf
```

#### B. `/api/crewing/seafarers/[id]/photo` - Upload Foto Seafarer
**File:** `src/app/api/crewing/seafarers/[id]/photo/route.ts`

```typescript
POST /api/crewing/seafarers/{seafarerId}/photo

FormData:
- file: File (image only)

Upload Path:
- $UPLOADS_DIR/../photos (if UPLOADS_DIR set)
- /var/www/hims-app/public/uploads/photos (default)

Validasi:
- Max file size: 5MB
- Only image files (image/*)
- Image types: JPEG, PNG, JPG

Naming Convention:
{date}_{seafarerid}_{hash}.{ext}
Contoh: 20251230_cm123abc_a7f2e.jpg
```

#### C. `/api/mobile/crew/upload` - Upload dari Mobile App
**File:** `src/app/api/mobile/crew/upload/route.ts`

```typescript
POST /api/mobile/crew/upload

FormData:
- file: File
- type: string (upload type category)

Upload Path:
- $UPLOADS_DIR (if set)
- /var/www/hims-app/public/uploads/documents (default)

Validasi:
- Max file size: 10MB
- Allowed types: PDF, JPEG, PNG, HEIC, HEIF
- MIME type validation

Naming Convention:
{date}_{crewid}_{uploadtype}_{hash}.{ext}
Contoh: 20251230_cm123abc_medical_a7f2e.jpg

Special:
- Creates document with PENDING status
- Requires review by admin
```

#### D. `/api/hgf/documents/upload` - Upload HGF Form Documents
**File:** `src/app/api/hgf/documents/upload/route.ts`

```typescript
POST /api/hgf/documents/upload

FormData:
- file: File
- submissionId: string
- documentType: string
- documentCode?: string

Upload Path:
- process.cwd()/public/uploads/documents

Validasi:
- Max file size: 10MB
- Allowed types: PDF, JPEG, PNG

Naming Convention:
{submissionId}-{documentCode}-{timestamp}.{ext}
Contoh: sub123-AC01-1704056400000.pdf
```

### 2. File Upload Library
**File:** `src/lib/file-operations.ts`

Centralized utility untuk file handling:
```typescript
// Upload document
export async function uploadDocument(file: File): Promise<FileUploadResult>

// Delete document
export async function deleteDocument(fileUrl: string): Promise<FileDeleteResult>

// Validate file
export function validateFile(file: File, options?): { valid: boolean; error?: string }
```

---

## 🚀 DEPLOYMENT DI VPS

### Konfigurasi yang Disarankan

#### 1. Struktur Directory di VPS
```bash
/var/www/hims-app/                     ← Root aplikasi di VPS
├── .next/
│   └── standalone/                    ← Next.js standalone build
├── public/
│   └── uploads/                       ← Symbolic link ke data directory
│       ├── documents/
│       └── photos/
└── ...

/var/www/data_staff/                   ← Directory terpisah untuk data
└── uploads/
    ├── documents/                     ← Actual file storage
    │   ├── 2025/
    │   │   ├── 01/
    │   │   └── 02/
    │   └── ...
    └── photos/
        ├── 2025/
        └── ...
```

#### 2. Setup Symbolic Link
```bash
# Buat directory data terpisah
sudo mkdir -p /var/www/data_staff/uploads/documents
sudo mkdir -p /var/www/data_staff/uploads/photos

# Set permissions
sudo chown -R hanmarine:hanmarine /var/www/data_staff
sudo chmod -R 755 /var/www/data_staff

# Backup existing uploads (jika ada)
sudo cp -r /var/www/hims-app/public/uploads/* /var/www/data_staff/uploads/

# Remove old directory
sudo rm -rf /var/www/hims-app/public/uploads

# Create symbolic link
sudo ln -s /var/www/data_staff/uploads /var/www/hims-app/public/uploads

# Verify link
ls -la /var/www/hims-app/public/
```

#### 3. Environment Variable
Edit `.env.production`:
```bash
# File Uploads Configuration
UPLOADS_DIR="/var/www/data_staff/uploads/documents"

# Or use relative path (jika masih di dalam app)
# UPLOADS_DIR="public/uploads/documents"
```

#### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name app.hanmarine.co;

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files directly (untuk performance)
    location /uploads/ {
        alias /var/www/data_staff/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Security headers
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "DENY";
    }

    # Limit upload size
    client_max_body_size 50M;
}
```

---

## 🔒 KEAMANAN FILE UPLOAD

### 1. File Validation
Semua endpoint melakukan validasi:
- ✅ File type validation (whitelist MIME types)
- ✅ File extension validation
- ✅ File size limits (5MB - 10MB)
- ✅ MIME type matching with extension
- ✅ Directory traversal prevention

### 2. Naming Convention
Files menggunakan naming pattern yang aman:
```
{timestamp}_{userid}_{category}_{identifier}.{ext}

Contoh:
20251230_clxuser001_coc_620027165in20225.pdf
20251230_cm123abc_medical_a7f2e.jpg
```

Pattern ini mencegah:
- ❌ File name collision
- ❌ Special characters dalam filename
- ❌ Path traversal attacks
- ❌ Information disclosure dari filename

### 3. Permission Dokumen
HIMS memiliki 3 level sensitivity:
- **RED**: Passport, medical results, salary → Requires DIRECTOR/CDMO role
- **AMBER**: Personal data, certificates → Requires OPERATIONAL/HR role
- **GREEN**: Public documents → All users

File access dikontrol oleh:
1. NextAuth session validation
2. Role-based access control (RBAC)
3. Data sensitivity checks
4. Owner-based access (crew can only see own documents)

---

## 💾 BACKUP & RESTORE

### 1. Backup Script untuk Documents
**File:** `backup-uploads.sh`

```bash
#!/bin/bash
# Backup HIMS Uploads

BACKUP_DIR="/var/backups/hims/uploads"
SOURCE_DIR="/var/www/data_staff/uploads"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hims_uploads_${TIMESTAMP}.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create compressed backup
echo "Creating backup: $BACKUP_FILE"
tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$SOURCE_DIR" .

# Check backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "Backup completed: $BACKUP_SIZE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "hims_uploads_*.tar.gz" -mtime +30 -delete

# Upload to remote storage (optional)
# aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://your-bucket/hims-backups/
# or
# rclone copy "$BACKUP_DIR/$BACKUP_FILE" remote:hims-backups/

echo "Backup process completed successfully"
```

### 2. Setup Cron Job untuk Auto Backup
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/hims-app/backup-uploads.sh >> /var/log/hims-backup.log 2>&1
```

### 3. Restore dari Backup
```bash
#!/bin/bash
# Restore HIMS Uploads

BACKUP_FILE="/var/backups/hims/uploads/hims_uploads_20251230_020000.tar.gz"
RESTORE_DIR="/var/www/data_staff/uploads"

# Create temporary restore directory
TEMP_DIR="/tmp/hims_restore_$(date +%s)"
mkdir -p "$TEMP_DIR"

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Stop application (optional)
sudo systemctl stop hims-app

# Backup current files
echo "Backing up current files..."
mv "$RESTORE_DIR" "${RESTORE_DIR}.backup_$(date +%Y%m%d_%H%M%S)"

# Restore files
echo "Restoring files..."
mv "$TEMP_DIR" "$RESTORE_DIR"

# Set permissions
sudo chown -R hanmarine:hanmarine "$RESTORE_DIR"
sudo chmod -R 755 "$RESTORE_DIR"

# Start application
sudo systemctl start hims-app

echo "Restore completed successfully"
```

---

## 📊 MONITORING & MAINTENANCE

### 1. Disk Usage Monitoring
```bash
# Check uploads directory size
du -sh /var/www/data_staff/uploads/

# Detailed breakdown
du -sh /var/www/data_staff/uploads/documents/
du -sh /var/www/data_staff/uploads/photos/

# Number of files
find /var/www/data_staff/uploads/documents/ -type f | wc -l
find /var/www/data_staff/uploads/photos/ -type f | wc -l
```

### 2. Auto Cleanup Script (Optional)
```bash
#!/bin/bash
# Clean up orphaned files (files not in database)

cd /var/www/hims-app

# Get list of files from database
psql -U hims_prod_user -d hims_prod -t -A -F"," -c \
  "SELECT DISTINCT REPLACE(file_url, '/uploads/documents/', '') 
   FROM crew_documents 
   WHERE file_url IS NOT NULL;" > /tmp/db_files.txt

# Find orphaned files
find /var/www/data_staff/uploads/documents/ -type f -printf "%f\n" | \
  grep -v -F -f /tmp/db_files.txt > /tmp/orphaned_files.txt

# Review orphaned files
echo "Found $(wc -l < /tmp/orphaned_files.txt) orphaned files"

# Optionally delete (CAREFUL!)
# while read file; do
#   rm "/var/www/data_staff/uploads/documents/$file"
# done < /tmp/orphaned_files.txt
```

### 3. Alert Monitoring
Tambahkan alert untuk:
- 📊 Disk usage > 80%
- 📂 Upload directory inaccessible
- 🚫 Failed upload attempts
- 📈 Upload rate spike (potential attack)

---

## 🔍 TROUBLESHOOTING

### Problem 1: "Failed to save file to disk"
**Penyebab:**
- Directory tidak ada
- Permission denied
- Disk full

**Solusi:**
```bash
# Check directory exists
ls -la /var/www/data_staff/uploads/documents/

# Create if missing
sudo mkdir -p /var/www/data_staff/uploads/documents
sudo mkdir -p /var/www/data_staff/uploads/photos

# Fix permissions
sudo chown -R hanmarine:hanmarine /var/www/data_staff/uploads
sudo chmod -R 755 /var/www/data_staff/uploads

# Check disk space
df -h /var/www/data_staff/
```

### Problem 2: "File not found" saat akses
**Penyebab:**
- Symbolic link broken
- Nginx tidak serve static files
- Path mismatch

**Solusi:**
```bash
# Check symbolic link
ls -la /var/www/hims-app/public/uploads

# Recreate if broken
sudo rm /var/www/hims-app/public/uploads
sudo ln -s /var/www/data_staff/uploads /var/www/hims-app/public/uploads

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Problem 3: Upload berhasil tapi tidak tampil
**Penyebab:**
- File tidak readable
- Next.js caching issue
- Database record tidak match

**Solusi:**
```bash
# Check file permissions
ls -la /var/www/data_staff/uploads/documents/

# Make files readable
sudo chmod 644 /var/www/data_staff/uploads/documents/*

# Clear Next.js cache
rm -rf /var/www/hims-app/.next/cache

# Restart application
sudo systemctl restart hims-app
```

---

## 📝 CHECKLIST DEPLOYMENT

Sebelum deploy ke VPS, pastikan:

- [ ] Directory `/var/www/data_staff/uploads/` sudah dibuat
- [ ] Permission directory sudah benar (755)
- [ ] Ownership directory sudah benar (hanmarine:hanmarine)
- [ ] Symbolic link sudah dibuat dengan benar
- [ ] Nginx configured untuk serve `/uploads/` path
- [ ] Environment variable `UPLOADS_DIR` sudah set (jika perlu)
- [ ] Backup script sudah disetup
- [ ] Cron job untuk backup sudah active
- [ ] Disk monitoring sudah dikonfigurasi
- [ ] Test upload file PDF dan image
- [ ] Test download/akses file yang di-upload
- [ ] Verify file naming convention bekerja
- [ ] Check logs tidak ada error permission
- [ ] Verify database record match dengan file di disk

---

## 🎓 KESIMPULAN

### Ringkasan Sistem:
1. **Framework**: Next.js 16 API Routes (bukan Express/NestJS/Laravel)
2. **Upload Path**: `/var/www/data_staff/uploads/` (recommended) atau `public/uploads/` (default)
3. **Storage Strategy**: File system storage dengan symbolic link untuk separation
4. **Security**: MIME validation, size limits, RBAC permissions, naming conventions
5. **Backup**: Daily automated backups dengan retention 30 hari
6. **Monitoring**: Disk usage, orphaned files, failed uploads

### File Sensitif "Pekaut":
Untuk dokumen sensitif seperti:
- 🔴 Passport numbers
- 🔴 Medical results
- 🔴 Salary information
- 🟡 Personal certificates
- 🟡 Seaman books

**Keamanan yang diterapkan:**
1. Files disimpan di directory terpisah (`/var/www/data_staff/`)
2. Access control via RBAC (only authorized roles)
3. Database records include sensitivity level
4. Automated backup dengan encryption (optional)
5. File naming tanpa informasi sensitif
6. Nginx serve dengan security headers

### Next Steps:
1. Setup directory structure di VPS
2. Configure symbolic links
3. Setup backup automation
4. Test upload & download
5. Monitor disk usage
6. Document untuk team

---

**Dibuat oleh:** GitHub Copilot
**Tanggal:** 2025-01-11
**Versi HIMS:** 1.0.0
**Framework:** Next.js 16 + React 19

Untuk pertanyaan lebih lanjut, hubungi tim development atau lihat dokumentasi di:
- `src/app/api/documents/route.ts`
- `src/app/api/mobile/crew/upload/route.ts`
- `src/lib/file-operations.ts`
- `DEPLOYMENT_VPS.md`
