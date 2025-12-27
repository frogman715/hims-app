#!/bin/bash

#############################################################################
# GIT POST-RECEIVE HOOK - Auto-deploy on git push
# Setup: Copy this to VPS at: /var/www/hims-app.git/hooks/post-receive
# Usage: When you push to this repo, it auto-deploys!
#############################################################################

set -e

APP_DIR="/var/www/hims-app"
DEPLOY_LOG="/var/log/hims-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

log "=========================================="
log "Starting deployment..."

# Check out latest code
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main

log "Code updated from git"

# Install dependencies
npm ci --production 2>&1 | tail -5

log "Dependencies installed"

# Build
npm run build 2>&1 | tail -10

log "Build completed"

# Run migrations
npx prisma migrate deploy 2>&1 | tail -5

log "Migrations executed"

# Restart application
sudo systemctl restart hims-app

# Wait for service to start
sleep 2

# Verify health
if curl -s http://localhost:3000/api/health | grep -q '"status":"ok"'; then
    log "✓ Application health check: PASSED"
    log "Deployment completed successfully!"
    echo ""
    echo "✓ Deployment successful!"
    echo "  Application restarted and running"
else
    log "✗ Health check failed - checking logs..."
    sudo journalctl -u hims-app -n 20 | tee -a "$DEPLOY_LOG"
    exit 1
fi

log "=========================================="
