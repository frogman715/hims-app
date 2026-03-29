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

const { canAccessOfficeNavigationItem } = require("./office-navigation-access.ts");
const { ModuleName, PermissionLevel } = require("./permissions.ts");

test("office navigation access honors admin scopes and module-role constraints", () => {
  assert.equal(
    canAccessOfficeNavigationItem(
      {
        module: ModuleName.dashboard,
        href: "/admin/users",
        label: "User Management",
        icon: "x",
        requiredLevel: PermissionLevel.FULL_ACCESS,
        allowedRoles: ["DIRECTOR", "HR_ADMIN"],
      },
      {
        roles: ["STAFF"],
        adminMaintenanceScopes: ["USER_MANAGEMENT"],
      }
    ),
    true
  );

  assert.equal(
    canAccessOfficeNavigationItem(
      {
        module: ModuleName.crewing,
        href: "/crewing/readiness",
        label: "Readiness",
        icon: "x",
        requiredLevel: PermissionLevel.VIEW_ACCESS,
        allowedRoles: ["HR", "HR_ADMIN", "DIRECTOR"],
      },
      {
        roles: ["HR"],
      }
    ),
    true
  );

  assert.equal(
    canAccessOfficeNavigationItem(
      {
        module: ModuleName.crewing,
        href: "/crewing/prepare-joining",
        label: "Prepare Joining",
        icon: "x",
        requiredLevel: PermissionLevel.VIEW_ACCESS,
        allowedRoles: ["DIRECTOR", "OPERATIONAL"],
      },
      {
        roles: ["HR"],
      }
    ),
    false
  );
});
