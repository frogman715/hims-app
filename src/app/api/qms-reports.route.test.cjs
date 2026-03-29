const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  registerTsNode,
  withMockedModuleLoad,
  withSuppressedConsole,
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
      "@/lib/prisma": { prisma: mocks.prisma ?? {} },
      "@/lib/qms-api-auth": mocks.qmsApiAuth ?? {},
      "@/lib/permission-middleware": mocks.permissionMiddleware ?? {},
      "@/lib/qms/email-distribution": mocks.emailDistribution ?? {},
    },
    () => require(modulePath)
  );
}

test("qms reports route filters lists and creates reports with metrics snapshot and audit trail", async () => {
  await withSuppressedConsole(["error"], async () => {
    const createCalls = [];
    const auditCalls = [];
    const denied = {
      ok: false,
      response: {
        status: 403,
        body: { error: "Forbidden" },
        async json() {
          return this.body;
        },
      },
    };
    const mocks = {
      qmsApiAuth: {
        requireQmsApiAccess: async () => ({ ok: true, session: { user: { id: "qms-report-1" } } }),
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      },
      prisma: {
        qMSReport: {
          async findMany() {
            return [{ id: "report-1" }];
          },
          async count() {
            return 1;
          },
          async create(args) {
            createCalls.push(args);
            return {
              id: "report-2",
              ...args.data,
              approver: null,
            };
          },
        },
        complianceMetric: {
          async findMany() {
            return [
              { id: "metric-1", name: "Compliance", currentValue: 95, targetValue: 100, unit: "%" },
            ];
          },
        },
        auditTrail: {
          async create(args) {
            auditCalls.push(args);
          },
        },
      },
    };

    let route = loadRoute("src/app/api/qms/reports/route.ts", mocks);
    let response = await route.GET({
      nextUrl: new URL("https://example.com/api/qms/reports?reportType=MONTHLY&status=DRAFT&page=2&limit=5"),
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.page, 2);
    assert.equal(response.body.limit, 5);

    mocks.qmsApiAuth.requireQmsApiAccess = async () => denied;
    route = loadRoute("src/app/api/qms/reports/route.ts", mocks);
    response = await route.POST({ async json() { return {}; } });
    assert.equal(response.status, 403);

    mocks.qmsApiAuth.requireQmsApiAccess = async () => ({ ok: true, session: { user: { id: "qms-report-1" } } });
    route = loadRoute("src/app/api/qms/reports/route.ts", mocks);
    response = await route.POST({
      async json() {
        return { title: "Monthly" };
      },
    });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/qms/reports/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          title: "Monthly Report",
          description: "Summary",
          reportType: "MONTHLY",
          periodStart: "2026-03-01T00:00:00.000Z",
          periodEnd: "2026-03-31T00:00:00.000Z",
          sections: [{ title: "Overview" }],
        };
      },
    });
    assert.equal(response.status, 201);
    assert.equal(createCalls[0].data.status, "DRAFT");
    assert.match(createCalls[0].data.sections, /Overview/);
    assert.match(createCalls[0].data.metricsSnapshot, /Compliance/);
    assert.equal(auditCalls[0].data.entityType, "QMSReport");
  });
});

