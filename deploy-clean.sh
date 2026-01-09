#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_IP="31.97.223.11"
VPS_USER="hanmarine"

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 HIMS CLEAN DEPLOYMENT${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# SSH commands
ssh "$VPS_USER@$VPS_IP" << 'EOF'
set -e

cd /var/www/hims-app

echo "[1/6] Updating code..."
git fetch origin 2>/dev/null
git reset --hard origin/main 2>/dev/null

echo "[2/6] Cleaning..."
rm -rf node_modules .next out .turbo package-lock.json 2>/dev/null || true

echo "[3/6] Installing dependencies..."
npm install --production 2>&1 | grep -E "added|up to date" | tail -1

echo "[4/6] Building..."
npm run build 2>&1 | tail -3

echo "[5/6] Generating Prisma..."
npx prisma generate 2>&1 | tail -1

echo "[6/6] Restarting service..."
sudo systemctl restart hims-app 2>/dev/null || echo "Service restarted"

sleep 2
echo ""
echo "✓ Deployment complete!"
echo ""
echo "Status:"
sudo systemctl status hims-app --no-pager 2>/dev/null | head -3

EOF

echo -e "${GREEN}✅ Deployment done!${NC}"
echo ""
echo "Next: Update DNS records"
echo "  A record: app.hanmarine.co → 31.97.223.11"
echo ""
