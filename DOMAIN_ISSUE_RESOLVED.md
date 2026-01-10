# Domain Setup Issue - RESOLVED ✅

## Problem (Masalah)
"bro tolong masih error appa gue gue bua domain" - Error saat setup domain

## Root Cause (Penyebab)
1. Tidak ada file `.env.example` dan `.env.docker.example` sebagai panduan
2. Hardcoded URL `localhost` di beberapa API routes
3. Penggunaan variable environment yang tidak konsisten (`NEXT_PUBLIC_APP_URL` vs `NEXTAUTH_URL`)
4. Kurangnya dokumentasi cara setup domain untuk production

## Solution (Solusi) ✅

### 1. File Konfigurasi Baru
- ✅ **`.env.example`** - Template environment variables untuk development
- ✅ **`.env.docker.example`** - Template untuk Docker deployment
- ✅ **`DOMAIN_SETUP_GUIDE.md`** - Panduan lengkap setup domain (EN)

### 2. Perbaikan Kode
- ✅ Fixed 3 API routes yang pakai hardcoded localhost:
  - `src/app/api/hgf/submissions/[submissionId]/approve/route.ts`
  - `src/app/api/hgf/submissions/[submissionId]/reject/route.ts`
  - `src/app/api/hgf/submissions/[submissionId]/submit/route.ts`
- ✅ Sekarang semua pakai `NEXTAUTH_URL` dari environment

### 3. Dokumentasi Diupdate
- ✅ README.md ditambah section Domain Setup
- ✅ Deployment guides diupdate (deprecation notes)
- ✅ Admin manual diupdate

## Cara Setup Domain (Quick Guide)

### Untuk Local Development:
```bash
# 1. Copy template
cp .env.example .env

# 2. Edit .env
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:password@localhost:5434/hims?schema=public"
NEXTAUTH_SECRET="generate-with-openssl"
HIMS_CRYPTO_KEY="generate-with-openssl"

# 3. Generate secrets
openssl rand -base64 32  # Untuk NEXTAUTH_SECRET
openssl rand -base64 32  # Untuk HIMS_CRYPTO_KEY

# 4. Start development
docker-compose up -d
npm install
npx prisma migrate dev
npm run dev
```

### Untuk Production (VPS):
```bash
# 1. Di VPS, buat .env.production.local
NODE_ENV=production
NEXTAUTH_URL="https://app.hanmarine.co"  # PENTING: Pakai https://
DATABASE_URL="postgresql://user:password@localhost:5432/hims_prod?schema=public"
NEXTAUTH_SECRET="generate-secret-baru"
HIMS_CRYPTO_KEY="generate-key-baru"

# 2. Setup DNS (di Hostinger/Niagahoster)
Type: A Record
Name: app
Value: [IP VPS kamu, e.g., 31.97.223.11]

# 3. Install & Build
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
npm run build

# 4. Setup Nginx + SSL
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot certonly --standalone -d app.hanmarine.co

# 5. Start dengan PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

## Key Points (Poin Penting)

### ✅ NEXTAUTH_URL adalah Variable Utama
Semua konfigurasi domain sekarang pakai **NEXTAUTH_URL**:
- Authentication callbacks
- Email notification links
- API base URLs
- Session cookies

### ✅ Untuk Production: Wajib HTTPS
```bash
# ❌ SALAH
NEXTAUTH_URL="http://app.hanmarine.co"

# ✅ BENAR
NEXTAUTH_URL="https://app.hanmarine.co"
```

### ✅ Generate Secrets Unik
```bash
# Generate secrets yang aman
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # HIMS_CRYPTO_KEY
openssl rand -base64 24  # Database password

# JANGAN pakai secrets yang sama untuk dev dan production!
```

## Troubleshooting

### Error: "Invalid callback URL"
**Penyebab:** NEXTAUTH_URL tidak match dengan domain yang diakses

**Solusi:**
```bash
# Check domain yang diakses
echo "Accessing: https://app.hanmarine.co"

# Pastikan .env match
grep NEXTAUTH_URL .env
# Output harus: NEXTAUTH_URL="https://app.hanmarine.co"

# Restart app
pm2 restart hims-app
```

### Error: Email links masih pakai localhost
**Penyebab:** App belum restart setelah ganti NEXTAUTH_URL

**Solusi:**
```bash
# Restart application
pm2 restart hims-app  # Untuk PM2
# atau
docker-compose restart app  # Untuk Docker
# atau
npm run dev  # Untuk development
```

### Error: DNS tidak resolve
**Check DNS:**
```bash
nslookup app.hanmarine.co
# Harus return IP VPS kamu

# Kalau belum, tunggu 10-30 menit (DNS propagation)
```

## Dokumentasi Lengkap

Lihat file-file berikut untuk panduan detail:

1. **DOMAIN_SETUP_GUIDE.md** - Panduan lengkap setup domain (semua skenario)
2. **.env.example** - Template environment variables dengan komentar lengkap
3. **docs/deployment/DEPLOYMENT_PRODUCTION_NIAGAHOSTER.md** - Guide khusus Niagahoster
4. **docs/deployment/DEPLOY_TO_VPS.md** - Deployment ke VPS

## Verification Checklist

Setelah setup, pastikan:
- [ ] `NEXTAUTH_URL` sudah diset dengan benar
- [ ] DNS pointing ke IP VPS yang benar
- [ ] SSL certificate valid (untuk HTTPS)
- [ ] Application running tanpa error
- [ ] Bisa login ke https://app.hanmarine.co
- [ ] Email notifications mengarah ke domain yang benar

## Status: ✅ RESOLVED

Semua issues domain configuration sudah diperbaiki. Sekarang ada:
1. ✅ Template environment files yang jelas
2. ✅ Panduan setup domain yang lengkap
3. ✅ Kode yang konsisten (pakai NEXTAUTH_URL)
4. ✅ Dokumentasi yang updated

**Kalau masih ada masalah, cek DOMAIN_SETUP_GUIDE.md atau TROUBLESHOOTING.md**

---

**Fixed by:** GitHub Copilot  
**Date:** January 10, 2026  
**Branch:** copilot/fix-domain-setup-issues
