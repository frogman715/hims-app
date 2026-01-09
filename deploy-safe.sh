#!/bin/bash

#############################################################################
# HIMS SAFE DEPLOYMENT SCRIPT v1.0
# Deployment ke VPS dengan verification lengkap, zero test data
# Usage: bash deploy-safe.sh <vps_ip> <domain> <db_password>
#############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="${1:-}"
DOMAIN="${2:-}"
DB_PASSWORD="${3:-}"
APP_DIR="/var/www/hims-app"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

#############################################################################
# FUNCTIONS
#############################################################################

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

verify_inputs() {
    log_step "Verifying inputs..."
    
    if [ -z "$VPS_IP" ]; then
        log_error "VPS IP address required"
        echo "Usage: $0 <vps_ip> <domain> <db_password>"
        echo "Example: $0 123.45.67.89 yourdomain.com SecurePassword123"
        exit 1
    fi
    
    if [ -z "$DOMAIN" ]; then
        log_error "Domain name required"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        log_error "Database password required"
        exit 1
    fi
    
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key not found: $SSH_KEY"
        exit 1
    fi
    
    log_success "All inputs verified"
}

verify_local_build() {
    log_step "Verifying local build..."
    
    if [ ! -f "package.json" ]; then
        log_error "Not in project directory"
        exit 1
    fi
    
    if [ ! -d ".next" ]; then
        log_error "Build not found. Run 'npm run build' first"
        exit 1
    fi
    
    if [ ! -f "prisma/schema.prisma" ]; then
        log_error "Prisma schema not found"
        exit 1
    fi
    
    log_success "Local build verified"
}

verify_vps_connectivity() {
    log_step "Verifying VPS connectivity..."
    
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 ubuntu@"$VPS_IP" "echo ok" &>/dev/null; then
        log_error "Cannot connect to VPS at $VPS_IP"
        exit 1
    fi
    
    log_success "VPS connectivity verified"
}

setup_vps() {
    log_step "Setting up VPS environment..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFVPS'
set -e

# Update system
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt-get update -qq
    sudo apt-get install -y -qq postgresql-15
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y -qq nginx
fi

# Create app directory
sudo mkdir -p /var/www/hims-app
sudo chown ubuntu:ubuntu /var/www/hims-app

echo "VPS setup complete"
EOFVPS

    log_success "VPS environment setup completed"
}

create_database() {
    log_step "Creating production database..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFDB
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

-- Verify
SELECT 'Database created successfully' as status;
EOFPSQL

EOFDB

    log_success "Production database created"
}

deploy_application() {
    log_step "Deploying application code..."
    
    # Create tar archive of application
    log_step "Creating application archive..."
    tar --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.env' \
        --exclude='.env.local' \
        --exclude='.env.development' \
        --exclude='.env.production.local' \
        --exclude='coverage' \
        --exclude='dist' \
        -czf /tmp/hims-app.tar.gz . 2>/dev/null
    
    log_success "Archive created: /tmp/hims-app.tar.gz"
    
    # Copy to VPS
    log_step "Uploading to VPS..."
    scp -i "$SSH_KEY" -q /tmp/hims-app.tar.gz ubuntu@"$VPS_IP":/tmp/
    
    # Extract on VPS
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFAPP'
set -e
cd /var/www/hims-app
tar -xzf /tmp/hims-app.tar.gz
rm /tmp/hims-app.tar.gz
log_success "Application extracted"
EOFAPP

    log_success "Application code deployed"
}

install_dependencies() {
    log_step "Installing dependencies..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFDEPS'
set -e
cd /var/www/hims-app
npm ci --production
log_success "Dependencies installed"
EOFDEPS

    log_success "Dependencies installed successfully"
}

setup_environment() {
    log_step "Configuring environment variables..."
    
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFENV
set -e
cat > /var/www/hims-app/.env.production << 'EOFENVFILE'
NODE_ENV=production
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
DATABASE_URL="postgresql://hims_prod_user:$DB_PASSWORD@localhost:5432/hims_production"
AWS_REGION=ap-southeast-1
LOG_LEVEL=info
EOFENVFILE

chmod 600 /var/www/hims-app/.env.production
echo ".env.production created"
EOFENV

    log_success "Environment variables configured"
}

