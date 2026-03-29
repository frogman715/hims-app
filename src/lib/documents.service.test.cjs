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

function loadDocumentsService({ prisma, hasDocumentPermission = () => true }) {
  const modulePath = path.join(process.cwd(), "src/lib/documents/service.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "@/lib/prisma": { prisma },
      "@/lib/data-quality-hardening": {
        ACTIVE_DOCUMENT_CONTROL_STATUSES: ["DRAFT", "FOR_APPROVAL", "APPROVED", "ACTIVE"],
        buildDocumentRegistryConflictKey({ title, documentType, department }) {
          return [title, documentType, department].join("::").toUpperCase();
        },
      },
      "./permissions": { hasDocumentPermission },
    },
    () => require(modulePath)
  );
}

test("documents service creates document and initial revision, and blocks duplicate codes", async () => {
  const calls = [];
  const prisma = {
    documentControl: {
      findUnique: async (args) => {
        calls.push(["findUnique", args]);
        return null;
      },
      findMany: async () => [],
      create: async (args) => {
        calls.push(["create", args]);
        return { id: "doc-1", ...args.data };
      },
    },
    documentRevision: {
      create: async (args) => {
        calls.push(["revisionCreate", args]);
        return { id: "rev-1", ...args.data };
      },
    },
  };

  const service = loadDocumentsService({ prisma });
  const created = await service.createDocument({
    code: "DOC-001",
    title: "SMS Manual",
    documentType: "MANUAL",
    department: "QHSE",
    retentionPeriod: "THREE_YEARS",
    effectiveDate: new Date("2026-03-28T00:00:00.000Z"),
    createdById: "user-1",
    contentUrl: "/files/doc-001.pdf",
    fileName: "doc-001.pdf",
    fileSize: 1234,
  });

  assert.equal(created.status, "DRAFT");
  assert.equal(calls[1][1].data.code, "DOC-001");
  assert.deepEqual(calls[2][1].data, {
    documentId: "doc-1",
    revisionNumber: 0,
    changesSummary: "Initial creation",
    revisionUrl: "/files/doc-001.pdf",
    fileName: "doc-001.pdf",
    createdById: "user-1",
  });

  const dupService = loadDocumentsService({
    prisma: {
      documentControl: {
        findUnique: async () => ({ id: "doc-existing" }),
        findMany: async () => [],
      },
      documentRevision: prisma.documentRevision,
    },
  });

  await assert.rejects(
    () =>
      dupService.createDocument({
        code: "DOC-001",
        title: "Duplicate",
        documentType: "MANUAL",
        department: "QHSE",
        retentionPeriod: "THREE_YEARS",
        effectiveDate: new Date(),
        createdById: "user-1",
      }),
    /already exists/
  );
});

test("documents service updates only draft documents when permission passes", async () => {
  const prisma = {
    documentControl: {
      findUnique: async () => ({
        id: "doc-1",
        status: "DRAFT",
        title: "Old Title",
        description: "Old",
        documentType: "MANUAL",
        department: "QHSE",
        contentUrl: "/old.pdf",
        fileName: "old.pdf",
        fileSize: 100,
      }),
      findMany: async () => [],
      update: async (args) => ({ id: "doc-1", ...args.data }),
    },
  };

  const service = loadDocumentsService({
    prisma,
    hasDocumentPermission: (role, action) => role === "QMR" && action === "canEdit",
  });

  const updated = await service.updateDocument("doc-1", {
    title: "New Title",
    userId: "user-1",
    userRole: "QMR",
  });

  assert.equal(updated.title, "New Title");

  await assert.rejects(
    () =>
      service.updateDocument("doc-1", {
        title: "Blocked",
        userId: "user-1",
        userRole: "STAFF",
      }),
    /do not have permission/
  );
});

