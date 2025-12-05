# 🚀 HIMS Implementation Checklist
**Implementation Guide untuk Audit Report**

---

## ✅ Files Created (READY TO USE)

### 1. **Komponen UI**
- ✅ `src/components/ui/Button.tsx` - Reusable button component dengan 4 variants
- ✅ `src/lib/utils.ts` - Utility function `cn()` untuk merge Tailwind classes

### 2. **Infrastructure**
- ✅ `src/lib/logger.ts` - Structured logger dengan sanitization
- ✅ `src/lib/constants.ts` - Centralized constants (45+ values)

### 3. **Documentation**
- ✅ `AUDIT_REPORT.md` - Comprehensive audit dengan examples
- ✅ `REFACTORED_EXAMPLE_contracts_route.ts` - Contoh best practice API route

---

## 📦 Required Dependencies

Install dependencies untuk Button component dan validation:

```bash
# For Button component (cn utility)
npm install clsx tailwind-merge

# For input validation (recommended untuk API routes)
npm install zod

# For better date handling
npm install date-fns

# TypeScript types
npm install -D @types/react @types/node
```

---

## 🔧 Implementation Steps

### PHASE 1: Setup Infrastructure (1 hari)
**Priority**: 🔴 HIGH

#### Step 1.1: Install Dependencies
```bash
cd /home/docter203/hanmarine_hims/hims-app
npm install clsx tailwind-merge zod date-fns
```

#### Step 1.2: Verify Button Component
```bash
# Test import di salah satu file
# Buka src/app/dashboard/page.tsx dan tambah di top:
# import { Button } from '@/components/ui/Button';
```

#### Step 1.3: Add Environment Variables
Edit `.env.production`:
```bash
# Company Info (untuk replace hardcoded values)
COMPANY_NAME="PT HANMARINE INTERNATIONAL MARITIME SERVICE"
COMPANY_ADDRESS="Jalan Raya Baru No. 123, Jakarta Pusat 10110, Indonesia"
COMPANY_PHONE="+62 21 1234 5678"
COMPANY_EMAIL="office@hanmarine.com"
COMPANY_LICENSE_NUMBER="SIUPAK/123/2020"
```

---

### PHASE 2: Fix Security Issues (2-3 hari)
**Priority**: 🔴 HIGH

#### Step 2.1: Replace `any` Types di API Routes

**Target Files** (10 most critical):
```
src/app/api/applications/[id]/route.ts:67
src/app/api/vessels/[id]/route.ts:74
src/app/api/prepare-joining/route.ts:22
src/app/api/interviews/route.ts:22
src/app/api/form-templates/route.ts:21
src/app/api/form-submissions/route.ts:22
src/app/api/form-submissions/[id]/route.ts:106
src/app/api/prepare-joining/[id]/route.ts:120
```

**Action**:
```bash
# Find all 'any' types
grep -rn ": any" src/app/api --include="*.ts" > any_types_audit.txt

# Review and replace dengan Prisma types
# Reference: REFACTORED_EXAMPLE_contracts_route.ts
```

**Pattern untuk replace**:
```typescript
// ❌ BEFORE
const updateData: any = {};

// ✅ AFTER
import { Prisma } from '@prisma/client';
const updateData: Prisma.ApplicationUpdateInput = {};
```

#### Step 2.2: Add Query Filters untuk `.findMany()`

**Target Files** (high risk):
```
src/app/api/contracts/route.ts:36
src/app/api/hr/requisitions/route.ts:7
src/app/api/hr/appraisals/route.ts:7
src/app/api/quality/qmr/tasks/route.ts:13
src/app/api/compliance/communication/route.ts:17
```

**Template untuk add filter**:
```typescript
// ✅ Add role-based where clause
const where: Prisma.ModelWhereInput = {};

if (session.user.roles?.includes('CREW_PORTAL')) {
  where.crewId = session.user.crewId; // Own data only
}

if (session.user.roles?.includes('OPERATIONAL')) {
  where.status = { in: ['ACTIVE', 'PENDING'] };
}

const data = await prisma.model.findMany({
  where,
  take: DEFAULT_PAGE_SIZE, // Add limit
  select: {
    // Only expose non-sensitive fields
  }
});
```

#### Step 2.3: Replace console.log dengan logger

**Action**:
```bash
# Find all console usage
grep -rn "console\." src/app/api --include="*.ts" > console_audit.txt

# Count occurrences
grep -rc "console\." src/app/api --include="*.ts" | grep -v ":0"
```

