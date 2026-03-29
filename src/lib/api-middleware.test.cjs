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
        type: "json",
        status: init.status ?? 200,
        body,
        async text() {
          return JSON.stringify(body);
        },
      };
    },
  };
}

function loadApiMiddleware(deps) {
  const modulePath = path.join(process.cwd(), "src/lib/api-middleware.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "next-auth": { getServerSession: deps.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/error-handler": deps.errorHandler,
      "@/lib/permission-middleware": deps.permissionMiddleware,
      "@/lib/rate-limit": { rateLimit: deps.rateLimit },
      "@/lib/env": { env: deps.env },
    },
    () => require(modulePath)
  );
}

test("api middleware enforces auth, permission, rate limit, and config availability", async () => {
  await withSuppressedConsoleError(async () => {
    const deps = {
      getServerSession: async () => ({ user: { id: "user-1" } }),
      errorHandler: {
        ApiError: class ApiError extends Error {
          constructor(statusCode, message, code) {
            super(message);
            this.statusCode = statusCode;
            this.code = code;
          }
        },
        handleApiError(error) {
          return {
            status: error.statusCode ?? 500,
            body: { error: error.message, code: error.code },
            async text() {
              return JSON.stringify(this.body);
            },
          };
        },
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
        checkPermission: () => true,
      },
      rateLimit: () => true,
      env: {
        hasNextAuthSecret: true,
        NEXTAUTH_SECRET: "x".repeat(32),
      },
    };

    let api = loadApiMiddleware(deps);
    const withAuthHandler = api.withAuth(async (_req, session, ctx) => ({
      status: 200,
      body: { sessionUserId: session.user.id, ctx },
      async text() {
        return JSON.stringify(this.body);
      },
    }));
    const ok = await withAuthHandler({}, { id: 1 });
    assert.equal(ok.status, 200);

    deps.env.hasNextAuthSecret = false;
    api = loadApiMiddleware(deps);
    const unavailable = await api.withAuth(async () => null)({}, {});
    assert.equal(unavailable.status, 503);

    deps.env.hasNextAuthSecret = true;
    deps.getServerSession = async () => null;
    api = loadApiMiddleware(deps);
    const unauthorized = await api.withAuth(async () => null)({}, {});
    assert.equal(unauthorized.status, 401);

    deps.getServerSession = async () => ({ user: { id: "user-2" } });
    deps.permissionMiddleware.checkPermission = () => false;
    api = loadApiMiddleware(deps);
    const forbidden = await api.withPermission(
      "documents",
      deps.permissionMiddleware.PermissionLevel.VIEW_ACCESS,
      async () => ({ status: 200 })
    )({}, {});
    assert.equal(forbidden.status, 403);

    deps.permissionMiddleware.checkPermission = () => true;
    deps.rateLimit = () => false;
    api = loadApiMiddleware(deps);
    const throttled = await api.withRateLimit(1, 1000, async () => ({ status: 200 }))({}, {});
    assert.equal(throttled.status, 429);
  });
});
