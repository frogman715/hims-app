#!/bin/bash

###############################################################################
# HIMS APPLICATION UPLOAD SCRIPT
# Upload from development machine to production server
# Usage: ./upload-to-server.sh SERVER_IP
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     HIMS - Upload to Production Server                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if server IP provided
if [ -z "$1" ]; then
    echo -e "${RED}ERROR: Please provide server IP address${NC}"
    echo -e "${BLUE}Usage: ./upload-to-server.sh SERVER_IP${NC}"
    echo -e "${BLUE}Example: ./upload-to-server.sh 103.150.197.10${NC}"
    exit 1
fi

SERVER_IP=$1
SERVER_USER="root"
SERVER_PATH="/opt/hims-app"
CURRENT_DIR=$(pwd)

echo -e "${YELLOW}Upload Configuration:${NC}"
echo -e "  Source: $CURRENT_DIR"
echo -e "  Destination: $SERVER_USER@$SERVER_IP:$SERVER_PATH"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}\n"
else
    echo -e "${RED}ERROR: Cannot connect to server${NC}"
    echo -e "${YELLOW}Make sure you can SSH to the server:${NC}"
    echo -e "${BLUE}  ssh $SERVER_USER@$SERVER_IP${NC}"
    exit 1
fi

# Exclude patterns
EXCLUDE_PATTERNS=(
    "node_modules"
    ".next"
    ".git"
    ".env*"
    "*.log"
    ".DS_Store"
    "*.swp"
    "*.swo"
    "coverage"
    ".vscode"
    ".idea"
    "dist"
    "build"
    "cookies.txt"
    "*.md"
)

# Build exclude options for rsync
EXCLUDE_OPTS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_OPTS="$EXCLUDE_OPTS --exclude='$pattern'"
done

echo -e "${YELLOW}Uploading application files...${NC}"
echo -e "${BLUE}This may take a few minutes depending on your connection...${NC}\n"

# Create remote directory if not exists
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"

# Upload with rsync
rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.env*' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='*.swp' \
    --exclude='*.swo' \
    --exclude='coverage' \
    --exclude='.vscode' \
    --exclude='.idea' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='cookies.txt' \
    --exclude='*.md' \
    ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Upload completed successfully!${NC}\n"
    
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. SSH to server: ${BLUE}ssh $SERVER_USER@$SERVER_IP${NC}"
    echo -e "  2. Run deployment script: ${BLUE}cd $SERVER_PATH && sudo bash deploy-to-server.sh${NC}"
    echo ""
    echo -e "${GREEN}Or run everything remotely:${NC}"
    echo -e "  ${BLUE}ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && sudo bash deploy-to-server.sh'${NC}"
    echo ""
else
    echo -e "\n${RED}ERROR: Upload failed!${NC}"
    exit 1
fi
