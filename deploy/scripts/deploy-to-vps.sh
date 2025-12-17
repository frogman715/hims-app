#!/bin/bash

# ============================================
# HIMS VPS DEPLOYMENT FROM LOCAL MACHINE
# ============================================
# Run this script from your local machine to deploy HIMS to VPS

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  HIMS DEPLOYMENT TO NIAGAHOSTER VPS"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Configuration - UPDATE THESE
VPS_IP="your-vps-ip"
VPS_USER="root"  # or your-vps-username
VPS_PATH="/var/www/hims-app"
GIT_REPO="https://github.com/frogman715/hims-app.git"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# STEP 1: Verify Configuration
# ============================================
echo -e "${YELLOW}[1/5]${NC} Checking configuration..."

if [ "$VPS_IP" == "your-vps-ip" ]; then
    echo -e "${RED}✗${NC} Please update VPS_IP in this script!"
    exit 1
fi

echo -e "${GREEN}✓${NC} Configuration ready"
echo ""

# ============================================
# STEP 2: Test SSH Connection
# ============================================
echo -e "${YELLOW}[2/5]${NC} Testing SSH connection to VPS..."

if ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_IP} "echo 'SSH connection OK'" &>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH connection successful"
else
    echo -e "${RED}✗${NC} Cannot connect to VPS via SSH"
    echo "   Check:"
    echo "   1. VPS_IP is correct"
    echo "   2. VPS is running and accessible"
    echo "   3. SSH key is configured"
    exit 1
fi
echo ""

# ============================================
# STEP 3: Create Deployment Script on VPS
# ============================================
echo -e "${YELLOW}[3/5]${NC} Creating deployment script on VPS..."

ssh ${VPS_USER}@${VPS_IP} bash << 'REMOTE_SCRIPT'
set -e

VPS_PATH="/var/www/hims-app"
GIT_REPO="https://github.com/frogman715/hims-app.git"

# Create directory
mkdir -p $VPS_PATH
cd $VPS_PATH

# Clone or pull latest
if [ -d ".git" ]; then
    git pull origin main
else
    git clone $GIT_REPO .
fi

echo "✓ Code updated on VPS"
REMOTE_SCRIPT

echo -e "${GREEN}✓${NC} Code deployed to VPS"
echo ""

# ============================================
# STEP 4: SSH into VPS for Manual Setup
# ============================================
echo -e "${YELLOW}[4/5]${NC} Ready for manual setup..."
echo ""
echo "Next steps (run these on VPS via SSH):"
echo ""
echo "  ssh ${VPS_USER}@${VPS_IP}"
echo ""
echo "Then run on VPS:"
echo ""
echo "  cd ${VPS_PATH}"
echo "  nano .env.production.local"
echo "  # Update DATABASE_URL with real credentials"
echo ""
echo "  npm ci --omit=dev"
echo "  npx prisma generate"
echo "  npx prisma migrate deploy"
echo "  npm run build"
echo ""
echo "  chmod +x DEPLOY_READY.sh"
echo "  ./DEPLOY_READY.sh"
echo ""
echo -e "${GREEN}✓${NC} Code is ready on VPS"
echo ""

# ============================================
# STEP 5: Show Quick Commands
# ============================================
echo -e "${YELLOW}[5/5]${NC} Quick commands..."
echo ""
echo "SSH into VPS:"
echo "  ssh ${VPS_USER}@${VPS_IP}"
echo ""
echo "Check application status:"
echo "  pm2 status"
echo ""
echo "View logs:"
echo "  pm2 logs hims-app --lines 50"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ DEPLOYMENT READY!${NC}"
echo "════════════════════════════════════════════════════════════════"
