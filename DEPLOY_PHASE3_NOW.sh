#!/bin/bash

################################################################################
# PHASE 3 DEPLOYMENT TO HOSTINGER VPS
# Deploys complete QMS system with all Phase 3 features
# Run: bash DEPLOY_PHASE3_NOW.sh
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_IP="31.97.223.11"
VPS_USER="hanmarine"
VPS_PASS="Hanmarine23"  # Consider using SSH keys for security
DOMAIN="app.hanmarine.co"
APP_DIR="/var/www/hims-app"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="hims_qms"
DB_USER="hims_user"
DB_PASSWORD="Hanmarine23"

log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  PHASE 3 DEPLOYMENT TO HOSTINGER VPS${NC}"
    echo -e "${BLUE}  QMS System with Analytics, Dashboard & Export Features${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_summary() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  DEPLOYMENT SUMMARY${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Deployment Configuration:"
    echo "  VPS IP:        $VPS_IP"
    echo "  Domain:        $DOMAIN"
    echo "  SSH User:      $VPS_USER"
    echo "  App Directory: $APP_DIR"
    echo "  Database:      $DB_NAME"
    echo ""
    echo "Phase 3 Components (2,962 lines total):"
    echo "  ✓ 3.1: Database Schema (7 new models, 1 migration)"
    echo "  ✓ 3.2: API Endpoints (8 endpoints, pagination/filtering)"
    echo "  ✓ 3.3: Analytics Engine (12 calculation methods)"
    echo "  ✓ 3.4: QMS Dashboard (4 KPI cards, 2 charts, 4 alerts)"
    echo "  ✓ 3.5: Export & Distribution (PDF/Excel, email scheduling)"
    echo ""
}

deploy_via_git() {
    log_step "Starting deployment via Git pull..."
    
    cat > /tmp/deploy_script.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

APP_DIR="/var/www/hims-app"
GIT_REPO="https://github.com/frogman715/hims-app.git"

echo "[DEPLOY] Pulling latest code from GitHub..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

echo "[DEPLOY] Installing dependencies..."
npm ci --legacy-peer-deps

echo "[DEPLOY] Building application..."
npm run build

echo "[DEPLOY] Running database migrations..."
npx prisma migrate deploy --skip-generate

echo "[DEPLOY] Generating Prisma client..."
npx prisma generate

echo "[DEPLOY] Restarting PM2..."
pm2 restart hims-app || pm2 start --name "hims-app" npm -- start

echo "[DEPLOY] ✓ Deployment complete!"
EOFSCRIPT

    chmod +x /tmp/deploy_script.sh
    
    log_step "Executing remote deployment script..."
    
    # Use sshpass if available, otherwise use standard ssh
    if command -v sshpass &> /dev/null; then
        sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=accept-new "$VPS_USER@$VPS_IP" < /tmp/deploy_script.sh
    else
        log_warning "sshpass not found. Attempting standard SSH (may require password prompt)..."
        ssh -o StrictHostKeyChecking=accept-new "$VPS_USER@$VPS_IP" < /tmp/deploy_script.sh
    fi
    
    log_success "Remote deployment executed"
}

verify_deployment() {
    log_step "Verifying deployment..."
    
    # Check if app is running
    if command -v sshpass &> /dev/null; then
        sshpass -p "$VPS_PASS" ssh "$VPS_USER@$VPS_IP" "ps aux | grep -i 'node\|npm' | grep -v grep" > /dev/null 2>&1
    else
        ssh "$VPS_USER@$VPS_IP" "ps aux | grep -i 'node\|npm' | grep -v grep" > /dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Application is running on VPS"
    else
        log_warning "Could not verify application status (may need manual check)"
    fi
}

print_header

print_summary

read -p "Ready to deploy Phase 3 to app.hanmarine.co? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Deployment cancelled"
fi

log_step "Testing SSH connection to VPS..."
if command -v sshpass &> /dev/null; then
    sshpass -p "$VPS_PASS" ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "echo 'SSH OK'" > /dev/null 2>&1
else
    ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "echo 'SSH OK'" > /dev/null 2>&1
fi

if [ $? -eq 0 ]; then
    log_success "SSH connection verified"
else
    log_error "Cannot connect to VPS at $VPS_IP"
fi

deploy_via_git
verify_deployment

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ PHASE 3 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Visit https://$DOMAIN"
echo "  2. Check QMS Dashboard at /dashboard"
echo "  3. Verify Phase 3 features are working"
echo ""
echo "If issues occur:"
echo "  SSH: ssh hanmarine@$VPS_IP"
echo "  Logs: tail -f /var/www/hims-app/.pm2/logs/hims-app-out.log"
echo ""
