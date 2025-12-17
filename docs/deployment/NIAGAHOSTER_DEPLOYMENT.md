# 🚀 DEPLOYMENT HIMS KE NIAGAHOSTER - COMPLETE GUIDE

**Setup: Website Marketing (hanmarine.co) + HIMS App (app.hanmarine.co)**

---

## 🎯 **ARSITEKTUR DEPLOYMENT**

```
hanmarine.co               →  Website Builder (marketing, company profile)
                             ↓
                             [Staff Login Button]
                             ↓
app.hanmarine.co          →  HIMS Application (Next.js - internal operations)
```

---

## 📦 **OPSI DEPLOYMENT DI NIAGAHOSTER**

### **OPSI A: VPS Niagahoster** (Recommended - Full Control)
**Paket**: VPS Baramuda ($10/month) atau VPS Garuda ($15/month)  
**Specs**: 2GB RAM, 40GB SSD, unlimited bandwidth  
**Best for**: Production, scalable, full control

### **OPSI B: Cloud Hosting Niagahoster** 
**Paket**: Bisnis ($30/month) atau Enterprise ($60/month)  
**Specs**: 3GB RAM, PHP + Node.js support  
**Best for**: Easier management, less technical

### **OPSI C: Subdomain ke VPS External** (Most Flexible)
**Paket**: Tetap pakai shared hosting untuk website  
**App**: Deploy di VPS lain (DigitalOcean/Contabo)  
**Best for**: Best performance + cost effective

---

## 🔧 **SETUP SUBDOMAIN (SEMUA OPSI)**

### **Step 1: Buat Subdomain di cPanel Niagahoster**

1. Login ke **cPanel Niagahoster**
2. Cari menu **"Subdomain"**
3. Buat subdomain baru:
   - **Subdomain**: `app`
   - **Domain**: `hanmarine.co`
   - **Document Root**: `/public_html/app` (atau kosongkan kalau mau point ke VPS)
4. Klik **Create**

✅ Sekarang `app.hanmarine.co` sudah aktif!

---

## 🌐 **OPSI A: DEPLOY KE VPS NIAGAHOSTER**

### **Step 1: Order VPS Niagahoster**

1. Login ke **Client Area** Niagahoster
2. Order VPS Baramuda/Garuda
3. Pilih OS: **Ubuntu 22.04 LTS**
4. Setup SSH access
5. Catat IP VPS: `123.45.67.89`

---

### **Step 2: Point Subdomain ke VPS**

Di **cPanel → Zone Editor**:

```
Type    Host                Value           TTL
A       app.hanmarine.co    123.45.67.89    14400
```

**Tunggu propagasi DNS**: 5-30 menit

Test DNS:
```bash
ping app.hanmarine.co
# Harus reply dari IP VPS kamu
```

---

### **Step 3: SSH ke VPS & Install Dependencies**

```bash
# SSH ke VPS
ssh root@123.45.67.89

# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL 16
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2

# Install Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Verify installations
node --version    # v20.x.x
npm --version     # 10.x.x
psql --version    # 16.x
nginx -v          # 1.x.x
```

---

### **Step 4: Setup PostgreSQL Database**

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database & user
CREATE DATABASE hims_production;
CREATE USER hims_user WITH ENCRYPTED PASSWORD 'StrongPassword123!@#';
GRANT ALL PRIVILEGES ON DATABASE hims_production TO hims_user;
\c hims_production
GRANT ALL ON SCHEMA public TO hims_user;
\q
```

**Test connection**:
```bash
psql -h localhost -U hims_user -d hims_production
# Enter password, then:
\dt  # Should show empty (belum ada tables)
\q
```

---

### **Step 5: Upload Aplikasi ke VPS**

**Opsi 1: Upload via SFTP (WinSCP/FileZilla)**

1. Download **WinSCP** atau **FileZilla**
2. Connect ke VPS:
   - **Host**: `123.45.67.89`
   - **Username**: `root`
   - **Password**: Your VPS password
   - **Port**: `22`
3. Upload folder `/home/docter203/hanmarine_hims/hims-app` ke `/root/hims-app`

**Opsi 2: Upload via rsync (dari komputer lokal)**

```bash
# Dari komputer lokal
cd /home/docter203/hanmarine_hims

