# 🔍 HIMS Code Audit Report
**Hanmarine Integrated Management System**  
**Date**: 6 Desember 2025  
**Auditor**: AI Code Review Assistant

---

## 📋 Executive Summary

Audit telah dilakukan terhadap codebase HIMS dengan fokus pada:
1. ✅ Konsistensi UI/UX (typography, spacing, button styles)
2. ⚠️ Keamanan (data exposure, input validation, query filtering)
3. ⚠️ Type Safety (penggunaan `any`, missing types)
4. ✅ Performance (console logs, redundant queries)

**Status Keseluruhan**: 🟡 **GOOD** dengan beberapa improvement areas

---

## 🎨 1. UI/UX Consistency

### ✅ **BAGUS**
- Font system sudah setup dengan baik di `globals.css` (HanmarineSans/Geist)
- Tailwind utilities digunakan secara konsisten
- Color palette enterprise (blue-600, gray-700, red-500)

### ⚠️ **PERLU DIPERBAIKI**

#### Problem 1: Inkonsistensi Button Styles
**Lokasi**: 163+ button di `src/app/**/*.tsx`

**Current State** (Contoh dari `dashboard/page.tsx:276`):
```tsx
<button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg">
  <LogOutIcon className="h-5 w-5" />
  <span>Logout</span>
</button>
```

**Issues**:
- 🔴 Manual className setiap kali (tidak DRY)
- 🔴 Tidak ada variant standardization
- 🔴 Sulit maintain consistency
- 🔴 Tidak ada loading state handling

**SOLUSI SUDAH DIBUAT**: ✅ `src/components/ui/Button.tsx`

**Cara Pakai**:
```tsx
import { Button } from '@/components/ui/Button';

// Primary button
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Danger button dengan icon
<Button 
  variant="danger" 
  onClick={handleLogout}
  leftIcon={<LogOutIcon className="h-5 w-5" />}
>
  Logout
</Button>

// Loading state
<Button variant="primary" isLoading={isSubmitting}>
  Submitting...
</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button> {/* default */}
<Button size="lg">Large</Button>

// Ghost/secondary
<Button variant="ghost">Cancel</Button>
<Button variant="secondary">Back</Button>
```

**Manfaat**:
- ✅ Konsisten di semua halaman (45+ pages)
- ✅ Easy to maintain (ubah satu tempat, semua update)
- ✅ Built-in loading state dengan spinner
- ✅ Accessible (focus rings, disabled states)
- ✅ Type-safe dengan TypeScript

---

#### Problem 2: Inline Styles Masih Ada
**Lokasi**: `dashboard/page.tsx:253`, `crewing/page.tsx:184`, dll.

**Example**:
```tsx
// ❌ BAD - inline style
<nav className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>

<div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
```

**REKOMENDASI**:
```tsx
// ✅ GOOD - Tailwind utility
<nav className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-300px)]">

<div className="bg-green-500 h-2 rounded-full w-[98.5%]"></div>
```

**Action Required**: Replace all inline `style={}` dengan Tailwind arbitrary values `className="w-[98.5%]"`

---

#### Problem 3: Typography Tidak Konsisten
**Lokasi**: Beberapa halaman masih mix font-medium/font-semibold/font-bold

**REKOMENDASI - Typography Scale**:
```tsx
// Headings
<h1 className="text-3xl font-extrabold text-gray-900">Page Title</h1>
<h2 className="text-2xl font-bold text-gray-900">Section Title</h2>
<h3 className="text-xl font-semibold text-gray-800">Subsection</h3>

// Body
<p className="text-base text-gray-700">Regular text</p>
<p className="text-sm text-gray-600">Small text</p>

// Labels
<label className="text-sm font-semibold text-gray-900">Field Label</label>

// Buttons - gunakan Button component (sudah termasuk font-semibold)
```

**Rationale**: Geist Sans (HanmarineSans) optimal di weight 600-800, hindari 300-400 untuk readability.

---

## 🔒 2. Security Issues

### ⚠️ **CRITICAL - HIGH PRIORITY**

#### Problem 1: Type `any` di API Routes
**Lokasi**: 
- `src/app/api/applications/[id]/route.ts:67`
- `src/app/api/vessels/[id]/route.ts:74`
- `src/app/api/prepare-joining/route.ts:22`
- Dan 10+ lainnya

**Current Code**:
```typescript
// ❌ BAD
const updateData: any = {};
if (status !== undefined) {
  updateData.status = status;
  updateData.reviewedBy = session.user.id; // NO TYPE CHECKING!
}
```

**Issues**:
- 🔴 Bypass type safety
- 🔴 Bisa assign wrong field types
- 🔴 Runtime errors tidak terdeteksi compile time
- 🔴 Sulit debug

