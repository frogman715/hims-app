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
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/api-middleware": mocks.apiMiddleware ?? {},
      "@/lib/permission-middleware": mocks.permissionMiddleware ?? {},
      "@/lib/error-handler": mocks.errorHandler ?? {},
      "@/lib/email/email-service": mocks.emailService ?? {},
      "@/lib/email/email-config": mocks.emailConfig ?? {},
      "@/lib/email-helpers": mocks.emailHelpers ?? {},
    },
    () => require(modulePath)
  );
}

test("crewing reports summary route returns aggregated funnel, compliance, and activity payload", async () => {
  const mocks = {
    apiMiddleware: {
      withPermission(_module, _level, handler) {
        return async () => handler();
      },
    },
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS" },
    },
    prisma: {
      application: {
        async count() {
          return 11;
        },
        async groupBy() {
          return [
            { status: "RECEIVED", _count: { status: 3 } },
            { status: "INTERVIEW", _count: { status: 2 } },
            { status: "ACCEPTED", _count: { status: 1 } },
          ];
        },
        async findMany() {
          return [
            {
              id: "app-1",
              createdAt: new Date("2026-03-27T00:00:00.000Z"),
              crew: { fullName: "Crew One" },
            },
          ];
        },
      },
      interview: {
        async count() {
          return 4;
        },
      },
      prepareJoining: {
        async count(args) {
          if (args?.where?.status === "READY") {
            return 5;
          }
          return 0;
        },
        async groupBy() {
          return [
            { status: "PENDING", _count: { status: 2 } },
            { status: "READY", _count: { status: 5 } },
          ];
        },
      },
      assignment: {
        async count() {
          return 8;
        },
        async findMany(args) {
          if (args?.select) {
            return [
              {
                principal: { id: "pr-1", name: "Atlas" },
              },
              {
                principal: { id: "pr-1", name: "Atlas" },
              },
              {
                principal: { id: "pr-2", name: "Oceanic" },
              },
            ];
          }

          if (args?.include) {
            return [
              {
                id: "asg-1",
                startDate: new Date("2026-03-29T00:00:00.000Z"),
                status: "PLANNED",
                crew: { fullName: "Crew One", rank: "Master" },
                vessel: { name: "MV Alpha", type: "Bulk", principal: { name: "Atlas" } },
                principal: { name: "Atlas" },
              },
            ];
          }
          return [];
        },
      },
      crewDocument: {
        async count(args) {
          if (args?.where?.expiryDate?.lt) {
            return 2;
          }
          if (args?.where?.expiryDate?.gte) {
            return 6;
          }
          return 10;
        },
      },
      activityLog: {
        async findMany() {
          return [
            {
              id: "act-1",
              action: "CREW_CREATED",
              entityType: "Crew",
              entityId: "crew-1",
              createdAt: new Date("2026-03-28T00:00:00.000Z"),
              user: { name: "Ops" },
            },
          ];
        },
      },
      auditSchedule: {
        async findMany() {
          return [
            {
              id: "audit-1",
              title: "ISM Audit",
              auditType: "ISM",
              startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              status: "SCHEDULED",
            },
          ];
        },
      },
    },
  };

  const route = loadRoute("src/app/api/crewing/reports/summary/route.ts", mocks);
  const response = await route.GET();

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.stats, {
    totalApplications: 11,
    interviewsScheduled: 4,
    crewReady: 5,
    documentsExpiringSoon: 6,
    activeAssignments: 8,
  });
  assert.equal(response.body.applicationFunnel[0].status, "RECEIVED");
  assert.equal(response.body.applicationFunnel[0].count, 3);
  assert.equal(response.body.applicationFunnel[0].percentage, 50);
  assert.deepEqual(response.body.prepareJoining[0], {
    status: "PENDING",
    label: "Pending",
    count: 2,
  });
  assert.deepEqual(response.body.documentCompliance, {
    total: 10,
    compliant: 8,
    expired: 2,
    expiringSoon: 6,
    complianceRate: 80,
  });
  assert.equal(response.body.upcomingAssignments[0].crewName, "Crew One");
  assert.equal(response.body.principalDistribution[0].principalName, "Atlas");
  assert.equal(response.body.recentActivities[0].userName, "Ops");
});

