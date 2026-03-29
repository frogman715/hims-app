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

function loadRiskService(prisma) {
  const modulePath = path.join(process.cwd(), "src/lib/risk-service.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "./prisma": { prisma },
      "./error-handler": () => {
        const actual = require(path.join(process.cwd(), "src/lib/error-handler.ts"));
        return { ApiError: actual.ApiError };
      },
      "@prisma/client": { Prisma: {}, $Enums: {} },
    },
    () => require(modulePath)
  );
}

test("risk service calculates scores and writes audit trail for create/update/action/review", async () => {
  const auditCalls = [];
  const prisma = {
    risk: {
      create: async (args) => ({ id: "risk-1", ...args.data }),
      findUnique: async ({ where }) => {
        if (where.id === "missing") return null;
        return {
          id: where.id,
          probability: 2,
          impact: 3,
        };
      },
      update: async (args) => ({ id: args.where.id, ...args.data }),
      findMany: async () => [
        { status: "ACTIVE", riskScore: 16, source: "REGULATORY" },
        { status: "MITIGATED", riskScore: 10, source: "OPERATIONAL" },
        { status: "CLOSED", riskScore: 4, source: "FINANCIAL" },
      ],
    },
    riskAuditLog: {
      create: async (args) => {
        auditCalls.push(args);
        return { id: `audit-${auditCalls.length}` };
      },
    },
    riskAction: {
      create: async (args) => ({ id: "action-1", ...args.data }),
    },
    riskReview: {
      create: async (args) => ({ id: "review-1", ...args.data }),
    },
  };

  const service = loadRiskService(prisma);

  assert.equal(service.calculateRiskScore(4, 5), 20);

  const created = await service.createRisk({
    title: "Port congestion",
    description: "Operational delay risk",
    source: "OPERATIONAL",
    probability: 4,
    impact: 5,
    treatmentStrategy: "MITIGATE",
    treatmentPlan: "Add alternate port plan",
    createdById: "user-1",
  });
  const updated = await service.updateRisk("risk-1", { probability: 5, impact: 4 }, "user-2");
  const action = await service.addRiskAction(
    "risk-1",
    { description: "Weekly review", dueDate: new Date("2026-04-10T00:00:00.000Z") },
    "user-2"
  );
  const review = await service.createRiskReview(
    "risk-1",
    { newProbability: 2, newImpact: 2, effectiveness: 80, notes: "Improved" },
    "user-3"
  );
  const metrics = await service.getRiskMetrics();

  assert.equal(created.riskScore, 20);
  assert.equal(updated.riskScore, 20);
  assert.equal(action.owner, "user-2");
  assert.equal(review.newRiskScore, 4);
  assert.equal(auditCalls.length, 4);
  assert.deepEqual(metrics, {
    total: 3,
    byStatus: {
      ACTIVE: 1,
      MITIGATED: 1,
      TRANSFERRED: 0,
      ACCEPTED: 0,
      CLOSED: 1,
    },
    bySource: {
      REGULATORY: 1,
      OPERATIONAL: 1,
      STRATEGIC: 0,
      FINANCIAL: 1,
      ENVIRONMENTAL: 0,
    },
    averageScore: 10,
    highRisks: 1,
    mediumRisks: 1,
    lowRisks: 1,
  });
});

test("risk service throws not found when updating a missing risk", async () => {
  const prisma = {
    risk: {
      findUnique: async () => null,
    },
  };
  const service = loadRiskService(prisma);
  await assert.rejects(() => service.updateRisk("missing", { status: "CLOSED" }, "user-1"), /Risk not found/);
});
