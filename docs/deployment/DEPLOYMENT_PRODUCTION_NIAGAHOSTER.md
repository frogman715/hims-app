# HIMS PRODUCTION DEPLOYMENT GUIDE - NIAGAHOSTER VPS
## Comprehensive Setup for Enterprise Maritime System

**Last Updated**: December 6, 2025  
**Target**: Niagahoster VPS (CentOS/Ubuntu)  
**Application**: HIMS v2.0 (Next.js 15 + Prisma + PostgreSQL)  

---

## 🎯 QUICK SUMMARY

```bash
# Total Deployment Time: ~15 minutes
# Zero Downtime: ✅ (Using PM2 with rolling restart)
# Database: ✅ Managed via Prisma migrations
# SSL: ✅ Auto via Let's Encrypt + Nginx
# Monitoring: ✅ PM2 Plus integration ready
# Backups: ✅ PostgreSQL backup script included
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### VPS Requirements
- [ ] Ubuntu 20.04+ or CentOS 7+ (2GB+ RAM minimum)
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 13+ running and accessible
- [ ] Nginx installed and configured
- [ ] SSH access to VPS
- [ ] Domain DNS pointed to VPS IP

### Code Repository
- [ ] All code committed to git
- [ ] `.env` configured with production values
- [ ] `.env.production.local` created (NOT committed)
- [ ] Database migrations applied locally first
- [ ] Build tested: `npm run build` ✅
- [ ] No console errors in build output

### Environment Variables
```bash
# .env.production.local (CREATE THIS - NOT COMMITTED)
NODE_ENV=production
NEXTAUTH_SECRET=your-32-char-secret-generated-by-openssl
NEXTAUTH_URL=https://app.hanmarine.co
DATABASE_URL=postgresql://user:password@localhost:5432/hims_prod
HIMS_CRYPTO_KEY=your-32-char-encryption-key

# Optional (for monitoring)
PM2_PUBLIC_KEY=your-pm2-key
PM2_SECRET_KEY=your-pm2-secret
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: SSH into VPS

```bash
ssh root@your-vps-ip
# or
ssh user@your-vps-ip -p 22
```

### Step 2: Prepare Application Directory

```bash
# Create app directory
mkdir -p /var/www/hims-app
cd /var/www/hims-app

# Clone or pull latest code
git clone https://github.com/frogman715/hims-app.git .
# OR if already cloned:
git pull origin main

# Create .env.production.local (CRITICAL - production secrets)
cat > .env.production.local << 'EOF'
NODE_ENV=production
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://app.hanmarine.co
DATABASE_URL=postgresql://hims_user:secure_password@localhost:5432/hims_prod
HIMS_CRYPTO_KEY=$(openssl rand -base64 32)
EOF

# Secure permissions
chmod 600 .env.production.local
```

### Step 3: Install & Build Application

```bash
# Install dependencies
npm ci --omit=dev
# (use 'npm ci' instead of 'npm install' for production - more deterministic)

# Generate Prisma client
npx prisma generate

# Run database migrations (if new schema)
npx prisma migrate deploy

# Build Next.js application
npm run build

# Verify build succeeded
ls -la .next/
```

### Step 4: Setup PM2 Ecosystem

```bash
# Install PM2 globally (if not already)
npm install -g pm2@latest

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hims-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/hims-app',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/hims-app-error.log',
      out_file: '/var/log/hims-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart & health checks
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],
      merge_logs: true,
    }
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'root',
      host: 'your-vps-ip',
      ref: 'origin/main',
      repo: 'https://github.com/frogman715/hims-app.git',
      path: '/var/www/hims-app',
      'post-deploy': 'npm ci --omit=dev && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Make PM2 start on VPS reboot
pm2 startup
pm2 save

# Verify application running
pm2 status
pm2 logs hims-app --lines 20
```

### Step 5: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/hims-app > /dev/null << 'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name app.hanmarine.co;
    return 301 https://$server_name$request_uri;
}

