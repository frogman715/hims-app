# 🚀 VPS Production Deployment Guide

## Complete step-by-step guide for deploying HIMS to a VPS

---

## 📋 Prerequisites

- VPS with Ubuntu 22.04 LTS (minimum 4GB RAM, 2 CPU cores, 40GB storage)
- Root or sudo access
- Domain name pointed to VPS IP address
- SSH access configured

---

## 🔧 Step 1: Server Preparation

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Required Software

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version  # Should be v20.x or higher
npm --version   # Should be v10.x or higher

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git

# Install build essentials
sudo apt install -y build-essential
```

---

## 👤 Step 2: Create Application User

```bash
# Create hanmarine user
sudo useradd -m -s /bin/bash hanmarine

# Set password
sudo passwd hanmarine

# Add to sudo group (optional)
sudo usermod -aG sudo hanmarine
```

---

## 🗄️ Step 3: Database Setup

### 3.1 Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE DATABASE hims_prod;
CREATE USER hims_prod_user WITH ENCRYPTED PASSWORD 'REPLACE_WITH_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE hims_prod TO hims_prod_user;
\q
```

### 3.2 Update PostgreSQL Configuration (if needed)

```bash
# Edit pg_hba.conf to allow local connections
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Ensure this line exists:
# local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3.3 Test Database Connection

```bash
psql -h localhost -U hims_prod_user -d hims_prod
# Enter password when prompted
# Type \q to exit
```

---

## 📦 Step 4: Application Deployment

### 4.1 Clone Repository

```bash
# Switch to hanmarine user
sudo su - hanmarine

# Clone repository
cd /home/hanmarine
git clone https://github.com/frogman715/hims-app.git
cd hims-app
```

### 4.2 Install Dependencies

```bash
npm install --production=false
```

### 4.3 Configure Environment Variables

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your credentials
nano .env.production
```

**Required environment variables:**

```bash
# Database
DATABASE_URL="postgresql://hims_prod_user:REPLACE_WITH_SECURE_PASSWORD@localhost:5432/hims_prod?schema=public"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="<32+ character secret>"
NEXTAUTH_URL="https://app.hanmarine.co"

# Encryption (generate with: openssl rand -base64 32)
HIMS_CRYPTO_KEY="<32+ character key>"

# Server Actions (generate with: openssl rand -base64 32)
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="<32+ character key>"

# Node Environment
NODE_ENV=production
```

### 4.4 Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Note: In Prisma 7, DATABASE_URL is read from environment by the adapter pattern
# The schema.prisma file does NOT contain url property - this is expected behavior
```

### 4.5 Seed Initial Data

```bash
# Create initial admin user
npm run seed
```

**⚠️ CRITICAL SECURITY WARNING:**

Default credentials created:
- **Email:** `admin@hanmarine.com`
- **Password:** `admin123`

**YOU MUST CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

Failure to change the default password is a critical security vulnerability that could compromise your entire system.

### 4.6 Build Application

```bash
npm run build
```

This creates a standalone production build in `.next/standalone/`

---

## 🔄 Step 5: Systemd Service Setup

### 5.1 Copy Service File

```bash
# Exit hanmarine user shell
exit

# Copy systemd service file
sudo cp /home/hanmarine/hims-app/deploy/config/hims-app.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload
```

### 5.2 Enable and Start Service

```bash
# Enable service to start on boot
sudo systemctl enable hims-app

# Start the service
sudo systemctl start hims-app

# Check status
sudo systemctl status hims-app
```

### 5.3 Verify Application is Running

```bash
# Check if app is listening on port 3000
curl http://localhost:3000

# View logs
sudo journalctl -u hims-app -f
```

---

## 🌐 Step 6: Nginx Configuration

### 6.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/hims-app
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name app.hanmarine.co;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client upload size
    client_max_body_size 50M;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Public uploads
    location /uploads {
        alias /home/hanmarine/hims-app/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Step 7: SSL Certificate Setup

### 7.1 Install SSL Certificate with Certbot

```bash
# Obtain and install certificate
sudo certbot --nginx -d app.hanmarine.co

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)
```

### 7.2 Test SSL Configuration

```bash
# Visit your domain
curl -I https://app.hanmarine.co

# Should return 200 OK with HTTPS
```

### 7.3 Auto-Renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up auto-renewal via systemd timer
# Verify timer is active
sudo systemctl list-timers | grep certbot
```

---

## 🔍 Step 8: Post-Deployment Verification

### 8.1 Application Health Check