**SOLUSI**:
```typescript
// ✅ GOOD - Gunakan Prisma generated types
import { Prisma } from '@prisma/client';

// Method 1: Partial update
type ApplicationUpdateInput = Prisma.ApplicationUpdateInput;
const updateData: Partial<ApplicationUpdateInput> = {};
if (status !== undefined) {
  updateData.status = status;
}

// Method 2: Type-safe builder
const updateData: Prisma.ApplicationUpdateInput = {
  ...(status && { status }),
  ...(position && { position }),
  ...(remarks && { remarks }),
  ...(status !== 'RECEIVED' && {
    reviewedBy: session.user.id,
    reviewedAt: new Date()
  })
};
```

**Action Required**: Replace ALL `any` types di API routes dengan Prisma types.

---

#### Problem 2: Query Tanpa Filter di Multiple Routes
**Lokasi**:
- `src/app/api/contracts/route.ts:36`
- `src/app/api/hr/requisitions/route.ts:7`
- `src/app/api/quality/qmr/tasks/route.ts:13`
- Dan banyak lainnya

**Current Code**:
```typescript
// ❌ DANGEROUS - No filtering, returns ALL data
const contracts = await prisma.employmentContract.findMany({
  include: {
    crew: true,
    assignment: true,
  }
});
```

**Issues**:
- 🔴 **Data leak**: User role CREW_PORTAL bisa akses semua contracts
- 🔴 **Performance**: Load semua data dari DB (ribuan rows)
- 🔴 **Privacy**: Expose data sensitif (salary, personal info)
- 🔴 **Compliance**: Melanggar data masking rules (AMBER/RED levels)

**SOLUSI**:
```typescript
// ✅ GOOD - Filter by role dan permission
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check permission
  if (!checkPermission(session, 'contracts', PermissionLevel.VIEW_ACCESS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Build where clause based on role
  const where: Prisma.EmploymentContractWhereInput = {};
  
  if (session.user.roles.includes('CREW_PORTAL')) {
    // Crew hanya bisa lihat kontrak sendiri
    where.crewId = session.user.crewId;
  }
  
  if (session.user.roles.includes('ACCOUNTING')) {
    // Accounting hanya kontrak untuk billing
    where.status = { in: ['ACTIVE', 'COMPLETED'] };
  }
  
  const contracts = await prisma.employmentContract.findMany({
    where,
    select: {
      id: true,
      contractNumber: true,
      startDate: true,
      endDate: true,
      crew: {
        select: {
          fullName: true,
          rank: true,
          // DON'T expose: passport, phone, address (RED data)
        }
      },
      // DON'T include salary for non-ACCOUNTING users
      ...(session.user.roles.includes('ACCOUNTING') && {
        basicSalary: true,
        overtimeRate: true
      })
    },
    take: 50, // Limit results
  });
  
  return NextResponse.json({ data: contracts });
}
```

**Action Required**: 
1. Audit SEMUA `.findMany()` calls
2. Add `where` clause berdasarkan user role
3. Use `select` untuk limit exposed fields
4. Add `take` limit untuk pagination

---

#### Problem 3: Console.log di Production Code
**Lokasi**: 73+ occurrences di `src/app/api/**/*.ts`

**Examples**:
```typescript
console.error("Error fetching crew:", error); // Line 88
console.error("Error updating crew:", error); // Line 156
console.log("Vision mission:", visionMission); // (hypothetical)
```

**Issues**:
- 🟡 **Security**: Bisa expose stack traces dengan env vars/secrets
- 🟡 **Performance**: Synchronous logging blocks event loop
- 🟡 **Production**: Tidak ada log aggregation/monitoring

**SOLUSI**:
```typescript
// ✅ Create proper logger - src/lib/logger.ts
import { NextRequest } from 'next/server';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  [key: string]: unknown;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      // Remove sensitive data
      ...(context?.error && {
        error: {
          message: (context.error as Error).message,
          // DON'T log: stack trace in production
          ...(process.env.NODE_ENV === 'development' && {
            stack: (context.error as Error).stack
          })
        }
      })
    };
    
    // In production: send to monitoring service (Sentry, Datadog, CloudWatch)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
      console.error(JSON.stringify(logEntry));
    } else {
      console[level === 'error' ? 'error' : 'log'](JSON.stringify(logEntry, null, 2));
    }
  }
  
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }
  
  error(message: string, error: Error, context?: LogContext) {
    this.log('error', message, { ...context, error });
  }
}

export const logger = new Logger();

// Usage di API routes
import { logger } from '@/lib/logger';

try {
  const crew = await prisma.crew.findMany();
  return NextResponse.json({ data: crew });
} catch (error) {
  logger.error('Failed to fetch crew', error as Error, {
    userId: session.user.id,
    endpoint: '/api/crew'
  });
  return NextResponse.json(
    { error: "Internal server error" }, // Generic message untuk client
    { status: 500 }
  );
}
```

