#!/bin/bash

# HIMS Deployment Script - Update to Production VPS
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 HIMS Deployment Script"
echo "=========================="
echo ""

# Configuration
REMOTE_USER="root"
REMOTE_HOST="app.hanmarine.co"
REMOTE_PATH="/opt/hims-app"
LOCAL_PATH="/home/docter203/hanmarine_hims/hims-app"

echo "📋 Deployment Configuration:"
echo "   Remote: $REMOTE_USER@$REMOTE_HOST"
echo "   Path: $REMOTE_PATH"
echo ""

# Step 1: Build production locally
echo "🔨 Step 1: Building production bundle..."
npm run build
echo "✅ Build completed!"
echo ""

# Step 2: Create tarball (exclude unnecessary files)
echo "📦 Step 2: Creating deployment package..."
tar -czf /tmp/hims-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env' \
  --exclude='.env.local' \
  -C "$LOCAL_PATH" .

echo "✅ Package created!"
echo ""

# Step 3: Upload to VPS
echo "📤 Step 3: Uploading to VPS..."
scp /tmp/hims-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/
echo "✅ Upload completed!"
echo ""

# Step 4: Deploy on VPS
echo "🔄 Step 4: Deploying on VPS..."
ssh $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
set -e

cd /opt/hims-app

# Backup current version
echo "  📁 Creating backup..."
if [ -d "backup" ]; then rm -rf backup; fi
mkdir -p backup
cp -r src backup/ 2>/dev/null || true
cp package.json backup/ 2>/dev/null || true

# Extract new version
echo "  📂 Extracting new version..."
tar -xzf /tmp/hims-deploy.tar.gz -C /opt/hims-app/

# Install dependencies
echo "  📦 Installing dependencies..."
npm install --production

# Generate Prisma client
echo "  🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "  🏗️  Building application..."
npm run build

# Restart application
echo "  🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart hims-app || pm2 start npm --name "hims-app" -- start
else
    echo "  ⚠️  PM2 not found. Please restart manually."
fi

# Cleanup
rm /tmp/hims-deploy.tar.gz

echo "  ✅ Deployment completed on VPS!"
ENDSSH

# Cleanup local
rm /tmp/hims-deploy.tar.gz

echo ""
echo "✨ DEPLOYMENT SUCCESSFUL!"
echo "=========================="
echo ""
echo "🌐 Application URL: https://app.hanmarine.co"
echo "📊 Check logs: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs hims-app'"
echo "📈 Monitor: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 monit'"
echo ""
