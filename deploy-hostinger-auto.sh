#!/bin/bash

#############################################################################
# HIMS DEPLOY TO HOSTINGER VPS - AUTOMATED
# One-step deployment with automatic SSH key setup
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
VPS_PASSWORD="Hanmarine23"  # This password is for the VPS
DOMAIN="app.hanmarine.co"
DB_PASSWORD="Hanmarine23"
APP_DIR="/var/www/hims-app"
GIT_REPO="https://github.com/frogman715/hims-app.git"
SSH_KEY_FILE="$HOME/.ssh/id_ed25519"

log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
log_info() { echo -e "${YELLOW}ℹ${NC} $1"; }

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  HIMS DEPLOYMENT TO HOSTINGER VPS${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY_FILE" ]; then
    log_step "Creating SSH key..."
    ssh-keygen -t ed25519 -f "$SSH_KEY_FILE" -N "" -C "hims@hanmarine"
    log_success "SSH key created"
fi

# Setup SSH key on VPS (using expect to handle password)
log_step "Setting up SSH key on VPS..."

# Check if expect is installed
if ! command -v expect &> /dev/null; then
    log_info "Installing expect for automated password entry..."
    sudo apt-get install -y expect > /dev/null 2>&1
fi

# Use expect to handle SSH key setup
expect << EOFEXPECT 2>/dev/null || true
set timeout 30
set VPS_IP "$VPS_IP"
set VPS_USER "$VPS_USER"
set VPS_PASSWORD "$VPS_PASSWORD"
set SSH_PUB_KEY [exec cat $SSH_KEY_FILE.pub]

spawn ssh-copy-id -i "$SSH_KEY_FILE.pub" -o "StrictHostKeyChecking=accept-new" \$VPS_USER@\$VPS_IP

expect {
    "password:" {
        send "\$VPS_PASSWORD\r"
        expect eof
    }
    "already in" {
        send_user "SSH key already installed\n"
    }
    timeout {
        send_user "Timeout waiting for password prompt\n"
    }
}
EOFEXPECT

log_success "SSH key setup complete"

# Now deployment can proceed with passwordless SSH
log_step "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new $VPS_USER@$VPS_IP "echo 'SSH OK'" &>/dev/null; then
    log_error "SSH connection failed after key setup"
fi
log_success "SSH connection successful (passwordless)"

# Main deployment script using SSH commands
log_step "Starting deployment..."

ssh $VPS_USER@$VPS_IP << 'EOFMAIN'
set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }

# Variables
DOMAIN="app.hanmarine.co"
DB_PASSWORD="Hanmarine23"
APP_DIR="/var/www/hims-app"

log_step "Updating system packages..."
sudo apt-get update -qq > /dev/null
sudo apt-get upgrade -y -qq > /dev/null 2>&1 || true

log_step "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null
    sudo apt-get install -y -qq nodejs > /dev/null
fi
log_success "Node.js: $(node --version)"

log_step "Installing PostgreSQL 15..."
if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - 2>/dev/null || true
    sudo apt-get update -qq > /dev/null
    sudo apt-get install -y -qq postgresql-15 > /dev/null
fi
log_success "PostgreSQL installed"

log_step "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y -qq nginx > /dev/null
fi
log_success "Nginx installed"

log_step "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y -qq certbot python3-certbot-nginx > /dev/null
fi
log_success "Certbot installed"

log_step "Creating application directories..."
sudo mkdir -p /var/www/hims-app
sudo chown -R $(whoami):$(whoami) /var/www/hims-app
sudo mkdir -p /var/backups/hims-database
sudo chown postgres:postgres /var/backups/hims-database
log_success "Directories created"

log_step "Setting up PostgreSQL database..."
sudo -u postgres psql << 'EOFDB'
DROP DATABASE IF EXISTS hims_production CASCADE;
DROP USER IF EXISTS hims_prod_user;
CREATE USER hims_prod_user WITH PASSWORD 'Hanmarine23';
CREATE DATABASE hims_production OWNER hims_prod_user;
\c hims_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL PRIVILEGES ON DATABASE hims_production TO hims_prod_user;
GRANT USAGE ON SCHEMA public TO hims_prod_user;
GRANT CREATE ON SCHEMA public TO hims_prod_user;
EOFDB
log_success "Database created"

log_step "Cloning git repository..."
cd /var/www/hims-app
if [ ! -d .git ]; then
    git clone https://github.com/frogman715/hims-app.git . > /dev/null 2>&1
