const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  registerTsNode,
  withMockedModuleLoad,
} = require("../../lib/test-harness.cjs");

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
        status: init.status ?? 200,
        body,
        async json() {
          return body;
        },
      };
    },
  };
}

function loadRoute(mocks) {
  const modulePath = path.join(
    process.cwd(),
    "src/app/api/admin/system-health/automation/route.ts"
  );
  delete require.cache[require.resolve(modulePath)];

  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "next-auth": { getServerSession: mocks.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/office-api-access": {
        ensureOfficeApiPathAccess: mocks.ensureOfficeApiPathAccess,
      },
      "@/lib/error-handler": {
        handleApiError(error) {
          return {
            status: error.statusCode ?? 500,
            body: { error: error.message },
            async json() {
              return this.body;
            },
          };
        },
      },
      "@/lib/internal-job-auth": {
        hasValidInternalJobToken: mocks.hasValidInternalJobToken,
      },
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/office-automation": {
        runOfficeAutomation: mocks.runOfficeAutomation,
      },
    },
    () => require(modulePath)
  );
}

test("system health automation route accepts internal job token and skips audit logging without session actor", async () => {
  let auditLogCalls = 0;
  const route = loadRoute({
    getServerSession: async () => null,
    hasValidInternalJobToken: () => true,
    ensureOfficeApiPathAccess: () => null,
    runOfficeAutomation: async () => ({
      generatedAt: "2026-03-29T00:00:00.000Z",
      summary: { totalAlerts: 4 },
      notificationSummary: { results: [] },
    }),
    prisma: {
      auditLog: {
        async create() {
          auditLogCalls += 1;
        },
      },
    },
  });

  const response = await route.POST({
    headers: { get() { return "token"; } },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.summary.totalAlerts, 4);
  assert.equal(auditLogCalls, 0);
});

test("system health automation route requires permission and logs execution for office user", async () => {
  const auditLogCalls = [];
  let allowAccess = false;
  let route = loadRoute({
    getServerSession: async () => ({ user: { id: "user-1" } }),
    hasValidInternalJobToken: () => false,
    ensureOfficeApiPathAccess: () =>
      allowAccess ? null : { status: 403, body: { error: "Forbidden" } },
    runOfficeAutomation: async () => ({
      generatedAt: "2026-03-29T00:00:00.000Z",
      summary: { totalAlerts: 2 },
      notificationSummary: { results: [{ status: "SENT" }] },
    }),
    prisma: {
      auditLog: {
        async create(args) {
          auditLogCalls.push(args);
        },
      },
    },
  });

  let response = await route.POST({ headers: { get() { return null; } } });
  assert.equal(response.status, 403);

  allowAccess = true;
  route = loadRoute({
    getServerSession: async () => ({ user: { id: "user-1" } }),
    hasValidInternalJobToken: () => false,
    ensureOfficeApiPathAccess: () => null,
    runOfficeAutomation: async () => ({
      generatedAt: "2026-03-29T00:00:00.000Z",
      summary: { totalAlerts: 2 },
      notificationSummary: { results: [{ status: "SENT" }] },
    }),
    prisma: {
      auditLog: {
        async create(args) {
          auditLogCalls.push(args);
        },
      },
    },
  });

  response = await route.POST({ headers: { get() { return null; } } });
  assert.equal(response.status, 200);
  assert.equal(auditLogCalls.length, 1);
  assert.equal(
    auditLogCalls[0].data.action,
    "OFFICE_AUTOMATION_EXECUTED"
  );
});
