const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  registerTsNode,
  withMockedModuleLoad,
  withSuppressedConsoleError,
} = require("./test-harness.cjs");

registerTsNode({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

function createNextResponseMock() {
  return {
    json(body, init = {}) {
      return {
        kind: "json",
        status: init.status ?? 200,
        body,
        async text() {
          return JSON.stringify(body);
        },
      };
    },
    next() {
      return { kind: "next", status: 200 };
    },
  };
}

function loadPermissionMiddleware(deps) {
  const modulePath = path.join(process.cwd(), "src/lib/permission-middleware.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "next-auth/jwt": { getToken: deps.getToken },
      "@/lib/permissions": { PermissionLevel: deps.PermissionLevel },
      "@/lib/type-guards": { isSystemAdmin: deps.isSystemAdmin },
      "@/lib/authorization": { hasModuleAccess: deps.hasModuleAccess },
    },
    () => require(modulePath)
  );
}

test("permission middleware enforces token/session validity and module access", async () => {
  await withSuppressedConsoleError(async () => {
    const deps = {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS", FULL_ACCESS: "FULL_ACCESS" },
      getToken: async () => ({ sub: "user-1", roles: ["QMR"], role: "QMR", email: "qmr@example.com" }),
      isSystemAdmin: () => false,
      hasModuleAccess: ({ roles }, module, level) =>
        roles.includes("QMR") && module === "documents" && level === "VIEW_ACCESS",
    };

    let mod = loadPermissionMiddleware(deps);
    let response = await mod.withPermission("VIEW_ACCESS", "documents")({});
    assert.equal(response.kind, "next");

    deps.getToken = async () => null;
    mod = loadPermissionMiddleware(deps);
    response = await mod.withPermission("VIEW_ACCESS", "documents")({});
    assert.equal(response.status, 401);

    deps.getToken = async () => ({ sub: "user-1", roles: [], role: null });
    mod = loadPermissionMiddleware(deps);
    response = await mod.withPermission("VIEW_ACCESS", "documents")({});
    assert.equal(response.status, 401);

    deps.getToken = async () => ({ sub: "user-1", roles: ["STAFF"], role: "STAFF" });
    deps.hasModuleAccess = () => false;
    mod = loadPermissionMiddleware(deps);
    response = await mod.withPermission("VIEW_ACCESS", "documents")({});
    assert.equal(response.status, 403);
  });
});

test("permission middleware helper functions return consistent permission decisions", async () => {
  const deps = {
    PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS", FULL_ACCESS: "FULL_ACCESS" },
    getToken: async () => ({ sub: "user-1", roles: ["QMR"], role: "QMR" }),
    isSystemAdmin: (session) => Boolean(session?.user?.isSystemAdmin),
    hasModuleAccess: ({ roles, isSystemAdmin }, module, level) =>
      isSystemAdmin || (roles.includes("QMR") && module === "documents" && level === "VIEW_ACCESS"),
  };

  const mod = loadPermissionMiddleware(deps);
  const allowed = await mod.checkUserPermission({}, "documents", "VIEW_ACCESS");
  const denied = await mod.checkUserPermission({}, "contracts", "VIEW_ACCESS");
  const guardPass = await mod.createPermissionGuard("documents", "VIEW_ACCESS")({});
  const guardFail = await mod.createPermissionGuard("contracts", "VIEW_ACCESS")({});

  assert.equal(allowed.allowed, true);
  assert.equal(denied.allowed, false);
  assert.equal(guardPass, null);
  assert.equal(guardFail.status, 403);
  assert.equal(mod.checkPermission({ user: { roles: ["QMR"], role: "QMR" } }, "documents", "VIEW_ACCESS"), true);
  assert.equal(mod.principalsGuard({ user: { roles: ["QMR"], role: "QMR" } }), false);
});
