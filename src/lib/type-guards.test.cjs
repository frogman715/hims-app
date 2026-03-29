const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

const {
  isValidUserRole,
  areValidUserRoles,
  normalizeToUserRole,
  normalizeToUserRoles,
  hasValidSession,
  getSessionRoles,
  getSessionPrimaryRole,
  isSystemAdmin,
  isValidPermissionContext,
} = require("./type-guards.ts");
const { UserRole } = require("./permissions.ts");

test("role type guards validate and normalize role values consistently", () => {
  assert.equal(isValidUserRole("CDMO"), true);
  assert.equal(isValidUserRole("DOCUMENT"), false);
  assert.equal(areValidUserRoles(["CDMO", "OPERATIONAL"]), true);
  assert.equal(areValidUserRoles(["CDMO", "UNKNOWN"]), false);
  assert.equal(normalizeToUserRole("document"), UserRole.CDMO);
  assert.equal(normalizeToUserRole("invalid"), UserRole.CREW_PORTAL);
  assert.deepEqual(normalizeToUserRoles(["driver", "HR", "invalid", "driver"]), [
    UserRole.GA_DRIVER,
    UserRole.HR,
  ]);
  assert.deepEqual(normalizeToUserRoles(null), [UserRole.CREW_PORTAL]);
});

test("session helpers fall back safely when session shape is incomplete", () => {
  const validSession = {
    user: {
      id: "user-1",
      email: "ops@example.com",
      name: "Ops",
      role: "DOCUMENT",
      roles: ["document", "operational"],
      isSystemAdmin: true,
    },
  };

  assert.equal(hasValidSession(validSession), true);
  assert.deepEqual(getSessionRoles(validSession), [UserRole.CDMO, UserRole.OPERATIONAL]);
  assert.equal(getSessionPrimaryRole(validSession), UserRole.CDMO);
  assert.equal(isSystemAdmin(validSession), true);

  assert.equal(hasValidSession({ user: { email: "x", roles: [] } }), false);
  assert.deepEqual(getSessionRoles(null), [UserRole.CREW_PORTAL]);
  assert.equal(getSessionPrimaryRole(null), UserRole.CREW_PORTAL);
  assert.equal(isSystemAdmin({ user: { isSystemAdmin: false } }), false);
});

test("permission context validator only accepts objects with required string fields", () => {
  assert.equal(
    isValidPermissionContext({
      session: null,
      requiredModule: "crewing",
      requiredLevel: "VIEW_ACCESS",
    }),
    true
  );
  assert.equal(isValidPermissionContext(null), false);
  assert.equal(isValidPermissionContext({ requiredModule: "crewing", requiredLevel: 1 }), false);
});
