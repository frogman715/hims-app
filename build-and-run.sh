#!/bin/bash

# HIMS Quick Fix on VPS
# Run on VPS: bash build-and-run.sh

set -e

echo "🔧 HIMS Build & Run Fix"
echo ""

cd /var/www/hims-app

echo "[1/4] Generating Prisma client..."
npx prisma generate

echo "[2/4] Building application..."
npm run build 2>&1 | tail -10

echo "[3/4] Starting application..."
node node_modules/.bin/next start -p 3000 &
APP_PID=$!

sleep 3

echo "[4/4] Verifying..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo ""
    echo "✅ Application running on port 3000!"
    echo "✅ Visit: https://app.hanmarine.co"
    echo ""
    echo "PID: $APP_PID"
    echo "Press Ctrl+C to stop"
    wait $APP_PID
else
    echo "❌ Application not responding"
    kill $APP_PID 2>/dev/null || true
fi
