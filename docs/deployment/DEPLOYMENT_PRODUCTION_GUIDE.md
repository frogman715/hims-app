# 🚀 PRODUCTION DEPLOYMENT GUIDE - HANMARINE HIMS

**Complete step-by-step guide untuk deploy aplikasi HIMS ke hosting & domain production**

---

## 📋 **TABLE OF CONTENTS**

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Option 1: VPS Deployment (Recommended)](#option-1-vps-deployment-recommended)
3. [Option 2: Vercel Deployment (Quick & Easy)](#option-2-vercel-deployment-quick--easy)
4. [Option 3: AWS/DigitalOcean/Linode](#option-3-awsdigitaloceanlinode)
5. [Database Setup (Production)](#database-setup-production)
6. [Domain Configuration](#domain-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Environment Variables (Production)](#environment-variables-production)
9. [Post-Deployment Tasks](#post-deployment-tasks)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 **PRE-DEPLOYMENT CHECKLIST**

### **1. Build Test (Local)**
```bash
cd /home/docter203/hanmarine_hims/hims-app

# Test production build
npm run build

# Test production mode locally
npm start
```

✅ **Expected Output**: Build successful, no errors

### **2. Database Migration Check**
```bash
# Verify all migrations applied
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

### **3. Environment Variables Check**
```bash
# Copy .env.example to .env.production
cp .env.example .env.production

# Edit production variables
nano .env.production
```

**Required Variables**:
```env
# Database (Production PostgreSQL)
DATABASE_URL="postgresql://user:password@your-db-host:5432/hims_production?schema=public"

# NextAuth (CRITICAL - Generate new secrets!)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="GENERATE_NEW_SECRET_32_CHARS_MINIMUM"

# Encryption (CRITICAL - New key for production!)
HIMS_CRYPTO_KEY="GENERATE_NEW_KEY_32_CHARS_MINIMUM"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### **4. Generate Production Secrets**
```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Generate HIMS_CRYPTO_KEY (32+ characters)
openssl rand -base64 32
```

⚠️ **NEVER use development secrets in production!**

---

## 🖥️ **OPTION 1: VPS DEPLOYMENT (Recommended for Control)**

### **Best For**:
- ✅ Full control over environment
- ✅ Custom configurations
- ✅ Better performance
- ✅ Cost-effective for long-term

### **Recommended Providers**:
1. **DigitalOcean Droplet** - $6/month (1GB RAM, 25GB SSD)
2. **Vultr** - $6/month (1GB RAM, 25GB SSD)
3. **Linode** - $5/month (1GB RAM, 25GB SSD)
4. **AWS Lightsail** - $5/month (512MB RAM, 20GB SSD)
5. **Contabo** - $4/month (4GB RAM, 50GB SSD) - Best value!

---

### **📦 Step 1: Create VPS Server**

**Example: DigitalOcean Droplet**

1. Go to https://www.digitalocean.com
2. Create new Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic $6/month (1GB RAM)
   - **Region**: Singapore (closest to Indonesia)
   - **Authentication**: SSH keys (recommended) or Password
3. Create Droplet → Note your IP address (e.g., `123.45.67.89`)

---

### **🔐 Step 2: Initial Server Setup**

```bash
# SSH into your server
ssh root@123.45.67.89

# Update system
apt update && apt upgrade -y

# Create new user (security best practice)
adduser hanmarine
usermod -aG sudo hanmarine

# Switch to new user
su - hanmarine
```

---

### **📦 Step 3: Install Dependencies**

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version

# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

---

### **🗄️ Step 4: Setup PostgreSQL Database**

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL console:
CREATE DATABASE hims_production;
CREATE USER hanmarine_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE hims_production TO hanmarine_user;
\c hims_production
GRANT ALL ON SCHEMA public TO hanmarine_user;
\q

# Exit postgres user
exit
```

**Test database connection**:
```bash
psql -h localhost -U hanmarine_user -d hims_production
# Enter password when prompted
\q
```

---

### **📂 Step 5: Clone & Setup Application**

```bash
# Create app directory
cd /home/hanmarine
mkdir -p apps
cd apps

# Clone from GitHub (if you have repo)
# git clone https://github.com/your-username/hims-app.git
# OR upload via SFTP/rsync

# For manual upload, on your LOCAL machine:
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /home/docter203/hanmarine_hims/hims-app/ \
  hanmarine@123.45.67.89:/home/hanmarine/apps/hims-app/

# On SERVER, navigate to app
cd /home/hanmarine/apps/hims-app

# Install dependencies
npm install --production

# Setup environment variables
nano .env.production
```

**`.env.production` content**:
```env
# Database (Use your PostgreSQL credentials from Step 4)
DATABASE_URL="postgresql://hanmarine_user:YOUR_STRONG_PASSWORD_HERE@localhost:5432/hims_production?schema=public"

# NextAuth
NEXTAUTH_URL="https://hims.yourdomain.com"
NEXTAUTH_SECRET="YOUR_GENERATED_SECRET_FROM_OPENSSL"

# Encryption
HIMS_CRYPTO_KEY="YOUR_GENERATED_KEY_FROM_OPENSSL"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://hims.yourdomain.com"
```

```bash
# Link environment file
ln -s .env.production .env

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data (admin user)
npm run seed

# Build application
npm run build
```

---

### **🚀 Step 6: Setup PM2 Process Manager**

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**`ecosystem.config.js` content**:
```javascript
module.exports = {
  apps: [{
    name: 'hims-app',
    script: 'npm',
    args: 'start',
    cwd: '/home/hanmarine/apps/hims-app',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/hanmarine/logs/hims-error.log',
    out_file: '/home/hanmarine/logs/hims-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

```bash
# Create logs directory
mkdir -p /home/hanmarine/logs

# Start application with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs hims-app

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it shows

# Test if app is running
curl http://localhost:3000
```

---

### **🌐 Step 7: Configure Nginx Reverse Proxy**

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/hims
```

**Nginx configuration**:
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name hims.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name hims.yourdomain.com;

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/hims.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hims.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Max upload size (for documents)
    client_max_body_size 50M;

    # Proxy to Next.js
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes (no caching)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hims /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

### **🔒 Step 8: Setup SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d hims.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)

# Test automatic renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via cron job
```

---

### **✅ Step 9: Configure Firewall**

```bash
# Install UFW firewall
sudo apt install -y ufw

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

### **🎉 Step 10: Verify Deployment**

```bash
# Check if PM2 is running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check logs
pm2 logs hims-app --lines 50

# Test from browser
# https://hims.yourdomain.com
```

**Expected**: Login page appears with SSL certificate ✅

---

## ☁️ **OPTION 2: VERCEL DEPLOYMENT (Quick & Easy)**

### **Best For**:
- ✅ Quick deployment (5 minutes)
- ✅ Automatic HTTPS
- ✅ Free tier available
- ✅ Zero server management

### **Limitations**:
- ⚠️ Serverless functions (10s timeout on free tier)
- ⚠️ Need external PostgreSQL database

---

### **📦 Step 1: Prepare Database (External)**

**Option A: Supabase (Free PostgreSQL)**
1. Go to https://supabase.com
2. Create new project
3. Copy database connection string

**Option B: Neon (Free PostgreSQL)**
1. Go to https://neon.tech
2. Create new project
3. Copy database connection string

**Option C: Railway (Free PostgreSQL)**
1. Go to https://railway.app
2. Create new project → PostgreSQL
3. Copy database connection string

---

### **📦 Step 2: Deploy to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /home/docter203/hanmarine_hims/hims-app
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name? hims-app
# - Directory? ./
# - Override settings? No
```

---

### **📦 Step 3: Configure Environment Variables**

```bash
# Add environment variables via Vercel dashboard
# OR via CLI:

vercel env add DATABASE_URL
# Paste your PostgreSQL connection string

vercel env add NEXTAUTH_URL
# Enter: https://your-project.vercel.app

vercel env add NEXTAUTH_SECRET
# Enter: your generated secret

vercel env add HIMS_CRYPTO_KEY
# Enter: your generated key

# Redeploy with new variables
vercel --prod
```

---

### **📦 Step 4: Run Database Migrations**

```bash
# On your LOCAL machine with Vercel DB connection
DATABASE_URL="your-vercel-db-url" npx prisma migrate deploy

# Seed admin user
DATABASE_URL="your-vercel-db-url" npm run seed
```

---

### **📦 Step 5: Add Custom Domain (Optional)**

1. Go to Vercel dashboard → Settings → Domains
2. Add your domain: `hims.yourdomain.com`
3. Configure DNS (see Domain Configuration below)

---

## 🌐 **DOMAIN CONFIGURATION**

### **Option 1: Point to VPS IP**

**DNS Records at your domain registrar** (e.g., Cloudflare, Namecheap):

```
Type    Name    Value               TTL
A       hims    123.45.67.89        Auto
AAAA    hims    your:ipv6:address   Auto (if you have IPv6)
```

### **Option 2: Point to Vercel**

**DNS Records**:

```
Type    Name    Value                       TTL
CNAME   hims    cname.vercel-dns.com        Auto
```

**Wait for DNS propagation** (5-30 minutes)

Test DNS:
```bash
dig hims.yourdomain.com
nslookup hims.yourdomain.com
```

---

## 🔒 **SSL CERTIFICATE SETUP**

### **VPS (Let's Encrypt - Free)**
Already covered in Step 8 above using Certbot.

### **Vercel (Automatic)**
SSL certificate automatically provided by Vercel.

### **Cloudflare (Recommended for VPS)**

**Benefits**:
- ✅ Free SSL
- ✅ CDN caching
- ✅ DDoS protection
- ✅ Better performance

**Setup**:
1. Add site to Cloudflare
2. Change nameservers at your registrar
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"

---

## 🔐 **ENVIRONMENT VARIABLES (Production)**

### **Complete `.env.production` Template**

```env
# ====================
# DATABASE
# ====================
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# ====================
# NEXTAUTH
# ====================
NEXTAUTH_URL="https://hims.yourdomain.com"
NEXTAUTH_SECRET="YOUR_SUPER_SECRET_MINIMUM_32_CHARS"

# ====================
# ENCRYPTION
# ====================
HIMS_CRYPTO_KEY="YOUR_ENCRYPTION_KEY_32_CHARS_MINIMUM"

# ====================
# APPLICATION
# ====================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://hims.yourdomain.com"

# ====================
# OPTIONAL: Email (for notifications)
# ====================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="HANMARINE HIMS <noreply@yourdomain.com>"

# ====================
# OPTIONAL: File Storage (if using cloud storage)
# ====================
# AWS_ACCESS_KEY_ID="your-key"
# AWS_SECRET_ACCESS_KEY="your-secret"
# AWS_REGION="ap-southeast-1"
# AWS_S3_BUCKET="hims-documents"

# ====================
# OPTIONAL: Monitoring
# ====================
# SENTRY_DSN="https://your-sentry-dsn"
# GOOGLE_ANALYTICS_ID="UA-XXXXXXXXX-X"
```

---

## ✅ **POST-DEPLOYMENT TASKS**

### **1. Database Backup Setup**

```bash
# Create backup script
nano /home/hanmarine/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/hanmarine/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="hims_production"
DB_USER="hanmarine_user"

mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD="YOUR_DB_PASSWORD" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/hims_backup_$TIMESTAMP.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "hims_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: hims_backup_$TIMESTAMP.sql.gz"
```

```bash
# Make executable
chmod +x /home/hanmarine/scripts/backup-db.sh

# Test backup
/home/hanmarine/scripts/backup-db.sh

# Setup daily cron job
crontab -e

# Add line (daily at 2 AM):
0 2 * * * /home/hanmarine/scripts/backup-db.sh >> /home/hanmarine/logs/backup.log 2>&1
```

---

### **2. Setup Monitoring**

```bash
# Install monitoring tools
sudo npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Create uptime monitor script**:
```bash
nano /home/hanmarine/scripts/health-check.sh
```

```bash
#!/bin/bash
URL="https://hims.yourdomain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -ne 200 ]; then
    echo "Site is DOWN! Response code: $RESPONSE"
    pm2 restart hims-app
    echo "Restarted application at $(date)" >> /home/hanmarine/logs/restart.log
else
    echo "Site is UP ($(date))"
fi
```

```bash
chmod +x /home/hanmarine/scripts/health-check.sh

# Add to crontab (every 5 minutes)
crontab -e
*/5 * * * * /home/hanmarine/scripts/health-check.sh >> /home/hanmarine/logs/health.log 2>&1
```

---

### **3. Setup Email Notifications (Optional)**

Install email notification for critical errors:

```bash
# Install mailutils
sudo apt install -y mailutils

# Test email
echo "Test email from HIMS" | mail -s "Test" your-email@gmail.com
```

---

### **4. Security Hardening**

```bash
# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Change: PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd

# Install fail2ban (brute force protection)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure fail2ban for nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
```

```bash
sudo systemctl restart fail2ban
```

---

## 📊 **MONITORING & MAINTENANCE**

### **Daily Checks**

```bash
# Check application status
pm2 status

# Check logs for errors
pm2 logs hims-app --lines 100 | grep -i error

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check database size
sudo -u postgres psql -c "SELECT pg_database_size('hims_production') / (1024*1024) AS size_mb;"

# Check disk space
df -h

# Check memory usage
free -h
```

### **Weekly Tasks**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean old logs
pm2 flush

# Verify backups
ls -lh /home/hanmarine/backups/

# Check SSL certificate expiry
sudo certbot certificates
```

### **Monthly Tasks**

```bash
# Update Node.js packages (test first!)
cd /home/hanmarine/apps/hims-app
npm outdated
# Review and update if needed

# Database vacuum (optimize)
sudo -u postgres psql hims_production -c "VACUUM ANALYZE;"

# Review security updates
sudo apt list --upgradable
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: Application not starting**

```bash
# Check PM2 logs
pm2 logs hims-app --err

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart application
pm2 restart hims-app

# If still failing, rebuild
cd /home/hanmarine/apps/hims-app
npm run build
pm2 restart hims-app
```

---

### **Problem: Database connection failed**

```bash
# Test PostgreSQL connection
psql -h localhost -U hanmarine_user -d hims_production

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check DATABASE_URL in .env
cat /home/hanmarine/apps/hims-app/.env | grep DATABASE_URL
```

---

### **Problem: Nginx 502 Bad Gateway**

```bash
# Check if Next.js is running
curl http://localhost:3000

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart hims-app
sudo systemctl restart nginx
```

---

### **Problem: SSL certificate issues**

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### **Problem: Out of memory**

```bash
# Check memory usage
free -h

# Check PM2 memory usage
pm2 monit

# Restart application to clear memory
pm2 restart hims-app

# Consider upgrading server if persistent
```

---

## 📋 **DEPLOYMENT CHECKLIST**

Before going live, verify:

- [ ] ✅ Database migrations applied successfully
- [ ] ✅ Admin user seeded and can login
- [ ] ✅ All environment variables configured
- [ ] ✅ Production secrets generated (NOT using dev secrets)
- [ ] ✅ SSL certificate installed and working
- [ ] ✅ Domain pointing to correct IP/server
- [ ] ✅ Firewall configured
- [ ] ✅ PM2 running and configured to start on boot
- [ ] ✅ Nginx reverse proxy configured
- [ ] ✅ Database backups automated
- [ ] ✅ Log rotation configured
- [ ] ✅ Monitoring/health checks setup
- [ ] ✅ Email notifications configured (optional)
- [ ] ✅ Test all major features (login, CRUD operations)
- [ ] ✅ Test file uploads (if applicable)
- [ ] ✅ Test email sending (if applicable)
- [ ] ✅ Verify ISO 9001 & MLC compliance features working

---

## 🎯 **RECOMMENDED SETUP (Most Common)**

**For Indonesian maritime company like HANMARINE:**

1. **Hosting**: Contabo VPS ($4/month, 4GB RAM) or DigitalOcean ($6/month, 1GB RAM)
2. **Database**: PostgreSQL on same VPS
3. **Domain**: Register at Cloudflare or Namecheap
4. **CDN/Protection**: Cloudflare (free tier)
5. **SSL**: Let's Encrypt via Certbot (free)
6. **Monitoring**: UptimeRobot (free) + PM2 built-in monitoring

**Total Cost**: ~$5-10/month

---

## 📞 **SUPPORT & RESOURCES**

### **Documentation**
- Next.js: https://nextjs.org/docs/deployment
- PM2: https://pm2.keymetrics.io/docs/usage/quick-start/
- Nginx: https://nginx.org/en/docs/
- PostgreSQL: https://www.postgresql.org/docs/

### **Community**
- Next.js Discord: https://nextjs.org/discord
- DigitalOcean Community: https://www.digitalocean.com/community

---

## 🎉 **FINAL NOTES**

**Congrats bro!** 🎊 Setelah deploy, aplikasi HIMS kamu bakal:

✅ Accessible dari internet via domain  
✅ Secured dengan SSL certificate (HTTPS)  
✅ Running 24/7 dengan auto-restart  
✅ Database backups automated  
✅ Monitoring & alerts setup  
✅ Production-ready untuk ISO 9001 certification  

**Need help?** Check troubleshooting section atau review logs:
```bash
pm2 logs hims-app
sudo tail -f /var/log/nginx/error.log
```

**Good luck with deployment!** 🚀🌊⚓

---

**END OF DEPLOYMENT GUIDE**