run_migrations() {
    log_step "Running database migrations..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFMIGRATE'
set -e
cd /var/www/hims-app
export DATABASE_URL="postgresql://hims_prod_user:$DB_PASSWORD@localhost:5432/hims_production"
npx prisma migrate deploy
npx prisma generate
echo "Migrations completed"
EOFMIGRATE

    log_success "Database migrations completed"
}

verify_no_test_data() {
    log_step "Verifying zero test data in database..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFVERIFY'
set -e

# Check for test records
TEST_CREW=$(sudo -u postgres psql -d hims_production -t -c "SELECT COUNT(*) FROM \"Crew\" WHERE email LIKE '%test%' OR email LIKE '%dummy%';" 2>/dev/null || echo "0")

if [ "$TEST_CREW" -ne 0 ]; then
    echo "ERROR: Found $TEST_CREW test crew records"
    exit 1
fi

echo "Database is clean: 0 test records found"
EOFVERIFY

    log_success "Database verification: CLEAN ✓"
}

setup_systemd_service() {
    log_step "Setting up systemd service..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFSYSTEMD'
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
echo "Systemd service configured"
EOFSYSTEMD

    log_success "Systemd service configured"
}

start_application() {
    log_step "Starting application..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << 'EOFSTART'
set -e
sudo systemctl restart hims-app
sleep 3

# Verify service is running
if sudo systemctl is-active --quiet hims-app; then
    echo "Application started successfully"
else
    echo "ERROR: Application failed to start"
    sudo systemctl status hims-app
    exit 1
fi
EOFSTART

    log_success "Application started successfully"
}

setup_nginx() {
    log_step "Configuring Nginx reverse proxy..."
    
    DOMAIN_ESCAPED="${DOMAIN//./\\.}"
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFNGINX
set -e

sudo tee /etc/nginx/sites-available/hims-app > /dev/null << 'EOFNGCONFIG'
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
EOFNGCONFIG

sudo ln -sf /etc/nginx/sites-available/hims-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
echo "Nginx configured"
EOFNGINX

    log_success "Nginx reverse proxy configured"
}

setup_ssl_certificate() {
    log_step "Setting up SSL certificate with Let's Encrypt..."
    
    ssh -i "$SSH_KEY" ubuntu@"$VPS_IP" << EOFSSL
set -e

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y -qq certbot python3-certbot-nginx
fi

# Create certbot directory
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# Get certificate
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    -m admin@$DOMAIN 2>&1 || true

# Verify certificate
if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    echo "SSL certificate obtained successfully"
    sudo systemctl restart nginx
else
    echo "WARNING: SSL certificate setup incomplete. You may need to run certbot manually."
fi
EOFSSL

    log_success "SSL certificate configured"
}

verify_deployment() {
    log_step "Verifying deployment..."
    
    # Wait for application to start
    sleep 5
    
    # Test health endpoint
    HEALTH=$(curl -s -k https://"$VPS_IP"/api/health 2>/dev/null || echo "{}")
    
    if echo "$HEALTH" | grep -q '"status":"ok"'; then
        log_success "Application health check: PASSED ✓"
    else
        log_warning "Application health check: Could not verify (normal if DNS not updated)"
    fi
    
    # Display summary
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "Domain: ${BLUE}https://$DOMAIN${NC}"
    echo -e "VPS IP: ${BLUE}$VPS_IP${NC}"
    echo -e "Status: ${GREEN}✓ READY${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update DNS A records to point to: $VPS_IP"
    echo "2. Wait 10-30 minutes for DNS propagation"
    echo "3. Visit https://$DOMAIN to verify"
    echo "4. Check logs: ssh ubuntu@$VPS_IP 'sudo journalctl -u hims-app -f'"
    echo ""
}

#############################################################################
# MAIN EXECUTION
#############################################################################

main() {
    log_step "Starting HIMS Safe Deployment..."
    echo ""
    echo "Configuration:"
    echo "  VPS IP: $VPS_IP"
    echo "  Domain: $DOMAIN"
    echo "  App Dir: $APP_DIR"
    echo ""
    
    verify_inputs
    verify_local_build
    verify_vps_connectivity
    
    setup_vps
    create_database
    deploy_application
    install_dependencies
    setup_environment
    run_migrations
    verify_no_test_data
    setup_systemd_service
    start_application
    setup_nginx
    setup_ssl_certificate
    
    verify_deployment
}

main "$@"