test("crewing documents expiring route categorizes urgency buckets and returns summary", async () => {
  const now = Date.now();
  const mocks = {
    apiMiddleware: {
      withPermission(_module, _level, handler) {
        return async (req) => handler(req);
      },
    },
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS" },
    },
    errorHandler: {
      handleApiError(error) {
        return {
          status: 500,
          body: { error: error.message },
          async json() {
            return this.body;
          },
        };
      },
    },
    prisma: {
      crewDocument: {
        async findMany() {
          return [
            { id: "d1", expiryDate: new Date(now - 24 * 60 * 60 * 1000), crew: { id: "c1", fullName: "Crew 1" } },
            { id: "d2", expiryDate: new Date(now + 10 * 24 * 60 * 60 * 1000), crew: { id: "c2", fullName: "Crew 2" } },
            { id: "d3", expiryDate: new Date(now + 60 * 24 * 60 * 60 * 1000), crew: { id: "c3", fullName: "Crew 3" } },
            { id: "d4", expiryDate: new Date(now + 120 * 24 * 60 * 60 * 1000), crew: { id: "c4", fullName: "Crew 4" } },
            { id: "d5", expiryDate: new Date(now + 220 * 24 * 60 * 60 * 1000), crew: { id: "c5", fullName: "Crew 5" } },
          ];
        },
      },
    },
  };

  const route = loadRoute("src/app/api/crewing/documents/expiring/route.ts", mocks);
  const response = await route.GET({ url: "https://example.com/api/crewing/documents/expiring?months=14" });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 5);
  assert.deepEqual(response.body.summary, {
    total: 5,
    expired: 1,
    critical: 1,
    warning: 1,
    notice: 1,
    monitor: 1,
  });
  assert.equal(response.body.categorized.expired[0].id, "d1");
  assert.equal(response.body.categorized.critical[0].id, "d2");
  assert.equal(response.body.categorized.warning[0].id, "d3");
  assert.equal(response.body.categorized.notice[0].id, "d4");
  assert.equal(response.body.categorized.monitor[0].id, "d5");
});

test("crewing documents remind route validates input and summarizes sent and failed reminders", async () => {
  const sentMessages = [];
  const auditCalls = [];
  class MockEmailService {
    constructor(config) {
      this.config = config;
    }

    async send(payload) {
      sentMessages.push(payload);
      if (payload.to === "fail@example.com") {
        return { success: false, error: "SMTP rejected" };
      }
      return { success: true, messageId: `msg-${sentMessages.length}` };
    }
  }

  const mocks = {
    apiMiddleware: {
      withPermission(_module, _level, handler) {
        return async (req) => handler(req);
      },
    },
    permissionMiddleware: {
      PermissionLevel: { EDIT_ACCESS: "EDIT_ACCESS" },
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
    emailService: { EmailService: MockEmailService },
    emailConfig: {
      getEmailConfig() {
        return { host: "smtp.example.com" };
      },
    },
    emailHelpers: {
      documentExpiryReminderTemplate({ crewName, documentType }) {
        return {
          subject: `Reminder: ${documentType} for ${crewName}`,
          html: `<p>${crewName}</p>`,
        };
      },
    },
    prisma: {
      crewDocument: {
        async findMany() {
          return [
            {
              id: "doc-1",
              docType: "Passport",
              expiryDate: new Date("2026-04-10T00:00:00.000Z"),
              crew: { id: "crew-1", fullName: "Crew One", email: "crew1@example.com", phone: "123" },
            },
            {
              id: "doc-2",
              docType: "Seaman Book",
              expiryDate: new Date("2026-04-12T00:00:00.000Z"),
              crew: { id: "crew-2", fullName: "Crew Two", email: null, phone: "456" },
            },
            {
              id: "doc-3",
              docType: "Medical",
              expiryDate: new Date("2026-04-14T00:00:00.000Z"),
              crew: { id: "crew-3", fullName: "Crew Three", email: "fail@example.com", phone: "789" },
            },
          ];
        },
      },
      auditLog: {
        async create(args) {
          auditCalls.push(args);
        },
      },
    },
  };

  let route = loadRoute("src/app/api/crewing/documents/remind/route.ts", mocks);
  let response = await route.POST({ async json() { return {}; } });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");

  route = loadRoute("src/app/api/crewing/documents/remind/route.ts", mocks);
  response = await route.POST({
    async json() {
      return { documentIds: ["doc-1", "doc-2", "doc-3"] };
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.summary.total, 3);
  assert.equal(response.body.summary.sent, 1);
  assert.equal(response.body.summary.failed, 2);
  assert.equal(response.body.reminders[0].documentId, "doc-1");
  assert.equal(response.body.errors.length, 2);
  assert.equal(sentMessages.length, 2);
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].data.action, "DOCUMENT_REMINDER_SENT");
});