# Upload ke VPS (exclude node_modules & .next)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  hims-app/ root@123.45.67.89:/root/hims-app/
```

---

### **Step 6: Setup Aplikasi di VPS**

```bash
# SSH ke VPS
ssh root@123.45.67.89

# Navigate to app directory
cd /root/hims-app

# Install dependencies
npm install --production

# Create production environment file
nano .env.production
```

**Paste konfigurasi ini** (ganti sesuai kebutuhan):

```env
# Database
DATABASE_URL="postgresql://hims_user:StrongPassword123!@#@localhost:5432/hims_production?schema=public"

# NextAuth
NEXTAUTH_URL="https://app.hanmarine.co"
NEXTAUTH_SECRET="GENERATE_WITH_openssl_rand_base64_32"

# Encryption (CRITICAL - 32+ chars)
HIMS_CRYPTO_KEY="GENERATE_WITH_openssl_rand_base64_32"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://app.hanmarine.co"
```

**Generate secrets**:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Copy output, paste ke .env.production

# Generate HIMS_CRYPTO_KEY
openssl rand -base64 32
# Copy output, paste ke .env.production
```

```bash
# Link environment file
ln -sf .env.production .env

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed admin user
npm run seed

# Build application
npm run build
```

**Expected output**:
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (XX/XX)
✓ Finalizing page optimization
```

---

### **Step 7: Setup PM2 Process Manager**

```bash
# Create PM2 config
nano ecosystem.config.js
```

**Paste konfigurasi**:
```javascript
module.exports = {
  apps: [{
    name: 'hims-app',
    script: 'npm',
    args: 'start',
    cwd: '/root/hims-app',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/logs/hims-error.log',
    out_file: '/root/logs/hims-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
```

```bash
# Create logs directory
mkdir -p /root/logs

# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status
# Should show: hims-app | online

# View logs
pm2 logs hims-app --lines 20

# Save PM2 config
pm2 save

# Setup PM2 auto-start on boot
pm2 startup
# Copy and run the command it shows (starts with: sudo env PATH=...)

# Test if app is running
curl http://localhost:3000
# Should return HTML content
```

---

### **Step 8: Configure Nginx Reverse Proxy**

```bash
# Create Nginx config
nano /etc/nginx/sites-available/hims
```

**Paste konfigurasi**:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name app.hanmarine.co;
    
    # Temporary: Allow HTTP for initial testing
    # Later will be redirected by certbot
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/hims /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t
# Should show: syntax is ok, test is successful

# Reload Nginx
systemctl reload nginx

# Check Nginx status
systemctl status nginx
# Should show: active (running)
```

**Test akses via browser**:
```
http://app.hanmarine.co
```

✅ Harusnya udah bisa akses login page!

---

### **Step 9: Install SSL Certificate (HTTPS)**

```bash
# Install SSL certificate dengan Let's Encrypt
certbot --nginx -d app.hanmarine.co

# Follow prompts:
# 1. Enter email: your-email@hanmarine.co
# 2. Agree to terms: Y
# 3. Share email with EFF: Y or N (up to you)
# 4. Redirect HTTP to HTTPS: 2 (Yes)
```

**Expected output**:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/app.hanmarine.co/fullchain.pem
Key is saved at: /etc/letsencrypt/live/app.hanmarine.co/privkey.pem
```

```bash
# Test auto-renewal
certbot renew --dry-run
# Should show: Congratulations, all simulated renewals succeeded
```

**Test HTTPS**:
```
https://app.hanmarine.co
```

✅ Sekarang app kamu secured dengan SSL! 🔒

---

### **Step 10: Configure Firewall**

```bash
# Install UFW firewall
apt install -y ufw

# Configure rules
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'

# Enable firewall
ufw enable
# Press Y to confirm

# Check status
ufw status
```

**Expected output**:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

---

## ✅ **VERIFIKASI DEPLOYMENT**

### **1. Check Services**
```bash
# PM2 status
pm2 status
# Should show: hims-app | online

# Nginx status
systemctl status nginx
# Should show: active (running)

# PostgreSQL status
systemctl status postgresql
# Should show: active (running)
```

### **2. Check Logs**
```bash
# Application logs
pm2 logs hims-app --lines 50

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs (should be empty)
tail -f /var/log/nginx/error.log
```

### **3. Test Login**
1. Buka browser: `https://app.hanmarine.co`
2. Login dengan:
   - **Email**: `admin@hanmarine.com`
   - **Password**: `admin123`
3. Harusnya redirect ke `/dashboard` ✅

---

## 🔗 **INTEGRASI DENGAN WEBSITE UTAMA**

### **Tambah Button "Staff Login" di hanmarine.co**

Edit website builder kamu (di cPanel Niagahoster):

1. Login ke **Website Builder**
2. Edit **Homepage** atau **Navigation Menu**
3. Tambah button/link:

**Button Text**: `Staff Login` atau `Login Karyawan`  
**Link URL**: `https://app.hanmarine.co`  
**Target**: `Open in new tab` (optional)

**Styling**: Make it prominent (e.g., warna berbeda, di pojok kanan atas)

---

## 🔐 **OPSI B: DEPLOY KE CLOUD HOSTING NIAGAHOSTER**

### **Persyaratan**:
- ✅ Paket **Bisnis** atau **Enterprise** (support Node.js)
- ✅ SSH access enabled
- ✅ Node.js installed (request ke support kalau belum ada)

### **Steps**:

1. **Request Node.js Installation**
   - Contact Niagahoster support
   - Minta install Node.js 20 LTS
   - Minta install PostgreSQL atau pakai external DB (Supabase/Neon)

2. **Upload via cPanel File Manager**
   - Zip folder `hims-app`
   - Upload via cPanel → File Manager → `public_html/app`
   - Extract zip

3. **Setup via SSH**
```bash
# SSH ke hosting
ssh username@your-cpanel-host

# Navigate to app
cd ~/public_html/app

# Install & build
npm install
npm run build

# Run dengan PM2 atau Node.js background
pm2 start npm --name hims -- start
# OR
nohup npm start &
```

4. **Configure .htaccess** (untuk routing Next.js)
```apache
RewriteEngine On
RewriteRule ^$ http://localhost:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

⚠️ **Note**: Cloud hosting lebih tricky, VPS lebih direkomendasikan!

---

## 🌍 **OPSI C: SUBDOMAIN KE VPS EXTERNAL (BEST VALUE)**

### **Konsep**:
- `hanmarine.co` → Shared hosting Niagahoster (website builder)
- `app.hanmarine.co` → VPS DigitalOcean/Contabo ($4-6/month)

### **Keuntungan**:
✅ Website marketing tetap di Niagahoster (easy manage)  
✅ HIMS app di VPS murah tapi powerful  
✅ Independence: kalau website builder down, app tetap jalan  
✅ Best performance untuk HIMS  

### **Setup DNS di Niagahoster**:

1. cPanel → **Zone Editor**
2. Tambah A Record:
```
Type: A
Host: app.hanmarine.co
Points to: 123.45.67.89 (IP VPS external)
TTL: 14400
```

3. Deploy HIMS ke VPS external (follow Step 3-10 dari Opsi A)

---

## 📊 **PERBANDINGAN OPSI**

| Feature | VPS Niagahoster | Cloud Hosting | VPS External |
|---------|----------------|---------------|--------------|
| **Cost** | $10-15/month | $30-60/month | $4-6/month |
| **Control** | Full | Limited | Full |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Ease Setup** | Medium | Hard | Medium |
| **Node.js Support** | ✅ Native | ⚠️ Limited | ✅ Native |
| **PostgreSQL** | ✅ Full | ⚠️ May need external | ✅ Full |
| **SSL** | ✅ Free (Let's Encrypt) | ✅ Included | ✅ Free |
| **Best For** | All-in-one Niagahoster | Easy manage | Best value |

**Rekomendasi Gue**: **Opsi C** (VPS External + Subdomain) 🏆

---

## 🔄 **AUTOMATED BACKUPS**

### **Database Backup Script**

```bash
# Create backup directory
mkdir -p /root/backups

# Create backup script
nano /root/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="hims_production"
DB_USER="hims_user"
DB_PASS="StrongPassword123!@#"

# Create backup
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/hims_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "hims_*.sql.gz" -mtime +7 -delete

echo "Backup completed: hims_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /root/scripts/backup-db.sh

# Test backup
/root/scripts/backup-db.sh

# Schedule daily backup (2 AM)
crontab -e
# Add line:
0 2 * * * /root/scripts/backup-db.sh >> /root/logs/backup.log 2>&1
```

---

## 📱 **POST-DEPLOYMENT CHECKLIST**

- [ ] ✅ App accessible via `https://app.hanmarine.co`
- [ ] ✅ SSL certificate installed (HTTPS working)
- [ ] ✅ Admin login successful (`admin@hanmarine.com` / `admin123`)
- [ ] ✅ Database migrations applied
- [ ] ✅ PM2 running and auto-restart configured
- [ ] ✅ Nginx reverse proxy working
- [ ] ✅ Firewall configured
- [ ] ✅ Automated backups scheduled
- [ ] ✅ "Staff Login" button added to main website
- [ ] ✅ Change default admin password (CRITICAL!)
- [ ] ✅ Test all major features (CRUD operations)
- [ ] ✅ Test file uploads
- [ ] ✅ Verify ISO 9001 compliance features working

---

## 🆘 **TROUBLESHOOTING**

### **Problem: app.hanmarine.co tidak bisa diakses**

```bash
# Check DNS propagation
ping app.hanmarine.co
dig app.hanmarine.co

# Check Nginx
systemctl status nginx
nginx -t

# Check if app is running
curl http://localhost:3000
pm2 status
```

### **Problem: 502 Bad Gateway**

```bash
# Restart services
pm2 restart hims-app
systemctl restart nginx

# Check logs
pm2 logs hims-app --err
tail -f /var/log/nginx/error.log
```

### **Problem: Database connection failed**

```bash
# Test database connection
psql -h localhost -U hims_user -d hims_production

# Check PostgreSQL status
systemctl status postgresql

# Verify DATABASE_URL in .env
cat /root/hims-app/.env | grep DATABASE_URL
```

### **Problem: SSL certificate error**

```bash
# Check certificate
certbot certificates

# Renew certificate
certbot renew

# Reload Nginx
systemctl reload nginx
```

---

## 📞 **SUPPORT NIAGAHOSTER**

Kalau ada masalah:
- **Live Chat**: https://www.niagahoster.co.id
- **Email**: support@niagahoster.co.id
- **Phone**: 0804-1-808-888
- **Ticket**: Client Area → Support

Request bantuan untuk:
- ✅ Install Node.js di cloud hosting
- ✅ Enable SSH access
- ✅ Database setup assistance
- ✅ DNS configuration help

---

## 🎉 **FINAL RESULT**

Setelah deployment selesai:

```
hanmarine.co              → Website marketing (public)
                            [Staff Login Button] ↓
                            
app.hanmarine.co          → HIMS Application (secure, internal)
                            ├─ Dashboard
                            ├─ Crew Management
                            ├─ Contracts
                            ├─ Compliance
                            ├─ Quality System
                            └─ Reports
```

**Professional, Secure, ISO 9001 Compliant!** ✅

---

**Need help?** Check troubleshooting atau hubungi support Niagahoster! 🚀

---

**END OF NIAGAHOSTER DEPLOYMENT GUIDE**
