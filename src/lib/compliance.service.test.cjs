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

function loadComplianceService(prisma) {
  const modulePath = path.join(process.cwd(), "src/lib/compliance/service.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "@/lib/prisma": { prisma },
    },
    () => require(modulePath)
  );
}

test("compliance service builds overdue filters and aggregates HR stats", async () => {
  const calls = [];
  const prisma = {
    complianceGap: {
      findMany: async (args) => {
        calls.push(args);
        return [];
      },
      count: async () => 0,
    },
    user: { count: async () => 12 },
    employeeTraining: {
      count: async ({ where } = {}) => {
        if (!where) return 0;
        if (where.status === "COMPLETED") return 7;
        if (where.status?.in) return where.training ? 2 : 3;
        return 0;
      },
      findMany: async () => [],
    },
    certification: {
      count: async ({ where } = {}) => {
        if (where?.status === "ACTIVE" && where?.expiryDate) return 4;
        if (where?.status === "ACTIVE") return 9;
        if (where?.expiryDate) return 1;
        return 0;
      },
      findMany: async () => [],
    },
  };

  const service = loadComplianceService(prisma);
  await service.listOpenComplianceGaps({ gapType: "TRAINING", assignedToId: "user-1", overdueOnly: true });
  const stats = await service.getHRComplianceStats();

  assert.equal(calls[0].where.resolvedDate, null);
  assert.equal(calls[0].where.gapType, "TRAINING");
  assert.equal(calls[0].where.assignedToId, "user-1");
  assert.equal(typeof calls[0].where.dueDate.lt, "object");
  assert.deepEqual(stats, {
    employees: 12,
    trainings: { completed: 7, pending: 3, overdue: 2 },
    certifications: { active: 9, expiring: 4, expired: 1 },
    complianceGaps: { total: 0, open: 0, overdue: 0 },
  });
});

test("employee compliance summary derives completion, expiry, and score correctly", async () => {
  const now = new Date("2026-03-28T00:00:00.000Z");
  const RealDate = Date;
  global.Date = class FakeDate extends RealDate {
    constructor(value) {
      super(arguments.length === 0 ? now : value);
    }
    static now() {
      return now.getTime();
    }
    static parse(value) {
      return RealDate.parse(value);
    }
    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  };

  try {
    const prisma = {
      employeeTraining: {
        findMany: async () => [
          { status: "COMPLETED", training: {} },
          { status: "IN_PROGRESS", training: {} },
          { status: "COMPLETED", training: {} },
        ],
      },
      certification: {
        findMany: async () => [
          { status: "ACTIVE" },
          { status: "EXPIRING" },
          { status: "EXPIRED" },
        ],
      },
      complianceGap: {
        findMany: async () => [
          { resolvedDate: null, dueDate: new Date("2026-03-20T00:00:00.000Z") },
          { resolvedDate: null, dueDate: new Date("2026-04-20T00:00:00.000Z") },
          { resolvedDate: new Date("2026-03-10T00:00:00.000Z"), dueDate: new Date("2026-03-01T00:00:00.000Z") },
        ],
      },
    };

    const service = loadComplianceService(prisma);
    const summary = await service.getEmployeeComplianceSummary("user-1");

    assert.deepEqual(summary, {
      totalTrainings: 3,
      completedTrainings: 2,
      completionRate: 66.66666666666666,
      certifications: {
        total: 3,
        activeOrExpiring: 2,
        expired: 1,
      },
      complianceGaps: {
        total: 3,
        open: 2,
        overdue: 1,
      },
      complianceScore: 67,
    });
  } finally {
    global.Date = RealDate;
  }
});
