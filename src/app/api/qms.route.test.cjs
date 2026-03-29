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
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/qms-api-auth": mocks.qmsApiAuth,
      "@/lib/permission-middleware": mocks.permissionMiddleware,
    },
    () => require(modulePath)
  );
}

test("qms metrics route enforces access, filters list, and creates metric with initial history", async () => {
  await withSuppressedConsole(["error"], async () => {
    const historyCalls = [];
    const createCalls = [];
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
        requireQmsApiAccess: async () => ({ ok: true, session: { user: { id: "qms-1" } } }),
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      },
      prisma: {
        complianceMetric: {
          async findMany(args) {
            return [{ id: "metric-1", category: args.where.category, isActive: args.where.isActive, history: [] }];
          },
          async findUnique(args) {
            return args.where.name === "Duplicate" ? { id: "metric-dup" } : null;
          },
          async create(args) {
            createCalls.push(args);
            return { id: "metric-2", ...args.data, history: [] };
          },
        },
        complianceMetricHistory: {
          async create(args) {
            historyCalls.push(args);
          },
        },
      },
    };

    let route = loadRoute("src/app/api/qms/metrics/route.ts", mocks);
    let response = await route.GET({ nextUrl: new URL("https://example.com/api/qms/metrics?category=SAFETY&isActive=true") });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [{ id: "metric-1", category: "SAFETY", isActive: true, history: [] }]);

    mocks.qmsApiAuth.requireQmsApiAccess = async () => denied;
    route = loadRoute("src/app/api/qms/metrics/route.ts", mocks);
    response = await route.GET({ nextUrl: new URL("https://example.com/api/qms/metrics") });
    assert.equal(response.status, 403);

    mocks.qmsApiAuth.requireQmsApiAccess = async () => ({ ok: true, session: { user: { id: "qms-1" } } });
    route = loadRoute("src/app/api/qms/metrics/route.ts", mocks);
    response = await route.POST({
      async json() {
        return { name: "Metric A", currentValue: 10 };
      },
    });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/qms/metrics/route.ts", mocks);
    response = await route.POST({
      async json() {
        return { name: "Duplicate", currentValue: 10, targetValue: 20, unit: "%" };
      },
    });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/qms/metrics/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          name: "Metric B",
          description: "On-time compliance",
          currentValue: "12.5",
          targetValue: "20",
          unit: "%",
          category: "OPS",
          formula: "a/b",
        };
      },
    });
    assert.equal(response.status, 201);
    assert.equal(createCalls[0].data.currentValue, 12.5);
    assert.equal(createCalls[0].data.targetValue, 20);
    assert.equal(historyCalls[0].data.value, 12.5);
  });
});

