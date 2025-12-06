# DEPLOYMENT TO NIAGAHOSTER VPS - FINAL CHECKLIST
## 15 MINUTE DEPLOYMENT PROCEDURE

**Date**: December 6, 2025  
**Target**: https://app.hanmarine.co  
**VPS**: Niagahoster  
**Time Estimate**: 15 minutes  

---

## 📋 BEFORE YOU START

**Have these ready:**
- [ ] Niagahoster VPS access credentials (IP, username, password/SSH key)
- [ ] Domain `app.hanmarine.co` DNS pointing to VPS IP (verify with `nslookup app.hanmarine.co`)
- [ ] PostgreSQL username and password for database
- [ ] Git repository access (GitHub - frogman715/hims-app)

---

## 🚀 DEPLOYMENT STEPS (Copy & Paste)

### STEP 1: SSH into VPS (2 minutes)

```bash
# Connect to VPS
ssh root@your-vps-ip
# OR
ssh username@your-vps-ip

# Verify you're in the right place
whoami
pwd
```

**Expected**: You should see your username in the prompt

---

### STEP 2: Download & Run Deployment Script (10 minutes)

```bash
# Go to app directory
cd /var/www
mkdir -p hims-app
cd hims-app

# Clone the repository with deployment scripts
git clone https://github.com/frogman715/hims-app.git .

# Make deployment script executable
chmod +x DEPLOY_READY.sh

# RUN THE DEPLOYMENT SCRIPT
./DEPLOY_READY.sh
```

**What it does:**
- ✅ Installs dependencies
- ✅ Generates Prisma client
- ✅ Runs database migrations
- ✅ Builds Next.js application
- ✅ Starts PM2 process manager
- ✅ Configures auto-startup

**Expected output:**
```
✅ DEPLOYMENT COMPLETE!
📍 Next Steps:
   1. Update .env.production.local with real DATABASE_URL
   2. Configure Nginx reverse proxy
   3. Setup SSL certificate
```

---

### STEP 3: Edit Environment Variables (2 minutes)

**CRITICAL**: Update the database credentials!

```bash
# Edit environment file
nano /var/www/hims-app/.env.production.local
```

**Update these lines with REAL values:**
```
DATABASE_URL=postgresql://hims_user:YOUR_REAL_PASSWORD@localhost:5432/hims_prod
```

**Save**: Press `Ctrl+O`, `Enter`, `Ctrl+X`

**Verify database connection:**
```bash
cd /var/www/hims-app
npx prisma db execute --stdin < /dev/null
# Should return no error if database is accessible
```

---

### STEP 4: Configure Nginx (1 minute)

**Copy Nginx configuration:**
```bash
# Copy config to Nginx
sudo cp /var/www/hims-app/nginx-hims-app.conf /etc/nginx/sites-available/hims-app

# Enable the site
sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/hims-app

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
# Should show: "syntax is ok" and "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

**Verify Nginx is running:**
```bash
sudo systemctl status nginx
# Should show "active (running)"
```

---

### STEP 5: Setup SSL Certificate (0 minutes - automatic)

```bash
# Make script executable
chmod +x /var/www/hims-app/setup-ssl.sh

# Run SSL setup
./setup-ssl.sh
```

**What it does:**
- ✅ Installs Certbot
- ✅ Gets SSL certificate for app.hanmarine.co
- ✅ Sets up automatic renewal

**Expected output:**
```
✅ SSL SETUP COMPLETE!
Certificate Details: [cert info]
```

---

### STEP 6: Setup Database Backups (1 minute)

```bash
# Make backup script executable
chmod +x /var/www/hims-app/backup-database.sh

# Create backup directory
sudo mkdir -p /var/backups/hims-db
sudo chown $USER:$USER /var/backups/hims-db

# Test backup
./backup-database.sh

# Schedule daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/hims-app/backup-database.sh") | crontab -
```

**Verify cron job:**
```bash
crontab -l
# Should show: 0 2 * * * /var/www/hims-app/backup-database.sh
```

---

## ✅ VERIFICATION (Do This!)

### Check Application is Running

```bash
# Check PM2 status
pm2 status
# Expected: hims-app should show "online"

# Check logs (first 50 lines)
pm2 logs hims-app --lines 50
# Should NOT show any [ERROR] messages

# Test local connection
curl http://127.0.0.1:3000
# Should return HTML content
```

### Check HTTPS Works

```bash
# Test HTTPS
curl -I https://app.hanmarine.co

