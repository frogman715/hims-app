#!/bin/bash

# ============================================
# HIMS VPS Deployment Script
# Production Deployment to VPS
# ============================================

set -e

echo "============================================"
echo "HIMS VPS Deployment Script"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="31.97.223.11"
VPS_USER="hanmarine"
VPS_HOST="$VPS_USER@$VPS_IP"
APP_DIR="/home/hanmarine/hims-app"
REPO_URL="https://github.com/frogman715/hims-app.git"

echo -e "${BLUE}Starting deployment to VPS...${NC}"
echo "VPS: $VPS_HOST"
echo "App Directory: $APP_DIR"
echo ""

# Step 1: SSH and clone/pull repository
echo -e "${YELLOW}Step 1: Updating code from GitHub...${NC}"
ssh "$VPS_HOST" << 'EOF'
#!/bin/bash
set -e

APP_DIR="/home/hanmarine/hims-app"

if [ -d "$APP_DIR" ]; then
  echo "Repository exists, pulling latest changes..."
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
else
  echo "Cloning repository..."
  git clone https://github.com/frogman715/hims-app.git "$APP_DIR"
  cd "$APP_DIR"
fi

pwd
git log --oneline -1
EOF

echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
ssh "$VPS_HOST" << 'EOF'
#!/bin/bash
set -e
cd /home/hanmarine/hims-app
npm install --production
EOF

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Run database migrations
echo -e "${YELLOW}Step 3: Running database migrations...${NC}"
ssh "$VPS_HOST" << 'EOF'
#!/bin/bash
set -e
cd /home/hanmarine/hims-app

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo "ERROR: .env.production not found!"
  echo "Please create it with your database credentials"
  exit 1
fi

# Run migrations
npx prisma migrate deploy
EOF

echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Step 4: Build application
echo -e "${YELLOW}Step 4: Building application...${NC}"
ssh "$VPS_HOST" << 'EOF'
#!/bin/bash
set -e
cd /home/hanmarine/hims-app
npm run build
EOF

echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Step 5: Stop old PM2 process if exists
echo -e "${YELLOW}Step 5: Managing PM2 process...${NC}"
ssh "$VPS_HOST" << 'EOF'
#!/bin/bash
cd /home/hanmarine/hims-app

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 globally..."
  npm install -g pm2
fi

# Stop old process if exists
pm2 delete hims-app 2>/dev/null || true
EOF

echo -e "${GREEN}✓ PM2 prepared${NC}"
echo ""

# Step 6: Start application with PM2
echo -e "${YELLOW}Step 6: Starting application with PM2...${NC}"
ssh "$VPS_HOST" << 'EOF'
#!/bin/bash
cd /home/hanmarine/hims-app

# Start with PM2 using ecosystem.config.js
pm2 start ecosystem.config.js --env production || pm2 start --name hims-app --exec "node .next/standalone/server.js" -- -p 3000

# Save PM2 config
pm2 save

echo ""
echo "✓ Application started with PM2"
pm2 list
EOF

echo ""
echo -e "${GREEN}✓ Application started on VPS${NC}"
echo ""

# Step 7: Display logs
echo -e "${YELLOW}Step 7: Checking application logs...${NC}"
ssh "$VPS_HOST" << 'EOF'
#!/bin/bash
pm2 logs hims-app --lines 20 --nostream
EOF

echo ""
echo "============================================"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
echo "============================================"
echo ""
echo "Application is now running on:"
echo "  http://$VPS_IP:3000"
echo ""
echo "To view logs:"
echo "  ssh $VPS_HOST 'pm2 logs hims-app'"
echo ""
echo "To restart:"
echo "  ssh $VPS_HOST 'pm2 restart hims-app'"
echo ""
echo "To stop:"
echo "  ssh $VPS_HOST 'pm2 stop hims-app'"
echo ""