```bash
# Check systemd service status
sudo systemctl status hims-app

# Check logs for errors
sudo journalctl -u hims-app -n 50 --no-pager

# Test application endpoint
curl -I https://app.hanmarine.co
```

### 8.2 Database Connection Test

```bash
# Connect to app shell
sudo su - hanmarine
cd /home/hanmarine/hims-app
NODE_ENV=production node -e "const {prisma} = require('./.next/standalone/node_modules/@prisma/client'); prisma.user.count().then(c => console.log('Users:', c)).finally(() => process.exit())"
```

### 8.3 Login Test

1. Navigate to `https://app.hanmarine.co/auth/signin`
2. Login with:
   - Email: `admin@hanmarine.com`
   - Password: `admin123`
3. **IMMEDIATELY change password** after first login

---

## 🔐 Step 9: Security Hardening

### 9.1 Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status verbose
```

### 9.2 Secure File Permissions

```bash
# Set proper ownership
sudo chown -R hanmarine:hanmarine /home/hanmarine/hims-app

# Secure .env.production
chmod 600 /home/hanmarine/hims-app/.env.production

# Make uploads directory writable
chmod 755 /home/hanmarine/hims-app/public/uploads
```

### 9.3 Fail2Ban Setup (Optional but Recommended)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create Nginx jail
sudo nano /etc/fail2ban/jail.local
```

Add:

```ini
[nginx-http-auth]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
```

---

## 📊 Step 10: Monitoring & Maintenance

### 10.1 Log Monitoring

```bash
# View application logs
sudo journalctl -u hims-app -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 10.2 Database Backup Setup

```bash
# Create backup script
sudo nano /home/hanmarine/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/hanmarine/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U hims_prod_user -d hims_prod | gzip > $BACKUP_DIR/hims_prod_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "hims_prod_*.sql.gz" -mtime +30 -delete

echo "Backup completed: hims_prod_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /home/hanmarine/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
# 0 2 * * * /home/hanmarine/backup-db.sh >> /home/hanmarine/backup.log 2>&1
```

### 10.3 Application Updates

```bash
# Update application
sudo su - hanmarine
cd /home/hanmarine/hims-app

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production=false

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart service
exit
sudo systemctl restart hims-app

# Check status
sudo systemctl status hims-app
```

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check logs
sudo journalctl -u hims-app -n 100 --no-pager

# Common issues:
# 1. DATABASE_URL incorrect - check .env.production
# 2. Port 3000 already in use - check with: sudo lsof -i :3000
# 3. Missing environment variables - validate all required vars set
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U hims_prod_user -d hims_prod

# Check PostgreSQL is running
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates

# Test SSL configuration
curl -vI https://app.hanmarine.co
```

### Performance Issues

```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h

# View application memory usage
ps aux | grep node
```

---

## 📝 Important Notes

1. **Change default admin password immediately** after first login
2. **Keep .env.production secure** - never commit to version control
3. **Regular database backups** are critical - test restoration regularly
4. **Monitor logs** for errors and security issues
5. **Keep system updated**: `sudo apt update && sudo apt upgrade` regularly
6. **SSL certificates** renew automatically but monitor expiry dates
7. **Document any custom changes** to configuration files

---

## ✅ Deployment Checklist

- [ ] Server provisioned and updated
- [ ] PostgreSQL installed and database created
- [ ] Application user created (hanmarine)
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Initial data seeded
- [ ] Application built successfully
- [ ] Systemd service configured and running
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] File permissions secured
- [ ] Database backups scheduled
- [ ] Application accessible at https://app.hanmarine.co
- [ ] Admin login tested
- [ ] Default password changed
- [ ] Logs monitored for errors

---

## 🔗 Quick Reference

**Service Management:**
```bash
sudo systemctl start hims-app      # Start
sudo systemctl stop hims-app       # Stop
sudo systemctl restart hims-app    # Restart
sudo systemctl status hims-app     # Status
sudo journalctl -u hims-app -f     # Logs
```

**Database Management:**
```bash
psql -h localhost -U hims_prod_user -d hims_prod  # Connect
npx prisma migrate deploy          # Run migrations
npx prisma studio                  # Database GUI
```

**Nginx Management:**
```bash
sudo nginx -t                      # Test config
sudo systemctl reload nginx        # Reload
sudo systemctl status nginx        # Status
```

---

## 📞 Support

For issues or questions:
- Check troubleshooting section above
- Review logs: `sudo journalctl -u hims-app -n 100`
- Consult HIMS documentation in repository
- Contact system administrator

---

**Deployment Date:** ____________________  
**Deployed By:** ____________________  
**Server IP:** ____________________  
**Domain:** app.hanmarine.co
