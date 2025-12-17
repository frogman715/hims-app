# 🎨 HIMS Quick Reference Card
**Untuk Developer - Copy-Paste Ready**

---

## 🔘 Button Component Usage

```tsx
import { Button } from '@/components/ui/Button';

// ========================================
// VARIANTS
// ========================================

// Primary (blue) - Default actions
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Secondary (white with border) - Cancel, Back
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Ghost (transparent) - Tertiary actions
<Button variant="ghost" onClick={handleEdit}>
  Edit
</Button>

// Danger (red) - Delete, Logout
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// ========================================
// SIZES
// ========================================

<Button size="sm">Small Button</Button>      // px-4 py-2
<Button size="md">Medium Button</Button>     // px-6 py-3 (default)
<Button size="lg">Large Button</Button>      // px-8 py-4

// ========================================
// WITH ICONS
// ========================================

import { PlusIcon, TrashIcon, CheckIcon } from 'lucide-react';

// Left icon
<Button 
  variant="primary" 
  leftIcon={<PlusIcon className="h-5 w-5" />}
>
  Add New
</Button>

// Right icon
<Button 
  variant="secondary"
  rightIcon={<CheckIcon className="h-5 w-5" />}
>
  Confirm
</Button>

// Both icons
<Button 
  leftIcon={<TrashIcon className="h-5 w-5" />}
  rightIcon={<span>→</span>}
>
  Delete Forever
</Button>

// ========================================
// STATES
// ========================================

// Loading state (dengan spinner)
<Button isLoading={isSubmitting}>
  Submitting...
</Button>

// Disabled
<Button disabled>
  Unavailable
</Button>

// Custom className (override)
<Button variant="primary" className="w-full">
  Full Width Button
</Button>
```

---

## 🔐 API Route Template (Type-Safe)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { logger } from "@/lib/logger";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// ========================================
// VALIDATION SCHEMA
// ========================================

const CreateSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  age: z.number().int().positive().optional(),
});

type CreateInput = z.infer<typeof CreateSchema>;