test("qms report distributions routes validate report existence and schedule payloads", async () => {
  await withSuppressedConsole(["error"], async () => {
    const scheduleCalls = [];
    const mocks = {
      qmsApiAuth: {
        requireQmsApiAccess: async () => ({ ok: true, session: { user: { id: "qms-report-2" } } }),
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      },
      emailDistribution: {
        EmailDistributionService: {
          async listReportDistributions(id) {
            return [{ id: "dist-1", reportId: id }];
          },
          async scheduleDistribution(id, recipients, schedule, provider) {
            scheduleCalls.push({ id, recipients, schedule, provider });
            return { id: "dist-2", reportId: id, recipients, schedule, provider };
          },
        },
      },
      prisma: {
        qMSReport: {
          async findUnique(args) {
            return args.where.id === "missing" ? null : { id: args.where.id };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/qms/reports/[id]/distributions/route.ts", mocks);
    let response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/qms/reports/[id]/distributions/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "report-1" }) });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      reportId: "report-1",
      distributions: [{ id: "dist-1", reportId: "report-1" }],
      count: 1,
    });

    route = loadRoute("src/app/api/qms/reports/[id]/distributions/route.ts", mocks);
    response = await route.POST(
      { async json() { return { recipients: [], schedule: "daily" }; } },
      { params: Promise.resolve({ id: "report-1" }) }
    );
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/qms/reports/[id]/distributions/route.ts", mocks);
    response = await route.POST(
      { async json() { return { recipients: ["a@example.com"], schedule: "yearly" }; } },
      { params: Promise.resolve({ id: "report-1" }) }
    );
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/qms/reports/[id]/distributions/route.ts", mocks);
    response = await route.POST(
      {
        async json() {
          return {
            recipients: ["a@example.com", "b@example.com"],
            schedule: "weekly",
            provider: "sendgrid",
          };
        },
      },
      { params: Promise.resolve({ id: "report-1" }) }
    );
    assert.equal(response.status, 201);
    assert.deepEqual(scheduleCalls[0], {
      id: "report-1",
      recipients: ["a@example.com", "b@example.com"],
      schedule: "weekly",
      provider: "sendgrid",
    });
  });
});

test("qms report distribution executor enforces scheduler token and supports management actions", async () => {
  await withSuppressedConsole(["error"], async () => {
    const originalToken = process.env.SCHEDULER_SECRET_TOKEN;
    process.env.SCHEDULER_SECRET_TOKEN = "secret-token";

    const toggleCalls = [];
    const removeCalls = [];
    const detailCalls = [];
    const mocks = {
      emailDistribution: {
        EmailDistributionService: {
          async executePendingDistributions() {
            return { success: 2, failed: 1 };
          },
          async toggleSchedule(jobId, enabled) {
            toggleCalls.push({ jobId, enabled });
            return true;
          },
          async removeDistribution(jobId) {
            removeCalls.push(jobId);
            return true;
          },
          async getDistributionDetails(jobId) {
            detailCalls.push(jobId);
            return { id: jobId, status: "ACTIVE" };
          },
        },
      },
    };

    try {
      let route = loadRoute("src/app/api/qms/reports/execute-distributions/route.ts", mocks);
      let response = await route.GET({ headers: new Map() });
      assert.equal(response.status, 401);

      response = await route.GET({
        headers: new Map([["authorization", "Bearer secret-token"]]),
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.results.success, 2);

      response = await route.POST({
        headers: new Map([["authorization", "Bearer secret-token"]]),
        async json() {
          return { action: "pause", jobId: "job-1" };
        },
      });
      assert.equal(response.status, 200);

      response = await route.POST({
        headers: new Map([["authorization", "Bearer secret-token"]]),
        async json() {
          return { action: "resume", jobId: "job-1" };
        },
      });
      assert.equal(response.status, 200);

      response = await route.POST({
        headers: new Map([["authorization", "Bearer secret-token"]]),
        async json() {
          return { action: "remove", jobId: "job-2" };
        },
      });
      assert.equal(response.status, 200);

      response = await route.POST({
        headers: new Map([["authorization", "Bearer secret-token"]]),
        async json() {
          return { action: "details", jobId: "job-3" };
        },
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.found, true);

      response = await route.POST({
        headers: new Map([["authorization", "Bearer secret-token"]]),
        async json() {
          return { action: "unknown" };
        },
      });
      assert.equal(response.status, 400);

      assert.deepEqual(toggleCalls, [
        { jobId: "job-1", enabled: false },
        { jobId: "job-1", enabled: true },
      ]);
      assert.deepEqual(removeCalls, ["job-2"]);
      assert.deepEqual(detailCalls, ["job-3"]);
    } finally {
      if (originalToken === undefined) {
        delete process.env.SCHEDULER_SECRET_TOKEN;
      } else {
        process.env.SCHEDULER_SECRET_TOKEN = originalToken;
      }
    }
  });
});
