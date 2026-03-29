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

const { OFFICE_NAV_ITEMS } = require("./office-navigation.ts");
const { PermissionLevel, ModuleName } = require("./permissions.ts");

test("office navigation items keep expected sections and access metadata", () => {
  assert.equal(OFFICE_NAV_ITEMS.length > 10, true);

  const crewing = OFFICE_NAV_ITEMS.find((item) => item.href === "/crewing");
  const compliance = OFFICE_NAV_ITEMS.find((item) => item.href === "/compliance");
  const adminUsers = OFFICE_NAV_ITEMS.find((item) => item.href === "/admin/users");

  assert.deepEqual(
    {
      module: crewing?.module,
      group: crewing?.group,
      hasAllowedRoles: Array.isArray(crewing?.allowedRoles),
    },
    {
      module: ModuleName.crewing,
      group: "CREW OPERATIONS",
      hasAllowedRoles: true,
    }
  );

  assert.equal(compliance?.requiredLevel, PermissionLevel.VIEW_ACCESS);
  assert.equal(adminUsers?.requiredLevel, PermissionLevel.FULL_ACCESS);
  assert.equal(adminUsers?.allowedRoles?.includes("DIRECTOR"), true);
  assert.equal(adminUsers?.allowedRoles?.includes("HR_ADMIN"), true);
});