**Pattern untuk replace**:
```typescript
// ❌ BEFORE
console.error("Error fetching crew:", error);

// ✅ AFTER
import { logger } from '@/lib/logger';

try {
  // ...
} catch (error) {
  logger.error('Failed to fetch crew', error as Error, {
    userId: session.user.id,
    endpoint: '/api/crew'
  });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

---

### PHASE 3: UI Consistency (3-4 hari)
**Priority**: 🟡 MEDIUM

#### Step 3.1: Refactor Top 10 Pages dengan Button Component

**Target Pages** (most used):
```
1. src/app/dashboard/page.tsx (276, 1132, 1135, 1138, 1141)
2. src/app/crewing/applications/page.tsx (163, 267, 282, 292, 298)
3. src/app/crewing/principals/page.tsx (327, 535, 542, 712, 719)
4. src/app/quality/forms/page.tsx (563, 703, 2554, 2615, 2630)
5. src/app/auth/signin/page.tsx (94)
6. src/app/compliance/communication/page.tsx (107, 119, 166, 174, 182)
7. src/app/crewing/sign-off/page.tsx (93, 159, 162)
8. src/app/hr/management/page.tsx (54, 69, 84, 112, 166)
9. src/app/crewing/applications/new/page.tsx (121, 128)
10. src/app/crewing/seafarers/new/page.tsx (102, 405, 422)
```

**Example Refactor** (dashboard logout button):
```typescript
// ❌ BEFORE (Line 276)
<button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg">
  <LogOutIcon className="h-5 w-5" />
  <span>Logout</span>
</button>

// ✅ AFTER
import { Button } from '@/components/ui/Button';

<Button 
  variant="danger" 
  onClick={handleLogout}
  leftIcon={<LogOutIcon className="h-5 w-5" />}
  className="w-full"
>
  Logout
</Button>
```

**Batch Replace Script** (optional):
```bash
# Create script: refactor-buttons.sh
#!/bin/bash

# Replace common button patterns (USE WITH CAUTION - review changes)
find src/app -name "*.tsx" -type f -exec sed -i.bak \
  's/<button className="[^"]*bg-blue-600[^"]*"/<Button variant="primary"/g' {} \;

# Review changes
git diff src/app
```

#### Step 3.2: Remove Inline Styles

**Find all inline styles**:
```bash
grep -rn 'style={{' src/app --include="*.tsx" > inline_styles_audit.txt
```

**Common patterns**:
```typescript
// ❌ BEFORE
<div style={{ width: '98.5%' }}>

// ✅ AFTER
<div className="w-[98.5%]">

// ❌ BEFORE
<nav style={{ maxHeight: 'calc(100vh - 300px)' }}>

// ✅ AFTER
<nav className="max-h-[calc(100vh-300px)]">
```

#### Step 3.3: Standardize Typography

**Create Typography Guide**:
```typescript
// Add to src/lib/constants.ts or create typography.ts

export const TYPOGRAPHY_CLASSES = {
  // Headings
  h1: 'text-3xl font-extrabold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-semibold text-gray-800',
  h4: 'text-lg font-semibold text-gray-800',
  
  // Body
  body: 'text-base text-gray-700',
  bodySmall: 'text-sm text-gray-600',
  
  // Labels
  label: 'text-sm font-semibold text-gray-900',
  labelOptional: 'text-sm font-medium text-gray-600',
  
  // Captions
  caption: 'text-xs text-gray-500'
} as const;
```

**Usage**:
```typescript
import { TYPOGRAPHY_CLASSES } from '@/lib/constants';

<h1 className={TYPOGRAPHY_CLASSES.h1}>Page Title</h1>
<p className={TYPOGRAPHY_CLASSES.body}>Content here</p>
<label className={TYPOGRAPHY_CLASSES.label}>Field Name</label>
```

---

### PHASE 4: Code Quality (2 hari)
**Priority**: 🟢 LOW

#### Step 4.1: Extract Hardcoded Values

**Target Files**:
```
src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts:80
src/app/api/compliance/siuppak/route.ts:89
```

**Action**:
```typescript
// ❌ BEFORE
const companyInfo = {
  name: "PT HANMARINE INTERNATIONAL MARITIME SERVICE",
  // ...
};

// ✅ AFTER
import { COMPANY_NAME, COMPANY_ADDRESS } from '@/lib/constants';

const companyInfo = {
  name: COMPANY_NAME,
  address: COMPANY_ADDRESS,
  // ...
};
```

#### Step 4.2: Add Input Validation dengan Zod

**Example** (applications API):
```typescript
import { z } from 'zod';

