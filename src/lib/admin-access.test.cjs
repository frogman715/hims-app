const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const resolved = path.join(process.cwd(), "src", request.slice(2));
    return originalResolveFilename.call(this, resolved, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const {
  ADMIN_ALLOWED_ROLES,
  ADMIN_MAINTENANCE_SCOPES,
  hasAdminMaintenanceScope,
  canAccessAnyAdminArea,
  getAdminScopeForPath,
} = require("./admin-access.ts");

test("admin access helpers honor allowed roles and explicit maintenance scopes", () => {
  assert.deepEqual(ADMIN_ALLOWED_ROLES, ["DIRECTOR", "HR_ADMIN"]);
  assert.equal(
    hasAdminMaintenanceScope({ roles: ["HR_ADMIN"] }, ADMIN_MAINTENANCE_SCOPES.USER_MANAGEMENT),
    true
  );
  assert.equal(
    hasAdminMaintenanceScope(
      { roles: ["STAFF"], adminMaintenanceScopes: [ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH] },
      ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH
    ),
    true
  );
  assert.equal(
    hasAdminMaintenanceScope(
      { roles: ["STAFF"], adminMaintenanceScopes: ["INVALID"] },
      ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH
    ),
    false
  );
  assert.equal(canAccessAnyAdminArea({ roles: ["DIRECTOR"] }), true);
  assert.equal(
    canAccessAnyAdminArea({
      roles: ["STAFF"],
      adminMaintenanceScopes: [ADMIN_MAINTENANCE_SCOPES.AUDIT_LOGS],
    }),
    true
  );
});

test("admin access path mapping stays aligned to admin areas", () => {
  assert.equal(
    getAdminScopeForPath("/admin/users"),
    ADMIN_MAINTENANCE_SCOPES.USER_MANAGEMENT
  );
  assert.equal(
    getAdminScopeForPath("/api/admin/audit-logs"),
    ADMIN_MAINTENANCE_SCOPES.AUDIT_LOGS
  );
  assert.equal(
    getAdminScopeForPath("/admin/system-health"),
    ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH
  );
  assert.equal(getAdminScopeForPath("/crewing"), null);
});