# Expected output:
# HTTP/2 200
# ...headers...
# Content-Type: text/html
```

### Check Database is Connected

```bash
cd /var/www/hims-app
npx prisma db execute --stdin < /dev/null
# No error = database connected ✓
```

### Check Memory Usage

```bash
# Memory usage should be under 500MB
pm2 show hims-app | grep memory
```

---

## 🎉 SUCCESS INDICATORS

**Application is ready when:**
- [ ] `pm2 status` shows hims-app as "online"
- [ ] `curl -I https://app.hanmarine.co` returns 200 OK
- [ ] No errors in `pm2 logs hims-app --err`
- [ ] Database connection works (`npx prisma db execute`)
- [ ] Memory usage < 500MB
- [ ] SSL certificate is valid (`sudo certbot certificates`)

---

## 🚨 TROUBLESHOOTING

### Issue: Application not running
```bash
# Check logs
pm2 logs hims-app --err

# Restart
pm2 restart hims-app

# If still failing, check environment
cat /var/www/hims-app/.env.production.local | grep DATABASE_URL
```

### Issue: Database connection failed
```bash
# Test PostgreSQL
psql -h localhost -U hims_user -d hims_prod -c "SELECT 1"

# If error, verify:
# 1. PostgreSQL is running
# 2. hims_user exists
# 3. hims_prod database exists
# 4. DATABASE_URL is correct
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check if app is running
curl http://127.0.0.1:3000

# Check Nginx config
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/hims-app-error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: SSL certificate not working
```bash
# Check certificate
sudo certbot certificates

# If not found, run setup again
./setup-ssl.sh

# Check Nginx config references correct cert paths
grep ssl_certificate /etc/nginx/sites-available/hims-app
```

---

## 📊 USEFUL COMMANDS

**Monitoring:**
```bash
pm2 status              # Process status
pm2 logs hims-app       # View logs
pm2 monit               # Real-time monitoring
```

**Management:**
```bash
pm2 restart hims-app    # Restart application
pm2 stop hims-app       # Stop application
pm2 start hims-app      # Start application
pm2 reload ecosystem.config.js --env production  # Zero-downtime reload
```

**Database:**
```bash
npx prisma studio      # Open DB GUI
npx prisma db push     # Apply schema changes
npx prisma migrate dev # Create new migration
```

**Nginx:**
```bash
sudo systemctl status nginx      # Check status
sudo nginx -t                    # Test config
sudo systemctl restart nginx     # Restart
sudo tail -f /var/log/nginx/*.log  # View logs
```

**System:**
```bash
df -h                   # Disk space
free -h                 # Memory
ps aux | grep node      # Node processes
netstat -tlnp | grep 3000  # Check port 3000
```

---

## 📞 IF SOMETHING GOES WRONG

**1. Check logs immediately:**
```bash
pm2 logs hims-app --err --lines 100
sudo tail -f /var/log/nginx/hims-app-error.log
```

**2. Verify environment variables:**
```bash
cat /var/www/hims-app/.env.production.local
# DATABASE_URL should have real credentials
```

**3. Restart everything:**
```bash
pm2 restart hims-app
sudo systemctl restart nginx
```

**4. If still failing, rollback:**
```bash
cd /var/www/hims-app
git log --oneline
git revert HEAD
npm run build
pm2 restart hims-app
```

---

## 📝 DEPLOYMENT SIGN-OFF

**Deployed By**: ___________________________  
**Date**: ___________________________  
**Time**: ___________________________  

**Final Verification:**
- [ ] Application running: ✅
- [ ] HTTPS working: ✅
- [ ] Database connected: ✅
- [ ] Logs clean: ✅
- [ ] Backups scheduled: ✅

**Status**: ✅ **PRODUCTION DEPLOYED**

---

## 🎯 YOU'RE DONE!

Your HIMS application is now running at:
```
https://app.hanmarine.co
```

**Features enabled:**
- ✅ Production-grade Next.js application
- ✅ PostgreSQL database with automated backups
- ✅ PM2 process management with auto-restart
- ✅ Nginx reverse proxy with SSL/HTTPS
- ✅ Let's Encrypt automatic certificate renewal
- ✅ 24/7 monitoring and logging
- ✅ Zero-downtime deployment capability

**Maintenance tasks (ongoing):**
- Daily: Monitor logs (`pm2 logs hims-app`)
- Weekly: Review backups exist
- Monthly: Update OS packages (`apt-get update && apt-get upgrade`)
- As needed: Deploy updates (`git pull && npm run build && pm2 reload`)

🚀 **HIMS is LIVE on Niagahoster VPS!**