test("qms audit trail route filters paged results and creates entries with request metadata", async () => {
  await withSuppressedConsole(["error"], async () => {
    const createCalls = [];
    const denied = {
      ok: false,
      response: {
        status: 401,
        body: { error: "Unauthorized" },
        async json() {
          return this.body;
        },
      },
    };
    const mocks = {
      qmsApiAuth: {
        requireQmsApiAccess: async () => ({ ok: true, session: { user: { id: "qms-2" } } }),
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      },
      prisma: {
        auditTrail: {
          async findMany() {
            return [{ id: "trail-1", user: { id: "u1", name: "QMR", email: "qmr@example.com" } }];
          },
          async count() {
            return 11;
          },
          async create(args) {
            createCalls.push(args);
            return { id: "trail-2", ...args.data, user: { id: "u1", name: "QMR", email: "qmr@example.com" } };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/qms/audit-trail/route.ts", mocks);
    let response = await route.GET({
      nextUrl: new URL("https://example.com/api/qms/audit-trail?entityType=QMSDocument&category=DOC&severity=INFO&days=7&page=2&limit=5"),
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 11);
    assert.equal(response.body.page, 2);
    assert.equal(response.body.limit, 5);
    assert.equal(response.body.pages, 3);

    mocks.qmsApiAuth.requireQmsApiAccess = async () => denied;
    route = loadRoute("src/app/api/qms/audit-trail/route.ts", mocks);
    response = await route.POST({ async json() { return {}; }, headers: new Map() });
    assert.equal(response.status, 401);

    mocks.qmsApiAuth.requireQmsApiAccess = async () => ({ ok: true, session: { user: { id: "qms-2" } } });
    route = loadRoute("src/app/api/qms/audit-trail/route.ts", mocks);
    response = await route.POST({
      async json() {
        return { category: "DOC", event: "UPDATED", userId: "u1" };
      },
      headers: new Map([
        ["x-forwarded-for", "10.0.0.1"],
        ["user-agent", "TestAgent"],
      ]),
    });
    assert.equal(response.status, 201);
    assert.equal(createCalls[0].data.ipAddress, "10.0.0.1");
    assert.equal(createCalls[0].data.userAgent, "TestAgent");
  });
});

test("qms documents and nonconformities routes validate inputs and write audit trail entries", async () => {
  await withSuppressedConsole(["error"], async () => {
    const auditTrailCalls = [];
    const qmsCreateCalls = [];
    const ncCreateCalls = [];
    const access = { ok: true, session: { user: { id: "qms-3" } } };
    const mocks = {
      qmsApiAuth: {
        requireQmsApiAccess: async () => access,
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      },
      prisma: {
        qMSDocument: {
          async findMany() {
            return [{ id: "qms-doc-1" }];
          },
          async count() {
            return 1;
          },
          async create(args) {
            qmsCreateCalls.push(args);
            return {
              id: "qms-doc-2",
              ...args.data,
              crew: { id: "crew-1", fullName: "Crew One" },
              document: { id: "doc-1", docType: "Passport" },
            };
          },
        },
        nonconformityRecord: {
          async findMany() {
            return [{ id: "nc-1" }];
          },
          async count() {
            return 1;
          },
          async create(args) {
            ncCreateCalls.push(args);
            return {
              id: "nc-2",
              ...args.data,
              crew: { id: "crew-1", fullName: "Crew One" },
              assignee: { id: "u2", name: "Verifier" },
              auditLogs: [],
            };
          },
        },
        auditTrail: {
          async create(args) {
            auditTrailCalls.push(args);
          },
        },
      },
    };

    let route = loadRoute("src/app/api/qms/documents/route.ts", mocks);
    let response = await route.GET({
      nextUrl: new URL("https://example.com/api/qms/documents?crewId=crew-1&status=ACTIVE&riskLevel=HIGH&page=2&limit=5"),
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.page, 2);

    route = loadRoute("src/app/api/qms/documents/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {};
      },
    });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/qms/documents/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          crewId: "crew-1",
          status: "ACTIVE",
          riskLevel: "HIGH",
          category: "GENERAL",
          remarks: "Checked",
          expiresAt: "2026-05-01T00:00:00.000Z",
        };
      },
    });
    assert.equal(response.status, 201);
    assert.equal(qmsCreateCalls[0].data.crewId, "crew-1");
    assert.equal(qmsCreateCalls[0].data.lastVerifiedAt instanceof Date, true);
    assert.equal(auditTrailCalls[0].data.category, "DOCUMENT_VERIFICATION");

    route = loadRoute("src/app/api/qms/nonconformities/route.ts", mocks);
    response = await route.GET({
      nextUrl: new URL("https://example.com/api/qms/nonconformities?crewId=crew-1&status=OPEN&severity=CRITICAL&page=1&limit=10"),
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);

    route = loadRoute("src/app/api/qms/nonconformities/route.ts", mocks);
    response = await route.POST({
      async json() {
        return { type: "DOC" };
      },
    });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/qms/nonconformities/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          crewId: "crew-1",
          type: "DOC",
          severity: "CRITICAL",
          description: "Expired certificate",
          findings: "Found during audit",
          assignedTo: "u2",
        };
      },
    });
    assert.equal(response.status, 201);
    assert.equal(ncCreateCalls[0].data.status, "OPEN");
    assert.equal(auditTrailCalls[1].data.category, "PROCESS_COMPLIANCE");
    assert.equal(auditTrailCalls[1].data.severity, "CRITICAL");
  });
});
