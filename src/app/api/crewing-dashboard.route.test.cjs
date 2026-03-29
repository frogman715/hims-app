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
      "@/lib/office-api-access": mocks.officeApiAccess ?? {},
      "@/lib/error-handler": mocks.errorHandler ?? {},
      "@/lib/crewing-overview-summary": mocks.crewingOverviewSummary ?? {},
      "@/lib/application-flow-state": mocks.applicationFlowState ?? {},
    },
    () => require(modulePath)
  );
}

test("crewing overview route enforces office access and normalizes summary payload", async () => {
  await withSuppressedConsole(["error"], async () => {
    const accessDenied = {
      status: 403,
      body: { error: "Forbidden" },
      async json() {
        return this.body;
      },
    };
    const mocks = {
      getServerSession: async () => ({ user: { id: "user-1" } }),
      officeApiAccess: {
        ensureOfficeApiPathAccess: () => null,
      },
      crewingOverviewSummary: {
        async getCrewingOverviewSummaryMetrics(_prisma, now) {
          assert.ok(now instanceof Date);
          return {
            activeSeafarers: 120,
            principalCount: 8,
            vesselCount: 15,
            activeAssignments: 44,
            plannedAssignments: 12,
            pendingApplications: 9,
            applicationInProgress: 6,
            scheduledInterviews: 3,
            prepareJoiningInProgress: 5,
            crewReplacementPending: 2,
            documentsExpiringSoon: 11,
            compliantDocuments: 90,
            totalDocuments: 100,
            documentReceiptsTotal: 18,
            trainingInProgress: 7,
            signOffThisMonth: 4,
            externalComplianceActive: 5,
          };
        },
      },
      prisma: {
        activityLog: {
          async findMany() {
            return [
              {
                id: "act-1",
                action: "CREW_UPDATED",
                entityType: "Crew",
                entityId: "crew-1",
                createdAt: new Date("2026-03-28T00:00:00.000Z"),
                user: { name: "Ops Admin" },
              },
              {
                id: "act-2",
                action: "SYNC",
                entityType: "System",
                entityId: "sys-1",
                createdAt: new Date("2026-03-28T01:00:00.000Z"),
                user: null,
              },
            ];
          },
        },
      },
    };

    let route = loadRoute("src/app/api/crewing/overview/route.ts", mocks);
    let response = await route.GET();
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.stats, {
      activeSeafarers: 120,
      principalCount: 8,
      vesselCount: 15,
      activeAssignments: 44,
      plannedAssignments: 12,
      pendingApplications: 9,
      applicationInProgress: 6,
      scheduledInterviews: 3,
      prepareJoiningInProgress: 5,
      crewReplacementPending: 2,
      documentsExpiringSoon: 11,
      complianceRate: 90,
      documentReceiptsTotal: 18,
      trainingInProgress: 7,
      signOffThisMonth: 4,
      externalComplianceActive: 5,
    });
    assert.deepEqual(response.body.recentActivities, [
      {
        id: "act-1",
        userName: "Ops Admin",
        action: "CREW_UPDATED",
        entityType: "Crew",
        entityId: "crew-1",
        createdAt: "2026-03-28T00:00:00.000Z",
      },
      {
        id: "act-2",
        userName: "System",
        action: "SYNC",
        entityType: "System",
        entityId: "sys-1",
        createdAt: "2026-03-28T01:00:00.000Z",
      },
    ]);

    mocks.officeApiAccess.ensureOfficeApiPathAccess = () => accessDenied;
    route = loadRoute("src/app/api/crewing/overview/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 403);
  });
});

test("crewing workflow stats route enforces access and aggregates stage counters", async () => {
  const accessDenied = {
    status: 403,
    body: { error: "Forbidden" },
    async json() {
      return this.body;
    },
  };
  const stageByStatus = {
    RECEIVED: "DRAFT",
    REVIEWING: "DOCUMENT_CHECK",
    PASSED: "CV_READY",
    OFFERED: "SENT_TO_OWNER",
    ACCEPTED: "OWNER_APPROVED",
  };
  const mocks = {
    getServerSession: async () => ({ user: { id: "user-2" } }),
    officeApiAccess: {
      ensureOfficeApiPathAccess: () => null,
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
    applicationFlowState: {
      resolveHgiApplicationStage({ status, hasPrepareJoining }) {
        return hasPrepareJoining ? "DIRECTOR_APPROVED" : stageByStatus[status] ?? "DRAFT";
      },
    },
    prisma: {
      application: {
        async findMany() {
          return [
            { id: "a1", crewId: "crew-1", status: "RECEIVED", attachments: "{}" },
            { id: "a2", crewId: "crew-2", status: "REVIEWING", attachments: "{}" },
            { id: "a3", crewId: "crew-3", status: "PASSED", attachments: "{}" },
            { id: "a4", crewId: "crew-4", status: "OFFERED", attachments: "{}" },
            { id: "a5", crewId: "crew-5", status: "ACCEPTED", attachments: "{}" },
            { id: "a6", crewId: "crew-6", status: "RECEIVED", attachments: "{}" },
          ];
        },
      },
      prepareJoining: {
        async findMany() {
          return [
            { crewId: "crew-6", status: "PENDING" },
            { crewId: "crew-7", status: "TRAINING" },
            { crewId: "crew-8", status: "READY" },
            { crewId: "crew-9", status: "DISPATCHED" },
          ];
        },
        async count(args) {
          if (args.where.status === "READY") {
            return 1;
          }
          if (args.where.status === "DISPATCHED") {
            return 1;
          }
          return 0;
        },
      },
    },
  };

  let route = loadRoute("src/app/api/crewing/workflow/stats/route.ts", mocks);
  let response = await route.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    draft: 1,
    documentCheck: 1,
    cvReady: 1,
    submittedToDirector: 0,
    directorApproved: 1,
    sentToOwner: 1,
    ownerApproved: 1,
    ownerRejected: 0,
    preJoining: 2,
    readyToOnboard: 1,
    onboarded: 1,
    total: 10,
  });

  mocks.officeApiAccess.ensureOfficeApiPathAccess = () => accessDenied;
  route = loadRoute("src/app/api/crewing/workflow/stats/route.ts", mocks);
  response = await route.GET();
  assert.equal(response.status, 403);
});