test("documents service submits for approval and creates QMR/director approval chain", async () => {
  const approvalCreates = [];
  const prisma = {
    documentControl: {
      findUnique: async (args) => {
        if (args.include) {
          return { id: "doc-1", approvals: approvalCreates.map((item) => item.data) };
        }
        return { id: "doc-1", status: "DRAFT" };
      },
      update: async () => ({}),
    },
    user: {
      findFirst: async ({ where }) => {
        if (where.role === "QMR") return { id: "qmr-1" };
        if (where.role === "DIRECTOR") return { id: "dir-1" };
        return null;
      },
    },
    documentApproval: {
      create: async (args) => {
        approvalCreates.push(args);
        return { id: `approval-${approvalCreates.length}` };
      },
    },
  };

  const service = loadDocumentsService({
    prisma,
    hasDocumentPermission: (role, action) => role === "QMR" && action === "canSubmit",
  });

  const result = await service.submitForApproval("doc-1", "user-1", "QMR");

  assert.equal(approvalCreates.length, 2);
  assert.deepEqual(
    approvalCreates.map((item) => ({
      level: item.data.approvalLevel,
      role: item.data.approvalRole,
      assignedToId: item.data.assignedToId,
      status: item.data.status,
    })),
    [
      { level: 1, role: "QMR", assignedToId: "qmr-1", status: "PENDING" },
      { level: 2, role: "DIRECTOR", assignedToId: "dir-1", status: "PENDING" },
    ]
  );
  assert.equal(result.id, "doc-1");
});

test("documents service approves and rejects through approval workflow", async () => {
  const controlUpdates = [];
  const approvalUpdates = [];
  const prisma = {
    documentApproval: {
      findUnique: async ({ where }) => {
        if (where.id === "approval-1") {
          return {
            id: "approval-1",
            documentId: "doc-1",
            assignedToId: "qmr-1",
            status: "PENDING",
          };
        }
        return {
          id: "approval-2",
          documentId: "doc-1",
          assignedToId: "dir-1",
          status: "PENDING",
        };
      },
      update: async (args) => {
        approvalUpdates.push(args);
        return { id: args.where.id, ...args.data };
      },
      count: async ({ where }) => (where.documentId === "doc-1" ? 0 : 1),
      updateMany: async (args) => {
        approvalUpdates.push(["many", args]);
        return { count: 1 };
      },
    },
    documentControl: {
      update: async (args) => {
        controlUpdates.push(args);
        return { id: args.where.id, ...args.data };
      },
      findUnique: async ({ where, include }) => ({
        id: where.id,
        approvals: include ? [] : undefined,
      }),
    },
  };

  const service = loadDocumentsService({
    prisma,
    hasDocumentPermission: (role, action) => role === "QMR" && action === "canApprove",
  });

  await service.approveDocument("doc-1", "approval-1", "qmr-1", "QMR", "Looks good");
  await service.rejectDocument("doc-1", "approval-2", "dir-1", "Fix section numbering");

  assert.equal(controlUpdates[0].data.status, "APPROVED");
  assert.equal(controlUpdates[1].data.status, "DRAFT");
  assert.equal(approvalUpdates[0].data.status, "APPROVED");
  assert.equal(approvalUpdates[1].data.status, "REJECTED");
  assert.deepEqual(approvalUpdates[2][1].data, { status: "REVOKED" });
});

test("documents service distributes, acknowledges, reads history, and deletes draft docs", async () => {
  const upserts = [];
  let lookupCount = 0;
  const prisma = {
    documentControl: {
      findUnique: async (args) => {
        if (args.include) {
          return { id: args.where.id };
        }
        lookupCount += 1;
        return {
          id: args.where.id,
          status: lookupCount <= 2 ? "APPROVED" : "DRAFT",
        };
      },
      update: async (args) => ({ id: args.where.id, ...args.data }),
      delete: async () => ({ id: "doc-1" }),
    },
    documentDistribution: {
      upsert: async (args) => {
        upserts.push(args);
        return { id: `dist-${upserts.length}`, ...args.create };
      },
      findFirst: async () => ({ id: "dist-1" }),
    },
    documentAcknowledgement: {
      upsert: async (args) => ({ id: "ack-1", ...args.create }),
    },
  };

  const service = loadDocumentsService({
    prisma,
    hasDocumentPermission: (_role, action) =>
      action === "canDistribute" || action === "canDelete",
  });

  const distributions = await service.distributeDocument(
    "doc-1",
    ["user-a", "user-b"],
    "qmr-1",
    "QMR"
  );
  const ack = await service.acknowledgeDocument("doc-1", "user-a", "Received");
  const history = await service.getDocumentHistory("doc-1");
  const deleted = await service.deleteDocument("doc-1", "qmr-1", "DIRECTOR");

  assert.equal(upserts.length, 2);
  assert.equal(distributions.length, 2);
  assert.equal(ack.status, "ACKNOWLEDGED");
  assert.equal(history.id, "doc-1");
  assert.deepEqual(deleted, {
    success: true,
    message: "Document deleted successfully",
  });
});
