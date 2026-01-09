#!/bin/bash

# ONE COMMAND FIX FOR HIMS ON VPS
# Run: bash vps-fix.sh

echo "🔧 HIMS VPS Fix Script"
echo ""

VPS_IP="31.97.223.11"
VPS_USER="hanmarine"

echo "Step 1: Kill old process if running..."
ssh $VPS_USER@$VPS_IP "pkill -f 'next start' || true"

echo "Step 2: Clean build artifacts..."
ssh $VPS_USER@$VPS_IP "cd /var/www/hims-app && rm -rf .next .turbo .eslintignore"

echo "Step 3: Update code..."
ssh $VPS_USER@$VPS_IP "cd /var/www/hims-app && git fetch origin && git reset --hard origin/main"

echo "Step 4: Install ALL dependencies (including dev for build)..."
ssh $VPS_USER@$VPS_IP "cd /var/www/hims-app && npm ci"

echo "Step 5: Generate Prisma..."
ssh $VPS_USER@$VPS_IP "cd /var/www/hims-app && npx prisma generate"

echo "Step 6: Build..."
ssh $VPS_USER@$VPS_IP "cd /var/www/hims-app && npm run build"

echo "Step 7: Start app (background)..."
ssh $VPS_USER@$VPS_IP "cd /var/www/hims-app && nohup node node_modules/.bin/next start -p 3000 > /tmp/hims.log 2>&1 &"

sleep 3

echo "Step 8: Verify..."
ssh $VPS_USER@$VPS_IP "curl -s http://localhost:3000/api/health | head -20 || echo 'App starting...'"

echo ""
echo "✅ Done! Visit https://app.hanmarine.co in 10 seconds"
echo ""
echo "Check logs: ssh $VPS_USER@$VPS_IP 'tail -f /tmp/hims.log'"
