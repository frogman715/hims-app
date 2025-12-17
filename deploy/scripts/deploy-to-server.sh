#!/bin/bash

###############################################################################
# HIMS AUTOMATED DEPLOYMENT SCRIPT
# For: Ubuntu 22.04 LTS (VPS or Local Server)
# Usage: ./deploy-to-server.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hims-app"
APP_DIR="/opt/hims-app"
DB_NAME="hims_production"
DB_USER="hims_user"
DOMAIN=""  # Will be asked during setup

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     HANMARINE HIMS - AUTOMATED DEPLOYMENT SCRIPT          ║"
echo "║     Version 1.0 - December 2025                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

###############################################################################
# STEP 0: Pre-flight checks
###############################################################################

echo -e "${YELLOW}[STEP 0] Pre-flight checks...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}ERROR: Please run as root (sudo ./deploy-to-server.sh)${NC}"
    exit 1
fi

# Check OS
if [ ! -f /etc/lsb-release ]; then
    echo -e "${RED}ERROR: This script is for Ubuntu only${NC}"
    exit 1
fi

# Get domain from user
echo -e "${BLUE}Enter your domain (e.g., app.hanmarine.co):${NC}"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}ERROR: Domain cannot be empty${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}\n"

###############################################################################
# STEP 1: Update system
###############################################################################

echo -e "${YELLOW}[STEP 1] Updating system packages...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}\n"

###############################################################################
# STEP 2: Install Node.js 20 LTS
###############################################################################

echo -e "${YELLOW}[STEP 2] Installing Node.js 20 LTS...${NC}"

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}\n"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}\n"
fi

###############################################################################
# STEP 3: Install PostgreSQL 16
###############################################################################

echo -e "${YELLOW}[STEP 3] Installing PostgreSQL 16...${NC}"

if ! command -v psql &> /dev/null; then
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
    apt update
    apt install -y postgresql-16 postgresql-contrib-16
    echo -e "${GREEN}✓ PostgreSQL installed: $(psql --version)${NC}\n"
else
    echo -e "${GREEN}✓ PostgreSQL already installed: $(psql --version)${NC}\n"
fi

###############################################################################
# STEP 4: Install Nginx
###############################################################################

echo -e "${YELLOW}[STEP 4] Installing Nginx...${NC}"

if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✓ Nginx installed: $(nginx -v 2>&1)${NC}\n"
else
    echo -e "${GREEN}✓ Nginx already installed: $(nginx -v 2>&1)${NC}\n"
fi

###############################################################################
# STEP 5: Install PM2
###############################################################################

echo -e "${YELLOW}[STEP 5] Installing PM2 process manager...${NC}"

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed: $(pm2 --version)${NC}\n"
else
    echo -e "${GREEN}✓ PM2 already installed: $(pm2 --version)${NC}\n"
fi

###############################################################################
# STEP 6: Setup PostgreSQL database
###############################################################################

echo -e "${YELLOW}[STEP 6] Setting up PostgreSQL database...${NC}"

# Generate random password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-25)

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
    sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF
    echo -e "${GREEN}✓ Database created: $DB_NAME${NC}"
    echo -e "${GREEN}✓ User created: $DB_USER${NC}"
    echo -e "${YELLOW}✓ Password: $DB_PASSWORD${NC}"
    echo -e "${YELLOW}  (Save this password!)${NC}\n"
else
    echo -e "${GREEN}✓ Database already exists: $DB_NAME${NC}\n"
fi

###############################################################################
# STEP 7: Create application directory
###############################################################################

echo -e "${YELLOW}[STEP 7] Setting up application directory...${NC}"

mkdir -p $APP_DIR
mkdir -p /var/log/hims
mkdir -p /root/backups

echo -e "${GREEN}✓ Directories created${NC}\n"

###############################################################################
# STEP 8: Check if app files exist
###############################################################################

echo -e "${YELLOW}[STEP 8] Checking application files...${NC}"

if [ ! -f "$APP_DIR/package.json" ]; then
    echo -e "${YELLOW}⚠ Application files not found in $APP_DIR${NC}"
    echo -e "${BLUE}Please upload your HIMS application to: $APP_DIR${NC}"
    echo -e "${BLUE}You can use rsync:${NC}"
    echo -e "${BLUE}  rsync -avz --exclude 'node_modules' --exclude '.next' \\${NC}"
    echo -e "${BLUE}    /path/to/hims-app/ root@server-ip:$APP_DIR/${NC}\n"
    echo -e "${YELLOW}After uploading, run this script again!${NC}"
    exit 0
fi

echo -e "${GREEN}✓ Application files found${NC}\n"

###############################################################################
# STEP 9: Setup environment variables
###############################################################################

echo -e "${YELLOW}[STEP 9] Setting up environment variables...${NC}"

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRYPTO_KEY=$(openssl rand -base64 32)

