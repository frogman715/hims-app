#!/bin/bash

#############################################################################
# HIMS GIT-BASED DEPLOYMENT SCRIPT v1.0
# Deploy langsung dari git ke VPS (lebih praktis untuk updates)
# Usage: bash deploy-from-git.sh <vps_ip> <domain> <db_password> <git_repo>
#############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_IP="${1:-}"
DOMAIN="${2:-}"
DB_PASSWORD="${3:-}"
GIT_REPO="${4:-https://github.com/frogman715/hims-app.git}"
APP_DIR="/var/www/hims-app"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  HIMS GIT-BASED DEPLOYMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Validate inputs
[ -z "$VPS_IP" ] && log_error "VPS IP required: bash deploy-from-git.sh <IP> <DOMAIN> <PASSWORD> [GIT_REPO]"
[ -z "$DOMAIN" ] && log_error "Domain required"
[ -z "$DB_PASSWORD" ] && log_error "Database password required"

log_step "Validating inputs..."
log_success "VPS IP: $VPS_IP"
log_success "Domain: $DOMAIN"
log_success "Git Repo: $GIT_REPO"

# Setup VPS
log_step "Setting up VPS (this may take a few minutes)..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFVPS'
set -e

# Update system
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# Install dependencies
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
fi

if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - 2>/dev/null || true
    sudo apt-get update -qq
    sudo apt-get install -y -qq postgresql-15
fi

if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y -qq nginx
fi

# Create app directory
sudo mkdir -p /var/www/hims-app
sudo chown ubuntu:ubuntu /var/www/hims-app
sudo mkdir -p /var/backups/hims-database
sudo chown postgres:postgres /var/backups/hims-database

EOFVPS

log_success "VPS setup complete"

# Create database
log_step "Creating production database..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFDB
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
EOFDB

log_success "Database created"

# Clone repository
log_step "Cloning git repository..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFGIT
cd /var/www/hims-app
git clone $GIT_REPO .

# Create .env.production
cat > .env.production << 'EOFENV'
NODE_ENV=production
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DATABASE_URL="postgresql://hims_prod_user:$DB_PASSWORD@localhost:5432/hims_production"
AWS_REGION=ap-southeast-1
LOG_LEVEL=info
EOFENV

chmod 600 .env.production

EOFGIT

log_success "Repository cloned"

# Install & build
log_step "Installing dependencies and building..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFBUILD'
set -e
cd /var/www/hims-app

# Install production dependencies
npm ci --production

# Build application
npm run build

# Generate Prisma client
npx prisma generate

EOFBUILD

log_success "Build complete"

# Run migrations
log_step "Running database migrations..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFMIGRATE'
set -e
cd /var/www/hims-app
export DATABASE_URL="postgresql://hims_prod_user:$DB_PASSWORD@localhost:5432/hims_production"
npx prisma migrate deploy
EOFMIGRATE

log_success "Migrations complete"

# Verify zero test data
log_step "Verifying ZERO test data..."

RESULT=$(ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFVERIFY'
set -e
sudo -u postgres psql -d hims_production -t -c "SELECT COUNT(*) FROM \"Crew\" WHERE email LIKE '%test%' OR email LIKE '%dummy%';" 2>/dev/null || echo "0"
EOFVERIFY
)

if [ "$RESULT" -ne 0 ]; then
    log_error "Found test data! Database must be clean. Records: $RESULT"
fi

log_success "Database verification: CLEAN ✓ (0 test records)"

# Setup systemd service
log_step "Setting up systemd service..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFSVC'
set -e

sudo tee /etc/systemd/system/hims-app.service > /dev/null << 'EOFSERVICE'
[Unit]
Description=HIMS Maritime Crew Management Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/hims-app
EnvironmentFile=/var/www/hims-app/.env.production
ExecStart=/usr/bin/node /var/www/hims-app/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOFSERVICE

sudo systemctl daemon-reload
sudo systemctl enable hims-app
sudo systemctl restart hims-app

sleep 2
EOFSVC

log_success "Systemd service configured and running"

# Setup Nginx
log_step "Configuring Nginx..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFNGINX
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
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    
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
    }
    
    client_max_body_size 100M;
}
EOFNGCONF

sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

EOFNGINX

log_success "Nginx configured"

# Setup SSL
log_step "Setting up SSL certificate..."

ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFSSL
set -e

if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y -qq certbot python3-certbot-nginx
fi

sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    -m admin@$DOMAIN 2>&1 || true

sudo systemctl restart nginx

EOFSSL

log_success "SSL certificate configured"

# Final verification
log_step "Final verification..."

sleep 3

if curl -s http://localhost:3000/api/health 2>/dev/null | grep -q '"status":"ok"'; then
    log_success "Application health check: PASSED ✓"
else
    log_error "Application health check failed"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOYMENT SUCCESSFUL! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "1. Update DNS A records to: $VPS_IP"
echo "2. Wait 10-30 minutes for DNS propagation"
echo "3. Visit https://$DOMAIN to verify"
echo ""
echo "Useful commands:"
echo "  Check logs: ssh ubuntu@$VPS_IP 'sudo journalctl -u hims-app -f'"
echo "  Restart: ssh ubuntu@$VPS_IP 'sudo systemctl restart hims-app'"
echo "  Redeploy: cd /var/www/hims-app && git pull && npm run build && pm2 restart hims-app"
echo ""
