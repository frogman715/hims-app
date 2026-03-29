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
  HGI_BUSINESS_ROLES,
  HGI_BUSINESS_ROLE_APP_ROLE_MAP,
  HGI_RBAC_MATRIX,
  OFFICE_SIDEBAR_BY_APP_ROLE,
  getSidebarAllowedRolesForHref,
} = require("./hgi-rbac.ts");

test("HGI RBAC maps business roles and sidebar access consistently", () => {
  assert.deepEqual(HGI_BUSINESS_ROLES, [
    "DIRECTOR",
    "DOCUMENT",
    "OPERATIONAL",
    "ACCOUNTING",
    "DRIVER",
    "PRINCIPAL",
  ]);
  assert.deepEqual(HGI_BUSINESS_ROLE_APP_ROLE_MAP.DOCUMENT, ["CDMO"]);
  assert.equal(HGI_RBAC_MATRIX.OPERATIONAL.primaryPages.includes("/crewing/prepare-joining"), true);
  assert.equal(OFFICE_SIDEBAR_BY_APP_ROLE.DIRECTOR.includes("/admin/users"), true);
  assert.deepEqual(getSidebarAllowedRolesForHref("/crewing/documents"), ["DIRECTOR", "CDMO", "HR_ADMIN"]);
  assert.equal(getSidebarAllowedRolesForHref("/unknown-path"), undefined);
});