**Action Required**: 
1. Create `src/lib/logger.ts`
2. Replace ALL `console.log/error` dengan `logger.info/error`
3. Setup monitoring service (Sentry recommended)

---

#### Problem 4: Environment Variables Exposed
**Potential Risk**: Beberapa file reference `process.env.*` di client components

**Check**:
```bash
# Run this to find client-side env usage
grep -r "process\.env\." src/app --include="*.tsx" | grep "'use client'"
```

**SAFE Pattern**:
```typescript
// ✅ Server-side only (API routes, Server Components)
const databaseUrl = process.env.DATABASE_URL;

// ✅ Client-side (must prefix with NEXT_PUBLIC_)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ DANGEROUS - Exposes secret to browser
const secret = process.env.NEXTAUTH_SECRET; // In 'use client' component
```

**Action Required**: Audit all `process.env` usage di client components.

---

## 📊 3. Code Quality Issues

### Problem 1: Hardcoded Company Info
**Lokasi**: 
- `src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts:80-83`
- `src/app/api/compliance/siuppak/route.ts:89`

**Current**:
```typescript
// ❌ BAD - Hardcoded
const companyInfo = {
  name: "PT HANMARINE INTERNATIONAL MARITIME SERVICE",
  address: "Jalan Raya Baru No. 123, Jakarta Pusat 10110, Indonesia",
  phone: "+62 21 1234 5678",
  email: "office@hanmarine.com"
};
```

**SOLUSI**:
```typescript
// ✅ GOOD - Store in database or env
// Option 1: Database (best)
const companyInfo = await prisma.companyProfile.findFirst();

// Option 2: Environment variables
const companyInfo = {
  name: process.env.COMPANY_NAME,
  address: process.env.COMPANY_ADDRESS,
  phone: process.env.COMPANY_PHONE,
  email: process.env.COMPANY_EMAIL
};
```

**Action Required**: Create `CompanyProfile` model atau move to `.env`.

---

### Problem 2: Magic Numbers & Strings
**Lokasi**: Multiple files

**Examples**:
```typescript
// ❌ BAD
<nav className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
const crewWithExpiringDocuments = await prisma.crewDocument.findMany({
  where: {
    expiryDate: { lte: addDays(new Date(), 30) } // Why 30?
  }
});
```

**SOLUSI**:
```typescript
// ✅ GOOD - Create constants
// src/lib/constants.ts
export const DOCUMENT_EXPIRY_WARNING_DAYS = 30;
export const CONTRACT_EXPIRY_WARNING_DAYS = 60;
export const SIDEBAR_HEIGHT_OFFSET = 300;

// Usage
<nav className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-${SIDEBAR_HEIGHT_OFFSET}px)]">
const crewWithExpiringDocuments = await prisma.crewDocument.findMany({
  where: {
    expiryDate: { lte: addDays(new Date(), DOCUMENT_EXPIRY_WARNING_DAYS) }
  }
});
```

---

## 🎯 Action Plan - Priority Order

### 🔴 **HIGH PRIORITY (Week 1)**
1. ✅ **DONE**: Create `Button` component
2. **Replace `any` types** di API routes dengan Prisma types (SECURITY)
3. **Add query filters** di `.findMany()` calls berdasarkan user role (DATA LEAK)
4. **Create `logger.ts`** dan replace console.log (MONITORING)

### 🟡 **MEDIUM PRIORITY (Week 2)**
5. **Refactor inline buttons** ke `Button` component (top 10 pages first)
6. **Audit `process.env` usage** di client components
7. **Remove inline styles**, gunakan Tailwind arbitrary values
8. **Extract constants** dari magic numbers/strings

### 🟢 **LOW PRIORITY (Week 3)**
9. **Typography cleanup** - standardize heading scales
10. **Company info** move to database/env
11. **Add integration tests** untuk critical API routes
12. **Setup error monitoring** (Sentry)

---

## 📝 Implementation Examples

### Example 1: Refactor Button di `dashboard/page.tsx`

**BEFORE** (Line 276):
```tsx
<button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg">
  <LogOutIcon className="h-5 w-5" />
  <span>Logout</span>
</button>
```

**AFTER**:
```tsx
import { Button } from '@/components/ui/Button';

<Button 
  variant="danger" 
  onClick={handleLogout}
  leftIcon={<LogOutIcon className="h-5 w-5" />}
  className="w-full" // Override untuk full width
>
  Logout
</Button>
```

