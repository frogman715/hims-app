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

function loadAdminMaintenanceModule(mapValue) {
  const modulePath = path.join(process.cwd(), "src/lib/admin-maintenance-access.ts");
  delete require.cache[require.resolve(modulePath)];

  if (mapValue === undefined) {
    delete process.env.HIMS_ADMIN_MAINTENANCE_ACCESS_MAP;
  } else {
    process.env.HIMS_ADMIN_MAINTENANCE_ACCESS_MAP = mapValue;
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

test("getAdminMaintenanceScopes normalizes configured access map by user id and email", () => {
  const mod = loadAdminMaintenanceModule(
    JSON.stringify({
      "User-1": ["user_management", "AUDIT_LOGS", "AUDIT_LOGS"],
      "ops@example.com": ["system_health", "invalid"],
    })
  );

  assert.deepEqual(mod.getAdminMaintenanceScopes({ userId: "user-1" }), [
    mod.ADMIN_MAINTENANCE_SCOPES.USER_MANAGEMENT,
    mod.ADMIN_MAINTENANCE_SCOPES.AUDIT_LOGS,
  ]);
  assert.deepEqual(mod.getAdminMaintenanceScopes({ email: "OPS@example.com" }), [
    mod.ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH,
  ]);
  assert.deepEqual(
    mod.getAdminMaintenanceScopes({ userId: "user-1", email: "ops@example.com" }),
    [
      mod.ADMIN_MAINTENANCE_SCOPES.USER_MANAGEMENT,
      mod.ADMIN_MAINTENANCE_SCOPES.AUDIT_LOGS,
      mod.ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH,
    ]
  );
});

test("getAdminMaintenanceScopes falls back to empty list when config is absent or invalid", () => {
  let mod = loadAdminMaintenanceModule(undefined);
  assert.deepEqual(mod.getAdminMaintenanceScopes({ userId: "missing" }), []);

  mod = withSuppressedConsoleError(() => loadAdminMaintenanceModule("{invalid-json"));
  assert.deepEqual(mod.getAdminMaintenanceScopes({ email: "missing@example.com" }), []);
});
