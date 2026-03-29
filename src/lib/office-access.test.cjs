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
  getPrimaryOfficeRole,
  isOfficeProtectedPath,
  canAccessOfficePath,
} = require("./office-access.ts");

test("office access helpers normalize roles and detect protected areas", () => {
  assert.deepEqual(getPrimaryOfficeRole(["document", "driver"]), ["CDMO", "GA_DRIVER"]);
  assert.deepEqual(getPrimaryOfficeRole(null, "operational"), ["OPERATIONAL"]);
  assert.equal(isOfficeProtectedPath("/crewing/seafarers"), true);
  assert.equal(isOfficeProtectedPath("/public-site"), false);
});

test("office path access enforces route and API role boundaries", () => {
  assert.equal(canAccessOfficePath("/crewing/readiness", ["HR"]), true);
  assert.equal(canAccessOfficePath("/crewing/prepare-joining", ["HR"]), false);
  assert.equal(canAccessOfficePath("/api/contracts", ["ACCOUNTING"], false, "POST"), false);
  assert.equal(canAccessOfficePath("/api/contracts", ["OPERATIONAL"], false, "POST"), true);
  assert.equal(canAccessOfficePath("/api/unknown-open-endpoint", ["CDMO"], false, "GET"), true);
  assert.equal(canAccessOfficePath("/admin/users", ["HR_ADMIN"]), true);
  assert.equal(canAccessOfficePath("/admin/users", null), false);
  assert.equal(canAccessOfficePath("/admin/users", null, true), true);
});
