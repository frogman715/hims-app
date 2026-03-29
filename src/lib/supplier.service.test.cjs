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

function loadSupplierService(prisma) {
  const modulePath = path.join(process.cwd(), "src/lib/supplier/service.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "@/lib/prisma": { prisma },
    },
    () => require(modulePath)
  );
}

test("supplier service computes compliance summary and PO totals consistently", async () => {
  const createCalls = [];
  const prisma = {
    supplierCompliance: {
      findMany: async () => [
        { status: "COMPLIANT" },
        { status: "COMPLIANT" },
        { status: "NON_COMPLIANT" },
        { status: "PENDING" },
      ],
    },
    supplierPurchaseOrder: {
      create: async (args) => {
        createCalls.push(args);
        return { id: "po-1", ...args.data };
      },
    },
  };

  const service = loadSupplierService(prisma);
  const summary = await service.getSupplierComplianceSummary("supplier-1");
  const po = await service.createPurchaseOrder({
    poNumber: "PO-001",
    supplierId: "supplier-1",
    description: "Safety helmets",
    quantity: 4,
    unit: "pcs",
    unitPrice: 25,
    dueDate: new Date("2026-04-01T00:00:00.000Z"),
    createdById: "user-1",
  });

  assert.deepEqual(summary, {
    total: 4,
    compliant: 2,
    nonCompliant: 1,
    pending: 1,
    complianceRate: 50,
  });
  assert.equal(po.totalAmount, 100);
  assert.equal(createCalls[0].data.status, "DRAFT");
});

test("supplier performance ranking scores and sorts approved suppliers", async () => {
  const prisma = {
    supplier: {
      findMany: async (args) => {
        assert.equal(args.where.status, "APPROVED");
        assert.equal(args.take, 10);
        return [
          {
            id: "supplier-b",
            name: "Beta",
            assessmentScore: 70,
            audits: [{ status: "PASSED" }, { status: "FAILED" }],
            compliance: [{ status: "COMPLIANT" }, { status: "NON_COMPLIANT" }],
            purchaseOrders: Array.from({ length: 3 }, (_, i) => ({ id: `po-${i}` })),
          },
          {
            id: "supplier-a",
            name: "Alpha",
            assessmentScore: 85,
            audits: [{ status: "PASSED" }, { status: "PASSED" }],
            compliance: [{ status: "COMPLIANT" }, { status: "COMPLIANT" }],
            purchaseOrders: Array.from({ length: 5 }, (_, i) => ({ id: `po2-${i}` })),
          },
        ];
      },
    },
  };

  const service = loadSupplierService(prisma);
  const ranking = await service.getSupplierPerformanceRanking();

  assert.equal(ranking[0].supplierId, "supplier-a");
  assert.equal(ranking[0].score, 90);
  assert.equal(ranking[1].supplierId, "supplier-b");
  assert.equal(ranking[1].score, 46);
});
