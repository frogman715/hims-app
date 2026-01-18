#!/bin/bash

# HIMS Production Deployment Setup Script
# This script validates environment and prepares database for production

set -e

echo "=========================================="
echo "HIMS Production Deployment Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}✗ Error: .env.production file not found${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

echo -e "${GREEN}✓ .env.production found${NC}"

# Source environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Validate critical environment variables
echo ""
echo "Validating environment variables..."

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}✗ DATABASE_URL not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓ DATABASE_URL configured${NC}"

if [ -z "$NEXTAUTH_SECRET" ] || [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
    echo -e "${RED}✗ NEXTAUTH_SECRET not set or too short (min 32 chars)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ NEXTAUTH_SECRET configured${NC}"

if [ -z "$HIMS_CRYPTO_KEY" ] || [ ${#HIMS_CRYPTO_KEY} -lt 32 ]; then
    echo -e "${RED}✗ HIMS_CRYPTO_KEY not set or too short (min 32 chars)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ HIMS_CRYPTO_KEY configured${NC}"

if [ -z "$NODE_ENV" ]; then
    echo -e "${YELLOW}! NODE_ENV not set, using 'production'${NC}"
    NODE_ENV=production
fi
echo -e "${GREEN}✓ NODE_ENV = $NODE_ENV${NC}"

# Check npm dependencies
echo ""
echo "Checking npm dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}! npm dependencies not installed, running npm install...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ node_modules found${NC}"
fi

# Test database connection
echo ""
echo "Testing database connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo "Please verify DATABASE_URL in .env.production"
    echo "Database URL: $DATABASE_URL"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"

# Run migrations
echo ""
echo "Running database migrations..."
if npx prisma migrate deploy; then
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

# Check if seed data exists
echo ""
echo "Checking seed data..."
SEED_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM roles;" 2>/dev/null | tail -1)
if [ "$SEED_COUNT" = "0" ]; then
    echo -e "${YELLOW}! No seed data found. Running seed...${NC}"
    if npm run seed 2>/dev/null; then
        echo -e "${GREEN}✓ Seed data loaded${NC}"
    else
        echo -e "${YELLOW}⚠ Seed script not found or failed (non-critical)${NC}"
    fi
else
    echo -e "${GREEN}✓ Seed data already exists ($SEED_COUNT roles found)${NC}"
fi

# Build next.js application
echo ""
echo "Building Next.js application..."
if npm run build; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ DEPLOYMENT SETUP COMPLETE${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the application:"
echo "   npm start"
echo ""
echo "2. Or use standalone server (recommended for VPS):"
echo "   node .next/standalone/server.js"
echo ""
echo "3. Verify application is running:"
echo "   curl http://localhost:3000"
echo ""
echo "4. Check logs for any warnings"
echo ""
echo "Application is ready for production!"