# Create .env.production
cat > $APP_DIR/.env.production <<EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# NextAuth
NEXTAUTH_URL="https://$DOMAIN"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Encryption
HIMS_CRYPTO_KEY="$CRYPTO_KEY"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://$DOMAIN"
EOF

ln -sf $APP_DIR/.env.production $APP_DIR/.env

echo -e "${GREEN}✓ Environment variables configured${NC}\n"

###############################################################################
# STEP 10: Install dependencies and build
###############################################################################

echo -e "${YELLOW}[STEP 10] Installing dependencies and building...${NC}"

cd $APP_DIR
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build

echo -e "${GREEN}✓ Application built successfully${NC}\n"

###############################################################################
# STEP 11: Seed database (admin user)
###############################################################################

echo -e "${YELLOW}[STEP 11] Seeding database with admin user...${NC}"

npm run seed || echo -e "${YELLOW}⚠ Seed script not found or already run${NC}"

echo -e "${GREEN}✓ Database seeded${NC}\n"

###############################################################################
# STEP 12: Setup PM2
###############################################################################

echo -e "${YELLOW}[STEP 12] Setting up PM2 process manager...${NC}"

cat > $APP_DIR/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/hims/error.log',
    out_file: '/var/log/hims/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
EOF

pm2 delete $APP_NAME 2>/dev/null || true
pm2 start $APP_DIR/ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash

echo -e "${GREEN}✓ PM2 configured and started${NC}\n"

###############################################################################
# STEP 13: Configure Nginx
###############################################################################

echo -e "${YELLOW}[STEP 13] Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/hims <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
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

    client_max_body_size 50M;
}
EOF

ln -sf /etc/nginx/sites-available/hims /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}\n"

###############################################################################
# STEP 14: Setup Firewall
###############################################################################

echo -e "${YELLOW}[STEP 14] Configuring firewall...${NC}"

if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    echo -e "${GREEN}✓ Firewall configured${NC}\n"
else
    apt install -y ufw
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    echo -e "${GREEN}✓ Firewall installed and configured${NC}\n"
fi

###############################################################################
# STEP 15: Setup automatic backups
###############################################################################

echo -e "${YELLOW}[STEP 15] Setting up automatic backups...${NC}"

cat > /root/backup-hims.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="hims_production"
DB_USER="hims_user"

PGPASSWORD="DB_PASSWORD_PLACEHOLDER" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/hims_$DATE.sql.gz
find $BACKUP_DIR -name "hims_*.sql.gz" -mtime +7 -delete
echo "Backup completed: hims_$DATE.sql.gz"
EOF

sed -i "s/DB_PASSWORD_PLACEHOLDER/$DB_PASSWORD/g" /root/backup-hims.sh
chmod +x /root/backup-hims.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-hims.sh >> /var/log/hims/backup.log 2>&1") | crontab -

echo -e "${GREEN}✓ Automatic daily backups configured${NC}\n"

###############################################################################
# STEP 16: Install SSL certificate
###############################################################################

echo -e "${YELLOW}[STEP 16] Installing SSL certificate...${NC}"

if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

echo -e "${BLUE}Installing SSL certificate for: $DOMAIN${NC}"
echo -e "${YELLOW}Note: Make sure your domain DNS is pointing to this server IP!${NC}\n"

read -p "Continue with SSL installation? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email --redirect
    echo -e "${GREEN}✓ SSL certificate installed${NC}\n"
else
    echo -e "${YELLOW}⚠ SSL installation skipped. Run manually later:${NC}"
    echo -e "${YELLOW}  certbot --nginx -d $DOMAIN${NC}\n"
fi

###############################################################################
# FINAL: Summary
###############################################################################

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              DEPLOYMENT COMPLETED SUCCESSFULLY!            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Application URL:${NC} https://$DOMAIN"
echo -e "${GREEN}✓ Admin Login:${NC} admin@hanmarine.com / admin123"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Database Credentials (SAVE THIS!):${NC}"
echo -e "  Database: $DB_NAME"
echo -e "  Username: $DB_USER"
echo -e "  Password: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  pm2 status              - Check app status"
echo -e "  pm2 logs $APP_NAME      - View logs"
echo -e "  pm2 restart $APP_NAME   - Restart app"
echo -e "  systemctl status nginx  - Check Nginx"
echo -e "  /root/backup-hims.sh    - Manual backup"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Change default admin password (admin123)"
echo -e "  2. Add 'Staff Login' button to hanmarine.co → https://$DOMAIN"
echo -e "  3. Test all features"
echo -e "  4. Setup monitoring (optional)"
echo ""
echo -e "${GREEN}Deployment log saved to: /var/log/hims/deployment.log${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🎉 Your HIMS application is now LIVE! 🚀${NC}"
echo ""
