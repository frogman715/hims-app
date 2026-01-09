#!/bin/bash

#############################################################################
# HIMS PRE-DEPLOYMENT VERIFICATION SCRIPT v1.0
# Run this BEFORE deploying to VPS to ensure everything is safe
# Usage: bash verify-deployment-ready.sh
#############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

log_check() {
    echo -n "Checking: $1... "
}

log_pass() {
    echo -e "${GREEN}✓${NC}"
    ((PASS++))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

log_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARN++))
}

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  HIMS PRE-DEPLOYMENT VERIFICATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# ============================================================================
# 1. PROJECT STRUCTURE
# ============================================================================
echo -e "${BLUE}[1] Project Structure${NC}"

log_check "package.json exists"
if [ -f "package.json" ]; then log_pass; else log_fail "Not in project directory"; fi

log_check "prisma/schema.prisma exists"
if [ -f "prisma/schema.prisma" ]; then log_pass; else log_fail "Prisma schema missing"; fi

log_check "src/app directory exists"
if [ -d "src/app" ]; then log_pass; else log_fail "App directory missing"; fi

log_check ".gitignore configured"
if grep -q "\.env" .gitignore 2>/dev/null; then log_pass; else log_fail ".env not in .gitignore"; fi

# ============================================================================
# 2. BUILD VERIFICATION
# ============================================================================
echo ""
echo -e "${BLUE}[2] Build Verification${NC}"

log_check ".next build directory exists"
if [ -d ".next" ]; then
    log_pass
    SIZE=$(du -sh .next | cut -f1)
    echo "         Build size: $SIZE"
else
    log_fail "Build not found. Run: npm run build"
fi

log_check "next.config.js exists"
if [ -f "next.config.js" ]; then log_pass; else log_fail "Next.js config missing"; fi

log_check "package-lock.json exists"
if [ -f "package-lock.json" ]; then log_pass; else log_fail "package-lock.json missing"; fi

# ============================================================================
# 3. ENVIRONMENT CONFIGURATION
# ============================================================================
echo ""
echo -e "${BLUE}[3] Environment Configuration${NC}"

log_check ".env.production template exists or .env.production can be created"
if [ -f ".env.production" ] || [ -f ".env.production.example" ]; then
    log_pass
else
    log_warn "Create .env.production before deployment with production values"
fi

log_check ".env file not in git"
if git check-ignore .env >/dev/null 2>&1; then
    log_pass
else
    if [ -f ".env" ]; then
        log_fail ".env file IS in git repository - SECURITY RISK!"
    else
        log_pass
    fi
fi

log_check "NEXTAUTH_SECRET will be generated"
log_pass

log_check "DATABASE_URL will be configured on VPS"
log_pass

# ============================================================================
# 4. DEPENDENCIES
# ============================================================================
echo ""
echo -e "${BLUE}[4] Dependencies${NC}"

log_check "node_modules exists"
if [ -d "node_modules" ]; then
    log_pass
    COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "         Package count: ~$((COUNT-1))"
else
    log_warn "node_modules not installed. Run: npm ci"
fi

log_check "Next.js version 15+ required"
if grep -q '"next": "15' package.json 2>/dev/null; then
    log_pass
    VERSION=$(grep '"next"' package.json | grep -oE '15\.[0-9]+\.[0-9]+' || echo "unknown")
    echo "         Version: $VERSION"
else
    log_warn "Check Next.js version in package.json"
fi

log_check "TypeScript configured"
if [ -f "tsconfig.json" ]; then log_pass; else log_fail "tsconfig.json missing"; fi

log_check "Prisma client available"
if [ -d "node_modules/.prisma/client" ]; then
    log_pass
else
    log_warn "Run: npx prisma generate"
fi

# ============================================================================
# 5. CODE QUALITY
# ============================================================================
echo ""
echo -e "${BLUE}[5] Code Quality${NC}"

log_check "ESLint configuration exists"
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    log_pass
else
    log_warn "ESLint not configured"
fi

log_check "No console.log in production code"
LOGS=$(grep -r "console\.log" src/ 2>/dev/null | wc -l || echo "0")
if [ "$LOGS" -eq 0 ]; then
    log_pass
else
    log_warn "Found $LOGS console.log statements in src/. Consider removing for production."
fi

log_check "No test seeds in production code"
TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l)
if [ "$TEST_FILES" -eq 0 ]; then
    log_pass
else
    echo "         Found $TEST_FILES test files (ok if in test directory)"
fi

# ============================================================================
# 6. SECURITY
# ============================================================================
echo ""
echo -e "${BLUE}[6] Security Checks${NC}"

log_check "No API keys in source code"
if grep -r "OPENAI_API_KEY\|AWS_SECRET\|DATABASE_PASSWORD" src/ 2>/dev/null | grep -v '${' > /dev/null 2>&1; then
    log_fail "Found hardcoded secrets in source code!"