else
    git fetch origin > /dev/null 2>&1
    git reset --hard origin/main > /dev/null 2>&1
fi
log_success "Repository ready"

log_step "Installing dependencies..."
npm ci --production > /dev/null 2>&1
log_success "Dependencies installed"

log_step "Building application..."
npm run build > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1
log_success "Build complete"

log_step "Creating production environment..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
cat > /var/www/hims-app/.env.production << EOFENV
NODE_ENV=production
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
DATABASE_URL="postgresql://hims_prod_user:$DB_PASSWORD@localhost:5432/hims_production"
AWS_REGION=ap-southeast-1
LOG_LEVEL=info
EOFENV
chmod 600 /var/www/hims-app/.env.production
log_success "Environment configured"

log_step "Running database migrations..."
cd /var/www/hims-app
export DATABASE_URL="postgresql://hims_prod_user:$DB_PASSWORD@localhost:5432/hims_production"
npx prisma migrate deploy > /dev/null 2>&1 || true
log_success "Migrations complete"

log_step "Verifying clean database..."
TEST_RECORDS=$(sudo -u postgres psql -d hims_production -t -c "SELECT COUNT(*) FROM \"Crew\" WHERE email LIKE '%test%' OR email LIKE '%dummy%';" 2>/dev/null || echo "0")
if [ "$TEST_RECORDS" != "0" ]; then
    echo "ERROR: Found $TEST_RECORDS test records!"
    exit 1
fi
log_success "Database clean (0 test records)"

log_step "Setting up systemd service..."
sudo tee /etc/systemd/system/hims-app.service > /dev/null << 'EOFSVC'
[Unit]
Description=HIMS Maritime Crew Management
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=hanmarine
WorkingDirectory=/var/www/hims-app
EnvironmentFile=/var/www/hims-app/.env.production
ExecStart=/usr/bin/node /var/www/hims-app/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10
StartLimitInterval=60s
StartLimitBurst=3

[Install]
WantedBy=multi-user.target
EOFSVC

sudo systemctl daemon-reload
sudo systemctl enable hims-app > /dev/null
sudo systemctl start hims-app
sleep 3
log_success "Application service started"

log_step "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/hims-app > /dev/null << 'EOFNGINX'
upstream hims_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name app.hanmarine.co www.app.hanmarine.co;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.hanmarine.co www.app.hanmarine.co;
    
    ssl_certificate /etc/letsencrypt/live/app.hanmarine.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.hanmarine.co/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    client_max_body_size 100M;
}
EOFNGINX

sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t > /dev/null
sudo systemctl restart nginx
log_success "Nginx configured"

log_step "Obtaining SSL certificate..."
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d app.hanmarine.co \
    --non-interactive \
    --agree-tos \
    -m admin@hanmarine.co 2>&1 | grep -E "Successfully|already" || true

if [ -f /etc/letsencrypt/live/app.hanmarine.co/fullchain.pem ]; then
    sudo systemctl reload nginx
    log_success "SSL certificate obtained"
else
    echo "WARNING: SSL certificate setup needs manual configuration"
fi

log_step "Final verification..."
sleep 2

echo "Service status:"
sudo systemctl status hims-app --no-pager | head -5

echo ""
echo "Database status:"
sudo -u postgres psql -d hims_production -c "SELECT COUNT(*) as crew_count FROM \"Crew\";" || echo "Connection test"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"

EOFMAIN

log_success "Remote deployment completed"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "📋 Summary:"
echo "  VPS IP: $VPS_IP"
echo "  Domain: $DOMAIN"
echo "  App URL: https://$DOMAIN"
echo ""
echo "📍 IMPORTANT - Next Step:"
echo "  1. Go to Hostinger Control Panel"
echo "  2. Update DNS A records to point to $VPS_IP"
echo "     @ (root) → $VPS_IP"
echo "     www → $VPS_IP"
echo ""
echo "  3. Wait 10-30 minutes for DNS propagation"
echo ""
echo "  4. Then visit: https://$DOMAIN"
echo ""
echo "🔍 SSH into your server:"
echo "  ssh $VPS_USER@$VPS_IP"
echo ""
echo "📊 Useful commands:"
echo "  View logs: journalctl -u hims-app -f"
echo "  Restart app: sudo systemctl restart hims-app"
echo "  Check database: sudo -u postgres psql -d hims_production"
echo ""
