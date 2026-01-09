# 🚀 FINAL VPS SETUP - HIMS Production Deployment

**Status**: Application is RUNNING on VPS ✅  
**Current Issue**: Domain not accessible = Nginx not configured  
**Time to Complete**: ~15 minutes

---

## 📋 Pre-requisites Check

Before proceeding, verify:
- ✅ SSH access to VPS (you have root access)
- ✅ Domain `app.hanmarine.co` points to VPS IP
- ✅ Application running on port 3000 (PM2 online)
- ✅ PostgreSQL database up and running

---

## 🔧 STEP 1: SSH into VPS

```bash
ssh root@your-vps-ip
# OR if you have domain DNS setup
ssh root@app.hanmarine.co
```

Verify application is running:
```bash
pm2 status
# Should show: hims-app | online
```

---

## 📝 STEP 2: Setup Nginx Reverse Proxy

The Nginx config file is already in your repo at `nginx-hims-app.conf`.

### Copy to Nginx
```bash
# Navigate to app directory
cd /var/www/hims-app

# Copy config to Nginx sites-available
sudo cp nginx-hims-app.conf /etc/nginx/sites-available/app.hanmarine.co

# Create symbolic link to enable site
sudo ln -sf /etc/nginx/sites-available/app.hanmarine.co /etc/nginx/sites-enabled/

# Test Nginx configuration (IMPORTANT - check for syntax errors)
sudo nginx -t
# Should output: nginx: configuration file test is successful
```

### If you get errors in nginx -t:
Edit the file and check for issues:
```bash
sudo nano /etc/nginx/sites-available/app.hanmarine.co
# Look for syntax errors, wrong paths, etc.
# Then retry: sudo nginx -t
```

---

## 🔐 STEP 3: Setup SSL Certificate (Let's Encrypt)

### Install certbot if not already installed
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

### Generate SSL certificate
```bash
sudo certbot certonly --standalone -d app.hanmarine.co \
  --non-interactive \
  --agree-tos \
  -m admin@hanmarine.co
```

If certbot is already installed:
```bash
sudo certbot renew --dry-run  # Test renewal first
```

### Verify certificate was created
```bash
sudo ls -la /etc/letsencrypt/live/app.hanmarine.co/
# Should show: fullchain.pem and privkey.pem
```

---

## 🚀 STEP 4: Start Nginx

```bash
# Start Nginx
sudo systemctl start nginx

# Enable auto-start on boot
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
# Should show: active (running)
```

---

## 🔗 STEP 5: Verify Connection

From VPS terminal:
```bash
# Test local connection
curl -I http://localhost:3000
# Should return 200 OK

# Test via Nginx (HTTP)
curl -I http://app.hanmarine.co
# Should return 301 (redirect to HTTPS)

# Test via Nginx (HTTPS)
curl -I https://app.hanmarine.co
# Should return 200 OK
```

---

## 📊 STEP 6: Verify Environment Variables

Make sure `.env.production.local` has all required variables:

```bash
cd /var/www/hims-app

# Check if file exists
ls -la .env.production.local

# View contents (DO NOT share with anyone)
sudo cat .env.production.local
```

Should have:
```
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://app.hanmarine.co
NEXTAUTH_SECRET=...
HIMS_CRYPTO_KEY=...
```

If missing, update:
```bash
sudo nano .env.production.local
```

Then restart application:
```bash
pm2 restart hims-app
```

---

## 🧪 STEP 7: Full System Test

Run this verification checklist:

```bash
# 1. Check database connection
cd /var/www/hims-app
npx prisma db execute --stdin < /dev/null
# Should succeed with no errors

# 2. Check application is responding
curl -s https://app.hanmarine.co/api/health 2>/dev/null | head -20
# Should return JSON or page content

# 3. Check PM2 logs for errors
pm2 logs hims-app --err --lines 20
# Should show minimal/no errors

# 4. Check Nginx logs
sudo tail -20 /var/log/nginx/error.log
# Should be empty or show 200 responses
```

---

## 🌐 STEP 8: Access Application

From your local machine:
```bash
# Open in browser
https://app.hanmarine.co

# Or test with curl
curl -I https://app.hanmarine.co
```

Expected response: `200 OK`

### Login with:
- **Email**: rinaldy@hanmarine.co
- **Password**: admin123

Other test users:
- arief@hanmarine.co (DIRECTOR)
- dino@hanmarine.co (ACCOUNTING)
- cdmo@hanmarine.co (CDMO)
- operational@hanmarine.co (OPERATIONAL)
- hr@hanmarine.co (HR)
- crew@hanmarine.co (CREW_PORTAL)

---

## 🔄 STEP 9: Setup Auto-Renewal for SSL

```bash
# Create renewal cron job (runs daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify cron is active
sudo systemctl status certbot.timer
```

---

## 🆘 Troubleshooting

### "Connection refused" error
```bash
# Check if app is running
pm2 status

# Check if Nginx is running
sudo systemctl status nginx

# Restart both
pm2 restart hims-app
sudo systemctl restart nginx
```

### SSL certificate not found
```bash
# Verify certificate location
sudo ls -la /etc/letsencrypt/live/app.hanmarine.co/

# If missing, regenerate
sudo certbot certonly --standalone -d app.hanmarine.co
```

### Nginx config error
```bash
# Test configuration
sudo nginx -t

# View detailed error
sudo nginx -t 2>&1 | tail -20

# Edit config
sudo nano /etc/nginx/sites-available/app.hanmarine.co
```

### Application not responding
```bash
# Check PM2 logs
pm2 logs hims-app --lines 50

# Check database
cd /var/www/hims-app
npx prisma db execute --stdin < /dev/null

# Restart application
npm run build
pm2 restart hims-app
```

---

## 📦 Quick Reference Commands

```bash
# Start/Stop/Restart
pm2 restart hims-app
pm2 stop hims-app
pm2 start hims-app

# View logs
pm2 logs hims-app
pm2 logs hims-app --err

# Check status
pm2 status
pm2 info hims-app

# Database
cd /var/www/hims-app
npx prisma db execute --stdin < /dev/null

# Rebuild
npm run build
pm2 restart hims-app

# Update code from GitHub
cd /var/www/hims-app
git pull origin main
npm ci --omit=dev
npm run build
pm2 restart hims-app
```

---

## ✅ Success Criteria

You'll know setup is complete when:

1. ✅ `pm2 status` shows `hims-app | online`
2. ✅ `curl -I https://app.hanmarine.co` returns `200 OK`
3. ✅ Can login at https://app.hanmarine.co with rinaldy@hanmarine.co / admin123
4. ✅ Dashboard loads without errors
5. ✅ No errors in `pm2 logs hims-app`
6. ✅ SSL certificate is valid (green lock in browser)

---

## 🎉 You're Done!

Application is now live at: **https://app.hanmarine.co** 🚀

For future updates:
```bash
cd /var/www/hims-app
git pull origin main
npm ci --omit=dev
npm run build
pm2 restart hims-app
```

---

**Need help?** Check logs:
```bash
pm2 logs hims-app
sudo tail -50 /var/log/nginx/error.log
```
