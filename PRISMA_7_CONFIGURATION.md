# Prisma 7 Configuration Guide

## Overview

HIMS uses **Prisma 7.x** which introduced a breaking change in how database connections are configured. This guide explains the new approach and how to properly configure the database connection.

---

## 🔄 Breaking Change in Prisma 7

### Before (Prisma 6.x and earlier):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ No longer supported in Prisma 7
}
```

### After (Prisma 7+):

```prisma
datasource db {
  provider = "postgresql"
  // No url property - connection is configured in PrismaClient
}
```

---

## ✅ Current Configuration

### 1. Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // No url - connection via adapter pattern
}
```

### 2. Prisma Client (`src/lib/prisma.ts`)

The database connection is configured using the **adapter pattern**:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Read DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

// Create PostgreSQL connection pool
const pool = new Pool({ connectionString });

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize PrismaClient with adapter
export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});
```

---

## 🔧 Environment Configuration

### Required Environment Variable

`DATABASE_URL` is still required and must be set in `.env.production`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### Example:

```bash
DATABASE_URL="postgresql://hims_prod_user:SecurePassword@localhost:5432/hims_prod?schema=public"
```

---

## 📦 Required Dependencies

The following packages are required for Prisma 7 with PostgreSQL:

```json
{
  "@prisma/client": "^7.1.0",
  "@prisma/adapter-pg": "^7.1.0",
  "pg": "^8.x"
}
```

---

## 🚀 Migration Commands

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Migrations (Development)

```bash
npx prisma migrate dev --name migration_name
```

### Deploy Migrations (Production)

```bash
npx prisma migrate deploy
```

### Validate Schema

```bash
npx prisma validate
```

---

## 🔍 Troubleshooting

### Error: "datasource property `url` is no longer supported"

**Solution:** Remove the `url` property from the `datasource db` block in `prisma/schema.prisma`.

### Error: "DATABASE_URL environment variable not found"

**Solution:** Ensure `DATABASE_URL` is set in your `.env.production` file:

```bash
# Check if variable is set
echo $DATABASE_URL

# If not set, add to .env.production
nano .env.production
```

### Error: "Cannot connect to database"

**Solution:** Verify the connection string format:

```bash
# Test connection with psql
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Error: "Prisma Client generation failed"

**Solution:** Regenerate the client:

```bash
# Remove generated files
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Reinstall and regenerate
npm install
npx prisma generate
```

---

## 🔐 Security Best Practices

1. **Never commit DATABASE_URL** to version control
2. **Use strong passwords** for database users (minimum 16 characters)
3. **Limit database user permissions** to only required operations
4. **Use SSL connections** in production (add `?sslmode=require` to connection string)
5. **Rotate credentials regularly** (every 90 days recommended)

### SSL Connection Example:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require"
```

---

## 📚 Additional Resources

- [Prisma 7 Migration Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Adapter Documentation](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [PostgreSQL Connection Pooling](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#connection-pool)

---

## ✅ Verification Checklist

- [ ] `prisma/schema.prisma` has no `url` property in datasource
- [ ] `src/lib/prisma.ts` uses adapter pattern
- [ ] `DATABASE_URL` is set in `.env.production`
- [ ] `npx prisma validate` passes successfully
- [ ] `npx prisma generate` completes without errors
- [ ] Database connection works (test with `npx prisma studio`)
- [ ] Migrations can be applied successfully

---

**Last Updated:** January 2026  
**Prisma Version:** 7.1.0+
