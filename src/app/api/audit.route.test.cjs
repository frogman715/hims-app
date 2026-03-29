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
      "next-auth": { getServerSession: mocks.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/audit/service": mocks.auditService,
      "@/lib/permission-middleware": mocks.permissionMiddleware ?? {},
      "@prisma/client": {
        ComplianceAuditStatus: {
          OPEN: "OPEN",
          IN_PROGRESS: "IN_PROGRESS",
          CLOSED: "CLOSED",
        },
        ComplianceAuditType: {
          INTERNAL: "INTERNAL",
          EXTERNAL: "EXTERNAL",
        },
      },
    },
    () => require(modulePath)
  );
}

test("audit list/create routes enforce auth and quality permission, and forward query/body payloads", async () => {
  await withSuppressedConsole(["error"], async () => {
    const listCalls = [];
    const createCalls = [];
    const mocks = {
      getServerSession: async () => null,
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
        checkPermission: () => true,
      },
      auditService: {
        async listAudits(args) {
          listCalls.push(args);
          return { data: [{ id: "audit-1" }], total: 1 };
        },
        async createAudit(args) {
          createCalls.push(args);
          return { id: "audit-2", ...args };
        },
      },
    };

    let route = loadRoute("src/app/api/audit/list/route.ts", mocks);
    let response = await route.GET({ url: "https://example.com/api/audit/list" });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-1" } });
    mocks.permissionMiddleware.checkPermission = () => false;
    route = loadRoute("src/app/api/audit/list/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/audit/list" });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/audit/list/route.ts", mocks);
    response = await route.GET({
      url: "https://example.com/api/audit/list?status=OPEN&auditType=INTERNAL&limit=25&offset=5",
    });
    assert.equal(response.status, 200);
    assert.deepEqual(listCalls[0], {
      status: "OPEN",
      auditType: "INTERNAL",
      limit: 25,
      offset: 5,
    });

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/audit/list/route.ts", mocks);
    response = await route.POST({ async json() { return {}; } });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "lead-1" } });
    mocks.permissionMiddleware.checkPermission = (_s, _m, level) => level !== "EDIT_ACCESS";
    route = loadRoute("src/app/api/audit/list/route.ts", mocks);
    response = await route.POST({ async json() { return {}; } });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/audit/list/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          auditNumber: "AUD-001",
          auditType: "INTERNAL",
          scope: "ISM",
          objectives: "Verify compliance",
          auditCriteria: "ISO 9001",
          assistantAuditors: ["user-2"],
          auditeeContactPerson: "Jane",
          auditeeContactEmail: "jane@example.com",
          auditeeContactPhone: "12345",
          estimatedDuration: 3,
          location: "Jakarta",
          auditDate: "2026-04-10T00:00:00.000Z",
        };
      },
    });
    assert.equal(response.status, 201);
    assert.equal(createCalls[0].leadAuditorId, "lead-1");
    assert.equal(createCalls[0].auditDate.toISOString(), "2026-04-10T00:00:00.000Z");
  });
});

test("audit stats/detail/finding routes enforce auth and forward service actions", async () => {
  await withSuppressedConsole(["error"], async () => {
    const findingCalls = [];
    const actionCalls = [];
    const mocks = {
      getServerSession: async () => null,
      auditService: {
        async getAuditStats() {
          return { open: 3, closed: 7 };
        },
        async getAuditWithDetails(id) {
          return id === "missing" ? null : { id, title: "Internal Audit" };
        },
        async startAudit(id) {
          actionCalls.push({ action: "start", id });
          return { id, status: "IN_PROGRESS" };
        },
        async completeAudit(id) {
          actionCalls.push({ action: "complete", id });
          return { id, status: "COMPLETED" };
        },
        async closeAudit(id) {
          actionCalls.push({ action: "close", id });
          return { id, status: "CLOSED" };
        },
        async createAuditFinding(args) {
          findingCalls.push(args);
          return { id: "finding-1", ...args };
        },
      },
    };

    let route = loadRoute("src/app/api/audit/stats/route.ts", mocks);
    let response = await route.GET();
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-2" } });
    route = loadRoute("src/app/api/audit/stats/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { open: 3, closed: 7 });

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/audit/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "audit-1" }) });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-2" } });
    route = loadRoute("src/app/api/audit/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/audit/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "audit-1" }) });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { id: "audit-1", title: "Internal Audit" });

    route = loadRoute("src/app/api/audit/[id]/route.ts", mocks);
    response = await route.PUT(
      { async json() { return { action: "pause" }; } },
      { params: Promise.resolve({ id: "audit-1" }) }
    );
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/audit/[id]/route.ts", mocks);
    response = await route.PUT(
      { async json() { return { action: "start" }; } },
      { params: Promise.resolve({ id: "audit-1" }) }
    );
    assert.equal(response.status, 200);
    route = loadRoute("src/app/api/audit/[id]/route.ts", mocks);
    response = await route.PUT(
      { async json() { return { action: "complete" }; } },
      { params: Promise.resolve({ id: "audit-1" }) }
    );
    assert.equal(response.status, 200);
    route = loadRoute("src/app/api/audit/[id]/route.ts", mocks);
    response = await route.PUT(
      { async json() { return { action: "close" }; } },
      { params: Promise.resolve({ id: "audit-1" }) }
    );
    assert.equal(response.status, 200);
    assert.deepEqual(actionCalls, [
      { action: "start", id: "audit-1" },
      { action: "complete", id: "audit-1" },
      { action: "close", id: "audit-1" },
    ]);

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/audit/[id]/findings/route.ts", mocks);
    response = await route.POST(
      { async json() { return {}; } },
      { params: Promise.resolve({ id: "audit-1" }) }
    );
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-2" } });
    route = loadRoute("src/app/api/audit/[id]/findings/route.ts", mocks);
    response = await route.POST(
      {
        async json() {
          return {
            findingCode: "F-001",
            description: "Missing calibration record",
            severity: "MAJOR",
            relatedDocId: "doc-1",
            relatedProcess: "Calibration",
            assignedToId: "user-5",
            dueDate: "2026-04-20T00:00:00.000Z",
          };
        },
      },
      { params: Promise.resolve({ id: "audit-1" }) }
    );
    assert.equal(response.status, 201);
    assert.equal(findingCalls[0].auditId, "audit-1");
    assert.equal(findingCalls[0].dueDate.toISOString(), "2026-04-20T00:00:00.000Z");
  });
});
