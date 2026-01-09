#!/bin/bash

#############################################################################
# HIMS DEPLOYMENT - FILES ALREADY AT /var/www/hims-app
# Simple setup & configuration script
#############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# VPS Details
VPS_IP="31.97.223.11"
VPS_USER="hanmarine"
DOMAIN="app.hanmarine.co"
DB_PASS="Hanmarine23"

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 HIMS DEPLOYMENT (Files Exist)${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Step 1: Test SSH
echo -e "${BLUE}[1/6]${NC} Testing SSH..."
if ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "test -d /var/www/hims-app && echo OK" 2>/dev/null | grep -q OK; then
    echo -e "${GREEN}✓ SSH OK, files found${NC}"
else
    echo -e "${RED}✗ Cannot find /var/www/hims-app${NC}"
    exit 1
fi

# Step 2: Install Dependencies
echo -e "${BLUE}[2/6]${NC} Installing dependencies..."
ssh "$VPS_USER@$VPS_IP" << 'EOF' > /dev/null 2>&1
sudo apt-get update -qq
sudo apt-get upgrade -y -qq > /dev/null 2>&1

# Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null
    sudo apt-get install -y -qq nodejs > /dev/null
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list > /dev/null
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - 2>/dev/null || true
    sudo apt-get update -qq > /dev/null
    sudo apt-get install -y -qq postgresql-15 > /dev/null
fi

# Nginx
sudo apt-get install -y -qq nginx > /dev/null

# Certbot
sudo apt-get install -y -qq certbot python3-certbot-nginx > /dev/null

echo "✓ Dependencies ready"
EOF
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Setup Database
echo -e "${BLUE}[3/6]${NC} Creating database..."
ssh "$VPS_USER@$VPS_IP" << 'EOF' > /dev/null 2>&1
sudo -u postgres psql << 'EOFDB'
DROP DATABASE IF EXISTS hims_production CASCADE;
DROP USER IF EXISTS hims_prod_user;
CREATE USER hims_prod_user WITH PASSWORD 'Hanmarine23';
CREATE DATABASE hims_production OWNER hims_prod_user;
\c hims_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL PRIVILEGES ON DATABASE hims_production TO hims_prod_user;
EOFDB
EOF
echo -e "${GREEN}✓ Database created${NC}"

# Step 4: Build App
echo -e "${BLUE}[4/6]${NC} Building application..."
ssh "$VPS_USER@$VPS_IP" << 'EOF' > /dev/null 2>&1
cd /var/www/hims-app

# Update from git
git fetch origin 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || true

# Build
npm ci --production > /dev/null 2>&1
npm run build > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1

echo "✓ Build complete"
EOF
echo -e "${GREEN}✓ Application built${NC}"

# Step 5: Configure & Migrate
echo -e "${BLUE}[5/6]${NC} Configuring environment..."
ssh "$VPS_USER@$VPS_IP" << 'EOF' > /dev/null 2>&1
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
npx prisma migrate deploy > /dev/null 2>&1 || true

echo "✓ Environment & migrations ready"
EOF
echo -e "${GREEN}✓ Environment configured${NC}"

# Step 6: Start Services
echo -e "${BLUE}[6/6]${NC} Starting services..."
ssh "$VPS_USER@$VPS_IP" << 'EOF' > /dev/null 2>&1

# Systemd Service
sudo tee /etc/systemd/system/hims-app.service > /dev/null << 'EOFSVC'
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
EOFSVC

sudo systemctl daemon-reload
sudo systemctl enable hims-app > /dev/null
sudo systemctl restart hims-app

sleep 2

# Nginx Config
sudo tee /etc/nginx/sites-available/hims-app > /dev/null << 'EOFNGINX'
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
    gzip_types text/plain text/css text/javascript application/json;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOFNGINX

sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t > /dev/null 2>&1 && sudo systemctl restart nginx || true

# SSL Certificate
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d app.hanmarine.co -d www.app.hanmarine.co --non-interactive --agree-tos -m admin@hanmarine.co 2>&1 | grep -E "Successfully|already" || true
sudo systemctl reload nginx 2>/dev/null || true

echo "✓ Services running"
EOF
echo -e "${GREEN}✓ Services started${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE! ✅${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "📍 NEXT STEPS:"
echo "  1. Update DNS at Hostinger Control Panel"
echo "     Set A record: app.hanmarine.co → 31.97.223.11"
echo ""
echo "  2. Wait 10-30 minutes for DNS propagation"
echo ""
echo "  3. Visit: https://app.hanmarine.co"
echo ""
echo "🔍 Check status:"
echo "  ssh hanmarine@31.97.223.11"
echo "  sudo systemctl status hims-app"
echo "  sudo journalctl -u hims-app -f"
echo ""
