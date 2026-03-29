const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  registerTsNode,
  withMockedModuleLoad,
  withSuppressedConsoleError,
} = require("../../../lib/test-harness.cjs");

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
        headers: init.headers ?? {},
        async json() {
          return body;
        },
      };
    },
  };
}

function loadHealthRoute(deps) {
  const modulePath = path.join(process.cwd(), "src/app/api/health/route.ts");
  delete require.cache[require.resolve(modulePath)];

  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "@/lib/prisma": { prisma: deps.prisma },
      "@/lib/env": { env: deps.env },
    },
    () => require(modulePath)
  );
}

test("health route returns ok when config is ready and database responds", async () => {
  const deps = {
    prisma: {
      async $queryRaw() {
        return [{ "?column?": 1 }];
      },
    },
    env: {
      hasDatabaseUrl: true,
      hasNextAuthSecret: true,
      hasCryptoKey: true,
      issues: [],
    },
  };

  const route = loadHealthRoute(deps);
  const response = await route.GET();

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.environment, process.env.NODE_ENV || "production");
  assert.equal(typeof response.body.timestamp, "string");
  assert.equal(typeof response.body.latencyMs, "number");
  assert.equal(response.headers["Cache-Control"], "public, max-age=10, must-revalidate");
  assert.equal(response.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(response.headers["X-Frame-Options"], "DENY");
});

test("health route returns config unavailable when required env is missing", async () => {
  await withSuppressedConsoleError(async () => {
    const deps = {
      prisma: {
        async $queryRaw() {
          throw new Error("should not run");
        },
      },
      env: {
        hasDatabaseUrl: false,
        hasNextAuthSecret: true,
        hasCryptoKey: false,
        issues: ["DATABASE_URL missing", "CRYPTO_KEY missing"],
      },
    };

    const route = loadHealthRoute(deps);
    const response = await route.GET();

    assert.equal(response.status, 503);
    assert.deepEqual(response.body.status, "error");
    assert.equal(response.body.error, "CONFIG_UNAVAILABLE");
    assert.equal(typeof response.body.timestamp, "string");
    assert.equal(response.headers["Cache-Control"], "no-cache, no-store, must-revalidate");
  });
});

test("health route returns service unavailable when database check fails", async () => {
  await withSuppressedConsoleError(async () => {
    const deps = {
      prisma: {
        async $queryRaw() {
          throw new Error("db offline");
        },
      },
      env: {
        hasDatabaseUrl: true,
        hasNextAuthSecret: true,
        hasCryptoKey: true,
        issues: [],
      },
    };

    const route = loadHealthRoute(deps);
    const response = await route.GET();

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, {
      status: "error",
      error: "SERVICE_UNAVAILABLE",
      timestamp: response.body.timestamp,
    });
    assert.equal(typeof response.body.timestamp, "string");
    assert.equal(response.headers["X-Frame-Options"], "DENY");
  });
});
