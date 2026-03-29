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

function loadSupplementalRolesModule(mapValue) {
  const modulePath = path.join(process.cwd(), "src/lib/supplemental-roles.ts");
  delete require.cache[require.resolve(modulePath)];

  if (mapValue === undefined) {
    delete process.env.HIMS_SUPPLEMENTAL_ROLE_MAP;
  } else {
    process.env.HIMS_SUPPLEMENTAL_ROLE_MAP = mapValue;
  }

  return require(modulePath);
}

function withSuppressedConsoleError(run) {
  const original = console.error;
  console.error = () => {};
  try {
    return run();
  } finally {
    console.error = original;
  }
}

test("getSupplementalRoles normalizes JSON maps and merges user and email roles", () => {
  const mod = loadSupplementalRolesModule(
    JSON.stringify({
      "user-1": ["hr", "qmr", "QMR"],
      "ops@example.com": ["operational", "invalid"],
    })
  );

  assert.deepEqual(mod.getSupplementalRoles({ userId: "USER-1" }), ["HR", "QMR"]);
  assert.deepEqual(mod.getSupplementalRoles({ email: "OPS@example.com" }), ["OPERATIONAL"]);
  assert.deepEqual(mod.getSupplementalRoles({ userId: "user-1", email: "ops@example.com" }), [
    "HR",
    "QMR",
    "OPERATIONAL",
  ]);
});

test("getSupplementalRoles accepts double-encoded maps and falls back on invalid input", () => {
  let mod = loadSupplementalRolesModule(
    JSON.stringify(JSON.stringify({ "crew@example.com": ["director", "staff"] }))
  );
  assert.deepEqual(mod.getSupplementalRoles({ email: "crew@example.com" }), [
    "DIRECTOR",
    "STAFF",
  ]);

  mod = withSuppressedConsoleError(() => loadSupplementalRolesModule("{broken-json"));
  assert.deepEqual(mod.getSupplementalRoles({ userId: "missing" }), []);
});