**Lines saved**: 4 → 7 (tapi reusable!)  
**Benefit**: Consistent styling, loading state support, type-safe

---

### Example 2: Fix Type Safety di `applications/[id]/route.ts`

**BEFORE** (Line 67):
```typescript
const updateData: any = {};
if (status !== undefined) {
  updateData.status = status;
  if (status !== 'RECEIVED') {
    updateData.reviewedBy = session.user.id;
    updateData.reviewedAt = new Date();
  }
}
```

**AFTER**:
```typescript
import { Prisma } from '@prisma/client';

type ApplicationUpdateInput = Prisma.ApplicationUpdateInput;

const updateData: ApplicationUpdateInput = {
  ...(status && {
    status,
    ...(status !== 'RECEIVED' && {
      reviewedBy: session.user.id,
      reviewedAt: new Date()
    })
  }),
  ...(position && { position }),
  ...(vesselType && { vesselType }),
  ...(principalId && { principalId }),
  ...(remarks && { remarks })
};
```

**Benefit**: 
- ✅ Type-checked at compile time
- ✅ Auto-complete in IDE
- ✅ Catch errors before runtime

---

### Example 3: Add Query Filter di `contracts/route.ts`

**BEFORE** (Line 36):
```typescript
const contracts = await prisma.employmentContract.findMany({
  include: {
    crew: true,
    assignment: true,
  }
});
```

**AFTER**:
```typescript
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';

// Get user role
const session = await getServerSession(authOptions);
if (!checkPermission(session, 'contracts', PermissionLevel.VIEW_ACCESS)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Build role-based filter
const where: Prisma.EmploymentContractWhereInput = {};

if (session.user.roles?.includes('CREW_PORTAL')) {
  where.crewId = session.user.crewId; // Only own contracts
}

if (session.user.roles?.includes('OPERATIONAL')) {
  where.status = { in: ['ACTIVE', 'PENDING'] }; // Only active ones
}

const contracts = await prisma.employmentContract.findMany({
  where,
  select: {
    id: true,
    contractNumber: true,
    startDate: true,
    endDate: true,
    crew: {
      select: {
        fullName: true,
        rank: true,
        // Don't expose: passport, salary (RED data)
      }
    },
    // Conditionally include salary for ACCOUNTING only
    ...(session.user.roles?.includes('ACCOUNTING') && {
      basicSalary: true,
      overtimeRate: true
    })
  },
  take: 100, // Pagination
  orderBy: { createdAt: 'desc' }
});
```

---

## 🔧 Required Dependencies

Run these to support the Button component:

```bash
npm install clsx tailwind-merge
npm install -D @types/react
```

Update `tsconfig.json` (if needed):
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## ✅ Verification Checklist

Setelah implement changes, run:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Build test
npm run build

# 4. Security audit
npm audit

# 5. Find remaining 'any' types
grep -r ": any" src/app/api --include="*.ts" | wc -l

# 6. Find remaining inline styles
grep -r 'style={{' src/app --include="*.tsx" | wc -l

# 7. Find console.log/error
grep -r "console\." src/app/api --include="*.ts" | wc -l
```

**Target**: 
- ❌ 0 `any` types di API routes
- ❌ 0 inline `style={{}}` (gunakan Tailwind)
- ❌ 0 `console.log` di production code
- ✅ All buttons use `<Button>` component
- ✅ All queries have role-based filters

---

## 📚 Resources

- **Button Component**: `src/components/ui/Button.tsx`
- **Utils**: `src/lib/utils.ts` (cn() function)
- **Permissions**: `src/lib/permissions.ts` (existing RBAC matrix)
- **Prisma Types**: Auto-generated from `schema.prisma`
- **Tailwind Docs**: https://tailwindcss.com/docs

---

## 🤝 Recommendations Summary

### DO ✅
- Gunakan `<Button>` component untuk semua buttons
- Type dengan Prisma generated types
- Filter queries by user role
- Use structured logger untuk production
- Tailwind utilities > inline styles
- Extract constants dari magic values

### DON'T ❌
- Jangan pakai `: any` di TypeScript
- Jangan `.findMany()` tanpa `where` clause
- Jangan `console.log` di API routes
- Jangan hardcode company info di code
- Jangan expose `process.env.*` di client
- Jangan inline `style={{}}` kecuali critical

---

**Next Steps**: Mulai dari HIGH PRIORITY tasks, implement Button component di 5 pages tersering dulu sebagai proof of concept.

**Questions?** Review this document dengan tim development untuk prioritization.
