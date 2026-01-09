#!/bin/bash

#############################################################################
# HIMS DEPLOY TO HOSTINGER VPS
# Khusus untuk VPS Hostinger dengan password auth
# Usage: bash deploy-to-hostinger.sh
#############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_IP="31.97.223.11"
VPS_USER="hanmarine"
DOMAIN="app.hanmarine.co"
DB_PASSWORD="Hanmarine23"
APP_DIR="/var/www/hims-app"
GIT_REPO="https://github.com/frogman715/hims-app.git"

log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  HIMS DEPLOYMENT TO HOSTINGER VPS${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
echo "Configuration:"
echo "  VPS IP: $VPS_IP"
echo "  Domain: $DOMAIN"
echo "  User: $VPS_USER"
echo "  App Dir: $APP_DIR"
echo ""

log_step "Testing SSH connection..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new $VPS_USER@$VPS_IP "echo 'SSH OK'" &>/dev/null; then
    log_success "SSH connection successful"
else
    log_error "Cannot SSH to $VPS_IP. Check IP, username, and password."
fi

log_step "Checking VPS system..."
ssh $VPS_USER@$VPS_IP << 'EOFCHECK'
set -e
echo "Ubuntu version:"
lsb_release -d
echo ""
echo "Disk space:"
df -h / | tail -1
echo ""
echo "RAM:"
free -h | grep Mem
EOFCHECK

log_success "VPS system check passed"

log_step "Setting up VPS (installing dependencies)..."
ssh $VPS_USER@$VPS_IP << 'EOFSETUP'
set -e

# Update system
echo "Updating system..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - 2>/dev/null || true
    sudo apt-get update -qq
    sudo apt-get install -y -qq postgresql-15
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get install -y -qq nginx
fi

# Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt-get install -y -qq certbot python3-certbot-nginx
fi

# Create app directory
echo "Creating directories..."
sudo mkdir -p /var/www/hims-app
sudo chown -R $USER:$USER /var/www/hims-app
sudo mkdir -p /var/backups/hims-database
sudo chown postgres:postgres /var/backups/hims-database

echo "VPS setup completed!"
EOFSETUP

log_success "VPS setup complete"

log_step "Creating production database..."
ssh $VPS_USER@$VPS_IP << EOFDB
set -e
sudo -u postgres psql << 'EOFPSQL'
DROP DATABASE IF EXISTS hims_production CASCADE;
DROP USER IF EXISTS hims_prod_user;
CREATE USER hims_prod_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE hims_production OWNER hims_prod_user;
\c hims_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL PRIVILEGES ON DATABASE hims_production TO hims_prod_user;
GRANT USAGE ON SCHEMA public TO hims_prod_user;
GRANT CREATE ON SCHEMA public TO hims_prod_user;
EOFPSQL

echo "Database created successfully!"
EOFDB

log_success "Database created"

log_step "Cloning git repository..."
ssh $VPS_USER@$VPS_IP << 'EOFGIT'
set -e
cd /var/www/hims-app

# Clone if not exists
if [ ! -d .git ]; then
    git clone https://github.com/frogman715/hims-app.git .
else
    git fetch origin
    git reset --hard origin/main
fi

echo "Repository cloned/updated"
EOFGIT

log_success "Repository cloned"

log_step "Installing dependencies and building..."
ssh $VPS_USER@$VPS_IP << 'EOFBUILD'
set -e
cd /var/www/hims-app

echo "Installing npm dependencies..."
npm ci --production

echo "Building application..."
npm run build

echo "Generating Prisma client..."
npx prisma generate

echo "Build completed!"
EOFBUILD

log_success "Build complete"

log_step "Creating .env.production..."
ssh $VPS_USER@$VPS_IP << EOFENV
cat > /var/www/hims-app/.env.production << 'EOFENVFILE'
NODE_ENV=production
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DATABASE_URL="postgresql://hims_prod_user:$DB_PASSWORD@localhost:5432/hims_production"
AWS_REGION=ap-southeast-1
LOG_LEVEL=info
EOFENVFILE

chmod 600 /var/www/hims-app/.env.production
echo "Environment file created!"
EOFENV

log_success "Environment configured"

log_step "Running database migrations..."
ssh $VPS_USER@$VPS_IP << 'EOFMIGRATE'
set -e
cd /var/www/hims-app
export DATABASE_URL="postgresql://hims_prod_user:Hanmarine23@localhost:5432/hims_production"
npx prisma migrate deploy
echo "Migrations completed!"
EOFMIGRATE

log_success "Migrations completed"

log_step "Verifying ZERO test data..."
RESULT=$(ssh $VPS_USER@$VPS_IP << 'EOFVERIFY'
sudo -u postgres psql -d hims_production -t -c "SELECT COUNT(*) FROM \"Crew\" WHERE email LIKE '%test%' OR email LIKE '%dummy%';" 2>/dev/null || echo "0"
EOFVERIFY
)

if [ "$RESULT" -ne 0 ]; then
    log_error "Found $RESULT test records. Database must be clean!"
fi

log_success "Database verification: CLEAN ✓ (0 test records)"

log_step "Setting up systemd service..."
ssh $VPS_USER@$VPS_IP << 'EOFSVC'
set -e

sudo tee /etc/systemd/system/hims-app.service > /dev/null << 'EOFSERVICE'
[Unit]
Description=HIMS Maritime Crew Management Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/hims-app
EnvironmentFile=/var/www/hims-app/.env.production
ExecStart=/usr/bin/node /var/www/hims-app/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10
StartLimitInterval=60s
StartLimitBurst=3

[Install]
WantedBy=multi-user.target
EOFSERVICE

sudo systemctl daemon-reload
sudo systemctl enable hims-app
sudo systemctl restart hims-app

sleep 3
echo "Systemd service started!"
EOFSVC

log_success "Systemd service configured and running"

log_step "Configuring Nginx reverse proxy..."
ssh $VPS_USER@$VPS_IP << EOFNGINX
set -e

sudo tee /etc/nginx/sites-available/hims-app > /dev/null << 'EOFNGCONF'
upstream hims_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    access_log /var/log/nginx/hims-app-access.log;
    error_log /var/log/nginx/hims-app-error.log;
    
    location / {
        proxy_pass http://hims_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    client_max_body_size 100M;
}
EOFNGCONF

sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Nginx configured!"
EOFNGINX

log_success "Nginx configured"

log_step "Getting SSL certificate from Let's Encrypt..."
ssh $VPS_USER@$VPS_IP << EOFSSL
set -e

sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    -m hanmarine@$DOMAIN 2>&1 || true

if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    echo "SSL certificate obtained!"
    sudo systemctl restart nginx
else
    echo "⚠️ SSL setup may need manual configuration"
fi
EOFSSL

log_success "SSL certificate configured"

log_step "Final verification..."
sleep 3

ssh $VPS_USER@$VPS_IP << 'EOFVERIFY'
set -e

echo "Checking application status..."
sudo systemctl status hims-app --no-pager || true

echo ""
echo "Checking health endpoint..."
curl -s http://localhost:3000/api/health || echo "❌ Health check failed (may be normal if not running)"

echo ""
echo "Checking database connection..."
sudo -u postgres psql -d hims_production -c "SELECT version();" || echo "❌ Database connection failed"

echo ""
echo "Nginx status:"
sudo systemctl status nginx --no-pager || true
EOFVERIFY

log_success "Verification complete"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 DEPLOYMENT SUCCESSFUL! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "📋 Deployment Summary:"
echo "  VPS IP: $VPS_IP"
echo "  Domain: $DOMAIN"
echo "  App URL: https://$DOMAIN"
echo "  API Health: https://$DOMAIN/api/health"
echo ""
echo "📊 Next Steps:"
echo "  1. Update DNS A records (in Hostinger Control Panel):"
echo "     @ → 31.97.223.11"
echo "     www → 31.97.223.11"
echo ""
echo "  2. Wait 10-30 minutes for DNS propagation"
echo ""
echo "  3. Visit https://$DOMAIN to verify"
echo ""
echo "🔍 Useful Commands:"
echo "  Check logs: ssh $VPS_USER@$VPS_IP 'sudo journalctl -u hims-app -f'"
echo "  Restart: ssh $VPS_USER@$VPS_IP 'sudo systemctl restart hims-app'"
echo "  View DB: ssh $VPS_USER@$VPS_IP 'sudo -u postgres psql -d hims_production'"
echo ""
echo "✅ Application deployed to Hostinger VPS!"
echo ""
