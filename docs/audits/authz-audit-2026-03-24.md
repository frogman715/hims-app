# Authorization Audit

Generated: 2026-03-24

## 1. Authoritative Map Of Current Permission Systems

### A. Permission matrix engine
- Source of truth for module-level access: [permissions.ts](/home/hanmarine/hims-app/src/lib/permissions.ts)
- Core model:
  - roles: `UserRole`
  - modules: `ModuleName`
  - levels: `PermissionLevel`
  - overrides: `RolePermissionOverride`
- Main evaluators:
  - `getEffectivePermissionLevel`
  - `hasPermission`
  - `hasSensitivityAccess`

### B. API/session permission adapter
- Session/token-facing adapter: [permission-middleware.ts](/home/hanmarine/hims-app/src/lib/permission-middleware.ts)
- Uses JWT token checks for middleware-style guards and session checks for route-local use.
- Main evaluators:
  - `withPermission`
  - `checkUserPermission`
  - `checkPermission`

### C. Page/API path regex access rules
- Route-pattern access map: [office-access.ts](/home/hanmarine/hims-app/src/lib/office-access.ts)
- Used heavily by UI visibility and some API guards.
- Decides access from pathname + method + role arrays.

### D. Auth/session normalization and page guards
- Session normalization and page/layout redirects: [authz.ts](/home/hanmarine/hims-app/src/lib/authz.ts)
- Main entry points:
  - `requireUser`
  - `requireCrew`
  - `requireUserApi`

### E. Route-local role checks
- Direct role checks still exist in route handlers and pages, for example:
  - [route.ts](/home/hanmarine/hims-app/src/app/api/about/vision-mission/route.ts#L46)
  - [route.ts](/home/hanmarine/hims-app/src/app/api/admin/users/route.ts#L23)
  - [page.tsx](/home/hanmarine/hims-app/src/app/admin/audit-logs/page.tsx#L22)

### F. UI visibility checks
- Sidebar and dashboard navigation mix module checks and hardcoded `allowedRoles`:
  - [Sidebar.tsx](/home/hanmarine/hims-app/src/components/sidebar/Sidebar.tsx)
  - [SidebarNav.tsx](/home/hanmarine/hims-app/src/components/sidebar/SidebarNav.tsx)
  - [DashboardClient.tsx](/home/hanmarine/hims-app/src/app/dashboard/DashboardClient.tsx#L509)
  - [CrewingClient.tsx](/home/hanmarine/hims-app/src/app/crewing/CrewingClient.tsx#L547)

## 2. Conflict Report

### Critical conflicts
- `office-access.ts` defines a second access matrix by pathname and role list, separate from `permissions.ts`.
- `requireUser({ allowedRoles })` enforces page access by explicit role allowlists, not module permission levels.
- Route-local direct checks use `session.user.role`, `session.user.roles`, and `isSystemAdmin` ad hoc, bypassing both shared systems.
- UI visibility uses mixed strategies, so visible navigation can diverge from API authorization.

### Concrete examples
- Sidebar previously let any office user pass once role was non-crew, regardless of `module` permission. Fixed in [SidebarNav.tsx](/home/hanmarine/hims-app/src/components/sidebar/SidebarNav.tsx#L30).
- `office-access.ts` says `/api/contracts` write is `DIRECTOR` or `OPERATIONAL`, while module-level checks in `permissions.ts` can allow other roles to have module access. This is a policy fork, not an implementation detail.
- Admin pages often allow `DIRECTOR` or `HR_ADMIN` plus `isSystemAdmin`; that rule is duplicated independently in multiple routes/pages.

## 3. Duplication Report

### Duplicated evaluators
- Module permission logic:
  - [permissions.ts](/home/hanmarine/hims-app/src/lib/permissions.ts)
  - [permission-middleware.ts](/home/hanmarine/hims-app/src/lib/permission-middleware.ts)
- Path access logic:
  - [office-access.ts](/home/hanmarine/hims-app/src/lib/office-access.ts)
  - UI callers across `dashboard`, `crewing`, `quality`, `contracts`
- Role allowlists:
  - page layouts via `requireUser({ allowedRoles })`
  - navigation item `allowedRoles`
  - route-local `includes("DIRECTOR")` style checks

### Duplicated role definitions
- [roles.ts](/home/hanmarine/hims-app/src/lib/roles.ts)
- [permissions.ts](/home/hanmarine/hims-app/src/lib/permissions.ts)

### Duplicated normalization
- [authz.ts](/home/hanmarine/hims-app/src/lib/authz.ts#L56)
- [type-guards.ts](/home/hanmarine/hims-app/src/lib/type-guards.ts#L35)
- [office-access.ts](/home/hanmarine/hims-app/src/lib/office-access.ts#L163)

## 4. Unified Authorization Path Proposal

### Target authority
- Keep `permissions.ts` as the authority for:
  - role catalog
  - module catalog
  - permission levels
  - effective permission evaluation

### Recommended path
1. Normalize session/token user once.
2. Evaluate `isSystemAdmin` override once.
3. Evaluate module permission through one helper.
4. Use explicit role allowlists only as narrow business exceptions.
5. Treat `office-access.ts` as a route-to-policy map, not a second policy engine.

### Practical implementation
- Central evaluator introduced in [authorization.ts](/home/hanmarine/hims-app/src/lib/authorization.ts).
- `permission-middleware.ts` now routes shared checks through that helper.
- `office-access.ts` now reuses shared explicit-role evaluation.
- `SidebarNav.tsx` now evaluates both explicit-role and module permission through shared helpers instead of bypassing for all office users.

### Remaining follow-up
- Replace direct `allowedRoles` page guards with module-aware guards where a module exists.
- Reduce `office-access.ts` from role arrays to route-to-module mapping over time.
- Remove route-local `roles.includes(...)` checks by moving them behind shared helpers.
