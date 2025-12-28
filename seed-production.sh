#!/bin/bash
# Quick Seed Script for HIMS Production
# Copy this script to the VPS and run it: bash seed-production.sh

set -e

echo "🌱 HIMS Production Database Seeding Script"
echo "==========================================="
echo ""

# Check if we're on the VPS
if [ ! -d ~/.pm2 ]; then
    echo "⚠️  Warning: PM2 directory not found. This doesn't look like the production VPS."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Find application directory
echo "🔍 Looking for HIMS application..."
APP_DIR=$(find ~ -name "package.json" -path "*/hims*" -type f 2>/dev/null | head -1 | xargs dirname)

if [ -z "$APP_DIR" ]; then
    echo "❌ Could not find HIMS application directory"
    exit 1
fi

echo "✅ Found application at: $APP_DIR"
cd "$APP_DIR"

# Check if latest code is pulled
echo "📥 Pulling latest code..."
git pull origin main

echo "🔨 Building application..."
npm run build

# Method 1: Try the API endpoint
echo ""
echo "🌐 Attempting to seed via API endpoint..."

# Start application if not running
if ! pgrep -f "npm.*start" > /dev/null && ! pm2 status | grep -q "online"; then
    echo "Starting application..."
    npm start &
    sleep 10
fi

# Call the seed endpoint
SEED_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/seed-users \
  -H "Content-Type: application/json" 2>&1)

if echo "$SEED_RESPONSE" | grep -q "successfully"; then
    echo "✅ Successfully seeded users via API!"
    echo "Response: $SEED_RESPONSE"
else
    echo "⚠️  API seeding may have failed, trying script method..."
    
    # Method 2: Try npm seed script
    echo "Running seed script..."
    npm run seed
fi

# Restart application
echo ""
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
else
    # If pm2 not available, restart npm start process
    pkill -f "npm start"
    npm start > /dev/null 2>&1 &
fi

echo ""
echo "✅ Seeding complete!"
echo ""
echo "📋 You can now log in with:"
echo "   Email: arief@hanmarine.co"
echo "   Password: admin2025"
echo ""
echo "🌍 Visit: https://app.hanmarine.co/auth/signin"
