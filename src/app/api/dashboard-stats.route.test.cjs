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

function loadRoute(mocks) {
  const modulePath = path.join(process.cwd(), "src/app/api/dashboard/stats/route.ts");
  delete require.cache[require.resolve(modulePath)];

  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "next-auth": { getServerSession: mocks.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/permission-middleware": mocks.permissionMiddleware,
      "@/lib/contract-expiry": mocks.contractExpiry,
      "@/lib/dashboard-summary": mocks.dashboardSummary,
      "@/lib/dashboard-transformers": mocks.dashboardTransformers,
      "@/lib/crewing-hardening": mocks.crewingHardening,
      "@/lib/office-automation": mocks.officeAutomation,
    },
    () => require(modulePath)
  );
}

test("dashboard stats route enforces auth, permission, and returns normalized dashboard payload", async () => {
  await withSuppressedConsole(["error"], async () => {
    const mocks = {
      getServerSession: async () => null,
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS" },
        checkPermission: () => true,
      },
      contractExpiry: {
        buildContractExpiryAlert(contract) {
          return {
            daysRemaining: contract.id === "contract-ok" ? 120 : 10,
            band: contract.id === "contract-ok" ? "OK" : "CRITICAL",
            nextAction: "Follow up",
          };
        },
        getContractExpiryBand(daysRemaining) {
          return daysRemaining > 90 ? "OK" : "CRITICAL";
        },
      },
      dashboardSummary: {
        async getDashboardSummaryMetrics() {
          return {
            crewReady: 5,
            crewOnBoard: 7,
            prepareJoiningAlerts: 4,
            pendingApplications: 3,
            totalCrew: 50,
            activeVessels: 9,
            onboardVessels: 6,
            operationalVessels: 8,
          };
        },
      },
      dashboardTransformers: {
        groupCrewDocumentsByCrew() {
          return [
            {
              name: "Crew One",
              crewId: "crew-1",
              documents: [
                { type: "Passport", expiryDate: new Date("2026-04-01T00:00:00.000Z"), daysUntilExpiry: 4 },
              ],
            },
          ];
        },
        groupCrewContractsByCrew() {
          return [
            {
              name: "Crew One",
              crewId: "crew-1",
              contracts: [
                {
                  vesselName: "MV Alpha",
                  principalName: "Atlas",
                  expiryDate: new Date("2026-04-10T00:00:00.000Z"),
                  daysUntilExpiry: 10,
                  band: "CRITICAL",
                  nextAction: "Follow up",
                  assignmentId: "contract-critical",
                },
              ],
            },
          ];
        },
        buildExpiringItems() {
          return [
            {
              seafarer: "Crew One",
              type: "Passport",
              name: "Passport",
              expiryDate: "2026-04-01T00:00:00.000Z",
              daysLeft: 4,
            },
          ];
        },
        buildContractExpiryItems() {
          return [
            {
              seafarer: "Crew One",
              crewId: "crew-1",
              vessel: "MV Alpha",
              principal: "Atlas",
              expiryDate: "2026-04-10T00:00:00.000Z",
              daysLeft: 10,
              band: "CRITICAL",
              nextAction: "Follow up",
              link: "/crewing/crew-list",
            },
          ];
        },
        buildCrewMovementItems() {
          return [
            {
              seafarer: "Crew One",
              rank: "Master",
              principal: "Atlas",
              vessel: "MV Alpha",
              status: "ONBOARD",
              nextAction: "Onboard",
            },
          ];
        },
      },
      crewingHardening: {
        ACTIVE_APPLICATION_STATUSES: ["RECEIVED", "REVIEWING"],
        detectDuplicateApplicationGroups() {
          return [];
        },
      },
      officeAutomation: {
        async getOfficeAutomationSnapshot() {
          return {
            summary: {
              failedEscalationNotifications: 0,
              stalledPrepareJoiningAlerts: 0,
              stalledRecruitmentAlerts: 0,
            },
            stalledPrepareJoiningItems: [],
            stalledRecruitmentItems: [],
          };
        },
      },
      prisma: {
        crewDocument: {
          async count(args) {
            if (args.where.expiryDate.lte && !args.where.expiryDate.gt) {
              return 2;
            }
            return 6;
          },
          async findMany() {
            return [
              {
                docType: "Passport",
                expiryDate: new Date("2026-04-01T00:00:00.000Z"),
                crew: { id: "crew-1", fullName: "Crew One" },
              },
            ];
          },
        },
        employmentContract: {
          async findMany(args) {
            if (args.include) {
              return [
                {
                  id: "contract-critical",
                  contractNumber: "C-1",
                  contractEnd: new Date("2026-04-10T00:00:00.000Z"),
                  status: "ACTIVE",
                  crew: { id: "crew-1", fullName: "Crew One" },
                  crewId: "crew-1",
                  vesselId: "v-1",
                  vessel: { name: "MV Alpha" },
                  principal: { name: "Atlas" },
                },
              ];
            }

            return [
              {
                id: "contract-critical",
                crewId: "crew-1",
                vesselId: "v-1",
                contractNumber: "C-1",
                contractEnd: new Date("2026-04-10T00:00:00.000Z"),
                status: "ACTIVE",
              },
              {
                id: "contract-ok",
                crewId: "crew-2",
                vesselId: "v-2",
                contractNumber: "C-2",
                contractEnd: new Date("2026-08-10T00:00:00.000Z"),
                status: "ACTIVE",
              },
            ];
          },
        },
        application: {
          async findMany() {
            return [
              {
                id: "app-1",
                createdAt: new Date("2026-03-25T00:00:00.000Z"),
                crew: { fullName: "Crew One" },
              },
            ];
          },
        },
        auditSchedule: {
          async findMany() {
            return [
              {
                id: "audit-1",
                title: "Internal Audit",
                auditType: "ISM",
                startDate: new Date("2026-03-29T00:00:00.000Z"),
                status: "SCHEDULED",
              },
            ];
          },
        },
        prepareJoining: {
          async findMany() {
            return [];
          },
        },
        assignment: {
          async findMany() {
            return [
              {
                id: "assignment-1",
                status: "ONBOARD",
                startDate: new Date("2026-03-24T00:00:00.000Z"),
                crew: { fullName: "Crew One", rank: "Master" },
                vessel: { name: "MV Alpha", principal: { name: "Atlas" } },
                principal: { name: "Atlas" },
              },
            ];
          },
        },
      },
    };

    let route = loadRoute(mocks);
    let response = await route.GET();
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-1" } });
    mocks.permissionMiddleware.checkPermission = () => false;
    route = loadRoute(mocks);
    response = await route.GET();
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute(mocks);
    response = await route.GET();
    assert.equal(response.status, 200);
    assert.equal(response.body.totalCrew, 50);
    assert.equal(response.body.activeVessels, 9);
    assert.equal(response.body.operationalVessels, 8);
    assert.equal(response.body.pendingApplications, 3);
    assert.equal(response.body.expiringDocuments, 6);
    assert.equal(response.body.expiredDocuments, 2);
    assert.equal(response.body.crewReady, 5);
    assert.equal(response.body.crewOnboard, 7);
    assert.equal(response.body.contractsExpiringSoon, 1);
    assert.equal(response.body.contractsExpiring45Days, 1);
    assert.equal(response.body.contractsExpiring30Days, 1);
    assert.equal(response.body.contractsExpiring14Days, 1);
    assert.equal(response.body.prepareJoiningAlerts, 4);
    assert.equal(response.body.stalledPrepareJoiningAlerts, 0);
    assert.equal(response.body.stalledRecruitmentAlerts, 0);
    assert.equal(response.body.readinessAlerts, 7);
    assert.equal(response.body.urgentCrewCases, 6);
    assert.deepEqual(response.body.contractExpiryAlerts, [
      {
        seafarer: "Crew One",
        crewId: "crew-1",
        vessel: "MV Alpha",
        principal: "Atlas",
        expiryDate: "2026-04-10T00:00:00.000Z",
        daysLeft: 10,
        band: "CRITICAL",
        nextAction: "Follow up",
        link: "/crewing/crew-list",
      },
    ]);
    assert.deepEqual(response.body.expiringItems, [
      {
        seafarer: "Crew One",
        type: "Passport",
        name: "Passport",
        expiryDate: "2026-04-01T00:00:00.000Z",
        daysLeft: 4,
      },
    ]);
    assert.deepEqual(response.body.crewMovement, [
      {
        seafarer: "Crew One",
        rank: "Master",
        principal: "Atlas",
        vessel: "MV Alpha",
        status: "ONBOARD",
        nextAction: "Onboard",
      },
    ]);
    assert.equal(response.body.pendingTasks.length, 3);
    assert.deepEqual(
      response.body.pendingTasks.map((task) => task.type),
      ["Application Review", "Audit Scheduled", "Contract Review"]
    );
    assert.equal(response.body.recentActivity.length > 0, true);
  });
});
