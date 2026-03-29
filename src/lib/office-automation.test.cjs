const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { registerTsNode, withMockedModuleLoad } = require("./test-harness.cjs");

registerTsNode({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

function loadOfficeAutomation({ prisma, dispatchEscalationNotifications }) {
  const modulePath = path.join(process.cwd(), "src/lib/office-automation.ts");
  delete require.cache[require.resolve(modulePath)];

  return withMockedModuleLoad(
    {
      "@/lib/prisma": { prisma },
      "@/lib/crewing-hardening": require(path.join(process.cwd(), "src/lib/crewing-hardening.ts")),
      "@/lib/data-quality-hardening": require(path.join(process.cwd(), "src/lib/data-quality-hardening.ts")),
      "@/lib/compliance-escalation-notifications": {
        dispatchEscalationNotifications,
      },
    },
    () => require(modulePath)
  );
}

test("office automation snapshot summarizes duplicate and stalled workflow risks", async () => {
  const now = new Date("2026-03-29T00:00:00.000Z");
  const prisma = {
    application: {
      async findMany() {
        return [
          {
            id: "app-1",
            crewId: "crew-1",
            principalId: "pr-1",
            position: "Chief Officer",
            status: "RECEIVED",
            createdAt: new Date("2026-03-20T00:00:00.000Z"),
            crew: { fullName: "Crew One" },
            principal: { name: "Atlas" },
          },
          {
            id: "app-2",
            crewId: "crew-1",
            principalId: "pr-1",
            position: "Chief Officer",
            status: "REVIEWING",
            createdAt: new Date("2026-03-21T00:00:00.000Z"),
            crew: { fullName: "Crew One" },
            principal: { name: "Atlas" },
          },
        ];
      },
    },
    employmentContract: {
      async findMany() {
        return [
          {
            id: "ctr-1",
            crewId: "crew-1",
            contractNumber: "SEA-001",
            contractKind: "SEA",
            status: "ACTIVE",
            contractStart: new Date("2026-03-01T00:00:00.000Z"),
            contractEnd: new Date("2026-06-01T00:00:00.000Z"),
            crew: { fullName: "Crew One" },
          },
          {
            id: "ctr-2",
            crewId: "crew-1",
            contractNumber: "SEA-002",
            contractKind: "SEA",
            status: "DRAFT",
            contractStart: new Date("2026-05-01T00:00:00.000Z"),
            contractEnd: new Date("2026-07-01T00:00:00.000Z"),
            crew: { fullName: "Crew One" },
          },
        ];
      },
    },
    recruitment: {
      async findMany(args) {
        if (args.where?.updatedAt) {
          return [
            {
              id: "rec-stalled",
              status: "SCREENING",
              updatedAt: new Date("2026-03-20T00:00:00.000Z"),
              recruitmentDate: new Date("2026-03-18T00:00:00.000Z"),
              crew: { fullName: "Candidate One", rank: "Cook" },
            },
          ];
        }

        return [
          {
            id: "rec-1",
            status: "APPLICANT",
            updatedAt: new Date("2026-03-28T00:00:00.000Z"),
            recruitmentDate: new Date("2026-03-20T00:00:00.000Z"),
            crew: {
              fullName: "Candidate One",
              rank: "Cook",
              email: "candidate@example.com",
              phone: null,
            },
          },
          {
            id: "rec-2",
            status: "SCREENING",
            updatedAt: new Date("2026-03-27T00:00:00.000Z"),
            recruitmentDate: new Date("2026-03-21T00:00:00.000Z"),
            crew: {
              fullName: "Candidate One",
              rank: "Cook",
              email: "candidate@example.com",
              phone: null,
            },
          },
        ];
      },
    },
    documentControl: {
      async findMany() {
        return [
          {
            id: "doc-1",
            code: "DOC-001",
            title: "SMS Manual",
            documentType: "MANUAL",
            department: "QHSE",
            status: "ACTIVE",
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
          },
          {
            id: "doc-2",
            code: "DOC-002",
            title: "SMS Manual",
            documentType: "MANUAL",
            department: "QHSE",
            status: "DRAFT",
            createdAt: new Date("2026-03-02T00:00:00.000Z"),
          },
        ];
      },
    },
    prepareJoining: {
      async findMany() {
        return [
          {
            id: "pj-1",
            status: "DOCUMENTS",
            updatedAt: new Date("2026-03-21T00:00:00.000Z"),
            crew: { fullName: "Crew One" },
            vessel: { name: "MV Alpha" },
            principal: { name: "Atlas" },
          },
        ];
      },
    },
    escalationNotificationLog: {
      async count() {
        return 2;
      },
    },
  };

  const service = loadOfficeAutomation({
    prisma,
    dispatchEscalationNotifications: async () => ({ results: [] }),
  });

  const snapshot = await service.getOfficeAutomationSnapshot(prisma, now);

  assert.equal(snapshot.summary.duplicateNominationAlerts, 1);
  assert.equal(snapshot.summary.contractOverlapAlerts, 1);
  assert.equal(snapshot.summary.duplicateRecruitmentAlerts, 1);
  assert.equal(snapshot.summary.duplicateControlledDocumentAlerts, 1);
  assert.equal(snapshot.summary.stalledPrepareJoiningAlerts, 1);
  assert.equal(snapshot.summary.stalledRecruitmentAlerts, 1);
  assert.equal(snapshot.summary.failedEscalationNotifications, 2);
  assert.equal(snapshot.summary.totalAlerts, 8);
});

test("office automation runner can skip notification dispatch for dry-run style execution", async () => {
  const service = loadOfficeAutomation({
    prisma: {
      application: { async findMany() { return []; } },
      employmentContract: { async findMany() { return []; } },
      recruitment: { async findMany() { return []; } },
      documentControl: { async findMany() { return []; } },
      prepareJoining: { async findMany() { return []; } },
      escalationNotificationLog: { async count() { return 0; } },
    },
    dispatchEscalationNotifications: async () => {
      throw new Error("should not dispatch");
    },
  });

  const result = await service.runOfficeAutomation({ dispatchNotifications: false });
  assert.equal(result.notificationSummary, null);
  assert.equal(result.summary.totalAlerts, 0);
});
