# Troubleshooting Guide - HIMS App

## Common Build & Installation Issues

### 1. Puppeteer Network Error During `npm install`

**Error Message:**
```
Error: ERROR: Failed to set up chrome v142.0.7444.175! 
Set "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.
Error: getaddrinfo ENOTFOUND googlechromelabs.github.io
```

**Cause:**
Puppeteer tries to download Chrome browser during installation, but the network may be restricted or blocked in certain environments (sandboxed CI/CD, corporate networks, etc.).

**Solution:**
Skip the Chrome download by setting the environment variable:
```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

**Alternative Solutions:**
1. Add to `.npmrc` file:
   ```
   puppeteer_skip_download=true
   ```

2. Set as permanent environment variable:
   ```bash
   export PUPPETEER_SKIP_DOWNLOAD=true
   npm install
   ```

3. If you need Chrome for testing, install it separately after npm install:
   ```bash
   PUPPETEER_SKIP_DOWNLOAD=true npm install
   npx puppeteer browsers install chrome
   ```

---

### 2. Prisma Client Type Errors After Schema Changes

**Error Message:**
```
Type error: Module '"@prisma/client"' has no exported member 'ComplianceAuditStatus'.
```

**Cause:**
The Prisma client wasn't regenerated after schema changes or fresh installation. TypeScript can't find the enum types defined in `schema.prisma`.

**Solution:**
Regenerate the Prisma client:
```bash
npx prisma generate
```

**When to Run This:**
- After any changes to `prisma/schema.prisma`
- After fresh `npm install`
- When switching between branches with different schema versions
- If you see TypeScript errors about missing Prisma types

---

### 3. Complete Fresh Setup Process

For a clean installation from scratch:

```bash
# 1. Install dependencies (skip puppeteer download)
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations (requires database connection)
npx prisma migrate dev

# 4. Build the application
npm run build

# 5. Run type checking
npm run typecheck
```

---

### 4. Environment Variable Warnings During Build

**Warning Message:**
```
[env] configuration issues detected {
  issues: [
    'NEXTAUTH_SECRET must be set and at least 32 characters.',
    'DATABASE_URL must be set.',
    'HIMS_CRYPTO_KEY must be set and at least 32 characters.'
  ]
}
```

**Cause:**
Build-time warnings about missing environment variables. These are non-fatal for build but required for runtime.

**Solution:**
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: 32+ character random string for NextAuth
- `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:3000`)
- `HIMS_CRYPTO_KEY`: 32+ character random string for data encryption

Generate secure secrets:
```bash
openssl rand -base64 32
```

---

### 5. Database Connection Issues

**Error:** Can't connect to database

**Solutions:**

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Start database:
   ```bash
   docker-compose up -d
   ```

3. Verify connection string in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5434/hims?schema=public"
   ```

4. Test connection:
   ```bash
   npx prisma db pull
   ```

---

## Quick Fixes

### Reset Everything and Start Fresh
```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Clean build artifacts
rm -rf .next

# Fresh install with puppeteer skip
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Generate Prisma client
npx prisma generate

# Build
npm run build
```

### Check Build Status
```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```

---

## Getting Help

If you encounter issues not covered here:

1. Check the main README.md for setup instructions
2. Review DEPLOYMENT.md for production setup
3. Check GitHub Issues for similar problems
4. Create a new issue with:
   - Error message (full stack trace)
   - Steps to reproduce
   - Environment details (Node version, OS, etc.)
