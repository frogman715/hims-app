# API REFACTORING GUIDE - HIMS

## 🎯 Objective
Standardize all 123 API route handlers dengan pattern yang clean, consistent, dan maintainable.

---

## ✅ Completed Example
**File**: `src/app/api/wage-scales/route.ts`  
**Status**: ✅ Fully refactored (96 → 70 lines)

### Before (Old Pattern - BAD ❌)
```typescript
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, 'wageScales', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const data = await prisma.wageScaleHeader.findMany({
      include: { items: true, principal: true }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Problems**:
- 🔴 Manual auth checking (boilerplate)
- 🔴 Manual permission checking (repetitive)
- 🔴 Manual try/catch (verbose)
- 🔴 Inconsistent error messages
- 🔴 Inconsistent response format

---

### After (New Pattern - GOOD ✅)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { validateRequired } from "@/lib/error-handler";

/**
 * GET /api/wage-scales - Fetch all wage scale headers with items
 * Permission: VIEW_ACCESS on wageScales module
 */
export const GET = withPermission(
  "wageScales",
  PermissionLevel.VIEW_ACCESS,
  async () => {
    const wageScales = await prisma.wageScaleHeader.findMany({
      include: { items: true, principal: true },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ data: wageScales, total: wageScales.length });
  }
);

/**
 * POST /api/wage-scales - Create new wage scale header
 * Permission: EDIT_ACCESS on wageScales module
 */
export const POST = withPermission(
  "wageScales",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest) => {
    const body = await req.json();
    const { name, principalId, rank, items } = body;

    // Input validation
    validateRequired(name, "name");
    validateRequired(rank, "rank");

    const wageScaleHeader = await prisma.wageScaleHeader.create({
      data: { name, principalId, rank, items: { create: items || [] } },
      include: { items: true, principal: true },
    });

    return NextResponse.json({
      data: wageScaleHeader,
      message: "Wage scale created successfully",
    }, { status: 201 });
  }
);
```

**Benefits**:
- ✅ Clean, readable code (30% reduction in LOC)
- ✅ Auto auth + permission checking
- ✅ Auto error handling (Prisma + ApiError)
- ✅ Consistent response format
- ✅ JSDoc documentation
- ✅ Type-safe with NextRequest/NextResponse

---

## 📋 Refactoring Checklist

For each API route file (`src/app/api/**/*.ts`):

### 1. Update Imports
```typescript
// ❌ OLD
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// ✅ NEW
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission, withAuth } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { validateRequired, ApiError } from "@/lib/error-handler";
```

### 2. Replace `export async function` → `export const`
```typescript
// ❌ OLD
export async function GET() { ... }

// ✅ NEW
export const GET = withPermission("moduleName", PermissionLevel.VIEW_ACCESS, async () => {
  // handler logic
});
```

### 3. Choose Appropriate Middleware

#### For routes with permission checks:
```typescript
export const GET = withPermission("crew", PermissionLevel.VIEW_ACCESS, async (req) => {
  // Your logic here - session available automatically
});
```

#### For routes with auth only (no permission):
```typescript
export const GET = withAuth(async (req, session) => {
  // Your logic here - session passed as parameter
});
```

#### For public routes (no auth):
```typescript
export async function GET(req: NextRequest) {
  // No middleware needed for public endpoints
}
```

### 4. Remove Manual Error Handling
```typescript
// ❌ OLD - Manual try/catch
try {
  const data = await prisma.crew.findMany();
  return NextResponse.json(data);
} catch (error) {
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// ✅ NEW - Middleware handles errors automatically
const data = await prisma.crew.findMany();
return NextResponse.json({ data, total: data.length });
```

### 5. Use Validation Helpers
```typescript
// ❌ OLD - Manual validation
if (!name || !email) {
  return NextResponse.json({ error: "Name and email required" }, { status: 400 });
}

// ✅ NEW - Use validateRequired
validateRequired(name, "name");
validateRequired(email, "email");

// Or throw ApiError for custom validation
if (age < 18) {
  throw new ApiError(400, "Age must be 18 or older", "INVALID_AGE");
}
```

### 6. Standardize Response Format
```typescript
// ✅ GET endpoints - return array with total
return NextResponse.json({ data: items, total: items.length });

// ✅ POST endpoints - return created item with message
return NextResponse.json({
  data: newItem,
  message: "Item created successfully"
}, { status: 201 });

// ✅ PUT endpoints - return updated item
return NextResponse.json({
  data: updatedItem,
  message: "Item updated successfully"
});

// ✅ DELETE endpoints - return success message
return NextResponse.json({
  message: "Item deleted successfully"
});
```

