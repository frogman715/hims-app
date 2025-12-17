#!/bin/bash

# ============================================
# HIMS PRODUCTION DEPLOYMENT SCRIPT
# Niagahoster VPS - 15 Minute Deploy
# ============================================
# Run this script on your Niagahoster VPS
# Usage: bash DEPLOY_READY.sh

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo "  HIMS PRODUCTION DEPLOYMENT - NIAGAHOSTER VPS"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# STEP 1: Prepare Application Directory
# ============================================
echo -e "${YELLOW}[STEP 1/8]${NC} Preparing application directory..."

APP_DIR="/var/www/hims-app"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${GREEN}✓${NC} Directory ready: $APP_DIR"
echo ""

# ============================================
# STEP 2: Clone or Pull Latest Code
# ============================================
echo -e "${YELLOW}[STEP 2/8]${NC} Getting latest code..."

if [ -d ".git" ]; then
    git pull origin main
    echo -e "${GREEN}✓${NC} Code updated"
else
    git clone https://github.com/frogman715/hims-app.git .
    echo -e "${GREEN}✓${NC} Code cloned"
fi
echo ""

# ============================================
# STEP 3: Create Production Environment File
# ============================================
echo -e "${YELLOW}[STEP 3/8]${NC} Creating production environment..."

if [ -f ".env.production.local" ]; then
    echo -e "${YELLOW}⚠${NC} .env.production.local already exists (keeping existing)"
else
    # Generate secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    HIMS_CRYPTO_KEY=$(openssl rand -base64 32)
    
    cat > .env.production.local << EOF
NODE_ENV=production
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://app.hanmarine.co
DATABASE_URL=postgresql://hims_user:your_secure_password_here@localhost:5432/hims_prod
HIMS_CRYPTO_KEY=$HIMS_CRYPTO_KEY
EOF
    
    chmod 600 .env.production.local
    echo -e "${GREEN}✓${NC} Environment file created"
    echo -e "${RED}⚠ IMPORTANT:${NC} Update DATABASE_URL with real credentials!"
fi
echo ""

# ============================================
# STEP 4: Install Dependencies
# ============================================
echo -e "${YELLOW}[STEP 4/8]${NC} Installing dependencies..."

npm ci --omit=dev
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# ============================================
# STEP 5: Generate Prisma Client & Run Migrations
# ============================================
echo -e "${YELLOW}[STEP 5/8]${NC} Setting up database..."

npx prisma generate
echo -e "${GREEN}✓${NC} Prisma client generated"

npx prisma migrate deploy
echo -e "${GREEN}✓${NC} Migrations applied"
echo ""

# ============================================
# STEP 6: Build Application
# ============================================
echo -e "${YELLOW}[STEP 6/8]${NC} Building Next.js application..."

npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed"
    exit 1
fi
echo ""

# ============================================
# STEP 7: Setup PM2 (if not already installed)
# ============================================
echo -e "${YELLOW}[STEP 7/8]${NC} Setting up PM2 process manager..."

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓${NC} PM2 installed globally"
fi

# Create ecosystem config if not exists
if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js << 'ECOSYSTEM'
module.exports = {
  apps: [
    {
      name: 'hims-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/hims-app',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/hims-app-error.log',
      out_file: '/var/log/hims-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      kill_timeout: 5000,
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],
      merge_logs: true,
    }
  ]
};
ECOSYSTEM
    echo -e "${GREEN}✓${NC} ecosystem.config.js created"
fi

# Start application with PM2
pm2 delete hims-app 2>/dev/null || true
pm2 start ecosystem.config.js --env production
echo -e "${GREEN}✓${NC} Application started with PM2"

# Setup auto-start on VPS reboot
pm2 startup
pm2 save
echo -e "${GREEN}✓${NC} PM2 configured for auto-startup"
echo ""

# ============================================
# STEP 8: Verify Application Running
# ============================================
echo -e "${YELLOW}[STEP 8/8]${NC} Verifying application..."

sleep 3
pm2 status
echo ""

if pm2 list | grep -q "hims-app.*online"; then
    echo -e "${GREEN}✓${NC} Application is running!"
else
    echo -e "${RED}✗${NC} Application did not start. Check logs:"
    echo "    pm2 logs hims-app --err"
    exit 1
fi
echo ""

# ============================================
# DEPLOYMENT COMPLETE
# ============================================
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📍 Next Steps:"
echo "   1. Update .env.production.local with real DATABASE_URL"
echo "   2. Configure Nginx reverse proxy (see DEPLOYMENT_PRODUCTION_NIAGAHOSTER.md)"
echo "   3. Setup SSL certificate with Let's Encrypt"
echo "   4. Verify: curl -I https://app.hanmarine.co"
echo ""
echo "📊 View logs:"
echo "   pm2 logs hims-app --lines 50"
echo ""
echo "🔄 Restart application:"
echo "   pm2 restart hims-app"
echo ""
echo "🛑 Stop application:"
echo "   pm2 stop hims-app"
echo ""
echo "════════════════════════════════════════════════════════════════"
