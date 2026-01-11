# 🚀 PRODUCTION DEPLOYMENT GUIDE - HIMS

**Hanmarine Integrated Management System (HIMS)**  
Complete production deployment guide for VPS/Cloud deployment

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Server Requirements](#server-requirements)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Configuration Details](#configuration-details)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Rollback Procedures](#rollback-procedures)

---

## 🎯 OVERVIEW

This guide covers deploying HIMS to a production VPS/Cloud server with:
- **Node.js v24.12.0** (or v20.x LTS)
- **Next.js 15.5.9** (standalone mode)
- **PostgreSQL 16** (or 15.x)
- **PM2** (process manager)
- **Nginx** (reverse proxy)
- **Let's Encrypt SSL** (HTTPS)

**Production URL**: `https://app.hanmarine.co`  
**Architecture**: Next.js standalone + PM2 + Nginx + PostgreSQL

---

## ✅ PREREQUISITES

### Required Knowledge
- Basic Linux command line
- SSH access to VPS
- Domain DNS management
- Basic Nginx configuration

### Required Credentials
- **VPS/Server SSH access** (root or sudo user)
- **Domain control** (for DNS and SSL)
- **GitHub access** (to pull repository)
- **Database credentials** (PostgreSQL)

### Local Development
Before deploying, ensure the app builds successfully locally:

```bash
# Clone repository
git clone https://github.com/frogman715/hims-app.git
cd hims-app

# Install dependencies
npm install

# Build application
npm run build

# Test production mode locally
npm start
```

✅ If build succeeds locally, you're ready to deploy.

---

## 🖥️ SERVER REQUIREMENTS

### Minimum Specifications
- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 40 GB SSD
- **OS**: Ubuntu 22.04 LTS (or 20.04 LTS)
- **Network**: Static IP address

### Required Software
- **Node.js**: v24.12.0 or v20.x LTS
- **PostgreSQL**: v16 or v15
- **Nginx**: Latest stable
- **PM2**: Latest version
- **Git**: Latest version
- **Certbot**: For Let's Encrypt SSL

---

## 📝 PRE-DEPLOYMENT CHECKLIST

### 1. Server Access
- [ ] SSH access confirmed
- [ ] Root or sudo privileges available
- [ ] Firewall ports configured (22, 80, 443, 5432)

### 2. Domain Configuration
- [ ] Domain registered and accessible
- [ ] DNS A record points to server IP
- [ ] DNS propagated (check with `nslookup app.hanmarine.co`)

### 3. Required Files
- [ ] `.env.production.example` reviewed
- [ ] All environment variables prepared
- [ ] Database credentials ready
- [ ] Email service credentials ready (if using email)

### 4. Security Preparations
- [ ] Generate NEXTAUTH_SECRET (32+ chars)
- [ ] Generate HIMS_CRYPTO_KEY (32+ chars)
- [ ] Generate SCHEDULER_SECRET_TOKEN (32+ chars)
- [ ] Database password is strong (16+ chars)

**Generate secure secrets:**
```bash
# Generate secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For HIMS_CRYPTO_KEY
openssl rand -base64 32  # For SCHEDULER_SECRET_TOKEN
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### Step 1: Initial Server Setup

#### 1.1 Connect to Server
```bash
ssh root@your-server-ip
# or
ssh your-user@your-server-ip
```

#### 1.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.3 Install Required Software
```bash
# Install Node.js 20.x LTS (or use nvm for v24.12.0)
# For security, download and inspect the script first:
curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
# Review the script content if needed: less /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs

# Verify Node.js version
node --version  # Should be v20.x or higher

# Install PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Database Setup

#### 2.1 Create PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL:
CREATE DATABASE hims_prod;
CREATE USER hims_prod_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE hims_prod TO hims_prod_user;

# Grant schema permissions (PostgreSQL 15+)
\c hims_prod
GRANT ALL ON SCHEMA public TO hims_prod_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hims_prod_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hims_prod_user;

# Exit PostgreSQL
\q
```

#### 2.2 Configure PostgreSQL for Remote Access (if needed)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Find and change:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add at the end:
local   all             hims_prod_user                          md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 2.3 Test Database Connection
```bash
psql -U hims_prod_user -d hims_prod -h localhost
# Enter password when prompted
# If successful, you'll see: hims_prod=>
\q  # to exit
```

### Step 3: Application Setup

#### 3.1 Create Application Directory
```bash
# Create directory
sudo mkdir -p /var/www/hims-app
sudo chown -R $USER:$USER /var/www/hims-app
cd /var/www/hims-app
```

#### 3.2 Clone Repository
```bash
# Clone from GitHub
git clone https://github.com/frogman715/hims-app.git .

# Checkout production branch (if exists)
# git checkout production
```

#### 3.3 Create Production Environment File
```bash
# Copy example file
cp .env.production.example .env.production

# Edit with your credentials
nano .env.production
```

**Required Variables** (see `.env.production.example` for full list):
```env
NODE_ENV=production
DATABASE_URL="postgresql://hims_prod_user:your_password@localhost:5432/hims_prod?schema=public"
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="https://app.hanmarine.co"
HIMS_CRYPTO_KEY="your-32-char-crypto-key"

# Company info
COMPANY_NAME="PT Hanmarine Mandiri Nusantara"
COMPANY_EMAIL="info@hanmarine.co"
# ... (other variables)
```

Save and exit (Ctrl+X, Y, Enter)

#### 3.4 Install Dependencies & Build
```bash
# Install production dependencies (this may take 5-10 minutes)
# Using npm ci for reproducible builds
npm ci --omit=dev

# Build application
npm run build

# Generate Prisma client
npx prisma generate
```

**Note**: If SSH times out during `npm ci`, use `screen`:
```bash
# Start screen session
screen -S build

# Run commands inside screen
npm ci --omit=dev
npm run build
npx prisma generate

# Detach from screen: Ctrl+A, then D
# Reattach later: screen -r build
```

#### 3.5 Run Database Migrations
```bash
# Apply all migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

#### 3.6 Seed Initial Data (Optional)
```bash
# Seed admin user and initial data
npm run seed
```

**Default Admin Credentials**:
- Email: `admin@hanmarine.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change admin password immediately after first login!

### Step 4: PM2 Configuration

#### 4.1 Verify PM2 Ecosystem Config
The repository includes `ecosystem.config.js` which uses `/deploy/config/pm2/ecosystem.config.js`.

Verify the configuration:
```bash
cat deploy/config/pm2/ecosystem.config.js
```

Should contain:
```javascript
module.exports = {
  apps: [
    {
      name: "hims-app",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: "/var/www/hims-app",
      env_file: "/var/www/hims-app/.env.production",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

#### 4.2 Start Application with PM2
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the instructions (copy-paste the command shown)

# Verify app is running
pm2 status
pm2 logs hims-app --lines 50
```

✅ You should see: `✓ Ready in X ms` in the logs

#### 4.3 Test Application Locally
```bash
# Test if app responds
curl http://localhost:3000/api/health

# Should return: {"status":"ok"}
```

### Step 5: Nginx Configuration

#### 5.1 Copy Nginx Configuration
```bash
# Copy provided nginx config
sudo cp nginx.conf /etc/nginx/sites-available/hims-app

# Or manually create it
sudo nano /etc/nginx/sites-available/hims-app
# Paste contents from nginx.conf in repository
```

#### 5.2 Update Server Name
```bash
# Edit the config
sudo nano /etc/nginx/sites-available/hims-app

# Ensure server_name matches your domain:
server_name app.hanmarine.co;
```

#### 5.3 Enable Site
```bash
# Create symbolic link
sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/hims-app

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

#### 5.4 Test HTTP Access
```bash
# From server
curl http://localhost

# From your computer
curl http://app.hanmarine.co
# or visit in browser: http://app.hanmarine.co
```

### Step 6: SSL Certificate Setup

#### 6.1 Install SSL Certificate with Certbot
```bash
# Obtain SSL certificate
sudo certbot --nginx -d app.hanmarine.co

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

✅ Certbot will automatically:
- Obtain SSL certificate from Let's Encrypt
- Update Nginx configuration
- Configure auto-renewal

#### 6.2 Test HTTPS
```bash
# Test HTTPS access
curl https://app.hanmarine.co/api/health

# Should return: {"status":"ok"}
```

#### 6.3 Verify Auto-Renewal
```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# View renewal timer
sudo systemctl status certbot.timer
```

### Step 7: Firewall Configuration

#### 7.1 Configure UFW Firewall
```bash
# Install UFW (if not installed)
sudo apt install -y ufw

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 8: Final Verification

#### 8.1 Service Status Check
```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql

# Check disk space
df -h

# Check memory
free -h
```

#### 8.2 Application Health Check
```bash
# Test API
curl https://app.hanmarine.co/api/health

# Test login page
curl -I https://app.hanmarine.co/auth/signin

# View application logs
pm2 logs hims-app --lines 100
```

#### 8.3 Browser Testing
1. Open browser and navigate to: `https://app.hanmarine.co`
2. Verify SSL certificate is valid (padlock icon)
3. Login with admin credentials
4. Test key features:
   - Dashboard loads
   - Crew management
   - Contract creation
   - Document upload

---

## ⚙️ CONFIGURATION DETAILS

### Environment Variables

All environment variables are documented in `.env.production.example`.

**Critical Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: JWT encryption key (min 32 chars)
- `NEXTAUTH_URL`: Production URL (https://app.hanmarine.co)
- `HIMS_CRYPTO_KEY`: AES-256-GCM encryption key (min 32 chars)

### PM2 Process Management

```bash
# Start application
pm2 start ecosystem.config.js

# Stop application
pm2 stop hims-app

# Restart application
pm2 restart hims-app

# Reload application (zero-downtime)
pm2 reload hims-app

# View logs
pm2 logs hims-app

# Monitor resources
pm2 monit

# Delete process
pm2 delete hims-app

# Save process list
pm2 save
```

### Nginx Configuration

The included `nginx.conf` provides:
- HTTP to HTTPS redirect
- SSL/TLS configuration
- Security headers
- Gzip compression
- Static file caching
- Reverse proxy to Node.js
- Request buffering

**Key Locations**:
- Config: `/etc/nginx/sites-available/hims-app`
- Logs: `/var/log/nginx/hims-app-*.log`

```bash
# Test config
sudo nginx -t

# Reload config
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/hims-app-error.log
sudo tail -f /var/log/nginx/hims-app-access.log
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Security Checklist
- [ ] HTTPS is working (SSL certificate valid)
- [ ] HTTP redirects to HTTPS
- [ ] Security headers present (check with curl -I)
- [ ] Default admin password changed
- [ ] Database password is strong
- [ ] Firewall is enabled and configured
- [ ] Only necessary ports are open (22, 80, 443)
- [ ] SSH key authentication enabled (password auth disabled)
- [ ] .env.production has correct permissions (600)

### Functionality Checklist
- [ ] Application loads at https://app.hanmarine.co
- [ ] Login page accessible
- [ ] Admin can login
- [ ] Dashboard displays correctly
- [ ] API endpoints respond
- [ ] Database connection working
- [ ] Crew management functions
- [ ] Contract creation works
- [ ] Document upload works
- [ ] All modules accessible based on roles

### Performance Checklist
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks (pm2 monit)
- [ ] Database queries optimized
- [ ] Static assets cached properly

---

## 🔒 SECURITY HARDENING

### 1. File Permissions
```bash
# Set correct ownership
sudo chown -R $USER:$USER /var/www/hims-app

# Protect environment file
chmod 600 /var/www/hims-app/.env.production

# Protect uploads directory
chmod 755 /var/www/hims-app/public/uploads
```

### 2. SSH Security
```bash
# Disable password authentication (use keys only)
sudo nano /etc/ssh/sshd_config

# Set:
PasswordAuthentication no
PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### 3. PostgreSQL Security
```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Ensure only local connections:
local   all             hims_prod_user                          md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 4. Nginx Security Headers
Already configured in `nginx.conf`:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Permissions-Policy`

### 5. Rate Limiting (Optional)
Uncomment rate limiting sections in `nginx.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

---

## 📊 MONITORING & MAINTENANCE

### Daily Monitoring
```bash
# Check PM2 status
pm2 status

# Check system resources
htop  # or top

# Check disk space
df -h

# Check application logs
pm2 logs hims-app --lines 50
```

### Weekly Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean package cache
sudo apt autoremove -y
sudo apt clean

# Rotate PM2 logs
pm2 flush

# Check Nginx logs for errors
sudo tail -100 /var/log/nginx/hims-app-error.log
```

### Monthly Tasks
```bash
# Backup database
pg_dump -U hims_prod_user -h localhost hims_prod > backup_$(date +%Y%m%d).sql

# Review SSL certificate expiry
sudo certbot certificates

# Review application performance
pm2 monit

# Update Node.js dependencies (carefully)
npm outdated
```

### Automated Backups

Create backup script:
```bash
sudo nano /usr/local/bin/backup-hims.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/hims"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U hims_prod_user -h localhost hims_prod | gzip > $BACKUP_DIR/hims_db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/hims_uploads_$DATE.tar.gz /var/www/hims-app/public/uploads

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-hims.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-hims.sh >> /var/log/hims-backup.log 2>&1
```

---

## 🔧 TROUBLESHOOTING

### Application Won't Start

**Symptom**: PM2 shows app crashed or errored

**Diagnosis**:
```bash
pm2 logs hims-app --lines 100
```

**Common Causes**:
1. Environment variables missing
   - Check `.env.production` exists and has all required variables
   - Verify: `cat .env.production | grep -E "NEXTAUTH_SECRET|DATABASE_URL|HIMS_CRYPTO_KEY"`

2. Database connection failed
   - Test connection: `psql -U hims_prod_user -d hims_prod -h localhost`
   - Check DATABASE_URL format

3. Build artifacts missing
   - Rebuild: `npm run build`
   - Check `.next/standalone/server.js` exists

4. Port 3000 already in use
   - Check: `sudo lsof -i :3000`
   - Kill process or change port in ecosystem.config.js

### Nginx 502 Bad Gateway

**Symptom**: Browser shows 502 error

**Diagnosis**:
```bash
sudo tail -100 /var/log/nginx/hims-app-error.log
pm2 status
```

**Common Causes**:
1. Application not running
   - Start: `pm2 start ecosystem.config.js`

2. Wrong port in nginx config
   - Check nginx.conf has `proxy_pass http://127.0.0.1:3000;`

3. Firewall blocking internal connection
   - Allow: `sudo ufw allow 3000/tcp`

### Database Connection Errors

**Symptom**: Application logs show database connection errors

**Diagnosis**:
```bash
pm2 logs hims-app | grep -i database
sudo systemctl status postgresql
```

**Common Causes**:
1. PostgreSQL not running
   - Start: `sudo systemctl start postgresql`

2. Wrong credentials
   - Verify DATABASE_URL in .env.production

3. Database doesn't exist
   - Create: `sudo -u postgres createdb hims_prod`

4. Migrations not applied
   - Apply: `npx prisma migrate deploy`

### SSL Certificate Issues

**Symptom**: Browser shows certificate error

**Diagnosis**:
```bash
sudo certbot certificates
```

**Solutions**:
```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Re-obtain certificate
sudo certbot --nginx -d app.hanmarine.co
```

### High Memory Usage

**Symptom**: Server slowing down, PM2 shows high memory

**Diagnosis**:
```bash
pm2 monit
free -h
```

**Solutions**:
```bash
# Restart application
pm2 restart hims-app

# Clear PM2 logs
pm2 flush

# Increase server RAM if needed

# Enable Node.js memory limit
# Edit ecosystem.config.js, add:
# node_args: "--max-old-space-size=2048"
```

---

## ⏮️ ROLLBACK PROCEDURES

### Rollback to Previous Version

#### 1. Using Git
```bash
cd /var/www/hims-app

# View commit history
git log --oneline -10

# Rollback to previous commit
git reset --hard HEAD~1  # or specific commit hash

# Rebuild
npm install
npm run build
npx prisma generate

# Restart application
pm2 restart hims-app
```

#### 2. Using PM2 Ecosystem File
Keep old builds:
```bash
# Before deploying new version
cp -r /var/www/hims-app /var/www/hims-app-backup-$(date +%Y%m%d)

# If rollback needed
rm -rf /var/www/hims-app
mv /var/www/hims-app-backup-YYYYMMDD /var/www/hims-app
pm2 restart hims-app
```

### Database Rollback

#### 1. Restore from Backup
```bash
# Stop application
pm2 stop hims-app

# Drop and recreate database
sudo -u postgres psql
DROP DATABASE hims_prod;
CREATE DATABASE hims_prod;
GRANT ALL PRIVILEGES ON DATABASE hims_prod TO hims_prod_user;
\q

# Restore backup
gunzip < /var/backups/hims/hims_db_YYYYMMDD_HHMMSS.sql.gz | psql -U hims_prod_user -h localhost hims_prod

# Restart application
pm2 restart hims-app
```

#### 2. Rollback Migration
```bash
# View migration history
npx prisma migrate status

# Revert last migration (DANGEROUS - data loss possible)
# This requires manual SQL or migration rollback
# Contact developer for safe rollback procedures
```

---

## 📞 SUPPORT & CONTACTS

### Documentation
- **Repository**: https://github.com/frogman715/hims-app
- **Issues**: https://github.com/frogman715/hims-app/issues
- **Deployment Docs**: `/docs/deployment/`

### Logs Location
- **Application**: `pm2 logs hims-app`
- **Nginx Access**: `/var/log/nginx/hims-app-access.log`
- **Nginx Error**: `/var/log/nginx/hims-app-error.log`
- **PostgreSQL**: `/var/log/postgresql/postgresql-16-main.log`
- **System**: `/var/log/syslog`

### Quick Commands Reference
```bash
# Application
pm2 status
pm2 logs hims-app
pm2 restart hims-app

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/hims-app-error.log

# Database
sudo systemctl status postgresql
psql -U hims_prod_user -d hims_prod -h localhost

# SSL
sudo certbot certificates
sudo certbot renew

# System
df -h        # Disk space
free -h      # Memory
top          # Processes
```

---

## ✅ DEPLOYMENT COMPLETE

After completing this guide, you should have:
- ✅ HIMS application running at https://app.hanmarine.co
- ✅ PM2 managing the application process
- ✅ Nginx reverse proxy with SSL
- ✅ PostgreSQL database configured
- ✅ Automated SSL renewal
- ✅ Automated backups (if configured)
- ✅ Monitoring tools in place
- ✅ Security hardening applied

**Next Steps**:
1. Review [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for final verification
2. Train users on the system
3. Set up monitoring and alerting
4. Plan regular maintenance schedule
5. Review and update company information in settings

---

**Document Version**: 1.0  
**Last Updated**: January 11, 2026  
**Maintained by**: HIMS Development Team