# HTTPS main server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.hanmarine.co;

    # SSL certificates (via Certbot/Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/app.hanmarine.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.hanmarine.co/privkey.pem;
    
    # SSL configuration for security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    gzip_min_length 1000;

    # Logging
    access_log /var/log/nginx/hims-app-access.log combined;
    error_log /var/log/nginx/hims-app-error.log;

    # Reverse proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # Headers for proper forwarding
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_cache_valid 30d;
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, immutable, max-age=2592000";
    }

    location /public {
        alias /var/www/hims-app/public;
        expires 30d;
        add_header Cache-Control "public, immutable, max-age=2592000";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/hims-app

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot (if not already)
sudo apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot certonly --standalone -d app.hanmarine.co

# Auto-renewal (already enabled by default on modern systems)
sudo systemctl enable certbot.timer

# Verify renewal will work
sudo certbot renew --dry-run
```

### Step 7: Database Backup Strategy

```bash
# Create backup script
cat > /var/www/hims-app/scripts/backup-database.sh << 'EOF'
#!/bin/bash

# Daily backup script for PostgreSQL
BACKUP_DIR="/var/backups/hims-db"
DB_NAME="hims_prod"
DB_USER="hims_user"
BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hims_$BACKUP_DATE.sql.gz"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD="$DB_PASSWORD" pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "hims_*.sql.gz" -mtime +30 -delete

# Log
echo "Backup created: $BACKUP_FILE" >> /var/log/hims-backup.log
EOF

# Make executable
chmod +x /var/www/hims-app/scripts/backup-database.sh

# Setup cron job (daily 2 AM)
crontab -e
# Add line: 0 2 * * * /var/www/hims-app/scripts/backup-database.sh
```

### Step 8: Monitoring & Alerts

```bash
# Setup PM2 monitoring
pm2 monit

# Or install PM2 Plus (optional - for cloud dashboard)
pm2 link <pm2-public-key> <pm2-secret-key>

# View real-time logs
pm2 logs hims-app --lines 100 --err

# Setup log rotation
sudo tee /etc/logrotate.d/hims-app > /dev/null << 'EOF'
/var/log/hims-app*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF
```

---

## 📊 VERIFICATION CHECKLIST

After deployment, verify everything works:

```bash
# 1. Check application is running
pm2 status
# Output should show hims-app with status "online"

# 2. Check logs for errors
pm2 logs hims-app --lines 50
# Should NOT show any "[ERROR]" messages

# 3. Test HTTP to HTTPS redirect
curl -I http://app.hanmarine.co
# Should get 301 redirect

# 4. Test HTTPS endpoint
curl -I https://app.hanmarine.co
# Should get 200 OK

# 5. Check Nginx is running
sudo systemctl status nginx
# Should be "active (running)"

# 6. Test database connection
cd /var/www/hims-app
npx prisma db execute --stdin < /dev/null
# If no errors, database is connected

# 7. Check memory usage
pm2 show hims-app | grep "memory"
# Should be < 500MB

# 8. Verify SSL certificate
curl -v https://app.hanmarine.co 2>&1 | grep "SSL"
# Should show valid certificate with 30+ days remaining
```

---

## 🔄 DEPLOYMENT UPDATES

When deploying new code updates:

```bash
cd /var/www/hims-app

# Pull latest code
git pull origin main

# Reinstall dependencies (if package.json changed)
npm ci --omit=dev

# Run migrations (if schema changed)
npx prisma migrate deploy

# Rebuild application
npm run build

# Restart application with zero downtime
pm2 reload ecosystem.config.js --env production

# Verify
pm2 logs hims-app --lines 20
```

---

## 🚨 TROUBLESHOOTING

### Application won't start
```bash
# Check logs
pm2 logs hims-app --err

# Check if port 3000 is available
sudo netstat -tlnp | grep 3000

# Check environment variables
cat /var/www/hims-app/.env.production.local | grep -v PASSWORD

# Rebuild and restart
cd /var/www/hims-app
npm run build
pm2 restart hims-app
```

### Database connection failed
```bash
# Test PostgreSQL connection
psql -h localhost -U hims_user -d hims_prod -c "SELECT NOW();"

# Check DATABASE_URL format
echo $DATABASE_URL

# Verify Prisma can connect
npx prisma db execute --stdin < /dev/null
```

### Nginx issues
```bash
# Check Nginx syntax
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/hims-app-error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL certificate expired
```bash
# Renew immediately
sudo certbot renew --force-renewal

# Check next renewal date
sudo certbot certificates

# Monitor renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Production Build Settings
Already optimized in `next.config.ts`:
- ✅ Standalone output mode
- ✅ Disabled lint/type checking in build (faster)
- ✅ Proper headers (X-Frame-Options, HSTS, etc.)

### Database Query Optimization
- Use Prisma's `include` for relations (not lazy loading)
- Add pagination to large queries (`skip`, `take`)
- Index frequently filtered fields

### Monitor Performance
```bash
# Check build size
du -sh /var/www/hims-app/.next

# Monitor API response times
pm2 logs hims-app | grep "response time"

# Check database slow queries
sudo tail -f /var/log/postgresql/postgresql.log
```

---

## 🔐 SECURITY HARDENING

Already implemented:
- ✅ HTTPS enforcement (HTTP → HTTPS redirect)
- ✅ Security headers (X-Frame-Options, Content-Security-Policy ready)
- ✅ Rate limiting in API middleware
- ✅ HIMS_CRYPTO_KEY for sensitive data encryption
- ✅ bcryptjs for password hashing

Additional measures:
```bash
# 1. Firewall (if using UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# 2. Disable root SSH login
sudo sed -i 's/^#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 3. Setup fail2ban for brute force protection
sudo apt-get install fail2ban -y
sudo systemctl enable fail2ban

# 4. Regular security updates
sudo apt-get update && sudo apt-get upgrade -y
# Setup automatic security updates
sudo apt-get install unattended-upgrades -y
```

---

## 📞 SUPPORT CONTACTS

- **VPS Provider**: Niagahoster support portal
- **Domain**: Check registrar (Niagahoster if registered there)
- **SSL Certificates**: Let's Encrypt (automatic renewal)
- **Node.js Issues**: https://nodejs.org/en/docs/
- **Next.js Documentation**: https://nextjs.org/docs

---

## ✅ DEPLOYMENT SUMMARY

**Status**: Production Ready  
**Application**: HIMS v2.0  
**Framework**: Next.js 15 + Prisma + PostgreSQL  
**Deployment Time**: ~15 minutes  
**Uptime Target**: 99.9%  
**Zero Downtime Updates**: ✅ Supported via PM2  

**Next Steps**:
1. Run this deployment guide step-by-step
2. Verify all checklist items
3. Monitor logs for first 24 hours
4. Setup automated backups
5. Document any custom configurations
