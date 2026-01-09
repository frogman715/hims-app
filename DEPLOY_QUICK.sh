#!/bin/bash

# COPY & PASTE IN VPS TERMINAL

cd /var/www/hims-app

# Kill old
pkill -f "next" || true
sleep 2

# Clean & install
rm -rf node_modules .next package-lock.json
npm ci

# Generate & Build
npx prisma generate
npm run build

# Verify
ls -la .next/BUILD_ID

# Start (background)
nohup node node_modules/.bin/next start -p 3000 > /tmp/hims.log 2>&1 &

sleep 3

# Test
curl http://localhost:3000/api/health

echo "✅ Done! Check: https://app.hanmarine.co"
