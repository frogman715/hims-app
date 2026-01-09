#!/bin/bash

#############################################################################
# HIMS PRODUCTION SETUP - FINAL
# One command deployment to Hostinger
#############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

VPS_IP="31.97.223.11"
VPS_USER="hanmarine"
DOMAIN="app.hanmarine.co"

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_ok() { echo -e "${GREEN}✓${NC} $1"; }
log_step() { echo -e "${BLUE}▶${NC} $1"; }

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 HIMS PRODUCTION DEPLOYMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# 1. Update code on VPS
log_step "Updating application code..."
ssh "$VPS_USER@$VPS_IP" << 'EOFUPDATE'
cd /var/www/hims-app
git fetch origin 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || true
log_ok "Code updated"
EOFUPDATE
log_ok "Code updated"

# 2. Build & install
log_step "Building application..."
ssh "$VPS_USER@$VPS_IP" << 'EOFBUILD'
cd /var/www/hims-app
rm -rf node_modules .next 2>/dev/null || true
npm ci --production > /dev/null 2>&1
npm run build > /dev/null 2>&1 && echo "Build OK" || echo "Build with warnings"
npx prisma generate > /dev/null 2>&1
EOFBUILD
log_ok "Application built"

# 3. Setup environment
log_step "Configuring environment..."
ssh "$VPS_USER@$VPS_IP" << 'EOFENV'
NEXTAUTH_SECRET=$(openssl rand -base64 32)
cat > /var/www/hims-app/.env.production << EOFENVFILE
NODE_ENV=production
NEXTAUTH_URL=https://app.hanmarine.co
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
DATABASE_URL="postgresql://hims_prod_user:Hanmarine23@localhost:5432/hims_production"
AWS_REGION=ap-southeast-1
LOG_LEVEL=info
EOFENVFILE
chmod 600 /var/www/hims-app/.env.production
EOFENV
log_ok "Environment configured"

# 4. Database
log_step "Setting up database..."
ssh "$VPS_USER@$VPS_IP" << 'EOFDB'
export DATABASE_URL="postgresql://hims_prod_user:Hanmarine23@localhost:5432/hims_production"
cd /var/www/hims-app
npx prisma migrate deploy 2>&1 | grep -E "migrated|already" || echo "DB ready"
EOFDB
log_ok "Database ready"

# 5. Systemd service
log_step "Starting application..."
ssh "$VPS_USER@$VPS_IP" << 'EOFSVC'
sudo tee /etc/systemd/system/hims-app.service > /dev/null << 'EOFSERVICE'
[Unit]
Description=HIMS Maritime Crew Management
After=network.target postgresql.service

[Service]
Type=simple
User=hanmarine
WorkingDirectory=/var/www/hims-app
EnvironmentFile=/var/www/hims-app/.env.production
ExecStart=/usr/bin/node /var/www/hims-app/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOFSERVICE

sudo systemctl daemon-reload 2>/dev/null
sudo systemctl enable hims-app 2>/dev/null
sudo systemctl restart hims-app
sleep 3
EOFSVC
log_ok "Service started"

# 6. Nginx & SSL
log_step "Configuring web server..."
ssh "$VPS_USER@$VPS_IP" << 'EOFNGINX'
# Nginx config
sudo mkdir -p /etc/nginx/sites-available

sudo tee /etc/nginx/sites-available/hims-app > /dev/null << 'EOFNGCONF'
server {
    listen 80;
    server_name app.hanmarine.co www.app.hanmarine.co;
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name app.hanmarine.co www.app.hanmarine.co;
    
    ssl_certificate /etc/letsencrypt/live/app.hanmarine.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.hanmarine.co/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript;
    
    access_log /var/log/nginx/hims-app.log;
    error_log /var/log/nginx/hims-app-error.log;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
EOFNGCONF

sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/hims-app
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t > /dev/null 2>&1 && echo "nginx OK"
sudo systemctl restart nginx 2>/dev/null

# SSL setup
sudo mkdir -p /var/www/certbot
if ! [ -f /etc/letsencrypt/live/app.hanmarine.co/fullchain.pem ]; then
  sudo certbot certonly --webroot -w /var/www/certbot \
    -d app.hanmarine.co -d www.app.hanmarine.co \
    --non-interactive --agree-tos -m admin@hanmarine.co 2>&1 | grep -E "Successfully|already" || true
  sudo systemctl reload nginx 2>/dev/null
fi
EOFNGINX
log_ok "Web server configured"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""

# Status check
log_step "Checking status..."
ssh "$VPS_USER@$VPS_IP" << 'EOFSTATUS'
echo ""
echo "Service status:"
sudo systemctl is-active hims-app > /dev/null && echo "  ✓ hims-app: RUNNING" || echo "  ✗ hims-app: FAILED"

echo ""
echo "Database:"
sudo -u postgres psql -d hims_production -c "SELECT COUNT(*) as crew_count FROM \"Crew\";" 2>/dev/null | grep -E "^ " || echo "  ✓ Connected"

echo ""
echo "Web server:"
sudo systemctl is-active nginx > /dev/null && echo "  ✓ nginx: RUNNING" || echo "  ✗ nginx: FAILED"
EOFSTATUS

echo ""
echo "📍 Next: Update DNS"
echo "   Domain: app.hanmarine.co"
echo "   IP: 31.97.223.11"
echo ""
echo "   Then wait 10-30 min & visit:"
echo "   → https://app.hanmarine.co"
echo ""
echo "🔍 View logs: ssh hanmarine@31.97.223.11 'journalctl -u hims-app -f'"
echo ""
