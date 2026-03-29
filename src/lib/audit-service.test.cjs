const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

function loadAuditBusinessService(prisma) {
  const modulePath = path.join(process.cwd(), "src/lib/audit-service.ts");
  delete require.cache[require.resolve(modulePath)];

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "./prisma") {
      return { prisma };
    }
    if (request === "./error-handler") {
      const actual = require(path.join(process.cwd(), "src/lib/error-handler.ts"));
      return { ApiError: actual.ApiError };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(modulePath);
  } finally {
    Module._load = originalLoad;
  }
}

test("audit business service generates numbers and aggregates metrics correctly", async () => {
  const RealDate = Date;
  global.Date = class FakeDate extends RealDate {
    constructor(value) {
      super(arguments.length === 0 ? "2026-03-28T00:00:00.000Z" : value);
    }
    static now() {
      return new RealDate("2026-03-28T00:00:00.000Z").getTime();
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
      auditSchedule: {
        findUnique: async ({ where }) => ({ id: where.id }),
        findMany: async () => [
          {
            status: "SCHEDULED",
            auditType: "INTERNAL_QMS",
            findings: [{ severity: "OBSERVATION" }, { severity: "MINOR_NC" }],
            report: { status: "APPROVED" },
          },
          {
            status: "COMPLETED",
            auditType: "SPECIAL",
            findings: [{ severity: "MAJOR_NC" }],
            report: null,
          },
        ],
      },
      auditFinding: {
        findMany: async () => [{ findingNumber: "AUD-2026-009" }],
      },
      auditReport: {
        findMany: async () => [{ reportNumber: "AUD-RPT-2026-004" }],
      },
    };

    const service = loadAuditBusinessService(prisma);
    const findingNumber = await service.generateFindingNumber("schedule-1");
    const reportNumber = await service.generateReportNumber();
    const metrics = await service.getAuditMetrics();

    assert.equal(findingNumber, "AUD-2026-010");
    assert.equal(reportNumber, "AUD-RPT-2026-005");
    assert.deepEqual(metrics, {
      total: 2,
      byStatus: {
        SCHEDULED: 1,
        IN_PROGRESS: 0,
        COMPLETED: 1,
        CANCELLED: 0,
      },
      byType: {
        INTERNAL_QMS: 1,
        EXTERNAL_CERTIFICATION: 0,
        SURVEILLANCE: 0,
        SPECIAL: 1,
      },
      findings: {
        total: 3,
        observations: 1,
        minorNC: 1,
        majorNC: 1,
      },
      reportsGenerated: 1,
    });
  } finally {
    global.Date = RealDate;
  }
});