### 7. Add JSDoc Comments
```typescript
/**
 * GET /api/crew - Fetch all crew members with filters
 * Permission: VIEW_ACCESS on crew module
 * Query params: status (optional), rank (optional)
 */
export const GET = withPermission("crew", PermissionLevel.VIEW_ACCESS, async (req) => {
  // ...
});
```

---

## 🔄 Module Permission Mapping

| Module | Permission Key | Levels |
|--------|---------------|---------|
| Crew | `crew` | VIEW, EDIT, FULL |
| Contracts | `contracts` | VIEW, EDIT, FULL |
| Applications | `applications` | VIEW, EDIT, FULL |
| Documents | `documents` | VIEW, EDIT, FULL |
| Wage Scales | `wageScales` | VIEW, EDIT, FULL |
| Assignments | `assignments` | VIEW, EDIT, FULL |
| Principals | `principals` | VIEW, EDIT, FULL |
| Vessels | `vessels` | VIEW, EDIT, FULL |
| Insurance | `insurance` | VIEW, EDIT, FULL |
| Agency Fees | `agencyFees` | VIEW, EDIT, FULL |
| Accounting | `accounting` | VIEW, EDIT, FULL |
| Attendance | `attendance` | VIEW, EDIT, FULL |
| Dispatches | `dispatches` | VIEW, EDIT, FULL |

---

## 📊 Progress Tracker

### ✅ Completed (1/123)
- [x] `/api/wage-scales` - GET, POST

### 🔄 High Priority (Suggested next targets)
- [ ] `/api/crew` - Main crew CRUD
- [ ] `/api/contracts` - Contract management
- [ ] `/api/applications` - Application workflow
- [ ] `/api/documents` - Document handling
- [ ] `/api/principals` - Principal CRUD
- [ ] `/api/vessels` - Vessel CRUD

### ⏳ Medium Priority
- [ ] `/api/assignments`
- [ ] `/api/insurance`
- [ ] `/api/agency-fees`
- [ ] `/api/accounting/*`
- [ ] `/api/prepare-joining`
- [ ] `/api/interviews`

### 🔵 Low Priority (Forms, stats, etc.)
- [ ] `/api/forms/*` - Form generation endpoints
- [ ] `/api/dashboard/stats` - Dashboard statistics
- [ ] `/api/quality/*` - QMR/HGQS endpoints

---

## 🛠 Tools & Helpers

### Available Middleware
```typescript
// src/lib/api-middleware.ts
withAuth()         // Auth only (session validation)
withPermission()   // Auth + permission check
withRateLimit()    // Auth + rate limiting
```

### Available Validators
```typescript
// src/lib/error-handler.ts
validateRequired(value, fieldName)  // Throws ApiError if value is falsy
ApiError(status, message, code)     // Custom error class
handleApiError(error)               // Auto error response handler
```

---

## 🎬 Quick Start Commands

### 1. Find routes without middleware
```bash
grep -r "export async function GET\|POST\|PUT\|DELETE" src/app/api --include="*.ts" | wc -l
# Result: 123 route handlers
```

### 2. Find routes still using manual auth
```bash
grep -r "getServerSession" src/app/api --include="*.ts" | wc -l
# Find count of files needing refactoring
```

### 3. Test a refactored route
```bash
# After refactoring, test with curl
curl -X GET http://localhost:3000/api/wage-scales \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

---

## ⚠️ Migration Notes

### Breaking Changes
None - middleware is backward compatible with existing session handling.

### Testing Required After Refactor
1. ✅ Auth validation (401 without token)
2. ✅ Permission validation (403 with wrong role)
3. ✅ Error handling (500 → proper error response)
4. ✅ Response format consistency

### Rollback Plan
Git commit setiap file setelah refactoring. Rollback per-file jika ada issue.

---

## 📚 References
- Permission matrix: `PERMISSION_MATRIX.md`
- Auth config: `src/lib/auth.ts`
- Middleware implementation: `src/lib/api-middleware.ts`
- Error handling: `src/lib/error-handler.ts`

---

**Status**: 1/123 routes refactored (0.8% complete)  
**Next Target**: `/api/crew/route.ts` (most critical endpoint)
