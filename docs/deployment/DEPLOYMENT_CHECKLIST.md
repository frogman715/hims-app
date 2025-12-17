# 🚀 HANMARINE HIMS - DEPLOYMENT CHECKLIST

## ✅ Pre-Deployment Checklist

### 1. Informasi Hosting yang Dibutuhkan
Tolong berikan informasi berikut:

- [ ] **Domain**: Nama domain (contoh: hims.hanmarine.com)
- [ ] **Hosting Type**: 
  - [ ] VPS/Cloud (DigitalOcean, AWS, Google Cloud, Azure)
  - [ ] Shared Hosting (cPanel)
  - [ ] Dedicated Server
- [ ] **Server Access**:
  - [ ] SSH Username & Password/Key
  - [ ] Server IP Address
  - [ ] Port (default 22)
- [ ] **Database**:
  - [ ] PostgreSQL installed? (required)
  - [ ] Database credentials (host, port, username, password)
  - [ ] Database name

---

## 🔧 Deployment Options

### Option A: VPS/Cloud Server (Recommended)
**Best for**: Production-grade deployment dengan full control

**Requirements:**
- Node.js 18+ installed
- PostgreSQL 16+ installed
- Nginx or Apache for reverse proxy
- SSL Certificate (Let's Encrypt)
- PM2 for process management

**Steps:**
1. Clone repository ke server
2. Install dependencies
3. Setup PostgreSQL database
4. Configure environment variables
5. Build production bundle
6. Setup Nginx reverse proxy
7. Install SSL certificate
8. Start with PM2

---

### Option B: Docker Deployment (Easiest)
**Best for**: Consistent environment, easy updates

**Requirements:**
- Docker installed
- Docker Compose installed

**Steps:**
1. Copy Dockerfile & docker-compose.yml
2. Configure environment variables
3. Run `docker-compose up -d`

---

### Option C: Vercel/Railway (Quick Deploy)
**Best for**: Quick testing, automatic deployments

**Requirements:**
- GitHub account
- External PostgreSQL database (Supabase/Neon)

**Steps:**
1. Push code to GitHub
2. Connect to Vercel/Railway
3. Add environment variables
4. Deploy

---

## 📋 Environment Variables Required

Buat file `.env.production`:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Encryption
HIMS_CRYPTO_KEY="minimum-32-characters-random-string"

# Node Environment
NODE_ENV="production"
```

Generate secrets:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate HIMS_CRYPTO_KEY
openssl rand -base64 32
```

---

## 🔐 Security Checklist

- [ ] Change default admin password from `admin123`
- [ ] Use strong NEXTAUTH_SECRET (32+ chars)
- [ ] Use strong HIMS_CRYPTO_KEY (32+ chars)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure firewall (only open ports 80, 443, 22)
- [ ] Setup database backups (daily recommended)
- [ ] Configure rate limiting on API routes
- [ ] Review CORS settings
- [ ] Enable audit logging
- [ ] Setup monitoring (Uptime, Performance)

---

## 📦 Build Production Bundle

```bash
# Install dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build Next.js production bundle
npm run build

# Start production server
npm start
```

---

## 🐳 Docker Deployment (Quick Start)

### 1. Build Docker Image
```bash
docker build -t hanmarine-hims:latest .
```

### 2. Run with Docker Compose
```bash
# Start services (app + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Database Setup
```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed initial data
docker-compose exec app npm run seed
```

---

## 🌐 Nginx Configuration (VPS Deployment)

Create `/etc/nginx/sites-available/hims`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/hims /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 🔄 PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "hims" -- start

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup

# Monitor application
pm2 monit

# View logs
pm2 logs hims

# Restart application
pm2 restart hims
```

---

## 📊 Post-Deployment Verification

### 1. Health Checks
- [ ] Application accessible via domain
- [ ] HTTPS working (green lock icon)
- [ ] Login working with admin@hanmarine.com
- [ ] Database connection successful
- [ ] All routes accessible

### 2. Test Critical Features
- [ ] User authentication (login/logout)
- [ ] Dashboard loads with data
- [ ] Crew management CRUD operations
- [ ] Document management & filters
- [ ] Contract creation
- [ ] Compliance tracking
- [ ] Role-based access control

### 3. Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database query optimization
- [ ] Static assets cached properly

### 4. Monitoring Setup
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error logging (Sentry)
- [ ] Setup performance monitoring (New Relic, DataDog)
- [ ] Configure database backups

---

## 🆘 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Verify DATABASE_URL format
echo $DATABASE_URL
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### SSL Certificate Issues
```bash
# Verify certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal
```

---

## 📞 Support

Jika ada masalah deployment, check:
1. Server logs: `pm2 logs hims` or `docker-compose logs -f`
2. Application logs: `.next/server.log`
3. Database logs: `sudo journalctl -u postgresql`
4. Nginx logs: `/var/log/nginx/error.log`

---

## 🎯 Next Steps

Setelah deployment berhasil:

1. **Setup Backups**:
   - Database: Daily PostgreSQL dumps
   - Files: Weekly server snapshots
   - Off-site backup storage

2. **Configure Monitoring**:
   - Uptime monitoring
   - Performance tracking
   - Error alerting
   - Resource usage monitoring

3. **Team Training**:
   - User manual: `HANMARINE_HIMS_USER_MANUAL.md`
   - Operator guide: `HANMARINE_HIMS_OPERATOR_GUIDE.md`
   - Admin manual: `HANMARINE_HIMS_ADMIN_MANUAL.md`

4. **Data Migration**:
   - Import existing crew data
   - Import vessel information
   - Import contract history
   - Import documents

---

## 📝 Berikan Informasi Berikut untuk Deploy:

1. **Domain**: _______________________
2. **Hosting Provider**: _______________________
3. **Server IP**: _______________________
4. **SSH Access**: username@ip:port
5. **PostgreSQL Installed**: Yes / No
6. **Preferred Deployment Method**: VPS / Docker / Vercel

Dengan informasi di atas, saya bisa bantu deploy langsung! 🚀
