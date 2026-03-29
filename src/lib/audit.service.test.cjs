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

function loadAuditService(prisma) {
  const modulePath = path.join(process.cwd(), "src/lib/audit/service.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "@/lib/prisma": { prisma },
    },
    () => require(modulePath)
  );
}

test("audit service applies defaults and expected status transitions", async () => {
  const calls = [];
  const prisma = {
    complianceAudit: {
      create: async (args) => {
        calls.push(["create", args]);
        return { id: "audit-1", ...args.data };
      },
      update: async (args) => {
        calls.push(["update", args]);
        return { id: args.where.id, ...args.data };
      },
      findUnique: async (args) => {
        calls.push(["findUnique", args]);
        return { id: args.where.id };
      },
    },
  };

  const service = loadAuditService(prisma);
  const created = await service.createAudit({
    auditNumber: "AUD-001",
    auditType: "INTERNAL",
    leadAuditorId: "user-1",
  });
  assert.equal(created.status, "PLANNED");
  assert.equal(created.scope, "");
  assert.equal(created.estimatedDuration, 0);

  const started = await service.startAudit("audit-1");
  const completed = await service.completeAudit("audit-1");
  const closed = await service.closeAudit("audit-1");
  await service.getAuditWithDetails("audit-1");

  assert.equal(started.status, "IN_PROGRESS");
  assert.equal(completed.status, "COMPLETED");
  assert.equal(closed.status, "CANCELLED");
  assert.equal(calls[0][1].data.auditNumber, "AUD-001");
  assert.equal(calls.some(([kind]) => kind === "findUnique"), true);
});

test("listAudits builds query shape correctly for filtered and unfiltered reads", async () => {
  const calls = [];
  const prisma = {
    complianceAudit: {
      findMany: async (args) => {
        calls.push(args);
        return [];
      },
    },
  };

  const service = loadAuditService(prisma);
  await service.listAudits();
  await service.listAudits({ status: "PLANNED", auditType: "EXTERNAL", limit: 5, offset: 10 });

  assert.deepEqual(calls[0], {
    take: 20,
    skip: 0,
    orderBy: { auditDate: "desc" },
  });
  assert.deepEqual(calls[1], {
    where: { status: "PLANNED", auditType: "EXTERNAL" },
    take: 5,
    skip: 10,
    orderBy: { auditDate: "desc" },
  });
});
