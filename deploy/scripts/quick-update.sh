#!/bin/bash

###############################################################################
# HIMS - Quick Update Script
# Use this to update application after changes
# Usage: ./quick-update.sh [local|SERVER_IP]
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     HIMS - Quick Update Script                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Determine if local or remote
if [ "$1" = "local" ] || [ -z "$1" ]; then
    echo -e "${YELLOW}Updating LOCAL installation...${NC}\n"
    
    # Stop PM2
    pm2 stop hims-app || true
    
    # Pull latest changes (if using git)
    if [ -d .git ]; then
        echo -e "${YELLOW}Pulling latest changes from git...${NC}"
        git pull
    fi
    
    # Install dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --production
    
    # Run migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    npx prisma migrate deploy
    npx prisma generate
    
    # Build
    echo -e "${YELLOW}Building application...${NC}"
    npm run build
    
    # Restart PM2
    echo -e "${YELLOW}Restarting application...${NC}"
    pm2 restart hims-app
    
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              LOCAL UPDATE COMPLETED!                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    pm2 status
    
elif [ -n "$1" ]; then
    SERVER_IP=$1
    SERVER_USER="root"
    APP_DIR="/opt/hims-app"
    
    echo -e "${YELLOW}Updating REMOTE server: $SERVER_IP${NC}\n"
    
    # Upload changes
    echo -e "${YELLOW}Uploading changed files...${NC}"
    rsync -avz --progress \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.git' \
        --exclude='.env*' \
        --exclude='*.log' \
        ./ $SERVER_USER@$SERVER_IP:$APP_DIR/
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Upload failed!${NC}"
        exit 1
    fi
    
    # Run update commands on server
    echo -e "\n${YELLOW}Running update commands on server...${NC}\n"
    
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /opt/hims-app
pm2 stop hims-app || true
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart hims-app
pm2 status
ENDSSH
    
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              REMOTE UPDATE COMPLETED!                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}Check application status:${NC}"
    echo -e "  ssh $SERVER_USER@$SERVER_IP 'pm2 logs hims-app --lines 50'"
    
else
    echo -e "${RED}Invalid argument${NC}"
    echo -e "${BLUE}Usage:${NC}"
    echo -e "  ${YELLOW}./quick-update.sh local${NC}        - Update local installation"
    echo -e "  ${YELLOW}./quick-update.sh SERVER_IP${NC}   - Update remote server"
    exit 1
fi
