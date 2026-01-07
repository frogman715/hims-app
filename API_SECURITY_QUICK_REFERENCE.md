# HIMS API Security & Best Practices Quick Reference

## Authentication Patterns

### 1. Using `withPermission` HOF (RECOMMENDED)
```typescript
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission(
  "moduleName",  // crew, quality, compliance, etc.
  PermissionLevel.VIEW_ACCESS,
  async (req, session) => {
    // Your handler code here
    // session is automatically validated
    // errors are automatically handled
  }
);

export const POST = withPermission(
  "moduleName",
  PermissionLevel.EDIT_ACCESS,
  async (req, session) => {
    const body = await req.json();
    // Your creation code here
  }
);
```

### 2. Manual Session Check (When needed)
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, 'moduleName', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Your handler code here
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Error Handling

### Using Centralized Error Handler
```typescript
import { handleApiError, ApiError } from "@/lib/error-handler";

try {
  // Your code here
  if (!validData) {
    throw new ApiError(400, "Invalid data", "VALIDATION_ERROR");
  }
} catch (error) {
  return handleApiError(error);
}
```

## Input Validation

### Using validateRequired
```typescript
import { validateRequired } from "@/lib/error-handler";

const body = await req.json();
validateRequired(body.name, "name");
validateRequired(body.email, "email");
```

### Custom Validation
```typescript
if (!Array.isArray(body.items) || body.items.length === 0) {
  throw new ApiError(400, "Items must be a non-empty array", "VALIDATION_ERROR");
}
```

## Module Permission Names
- `crew` - Crew management, applications, assignments
- `quality` - Quality management, audits, risks, QMS
- `compliance` - External compliance, certifications
- `documents` - Document management
- `accounting` - Financial tracking, wages
- `hr` - Human resources, appraisals
- `admin` - System administration
- `contracts` - Employment contracts
- `principals` - Principal/vessel management
- `disciplinary` - Disciplinary records
- `agencyFees` - Agency fee management
- `wageScales` - Wage scale management
- `nationalHolidays` - Holiday calendar
- `insurance` - Insurance records

## Permission Levels
```typescript
enum PermissionLevel {
  NO_ACCESS = 0,      // Completely blocked
  VIEW_ACCESS = 1,    // Read-only
  EDIT_ACCESS = 2,    // Create/update (no delete)
  FULL_ACCESS = 3     // All operations including delete
}
```

## Data Sensitivity Levels

### Handling Sensitive Data
```typescript
import { hasSensitivityAccess, DataSensitivity } from "@/lib/permissions";
import { maskDocumentNumber } from "@/lib/masking";
import { encrypt, decrypt } from "@/lib/crypto";

// Check if user can view sensitive data
const canViewRed = hasSensitivityAccess(userRoles, DataSensitivity.RED);
const canViewAmber = hasSensitivityAccess(userRoles, DataSensitivity.AMBER);

// Mask data if user doesn't have access
if (!canViewAmber) {
  data.docNumber = maskDocumentNumber(data.docNumber);
}

// Encrypt RED data before storing
const encryptedData = encrypt(sensitiveData);

// Decrypt when retrieving
const decryptedData = decrypt(encryptedData);
```

## Common API Response Patterns

### Success Response
```typescript
return NextResponse.json({
  data: results,
  total: count,
  message: "Operation successful"
}, { status: 200 });
```

### Created Response
```typescript
return NextResponse.json(newRecord, { status: 201 });
```

### Error Responses
```typescript
// 400 - Bad Request
return NextResponse.json({ error: "Invalid input" }, { status: 400 });

// 401 - Unauthorized
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 403 - Forbidden
return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

// 404 - Not Found
return NextResponse.json({ error: "Resource not found" }, { status: 404 });

// 500 - Internal Server Error
return handleApiError(error);
```

## Prisma Query Best Practices

### Include Related Data
```typescript
const records = await prisma.crew.findMany({
  include: {
    documents: { select: { id: true, docType: true, expiryDate: true } },
    assignments: { take: 1, orderBy: { startDate: "desc" } },
    contracts: { where: { status: "ACTIVE" } }
  }
});
```

### Pagination
```typescript
const limit = Math.min(parseInt(req.query.limit || "50"), 100);
const offset = parseInt(req.query.offset || "0");

const records = await prisma.model.findMany({
  take: limit,
  skip: offset,
  orderBy: { createdAt: "desc" }
});

const total = await prisma.model.count({ where });
```

### Type-Safe Filters
```typescript
const where: Record<string, unknown> = {};
if (status) where.status = status;
if (crewId) where.crewId = crewId;

const results = await prisma.model.findMany({ where });
```

## File Upload Handling

### Validate Files
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

if (file.size > MAX_FILE_SIZE) {
  throw new ApiError(413, "File too large", "FILE_TOO_LARGE");
}

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new ApiError(415, "Unsupported file type", "INVALID_FILE_TYPE");
}
```

## Common Pitfalls to Avoid

### ❌ DON'T: Expose Internal Errors
```typescript
// BAD
return NextResponse.json({ error: error.message }, { status: 500 });
```

### ✅ DO: Use Centralized Error Handler
```typescript
// GOOD
return handleApiError(error);
```

### ❌ DON'T: Skip Authentication on Mutations
```typescript
// BAD
export async function POST(req: Request) {
  const body = await req.json();
  await prisma.model.create({ data: body }); // No auth!
}
```

### ✅ DO: Always Authenticate Mutations
```typescript
// GOOD
export const POST = withPermission("module", PermissionLevel.EDIT_ACCESS, async (req) => {
  const body = await req.json();
  await prisma.model.create({ data: body });
});
```

### ❌ DON'T: Trust Client Input
```typescript
// BAD
const { userId } = await req.json();
await prisma.user.delete({ where: { id: userId } }); // User can delete anyone!
```

### ✅ DO: Validate Against Session
```typescript
// GOOD
const { userId } = await req.json();
if (userId !== session.user.id && !isAdmin) {
  throw new ApiError(403, "Cannot delete other users", "FORBIDDEN");
}
```

## Security Checklist for New Endpoints

- [ ] Authentication check (session validation)
- [ ] Permission check (module + level)
- [ ] Input validation (required fields)
- [ ] Error handling (try-catch or HOF)
- [ ] Type safety (TypeScript types)
- [ ] Data sensitivity (mask/encrypt if needed)
- [ ] Response format (consistent structure)
- [ ] Audit logging (for sensitive operations)

## Quick Commands

### Generate Prisma Client
```bash
npx prisma generate
```

### Check TypeScript
```bash
npm run typecheck
```

### Build Application
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```

---

**Last Updated**: January 7, 2026
**Version**: 1.0
