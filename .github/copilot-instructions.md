# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS) - AI Coding Guide

## Project Overview
HIMS is a comprehensive maritime crew management system built with Next.js 16, React 19, Prisma, and PostgreSQL. It manages seafarer applications, assignments, contracts, documents, compliance, and accounting for maritime operations.

## Core Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes with route handlers
- **Database**: PostgreSQL 16 with Prisma ORM 7.x
- **Auth**: NextAuth.js v4 with JWT strategy and credentials provider
- **Deployment**: Docker with standalone output mode

### Project Structure
```
src/app/                    # Next.js App Router pages & API routes
├── api/                    # REST API route handlers (GET, POST, PUT, DELETE)
├── [module]/page.tsx       # Module pages (dashboard, crew, crewing, etc.)
└── layout.tsx              # Root layout with SessionProvider
src/lib/
├── auth.ts                 # NextAuth configuration
├── prisma.ts               # Prisma client singleton
├── permissions.ts          # Role-based access control matrix
├── permission-middleware.ts # API middleware for permission checks
├── crypto.ts               # AES-256-GCM encryption for RED sensitivity data
└── masking.ts              # Data masking for AMBER sensitivity levels
src/components/             # Reusable React components
prisma/
├── schema.prisma           # Single source of truth for database models
└── migrations/             # Database migration history
```

## Critical Patterns

### 1. Permission System (RBAC)
**Roles**: DIRECTOR, CDMO, OPERATIONAL, ACCOUNTING, HR, CREW_PORTAL

Every module has granular permissions defined in `src/lib/permissions.ts`:
- `NO_ACCESS`: Completely blocked
- `VIEW_ACCESS`: Read-only
- `EDIT_ACCESS`: Create/update (no delete)
- `FULL_ACCESS`: All operations

**Implementation**:
```typescript
// In API routes
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!checkPermission(session, 'crew', PermissionLevel.EDIT_ACCESS)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  // ... proceed with operation
}
```

**Guards**: Use `crewGuard(session)`, `contractGuard(session)`, etc. for module-level checks.

### 2. Data Sensitivity Levels
Based on maritime compliance requirements (MLC, STCW):
- **RED**: Passport numbers, medical results, full salary details, seaman codes → Encrypt with `crypto.encrypt()` before storage
- **AMBER**: Personal info, disciplinary records, certificates → Mask with functions from `masking.ts` for non-privileged users
- **GREEN**: Public vessel info, procedures → Normal display

### 3. Server vs Client Components
- **Default to Server Components** for data fetching and initial renders
- Use `'use client'` ONLY when needed for:
  - Interactive forms with state (`useState`, `useForm`)
  - Browser APIs (`useRouter`, `useSession`)
  - Event handlers requiring client-side JS
- Example: Dashboard page (`src/app/dashboard/page.tsx`) is client-side for real-time updates

### 4. Modern API Route Patterns (UPDATED 2025)
**New Pattern**: Use middleware wrappers from `src/lib/api-middleware.ts`:
```typescript
// RECOMMENDED: Use withPermission wrapper
import { withPermission } from '@/lib/api-middleware';
import { PermissionLevel } from '@/lib/permission-middleware';
import { handleApiError, validateRequired } from '@/lib/error-handler';

export const GET = withPermission("crew", PermissionLevel.VIEW_ACCESS, async (req, session) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  
  const data = await prisma.crew.findMany({
    where: { status },
    include: { documents: true, contracts: true }
  });
  
  return NextResponse.json({ data, total: data.length });
});

// With rate limiting (for sensitive endpoints)
import { withRateLimit } from '@/lib/api-middleware';
export const POST = withRateLimit(5, 60000, async (req, session) => {
  // Max 5 requests per minute
  const body = await req.json();
  validateRequired(body.email, "email");
  // ...
});
```

**Error Handling**:
```typescript
// Centralized error handling
import { handleApiError, ApiError } from '@/lib/error-handler';

try {
  if (!isValid) {
    throw new ApiError(400, "Invalid data", "VALIDATION_ERROR");
  }
  // ...
} catch (error) {
  return handleApiError(error); // Automatically handles Prisma/API errors
}
```

For dynamic routes: `src/app/api/[resource]/[id]/route.ts` with `{ params }: { params: { id: string } }`

### 5. Prisma Patterns
- **Client**: Import from `@/lib/prisma` (singleton pattern prevents connection exhaustion)
- **Relations**: Always use `include` for related data, not manual joins
- **Enums**: Defined in schema (e.g., `CrewStatus`, `ContractKind`, `Role`) - use directly
- **Contracts**: Two types via `ContractKind` enum:
  - `SEA`: Seafarer Employment Agreement (MLC compliant, carried onboard)
  - `OFFICE_PKL`: Indonesian PKL for Hubla/office documentation

### 6. Crewing Data Flow
Core workflow (`CREWING_ERD_FLOW.md`):
```
Add Seafarer → Application (CR-02) → Document Upload → Assignment → Crew List
                                                            ↓
                                              Crew Replacements ← Monthly Checklist
```

**Key models**: `Crew`, `Application`, `Assignment`, `Contract`, `SeafarerDocument`, `Principal`, `Vessel`

## Development Workflow

### Setup
```bash
npm install                          # Install dependencies
docker-compose up -d                 # Start PostgreSQL
npx prisma migrate dev              # Run migrations
npx prisma generate                 # Generate Prisma client
npm run seed                        # Seed initial data (admin@hanmarine.com / admin123)
npm run dev                         # Start dev server on :3000
```

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Run `npx prisma generate` to update types
4. Never edit migrations directly - always create new ones

