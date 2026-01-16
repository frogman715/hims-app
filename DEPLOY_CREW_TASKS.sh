#!/bin/bash

# Crew Task Management System - Deployment Instructions
# Commit: 3cde176

echo "================================="
echo "Deploying Crew Task Management System"
echo "================================="
echo ""

# SSH into VPS
echo "[1/5] Connecting to VPS..."
ssh root@31.97.223.11 << 'EOF'

cd /home/hims-app/hims-app

# Pull latest code
echo "[2/5] Pulling latest code from GitHub..."
git pull origin main

# Install dependencies (if any new packages)
echo "[3/5] Installing dependencies..."
npm install --no-save

# Apply database migration
echo "[4/5] Applying database migration..."
npx prisma migrate deploy

# Build application
echo "[5/5] Building application..."
npm run build

# Restart PM2
pm2 restart hims-app

# Verify build
echo ""
echo "================================="
echo "Deployment Complete!"
echo "================================="
echo ""
echo "✓ Code deployed (commit 3cde176)"
echo "✓ Database migrated"
echo "✓ Build completed"
echo "✓ PM2 restarted"
echo ""
echo "New Features:"
echo "  - Crew tasks dashboard: https://31.97.223.11/crewing/crew-tasks"
echo "  - Auto-task creation on crew approval"
echo "  - Task management API endpoints"
echo ""
echo "API Endpoints:"
echo "  GET    /api/crew-tasks           - List all crew tasks"
echo "  POST   /api/crew-tasks           - Create new task"
echo "  GET    /api/crew-tasks/[id]      - Get specific task"
echo "  PATCH  /api/crew-tasks/[id]      - Update task status/assignment"
echo "  DELETE /api/crew-tasks/[id]      - Delete task"
echo "  POST   /api/crew-tasks/auto-create - Manually trigger auto-creation"
echo ""

EOF

echo "Deployment script complete!"
