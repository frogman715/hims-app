# 📤 Panduan Deploy Upload System ke VPS Hostinger

## Ringkasan Perubahan

Sistem upload HIMS telah direfactor untuk menggunakan direktori terpusat di VPS Hostinger dengan struktur yang lebih terorganisir dan mudah di-backup.

### Struktur Direktori Baru di VPS

```
/home/hanmarine/
├── backups/                        # Backup database dan file upload
├── projects/
│   └── hims-app/                  # Source code aplikasi
└── seafarers_files/               # SEMUA FILE UPLOAD (BARU!)
    ├── cm123abc_JOHN_DOE_MASTER/  # Per-crew directory
    │   ├── 20251230_cm123abc_photo.jpg
    │   ├── 20251230_cm123abc_coc_620027165in20225.pdf
    │   └── 20251230_cm123abc_passport_a1234567.pdf
    └── cm456def_JANE_SMITH_CHIEF/
        └── ...
```

## 🚀 Langkah Deployment

### 1. Persiapan di VPS Hostinger

SSH ke VPS dan jalankan perintah berikut:

```bash
# Login sebagai user hanmarine
ssh hanmarine@your-vps-ip

# Buat direktori upload yang baru
mkdir -p /home/hanmarine/seafarers_files
chmod 755 /home/hanmarine/seafarers_files

# Buat direktori backup jika belum ada
mkdir -p /home/hanmarine/backups
chmod 755 /home/hanmarine/backups
```

### 2. Update Environment Variables

Edit file `.env.production` di server:

```bash
cd /home/hanmarine/projects/hims-app
nano .env.production
```

Tambahkan/update variabel berikut:

```bash
# File Upload Configuration (BARU!)
UPLOAD_BASE_DIR=/home/hanmarine/seafarers_files
UPLOAD_MAX_SIZE_MB=20
```

**Catatan:** Jangan ubah `UPLOADS_DIR` lama, biarkan untuk backward compatibility.

### 3. Pull & Build Kode Terbaru

```bash
cd /home/hanmarine/projects/hims-app

# Pull latest code
git fetch origin
git checkout copilot/find-upload-configuration
git pull origin copilot/find-upload-configuration

# Install dependencies (jika ada perubahan)
npm install

# Build aplikasi
npm run build

# Verifikasi build berhasil
ls -la .next/standalone/
```

### 4. Restart Aplikasi

**Jika menggunakan PM2:**

```bash
# Reload app dengan environment baru
pm2 reload ecosystem.config.js --env production

# Atau restart full
pm2 restart hims-app

# Cek status
pm2 status
pm2 logs hims-app --lines 50
```

**Jika menggunakan systemd service:**

```bash
sudo systemctl restart hims-app
sudo systemctl status hims-app
journalctl -u hims-app -n 50 -f
```

### 5. Migrasi File Upload Lama (Optional)

Jika ada file upload di lokasi lama, migrasi ke struktur baru:

```bash
# Script migrasi akan dibuat di langkah selanjutnya
cd /home/hanmarine/projects/hims-app
chmod +x scripts/migrate-old-uploads.sh
./scripts/migrate-old-uploads.sh
```

### 6. Setup Backup Otomatis

Update cron job untuk backup:

```bash
# Edit crontab
crontab -e

# Tambahkan baris ini (backup setiap hari jam 2 pagi)
0 2 * * * /home/hanmarine/projects/hims-app/backup-uploads.sh >> /var/log/hims-backup.log 2>&1

# Verifikasi cron sudah terdaftar
crontab -l
```

### 7. Test Upload Functionality

1. **Login ke aplikasi:**
   - Buka browser: `https://app.hanmarine.co`
   - Login dengan user admin

2. **Test upload foto seafarer:**
   - Navigate ke: Crew Management → Seafarer Details
   - Upload foto
   - Verify file muncul di: `/home/hanmarine/seafarers_files/{crewId}_{name}/`

3. **Test upload dokumen:**
   - Navigate ke: Documents → Upload Document
   - Upload certificate (PDF/JPG)
   - Verify file saved dengan format: `20251230_{crewId}_{docType}_{docNumber}.pdf`