### Testing Access
Default users from seed script:
- Admin: `admin@hanmarine.com` / `admin123` (DIRECTOR role)
- Test login at `http://localhost:3000/auth/signin`

## Common Gotchas

1. **Environment Variables**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `HIMS_CRYPTO_KEY` (32+ chars) required
2. **Port Conflict**: Database runs on `5434:5432` to avoid conflicts with local PostgreSQL
3. **Session Type**: JWT strategy only - no database sessions
4. **File Uploads**: Store paths in DB, actual files in `public/uploads/` (implement file handling as needed)
5. **Type Safety**: Prisma generates types from schema - regenerate after schema changes
6. **Client Components**: Don't fetch data in client components - pass as props from server components or use API routes
7. **Permission Matrix**: ACCOUNTING has FULL_ACCESS to contracts (wage calculation) but NO_ACCESS to medical records

## External Maritime Compliance Systems

HIMS integrates with 3 external regulatory systems (NEW 2025):

### 1. KOSMA Certificate (Korea)
- **URL**: https://www.marinerights.or.kr
- **Purpose**: 3-hour online training for Korea-flagged vessels
- **Validity**: 1 year (crew must renew before every contract on Korean vessel)
- **Model**: `ExternalCompliance` with `systemType: KOSMA_CERTIFICATE`
- **API**: `/api/external-compliance?systemType=KOSMA_CERTIFICATE`

### 2. Dephub Certificate (Indonesia)
- **URL**: https://pelaut.dephub.go.id/login-perusahaan
- **Purpose**: Validate sijil/seaman book authenticity (online/offline check)
- **Required**: All Indonesian seafarers on international voyages
- **Model**: `ExternalCompliance` with `systemType: DEPHUB_CERTIFICATE`
- **Company account**: Required SIUPAK (legal manning agency license)

### 3. Schengen Visa NL (Netherlands)
- **URL**: https://consular.mfaservices.nl
- **Purpose**: Visa application for crew joining tanker vessels in EU ports
- **Model**: `ExternalCompliance` with `systemType: SCHENGEN_VISA_NL`
- **Status tracking**: PENDING → VERIFIED → EXPIRED

**Dashboard Integration**:
- `ExternalComplianceWidget` shows real-time stats for all 3 systems
- Direct links to external portals
- Expiry alerts for KOSMA (1-year validity)
- Component: `src/components/compliance/ExternalComplianceWidget.tsx`
- Page: `src/app/compliance/external/page.tsx`

## Security & Best Practices (UPDATED 2025)

### Encryption (CRITICAL)
- **Crypto**: Uses AES-256-GCM with proper IV (fixed deprecated `createCipher`)
- **Key**: `HIMS_CRYPTO_KEY` must be 32+ chars, stored in `.env`
- **Usage**: `encrypt(plaintext)` before storing RED data, `decrypt(ciphertext)` when retrieving
- **File**: `src/lib/crypto.ts`

### Security Headers
Configured in `next.config.ts`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (disable camera/mic/geolocation)

### Error Handling
- **Never expose** stack traces in production
- Use `handleApiError()` for consistent error responses
- Log errors with context for monitoring
- Return generic messages to clients: "Internal server error"

### Rate Limiting
- Implemented in `src/lib/api-middleware.ts`
- Use `withRateLimit(maxRequests, windowMs, handler)` for sensitive endpoints
- Example: Login limited to 5 attempts per minute per user

### Environment Variables
- **NEVER commit** `.env` to git (already in `.gitignore`)
- Use `.env.example` as template
- Generate secrets with: `openssl rand -base64 32`
- Validate on startup (check `NEXTAUTH_SECRET` length)

## Key Files Reference
- Permission rules: `src/lib/permissions.ts` (360 lines, comprehensive RBAC matrix)
- Auth config: `src/lib/auth.ts` (NextAuth setup with role injection)
- Schema: `prisma/schema.prisma` (953 lines, 40+ models with enums)
- API middleware: `src/lib/api-middleware.ts` (auth/permission/rate-limit wrappers)
- Error handler: `src/lib/error-handler.ts` (centralized error handling)
- Crypto: `src/lib/crypto.ts` (AES-256-GCM encryption for RED data)
- Error Boundary: `src/components/ErrorBoundary.tsx` (React error handling)
- Permission docs: `PERMISSION_MATRIX.md` (business rules by role)
- Deployment: `DEPLOYMENT.md` (complete setup & security guide)

## Naming Conventions
- Models: PascalCase singular (e.g., `Crew`, `Assignment`, `Principal`)
- Enums: PascalCase with SCREAMING_SNAKE values (e.g., `Role.CREW_PORTAL`)
- Files: kebab-case for routes (e.g., `agency-fees/page.tsx`)
- API routes: RESTful conventions (`/api/crew`, `/api/contracts/[id]`)
- Components: PascalCase (e.g., `WorldClock.tsx`, `Providers.tsx`)

## Maritime Domain Context
- **MLC**: Maritime Labour Convention - requires specific contract formats and medical standards
- **STCW**: Standards of Training, Certification and Watchkeeping - governs seafarer certificates
- **Principal**: Ship owner/management company (not the same as "director" role)
- **Rank**: Job position on vessel (Captain, Chief Engineer, Able Seaman, etc.)
- **Sign-on/Sign-off**: Seafarer joining/leaving vessel (not auth login/logout)
- **PKL**: Indonesian employment contract format for regulatory compliance
