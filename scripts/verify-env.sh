#!/bin/bash

# HIMS Environment Verification Script
# Checks that all required environment variables are properly configured

set -e

echo "🔍 HIMS Environment Verification"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ ERROR: .env file not found!${NC}"
    echo "   Please copy .env.example to .env and configure it:"
    echo "   cp .env.example .env"
    exit 1
fi

echo "✅ .env file exists"
echo ""

# Load .env file
export $(grep -v '^#' .env | xargs)

# Function to check if variable exists and is not default
check_var() {
    local var_name=$1
    local default_pattern=$2
    local min_length=$3
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ ERROR: $var_name is not set${NC}"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    if [ ! -z "$default_pattern" ] && [[ "$var_value" == *"$default_pattern"* ]]; then
        echo -e "${RED}❌ ERROR: $var_name contains default value '$default_pattern'${NC}"
        echo "   Generate a secure value with: openssl rand -base64 32"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    if [ ! -z "$min_length" ] && [ ${#var_value} -lt $min_length ]; then
        echo -e "${YELLOW}⚠️  WARNING: $var_name is too short (${#var_value} < $min_length chars)${NC}"
        WARNINGS=$((WARNINGS + 1))
        return
    fi
    
    echo -e "${GREEN}✅ $var_name is properly configured (${#var_value} chars)${NC}"
}

echo "Checking Critical Environment Variables:"
echo "--------------------------------------"

# Check DATABASE_URL
check_var "DATABASE_URL" "" ""

# Check POSTGRES_PASSWORD
check_var "POSTGRES_PASSWORD" "CHANGE_ME" 12

# Check NEXTAUTH_URL
check_var "NEXTAUTH_URL" "" ""

# Check NEXTAUTH_SECRET
check_var "NEXTAUTH_SECRET" "CHANGE_ME" 32

# Check HIMS_CRYPTO_KEY
check_var "HIMS_CRYPTO_KEY" "CHANGE_ME" 32

echo ""
echo "Checking Optional Environment Variables:"
echo "--------------------------------------"

# Check external system URLs
if [ -z "$KOSMA_BASE_URL" ]; then
    echo -e "${YELLOW}⚠️  WARNING: KOSMA_BASE_URL not set (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ KOSMA_BASE_URL is set${NC}"
fi

if [ -z "$DEPHUB_BASE_URL" ]; then
    echo -e "${YELLOW}⚠️  WARNING: DEPHUB_BASE_URL not set (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ DEPHUB_BASE_URL is set${NC}"
fi

if [ -z "$SCHENGEN_VISA_BASE_URL" ]; then
    echo -e "${YELLOW}⚠️  WARNING: SCHENGEN_VISA_BASE_URL not set (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ SCHENGEN_VISA_BASE_URL is set${NC}"
fi

echo ""
echo "Security Checks:"
echo "--------------------------------------"

# Check if using HTTP in production
if [[ "$NODE_ENV" == "production" ]] && [[ "$NEXTAUTH_URL" == http://* ]]; then
    echo -e "${RED}❌ ERROR: Using HTTP in production! Use HTTPS for NEXTAUTH_URL${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ URL protocol is appropriate for environment${NC}"
fi

# Check if .env is in git
if git check-ignore .env > /dev/null 2>&1; then
    echo -e "${GREEN}✅ .env is properly ignored by git${NC}"
else
    echo -e "${RED}❌ ERROR: .env is NOT ignored by git! This is a security risk!${NC}"
    echo "   Add '.env' to .gitignore immediately"
    ERRORS=$((ERRORS + 1))
fi

# Check .env file permissions (should be 600 or 400)
if [ -f .env ]; then
    PERMS=$(stat -c %a .env 2>/dev/null || stat -f %Lp .env 2>/dev/null)
    if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
        echo -e "${YELLOW}⚠️  WARNING: .env file permissions are $PERMS (should be 600)${NC}"
        echo "   Fix with: chmod 600 .env"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ .env file has correct permissions ($PERMS)${NC}"
    fi
fi

echo ""
echo "================================"
echo "Verification Complete"
echo "================================"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Found $ERRORS critical error(s)${NC}"
    echo "   Please fix the errors above before starting the application."
    exit 1
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $WARNINGS warning(s)${NC}"
    echo "   Consider addressing these warnings for better security."
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your environment is properly configured.${NC}"
fi

echo ""
echo "Next steps:"
echo "  1. Start database:    docker-compose up -d db"
echo "  2. Run migrations:    npx prisma migrate deploy"
echo "  3. Generate client:   npx prisma generate"
echo "  4. Seed database:     npm run seed"
echo "  5. Start app:         npm run dev"
echo ""

exit 0