4. **Cek permission file:**
   ```bash
   ls -la /home/hanmarine/seafarers_files/
   # Semua folder harus owned by user yang menjalankan aplikasi
   ```

## 🔍 Troubleshooting

### Problem: Permission Denied saat Upload

**Symptom:**
```
[UPLOAD] writeFile failed: EACCES: permission denied
```

**Solution:**
```bash
# Set ownership dan permission
sudo chown -R hanmarine:hanmarine /home/hanmarine/seafarers_files
chmod -R 755 /home/hanmarine/seafarers_files
```

### Problem: File Not Found setelah Upload

**Symptom:** Upload berhasil tapi file tidak bisa diakses

**Solution:**
```bash
# Cek apakah file benar-benar ada
ls -la /home/hanmarine/seafarers_files/

# Cek log aplikasi
pm2 logs hims-app --lines 100 | grep "UPLOAD"

# Pastikan environment variable ter-load
pm2 env hims-app | grep UPLOAD
```

### Problem: Upload Folder Tidak Terbuat Otomatis

**Symptom:**
```
[UPLOAD] mkdir failed: ENOENT: no such file or directory
```

**Solution:**
```bash
# Manual create base directory
mkdir -p /home/hanmarine/seafarers_files
chmod 755 /home/hanmarine/seafarers_files

# Restart app
pm2 restart hims-app
```

### Problem: File Terlalu Besar

**Symptom:**
```
File size exceeds maximum allowed (20MB)
```

**Solution:**
```bash
# Increase max size di .env.production
echo "UPLOAD_MAX_SIZE_MB=50" >> .env.production

# Restart app
pm2 restart hims-app
```

## 📊 Monitoring & Maintenance

### Cek Disk Usage

```bash
# Cek total size upload folder
du -sh /home/hanmarine/seafarers_files

# Cek per-crew directory
du -sh /home/hanmarine/seafarers_files/*/ | sort -hr | head -20

# Cek file yang paling besar
find /home/hanmarine/seafarers_files -type f -exec du -h {} + | sort -rh | head -20
```

### Verify Backup

```bash
# List backup files
ls -lh /home/hanmarine/backups/seafarers_files_backup_*.tar.gz

# Check latest backup
ls -lt /home/hanmarine/backups/ | head -5

# Test restore backup (dry-run)
cd /tmp/test_restore
tar -tzf /home/hanmarine/backups/seafarers_files_backup_20251230_020000.tar.gz | head -20
```

### Log Monitoring

```bash
# Monitor upload activity
pm2 logs hims-app | grep "UPLOAD\|FILE_SERVER"

# Count successful uploads today
grep "$(date +%Y-%m-%d)" /var/log/hims-backup.log | grep "File written successfully" | wc -l

# Check for upload errors
pm2 logs hims-app --err | grep "UPLOAD\|writeFile failed"
```

## 🔐 Security Checklist

- [ ] `/home/hanmarine/seafarers_files` owned by aplikasi user
- [ ] Permission direktori: 755 (drwxr-xr-x)
- [ ] Permission file: 644 (-rw-r--r--)
- [ ] No public web access ke folder upload (file served via `/api/files`)
- [ ] Session authentication required untuk download file
- [ ] Path traversal protection enabled di file server route
- [ ] File type whitelist enforced (PDF, JPG, PNG, DOC, DOCX)
- [ ] File size limit configured (default 20MB)
- [ ] Backup script running daily via cron
- [ ] Backup retention configured (30 days)

## 📞 Support

Jika ada masalah saat deployment, cek:

1. **Log aplikasi:** `pm2 logs hims-app`
2. **System log:** `journalctl -u hims-app -n 100`
3. **Backup log:** `cat /var/log/hims-backup.log`
4. **Environment:** `pm2 env hims-app`

Atau hubungi tim development untuk bantuan lebih lanjut.

---

**Tanggal Update:** 2025-01-11
**Versi:** 1.0
**Author:** HIMS Development Team