const CreateApplicationSchema = z.object({
  crewId: z.string().cuid("Invalid crew ID"),
  position: z.string().min(1, "Position required"),
  principalId: z.string().cuid().optional(),
  remarks: z.string().max(500, "Remarks too long").optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  try {
    const validatedData = CreateApplicationSchema.parse(body);
    // Use validatedData (type-safe!)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

---

## 🧪 Testing Checklist

After each phase, run:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Build test
npm run build

# 4. Run app locally
npm run dev

# 5. Manual testing
# - Login dengan different roles (DIRECTOR, CREW_PORTAL, ACCOUNTING)
# - Test API endpoints di Postman/Thunder Client
# - Verify data masking works (crew can't see others' contracts)
# - Check console - should see no console.log, only logger output
```

---

## 📊 Progress Tracking

### Phase 1: Infrastructure Setup
- [ ] Install dependencies (clsx, tailwind-merge, zod)
- [ ] Verify Button component imports
- [ ] Add company environment variables
- [ ] Test logger in development

### Phase 2: Security Fixes
- [ ] Replace `any` types in applications/[id]/route.ts
- [ ] Replace `any` types in vessels/[id]/route.ts
- [ ] Replace `any` types in prepare-joining/route.ts
- [ ] Add query filters in contracts/route.ts
- [ ] Add query filters in hr/requisitions/route.ts
- [ ] Add query filters in quality/qmr/tasks/route.ts
- [ ] Replace console.log in crew/[id]/route.ts
- [ ] Replace console.log in contracts/route.ts
- [ ] Replace console.log in applications/[id]/route.ts
- [ ] Replace console.log in dashboard/stats/route.ts

### Phase 3: UI Consistency
- [ ] Refactor buttons in dashboard/page.tsx
- [ ] Refactor buttons in crewing/applications/page.tsx
- [ ] Refactor buttons in crewing/principals/page.tsx
- [ ] Refactor buttons in quality/forms/page.tsx
- [ ] Refactor buttons in auth/signin/page.tsx
- [ ] Remove inline styles in dashboard/page.tsx
- [ ] Remove inline styles in crewing/page.tsx
- [ ] Remove inline styles in crewing/prepare-joining/page.tsx
- [ ] Standardize typography in top 5 pages

### Phase 4: Code Quality
- [ ] Extract company info to constants
- [ ] Add Zod validation in applications API
- [ ] Add Zod validation in contracts API
- [ ] Add Zod validation in prepare-joining API
- [ ] Document API schemas

---

## 🎯 Success Metrics

**Target Goals**:
- ✅ 0 `any` types in API routes
- ✅ 0 `.findMany()` without `where` clause
- ✅ 0 `console.log` in production code
- ✅ 100+ buttons use `<Button>` component
- ✅ 0 inline `style={{}}` (use Tailwind)
- ✅ All API inputs validated with Zod
- ✅ Build passes with no TypeScript errors
- ✅ npm audit shows 0 critical vulnerabilities

**Performance Targets**:
- ⚡ API response time < 200ms (with pagination)
- ⚡ Dashboard load time < 1s
- ⚡ Page bundle size < 200KB (First Load JS)

---

## 📞 Support & Questions

**Common Issues**:

1. **"Module not found: Can't resolve '@/components/ui/Button'"**
   - Check tsconfig.json paths configuration
   - Ensure file exists at correct location
   - Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")

2. **"Type error: Property 'cn' does not exist"**
   - Install: `npm install clsx tailwind-merge`
   - Verify src/lib/utils.ts exists

3. **"Prisma type not found"**
   - Run: `npx prisma generate`
   - Import: `import { Prisma } from '@prisma/client'`

4. **Button styles not showing**
   - Check Tailwind JIT mode is enabled
   - Verify globals.css is imported in layout.tsx
   - Clear .next cache: `rm -rf .next && npm run dev`

---

## 🔄 Deployment Steps

After implementation:

```bash
# 1. Local testing
npm run build
npm start

# 2. Commit changes
git add .
git commit -m "refactor: improve type safety, security, and UI consistency"

# 3. Deploy ke VPS
./deploy-to-server.sh

# 4. Verify production
ssh root@31.97.223.11
cd /opt/hims-app
pm2 restart hims-app
pm2 logs hims-app --lines 100

# 5. Test endpoints
curl -I https://app.hanmarine.co
curl https://app.hanmarine.co/api/health
```

---

## 📝 Notes

- **Backup first**: Create git branch sebelum refactor besar
- **Incremental**: Implement phase by phase, test setiap phase
- **Review**: Minta tim review PR sebelum merge
- **Monitor**: Setup Sentry atau monitoring service untuk production errors

**Estimated Total Time**: 8-10 hari kerja (dengan testing)

**Priority Order**:
1. 🔴 Phase 2 (Security) - CRITICAL
2. 🔴 Phase 1 (Infrastructure) - BLOCKING
3. 🟡 Phase 3 (UI) - IMPORTANT
4. 🟢 Phase 4 (Quality) - NICE TO HAVE
