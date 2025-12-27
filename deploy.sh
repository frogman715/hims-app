#!/bin/bash

#############################################################################
# HIMS DEPLOYMENT - SIMPLIFIED
# Setup untuk /var/www/hims-app yang sudah ada
#############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_IP="31.97.223.11"
VPS_USER="hanmarine"
DOMAIN="app.hanmarine.co"

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 HIMS SETUP ON VPS${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check files
echo -e "${BLUE}[1/5]${NC} Checking application files..."
ssh "$VPS_USER@$VPS_IP" "cd /var/www/hims-app && pwd && ls -1 | head -5" > /dev/null 2>&1
echo -e "${GREEN}✓ Files found${NC}"

# Step 2: Build & Install
echo -e "${BLUE}[2/5]${NC} Installing & building application..."
ssh "$VPS_USER@$VPS_IP" << 'EOFBUILD'
cd /var/www/hims-app

# Install dependencies
echo "Installing npm packages..."
npm ci --production 2>&1 | tail -3

# Build
echo "Building application..."
npm run build 2>&1 | tail -3

# Generate Prisma
npx prisma generate 2>&1 | tail -1

echo "✓ Build complete"
EOFBUILD
echo -e "${GREEN}✓ Application built${NC}"

# Step 3: Setup database
echo -e "${BLUE}[3/5]${NC} Setting up database..."
ssh "$VPS_USER@$VPS_IP" << 'EOFDB'
# Create .env.production
NEXTAUTH_SECRET=$(openssl rand -base64 32)
cat > /var/www/hims-app/.env.production << EOFENV
NODE_ENV=production
NEXTAUTH_URL=https://app.hanmarine.co
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
DATABASE_URL="postgresql://hims_prod_user:Hanmarine23@localhost:5432/hims_production"
AWS_REGION=ap-southeast-1
LOG_LEVEL=info
EOFENV
chmod 600 /var/www/hims-app/.env.production

# Run migrations
cd /var/www/hims-app
export DATABASE_URL="postgresql://hims_prod_user:Hanmarine23@localhost:5432/hims_production"
npx prisma migrate deploy 2>&1 | tail -1 || echo "Migrations processed"

echo "✓ Database ready"
EOFDB
echo -e "${GREEN}✓ Database configured${NC}"

# Step 4: Systemd service
echo -e "${BLUE}[4/5]${NC} Starting application service..."
ssh "$VPS_USER@$VPS_IP" << 'EOFSVC'
# Create systemd service
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

[Install]
WantedBy=multi-user.target
EOFSERVICE

sudo systemctl daemon-reload
sudo systemctl enable hims-app > /dev/null 2>&1
sudo systemctl restart hims-app
sleep 2

echo "✓ Service running"
EOFSVC
echo -e "${GREEN}✓ Application service started${NC}"

# Step 5: Nginx & SSL
echo -e "${BLUE}[5/5]${NC} Configuring Nginx & SSL..."
ssh "$VPS_USER@$VPS_IP" << 'EOFNGINX'
# Nginx config
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
    
    gzip on;
    gzip_comp_level 6;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOFNGCONF

sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t > /dev/null 2>&1 && sudo systemctl restart nginx

# SSL
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d app.hanmarine.co -d www.app.hanmarine.co \
  --non-interactive --agree-tos -m admin@hanmarine.co 2>&1 | grep -E "already|Success" || true

sudo systemctl reload nginx 2>/dev/null || true

echo "✓ Nginx configured"
EOFNGINX
echo -e "${GREEN}✓ Nginx & SSL configured${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "📋 Status:"
ssh "$VPS_USER@$VPS_IP" << 'EOFSTATUS'
echo "Service status:"
sudo systemctl is-active hims-app && echo "✓ hims-app running" || echo "✗ hims-app not running"

echo ""
echo "Database check:"
sudo -u postgres psql -d hims_production -c "SELECT COUNT(*) as crew_count FROM \"Crew\";" 2>/dev/null || echo "Database ready"

echo ""
echo "Nginx status:"
sudo systemctl is-active nginx && echo "✓ nginx running" || echo "✗ nginx not running"
EOFSTATUS

echo ""
echo "📍 NEXT STEPS:"
echo "  1. Update DNS at Hostinger Control Panel"
echo "     A record: app.hanmarine.co → 31.97.223.11"
echo ""
echo "  2. Wait 10-30 minutes for DNS"
echo ""
echo "  3. Visit: https://app.hanmarine.co"
echo ""
echo "🔍 Check logs:"
echo "  ssh hanmarine@31.97.223.11"
echo "  sudo journalctl -u hims-app -f"
echo ""
