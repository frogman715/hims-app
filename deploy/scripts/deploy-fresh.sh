#!/bin/bash

# Fresh Deployment to VPS
# Usage: ./deploy-fresh.sh

set -e

echo "🚀 FRESH DEPLOYMENT TO VPS"
echo "============================"
echo ""

# VPS Details
VPS_HOST="31.97.223.11"
VPS_USER="root"
APP_DIR="/opt/hims-app"

echo "📦 Step 1: Creating deployment package..."
tar -czf /tmp/hims-fresh-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='venv' \
  --exclude='backup*' \
  --exclude='*.pdf' \
  --exclude='.env*' \
  .

echo "✅ Package created: $(ls -lh /tmp/hims-fresh-deploy.tar.gz | awk '{print $5}')"
echo ""

echo "📤 Step 2: Manual upload instructions..."
echo ""
echo "Run these commands on VPS:"
echo "================================"
echo ""
echo "cd /tmp"
echo "base64 -d > hims-fresh-deploy.tar.gz"
echo "[Paste base64 data, then press Ctrl+D twice]"
echo ""
echo "cd ${APP_DIR}"
echo "pm2 stop hims-app"
echo "rm -rf src/ prisma/ public/ scripts/ .github/"
echo "tar -xzf /tmp/hims-fresh-deploy.tar.gz"
echo "npm install"
echo "npx prisma generate"
echo "npm run build"
echo "pm2 restart hims-app"
echo "pm2 logs hims-app --lines 30"
echo ""
echo "================================"
echo ""
echo "📋 Base64 data ready. Copy output below:"
echo ""

# Output base64
base64 /tmp/hims-fresh-deploy.tar.gz

echo ""
echo ""
echo "✅ Copy the base64 output above and paste to VPS!"
