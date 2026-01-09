# DEPLOYMENT GUIDE - app.hanmarine.co
## Production Deployment to VPS

### 🎯 PRE-DEPLOYMENT CHECKLIST

#### 1. Clean Local Database (DONE)
```bash
cd /home/docter203/hanmarine_hims/hims-app
psql -h localhost -p 5434 -U hims -d hims -f scripts/clean-for-production.sql
```

#### 2. Environment Variables for Production
Create `.env.production` on VPS:
```bash
# Database (Production PostgreSQL on VPS)
DATABASE_URL="postgresql://hims:YOUR_PRODUCTION_PASSWORD@localhost:5432/hims_production"

# NextAuth
NEXTAUTH_URL="https://app.hanmarine.co"
NEXTAUTH_SECRET="GENERATE_NEW_SECRET_MIN_32_CHARS_openssl_rand_base64_32"

# Encryption (CRITICAL - Generate new key for production!)
HIMS_CRYPTO_KEY="GENERATE_NEW_32_CHAR_KEY_openssl_rand_hex_32"

# Node Environment
NODE_ENV="production"
```

#### 3. Generate Production Secrets
```bash
# NextAuth Secret (32+ characters)
openssl rand -base64 32

# Crypto Key (32 bytes hex)
openssl rand -hex 32
```

---

### 📦 DEPLOYMENT STEPS

#### Step 1: Prepare VPS Server
```bash
# SSH to VPS
ssh root@your-vps-ip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PostgreSQL 16
apt install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2

# Install Nginx
apt install nginx certbot python3-certbot-nginx
```

#### Step 2: Setup Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database
CREATE DATABASE hims_production;
CREATE USER hims WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE hims_production TO hims;
ALTER DATABASE hims_production OWNER TO hims;
\q
```

#### Step 3: Upload Code to VPS
```bash
# On local machine - create production build
cd /home/docter203/hanmarine_hims/hims-app
npm run build

# Upload to VPS (using rsync or git)
# Option A: Using rsync
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /home/docter203/hanmarine_hims/hims-app/ \
  root@your-vps-ip:/var/www/hims-app/

# Option B: Using Git (RECOMMENDED)
git init
git add .
git commit -m "Production ready"
git push origin main

# On VPS
cd /var/www
git clone https://github.com/yourusername/hims-app.git
cd hims-app
```

#### Step 4: Install Dependencies on VPS
```bash
cd /var/www/hims-app
npm install --production
```

#### Step 5: Setup Environment Variables
```bash
# Create .env file on VPS
nano .env

# Paste production environment variables (see section 2 above)
```

#### Step 6: Run Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

#### Step 7: Create Admin User (First Time Only)
```bash
npx prisma db seed
# Or manually:
node -e "
const bcrypt = require('bcryptjs');
const password = bcrypt.hashSync('YOUR_SECURE_PASSWORD', 10);
console.log('Hashed password:', password);
"
```

Then insert admin user:
```sql
INSERT INTO \"User\" (id, email, name, role, password, \"isActive\")
VALUES (
  'admin-001',
  'admin@hanmarine.co',
  'Admin HANMARINE',
  'DIRECTOR',
  'HASHED_PASSWORD_FROM_ABOVE',
  true
);
```

#### Step 8: Build for Production
```bash
npm run build
```

#### Step 9: Start with PM2
```bash
# Start application
pm2 start npm --name "hims-app" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

#### Step 10: Setup Nginx Reverse Proxy
```bash
nano /etc/nginx/sites-available/app.hanmarine.co
```

Add configuration:
```nginx
server {
    listen 80;
    server_name app.hanmarine.co;

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
ln -s /etc/nginx/sites-available/app.hanmarine.co /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 11: Setup SSL Certificate (HTTPS)
```bash
certbot --nginx -d app.hanmarine.co
```

---

### 🔒 SECURITY CHECKLIST

- [ ] Strong database password set
- [ ] New NEXTAUTH_SECRET generated (32+ chars)
- [ ] New HIMS_CRYPTO_KEY generated (32 bytes)
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key authentication enabled (password disabled)
- [ ] PostgreSQL only accepts local connections
- [ ] Regular backups configured
- [ ] Admin password changed from default

---

### 🚀 POST-DEPLOYMENT

#### Verify Installation
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hims-app

# Check Nginx status
systemctl status nginx

# Check database connection
psql -U hims -d hims_production -c "SELECT COUNT(*) FROM \"User\";"
```

#### Test Application
1. Visit: https://app.hanmarine.co
2. Login with admin credentials
3. Create test crew member
4. Generate SIUPPAK report
5. Test all modules

#### Monitoring
```bash
# View real-time logs
pm2 logs hims-app --lines 100

# Monitor resources
pm2 monit

# Check error logs
pm2 logs hims-app --err
```

---

### 🔄 UPDATES & MAINTENANCE

#### Deploy New Updates
```bash
# On local machine
git add .
git commit -m "Feature: description"
git push origin main

# On VPS
cd /var/www/hims-app
git pull origin main
npm install
npm run build
pm2 restart hims-app
```

#### Database Backup
```bash
# Create backup script
cat > /root/backup-hims.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U hims hims_production > /backups/hims_$DATE.sql
# Keep last 30 days
find /backups -name "hims_*.sql" -mtime +30 -delete
EOF

chmod +x /root/backup-hims.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-hims.sh
```

---

### 📊 PERFORMANCE OPTIMIZATION

#### Enable Next.js Standalone Output (Already configured in next.config.ts)
```typescript
output: 'standalone'
```

#### PM2 Cluster Mode (for multiple CPU cores)
```bash
pm2 start npm --name "hims-app" -i max -- start
```

#### PostgreSQL Optimization
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf

# Increase connection pool
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
```

---

### 🆘 TROUBLESHOOTING

#### App won't start
```bash
pm2 logs hims-app --err --lines 50
# Check database connection in .env
# Verify migrations: npx prisma migrate status
```

#### 502 Bad Gateway
```bash
# Check if app is running
pm2 status
# Check port 3000 is listening
netstat -tulpn | grep 3000
# Restart Nginx
systemctl restart nginx
```

#### Database connection failed
```bash
# Check PostgreSQL is running
systemctl status postgresql
# Test connection
psql -U hims -d hims_production -c "SELECT 1;"
```

---

### 📞 SUPPORT

- Documentation: Check /docs folder
- Logs: `pm2 logs hims-app`
- Database: `psql -U hims hims_production`
- Nginx: `/var/log/nginx/error.log`

---

**DEPLOYMENT COMPLETED:** ✅
- Clean database (no dummy data)
- Production environment configured
- SSL certificate installed
- PM2 process running
- Monitoring enabled
- Backups scheduled

**Access:** https://app.hanmarine.co
**Login:** admin@hanmarine.co / [your-secure-password]