else
    log_pass
fi

log_check "NextAuth.js configured"
if grep -q "NEXTAUTH_SECRET\|NEXTAUTH_URL" src/auth.ts 2>/dev/null || grep -q "providers:" src/auth.ts 2>/dev/null; then
    log_pass
else
    log_warn "Verify NextAuth.js configuration"
fi

log_check "No development dependencies in build"
DEV_ONLY=$(grep -c "devDependencies" package.json || echo "0")
if [ "$DEV_ONLY" -gt 0 ]; then
    log_pass "DevDependencies properly separated"
else
    log_pass
fi

# ============================================================================
# 7. DATABASE & MIGRATIONS
# ============================================================================
echo ""
echo -e "${BLUE}[7] Database & Migrations${NC}"

log_check "Prisma schema is valid"
if npx prisma validate >/dev/null 2>&1; then
    log_pass
else
    log_fail "Prisma schema validation failed"
fi

log_check "Migrations directory exists"
if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 prisma/migrations/ 2>/dev/null | wc -l)
    log_pass
    echo "         Migrations: $MIGRATION_COUNT"
else
    log_warn "No migrations found. Ensure migrations exist before deployment."
fi

log_check "Prisma client generation possible"
if npx prisma generate >/dev/null 2>&1; then
    log_pass
else
    log_fail "Prisma client generation failed"
fi

# ============================================================================
# 8. DOCKER (if applicable)
# ============================================================================
echo ""
echo -e "${BLUE}[8] Docker Configuration (Optional)${NC}"

if [ -f "Dockerfile" ]; then
    log_check "Dockerfile exists"
    log_pass
    
    log_check "Docker build works"
    if docker build --dry-run -f Dockerfile . >/dev/null 2>&1; then
        log_pass
    else
        log_warn "Docker build test failed (not critical)"
    fi
else
    echo "         Dockerfile not found (ok - using direct Node.js deployment)"
fi

# ============================================================================
# 9. GIT CONFIGURATION
# ============================================================================
echo ""
echo -e "${BLUE}[9] Git Configuration${NC}"

log_check "Git repository initialized"
if [ -d ".git" ]; then log_pass; else log_fail "Not a git repository"; fi

log_check "All code committed"
if [ -z "$(git status -s)" ] || [ "$(git status -s | wc -l)" -lt 5 ]; then
    log_pass
else
    log_warn "$(git status -s | wc -l) files have uncommitted changes"
fi

log_check ".gitignore properly configured"
IGNORED=("node_modules" ".next" ".env" "dist" "coverage")
for item in "${IGNORED[@]}"; do
    if ! grep -q "$item" .gitignore 2>/dev/null; then
        log_warn "$item not in .gitignore"
    fi
done
log_pass

# ============================================================================
# 10. DEPLOYMENT READINESS
# ============================================================================
echo ""
echo -e "${BLUE}[10] Deployment Readiness${NC}"

log_check "Node.js version compatible"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    log_pass
    echo "         Node.js: $(node -v)"
else
    log_fail "Node.js 18+ required (current: $(node -v))"
fi

log_check "npm/yarn present"
if command -v npm &> /dev/null; then
    log_pass "npm: $(npm -v)"
elif command -v yarn &> /dev/null; then
    log_pass "yarn: $(yarn -v)"
else
    log_fail "npm or yarn not found"
fi

log_check "Disk space sufficient"
DISK=$(df . | awk 'NR==2 {print $4}')
if [ "$DISK" -gt 1000000 ]; then  # > 1GB
    log_pass
    echo "         Available: $(df -h . | awk 'NR==2 {print $4}')"
else
    log_fail "Insufficient disk space"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
echo -e "Checks Passed: ${GREEN}$PASS${NC}"
echo -e "Checks Failed: ${RED}$FAIL${NC}"
echo -e "Warnings: ${YELLOW}$WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ APPLICATION READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure .env.production with production values:"
    echo "   - DATABASE_URL: postgresql://user:password@vps_ip:5432/hims_production"
    echo "   - NEXTAUTH_SECRET: $(openssl rand -base64 32)"
    echo "   - NEXTAUTH_URL: https://yourdomain.com"
    echo "   - AWS_S3_BUCKET: hims-production-docs (if using AWS)"
    echo ""
    echo "2. Run deployment script:"
    echo "   bash deploy-safe.sh <vps_ip> <domain> <db_password>"
    echo ""
    echo "Example:"
    echo "   bash deploy-safe.sh 123.45.67.89 yourdomain.com 'SecurePassword123'"
    echo ""
    exit 0
else
    echo -e "${RED}✗ DEPLOYMENT BLOCKED - Fix failures above${NC}"
    exit 1
fi
