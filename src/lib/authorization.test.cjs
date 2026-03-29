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
  resolveAuthorizationRoles,
  hasExplicitRoleAccess,
  hasModuleAccess,
} = require("./authorization.ts");
const { PermissionLevel } = require("./permissions.ts");

test("authorization helpers normalize roles and explicit role gates", () => {
  assert.deepEqual(resolveAuthorizationRoles(["document", "driver"], "operational"), [
    "CDMO",
    "GA_DRIVER",
    "OPERATIONAL",
  ]);
  assert.deepEqual(resolveAuthorizationRoles(["invalid"], null), []);
  assert.equal(
    hasExplicitRoleAccess({ roles: ["document"] }, ["CDMO", "OPERATIONAL"]),
    true
  );
  assert.equal(hasExplicitRoleAccess({ roles: ["driver"] }, ["CDMO"]), false);
  assert.equal(hasExplicitRoleAccess({ isSystemAdmin: true }, ["CDMO"]), true);
});

test("hasModuleAccess respects permission matrix and overrides", () => {
  assert.equal(
    hasModuleAccess({ roles: ["ACCOUNTING"] }, "contracts", PermissionLevel.VIEW_ACCESS),
    true
  );
  assert.equal(
    hasModuleAccess({ roles: ["ACCOUNTING"] }, "contracts", PermissionLevel.FULL_ACCESS),
    false
  );
  assert.equal(
    hasModuleAccess(
      {
        roles: ["ACCOUNTING"],
        permissionOverrides: [
          { role: "ACCOUNTING", moduleKey: "contracts", level: "FULL_ACCESS" },
        ],
      },
      "contracts",
      PermissionLevel.FULL_ACCESS
    ),
    true
  );
});
