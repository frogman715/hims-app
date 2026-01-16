#!/bin/bash

cd ~/projects/hims-app

echo "================================="
echo "🚀 CREW TASK SYSTEM DEPLOYMENT"
echo "================================="
echo ""

echo "[1/5] Pulling latest code..."
git pull origin main || exit 1

echo ""
echo "[2/5] Generating Prisma client..."
npx prisma generate || exit 1

echo ""
echo "[3/5] Applying database migration..."
npx prisma migrate deploy || exit 1

echo ""
echo "[4/5] Building application..."
npm run build || exit 1

echo ""
echo "[5/5] Restarting PM2..."
pm2 restart hims-app

echo ""
echo "================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================="
echo ""
echo "New Features:"
echo "  📊 Dashboard: /crewing/crew-tasks"
echo "  🤖 Auto-task creation on crew approval"
echo "  📋 Task management API endpoints"
echo ""
echo "Recent Commits:"
git log --oneline -3
echo ""
pm2 status hims-app