// ========================================
// GET /api/resource
// ========================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Permission check
    if (!checkPermission(session, 'resource', PermissionLevel.VIEW_ACCESS)) {
      logger.warn('Unauthorized access attempt', {
        userId: session.user.id,
        endpoint: '/api/resource'
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE));

    // 4. Build where clause (role-based filtering!)
    const where: Prisma.ResourceWhereInput = {};

    if (session.user.roles?.includes('CREW_PORTAL')) {
      where.userId = session.user.id; // Own data only
    }

    // 5. Fetch data with pagination
    const [data, total] = await prisma.$transaction([
      prisma.resource.findMany({
        where,
        select: {
          id: true,
          name: true,
          // DON'T expose sensitive fields here
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.resource.count({ where })
    ]);

    // 6. Log success
    logger.info('Data fetched successfully', {
      userId: session.user.id,
      count: data.length,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      data,
      total,
      page,
      limit
    });

  } catch (error) {
    // 7. Error handling
    logger.error('Failed to fetch data', error as Error, {
      endpoint: '/api/resource',
      method: 'GET'
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/resource
// ========================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, 'resource', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate input
    const body = await req.json();
    
    let validatedData: CreateInput;
    try {
      validatedData = CreateSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Create record with type-safe data
    const createData: Prisma.ResourceCreateInput = {
      name: validatedData.name,
      email: validatedData.email,
      ...(validatedData.age && { age: validatedData.age })
    };

    const record = await prisma.resource.create({
      data: createData
    });

    logger.info('Record created', {
      userId: session.user.id,
      recordId: record.id
    });

    return NextResponse.json(record, { status: 201 });

  } catch (error) {
    logger.error('Failed to create record', error as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 📝 Typography Classes

```tsx
// ========================================
// HEADINGS
// ========================================

<h1 className="text-3xl font-extrabold text-gray-900">
  Main Page Title
</h1>

<h2 className="text-2xl font-bold text-gray-900">
  Section Title
</h2>

<h3 className="text-xl font-semibold text-gray-800">
  Subsection Title
</h3>

<h4 className="text-lg font-semibold text-gray-800">
  Card Title
</h4>

// ========================================
// BODY TEXT
// ========================================

<p className="text-base text-gray-700">
  Regular paragraph text with good readability.
</p>

<p className="text-sm text-gray-600">
  Smaller supporting text or captions.
</p>

<span className="text-xs text-gray-500">
  Tiny text for metadata or timestamps.
</span>

// ========================================
// LABELS
// ========================================

<label className="text-sm font-semibold text-gray-900">
  Required Field Label *
</label>

<label className="text-sm font-medium text-gray-600">
  Optional Field Label
</label>

// ========================================
// SPECIAL TEXT
// ========================================

// Success
<p className="text-sm font-medium text-green-700">
  Operation successful!
</p>

// Error
<p className="text-sm font-medium text-red-700">
  Please fix the errors above.
</p>

// Warning
<p className="text-sm font-medium text-yellow-700">
  Document expiring soon.
</p>

// Info
<p className="text-sm font-medium text-blue-700">
  Click here for more information.
</p>
```

---

## 🎨 Common UI Patterns

### Card Container
```tsx
<div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">
    Card Title
  </h3>
  <p className="text-base text-gray-700">
    Card content here
  </p>
</div>
```

### Form Input
```tsx
<div className="space-y-2">
  <label className="text-sm font-semibold text-gray-900">
    Email Address *
  </label>
  <input
    type="email"
    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="name@example.com"
  />
  <p className="text-xs text-gray-500">
    We'll never share your email.
  </p>
</div>
```

### Alert Box
```tsx
// Success
<div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
  <p className="text-sm font-medium text-green-800">
    ✓ Changes saved successfully!
  </p>
</div>

// Error
<div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
  <p className="text-sm font-medium text-red-800">
    ✗ Failed to save. Please try again.
  </p>
</div>
```

### Badge/Status
```tsx
// Active
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
  Active
</span>

// Pending
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
  Pending
</span>

// Expired
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
  Expired
</span>
```

### Table
```tsx
<div className="overflow-x-auto">
  <table className="min-w-full">
    <thead className="bg-gray-100 border-b-2 border-gray-300">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
          Name
        </th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-700">
          John Doe
        </td>
        <td className="px-6 py-4 text-sm">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            Active
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🔒 Security Checklist

### ✅ DO
```typescript
// ✅ Type-safe with Prisma types
const updateData: Prisma.ModelUpdateInput = {};

// ✅ Role-based filtering
const where: Prisma.ModelWhereInput = {};
if (session.user.roles?.includes('CREW_PORTAL')) {
  where.userId = session.user.id;
}

// ✅ Select only needed fields
const data = await prisma.model.findMany({
  select: {
    id: true,
    name: true,
    // DON'T expose: password, passport, salary
  }
});

// ✅ Use structured logger
logger.error('Operation failed', error as Error, { userId: session.user.id });

// ✅ Validate input with Zod
const validatedData = Schema.parse(body);

// ✅ Use constants
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
```

### ❌ DON'T
```typescript
// ❌ Don't use 'any'
const updateData: any = {}; // NO!

// ❌ Don't findMany without filter
const allData = await prisma.model.findMany(); // DANGEROUS!

// ❌ Don't console.log in production
console.error("Error:", error); // NO!

// ❌ Don't expose sensitive data
select: {
  passport: true,     // RED level!
  salary: true,       // RED level!
  password: true      // NEVER!
}

// ❌ Don't hardcode values
const companyName = "PT HANMARINE"; // Use constants!

// ❌ Don't inline styles
<div style={{ width: '100%' }}>  // Use Tailwind!
```

---

## 🚀 Quick Commands

```bash
# Install dependencies
npm install clsx tailwind-merge zod

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# Run dev
npm run dev

# Find 'any' types
grep -rn ": any" src/app/api --include="*.ts"

# Find console.log
grep -rn "console\." src/app/api --include="*.ts"

# Find inline styles
grep -rn 'style={{' src/app --include="*.tsx"

# Generate Prisma types
npx prisma generate

# Deploy to VPS
./deploy-to-server.sh
```

---

## 📞 Common Fixes

### Fix: Module not found '@/components/ui/Button'
```bash
# Check tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# Restart TS server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Fix: 'cn' is not defined
```bash
npm install clsx tailwind-merge

# Create src/lib/utils.ts
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Fix: Prisma type not found
```bash
npx prisma generate
```

### Fix: Button styles not showing
```bash
# Clear cache
rm -rf .next
npm run dev
```

---

**💡 Tip**: Bookmark this file untuk quick reference!
