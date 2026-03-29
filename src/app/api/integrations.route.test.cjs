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

function loadRoute(moduleRelativePath, mocks) {
  const modulePath = path.join(process.cwd(), moduleRelativePath);
  delete require.cache[require.resolve(modulePath)];

  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "next-auth": { getServerSession: mocks.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/permission-middleware": mocks.permissionMiddleware,
      "@/lib/error-handler": mocks.errorHandler,
    },
    () => require(modulePath)
  );
}

test("qms status integration route enforces auth/permission and computes health summary", async () => {
  const mocks = {
    getServerSession: async () => null,
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      checkPermission: () => true,
    },
    errorHandler: {
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
    prisma: {
      risk: {
        async findMany() {
          return [
            { riskScore: 20, status: "ACTIVE", source: "RISK" },
            { riskScore: 10, status: "ACTIVE", source: "RISK" },
            { riskScore: 5, status: "CLOSED", source: "RISK" },
          ];
        },
      },
      auditSchedule: {
        async findMany() {
          return [
            {
              status: "COMPLETED",
              findings: [{ severity: "MAJOR_NC" }, { severity: "MINOR_NC" }],
            },
            {
              status: "SCHEDULED",
              findings: [{ severity: "OBSERVATION" }],
            },
          ];
        },
      },
    },
  };

  let route = loadRoute("src/app/api/integrations/qms-status/route.ts", mocks);
  let response = await route.GET();
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-1" } });
  mocks.permissionMiddleware.checkPermission = () => false;
  route = loadRoute("src/app/api/integrations/qms-status/route.ts", mocks);
  response = await route.GET();
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.checkPermission = () => true;
  route = loadRoute("src/app/api/integrations/qms-status/route.ts", mocks);
  response = await route.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data.risk, {
    total: 3,
    active: 2,
    averageScore: 12,
    highRisks: 1,
  });
  assert.deepEqual(response.body.data.audit.findings, {
    total: 3,
    majorNC: 1,
    minorNC: 1,
    observations: 1,
  });
  assert.equal(response.body.data.overallHealth.level, "FAIR");
});

test("risk/nonconformance and finding/cpar integration routes validate payloads and entity existence", async () => {
  const mocks = {
    getServerSession: async () => null,
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      checkPermission: () => true,
    },
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
          async json() {
            return this.body;
          },
        };
      },
    },
    prisma: {
      risk: {
        async findUnique(args) {
          return args.where.id === "missing" ? null : { id: args.where.id };
        },
      },
      auditFinding: {
        async findUnique(args) {
          return args.where.id === "missing"
            ? null
            : { id: args.where.id, findingNumber: "AUD-2026-001", schedule: { id: "sched-1" } };
        },
      },
    },
  };

  let route = loadRoute("src/app/api/integrations/link-risk-nonconformance/route.ts", mocks);
  let response = await route.POST({ async json() { return {}; } });
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-2" } });
  mocks.permissionMiddleware.checkPermission = () => false;
  route = loadRoute("src/app/api/integrations/link-risk-nonconformance/route.ts", mocks);
  response = await route.POST({ async json() { return { riskId: "risk-1", nonconformanceId: "nc-1" }; } });
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.checkPermission = () => true;
  route = loadRoute("src/app/api/integrations/link-risk-nonconformance/route.ts", mocks);
  response = await route.POST({ async json() { return { riskId: "", nonconformanceId: "nc-1" }; } });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");

  route = loadRoute("src/app/api/integrations/link-risk-nonconformance/route.ts", mocks);
  response = await route.POST({ async json() { return { riskId: "missing", nonconformanceId: "nc-1" }; } });
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/integrations/link-risk-nonconformance/route.ts", mocks);
  response = await route.POST({ async json() { return { riskId: "risk-1", nonconformanceId: "nc-1" }; } });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, {
    riskId: "risk-1",
    nonconformanceId: "nc-1",
    linked: true,
    message: "Risk linked to nonconformance (integration point)",
  });

  route = loadRoute("src/app/api/integrations/link-finding-cpar/route.ts", mocks);
  response = await route.POST({ async json() { return { findingId: "", cparId: "cpar-1" }; } });
  assert.equal(response.status, 400);

  route = loadRoute("src/app/api/integrations/link-finding-cpar/route.ts", mocks);
  response = await route.POST({ async json() { return { findingId: "missing", cparId: "cpar-1" }; } });
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/integrations/link-finding-cpar/route.ts", mocks);
  response = await route.POST({ async json() { return { findingId: "finding-1", cparId: "cpar-1" }; } });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, {
    findingId: "finding-1",
    findingNumber: "AUD-2026-001",
    linked: true,
    message: "Finding linked to CPAR (integration point)",
  });
});
