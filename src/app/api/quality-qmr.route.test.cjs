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
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/office-api-access": mocks.officeApiAccess,
      "@prisma/client": {
        PriorityLevel: {
          LOW: "LOW",
          MEDIUM: "MEDIUM",
          HIGH: "HIGH",
          CRITICAL: "CRITICAL",
        },
        QMRTaskType: {
          AUDIT: "AUDIT",
          CAPA: "CAPA",
          REVIEW: "REVIEW",
        },
      },
    },
    () => require(modulePath)
  );
}

test("quality qmr stats route enforces office access and returns aggregated counters", async () => {
  await withSuppressedConsole(["error"], async () => {
    const accessDenied = {
      status: 403,
      body: { error: "Forbidden" },
      async json() {
        return this.body;
      },
    };
    const mocks = {
      getServerSession: async () => ({ user: { id: "qmr-1" } }),
      officeApiAccess: {
        ensureOfficeApiPathAccess: () => null,
      },
      prisma: {
        internalAudit: {
          async count() {
            return 4;
          },
        },
        correctiveAction: {
          async count() {
            return 7;
          },
        },
        managementReview: {
          async count() {
            return 2;
          },
        },
        qMRTask: {
          async count() {
            return 3;
          },
        },
      },
    };

    let route = loadRoute("src/app/api/quality/qmr/stats/route.ts", mocks);
    let response = await route.GET();
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      pendingAudits: 4,
      openCAPAs: 7,
      pendingApprovals: 2,
      overdueItems: 3,
    });

    mocks.officeApiAccess.ensureOfficeApiPathAccess = () => accessDenied;
    route = loadRoute("src/app/api/quality/qmr/stats/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 403);
  });
});

test("quality qmr tasks routes enforce access, validate payloads, and create audit log entries", async () => {
  await withSuppressedConsole(["error"], async () => {
    const createCalls = [];
    const auditCalls = [];
    const accessDenied = {
      status: 403,
      body: { error: "Forbidden" },
      async json() {
        return this.body;
      },
    };
    const mocks = {
      getServerSession: async () => ({ user: { id: "qmr-2" } }),
      officeApiAccess: {
        ensureOfficeApiPathAccess: () => null,
      },
      prisma: {
        qMRTask: {
          async findMany() {
            return [
              {
                id: "task-1",
                taskType: "AUDIT",
                title: "Review open audit",
                description: "Check findings",
                priority: "HIGH",
                assignedTo: "qmr-2",
                dueDate: new Date("2026-04-10T00:00:00.000Z"),
                status: "PENDING",
              },
            ];
          },
          async create(args) {
            createCalls.push(args);
            return {
              id: "task-2",
              ...args.data,
            };
          },
        },
        auditLog: {
          async create(args) {
            auditCalls.push(args);
          },
        },
      },
    };

    let route = loadRoute("src/app/api/quality/qmr/tasks/route.ts", mocks);
    let response = await route.GET();
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.tasks[0].id, "task-1");

    mocks.officeApiAccess.ensureOfficeApiPathAccess = () => accessDenied;
    route = loadRoute("src/app/api/quality/qmr/tasks/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 403);

    mocks.officeApiAccess.ensureOfficeApiPathAccess = () => null;
    route = loadRoute("src/app/api/quality/qmr/tasks/route.ts", mocks);
    response = await route.POST({
      async json() {
        return { title: "Incomplete" };
      },
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Task type is required");

    route = loadRoute("src/app/api/quality/qmr/tasks/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          taskType: "unknown",
          title: "Bad type",
          description: "desc",
          dueDate: "2026-04-10T00:00:00.000Z",
        };
      },
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Invalid QMR task type");

    route = loadRoute("src/app/api/quality/qmr/tasks/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          taskType: "audit",
          title: " Review overdue CAPA ",
          description: " Follow up with owners ",
          priority: "critical",
          dueDate: "2026-04-10T00:00:00.000Z",
        };
      },
    });
    assert.equal(response.status, 201);
    assert.equal(createCalls.length, 1);
    assert.deepEqual(createCalls[0].data, {
      taskType: "AUDIT",
      title: "Review overdue CAPA",
      description: "Follow up with owners",
      priority: "CRITICAL",
      assignedTo: "qmr-2",
      dueDate: new Date("2026-04-10T00:00:00.000Z"),
      status: "PENDING",
    });
    assert.equal(auditCalls.length, 1);
    assert.equal(auditCalls[0].data.action, "QMR_TASK_CREATED");
    assert.equal(auditCalls[0].data.entityType, "QMRTask");
  });
});
