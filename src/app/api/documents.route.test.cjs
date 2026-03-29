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
      "@/lib/documents/service": mocks.documentsService ?? {},
      "@/lib/api-middleware": mocks.apiMiddleware ?? {},
      "@/lib/permission-middleware": mocks.permissionMiddleware ?? {},
      "@/lib/permissions": mocks.permissions ?? {},
      "@/lib/office-api-access": mocks.officeApiAccess ?? {},
      "@/lib/error-handler": mocks.errorHandler ?? {},
      "@/lib/document-types": mocks.documentTypes ?? {},
      "@/lib/masking": mocks.masking ?? {},
      "@/lib/upload-path": mocks.uploadPath ?? {},
      "fs/promises": mocks.fsPromises ?? {},
    },
    () => require(modulePath)
  );
}

test("documents create route enforces auth, validates payload, and writes audit log", async () => {
  const createdCalls = [];
  const auditCalls = [];
  const mocks = {
    getServerSession: async () => null,
    prisma: {
      auditLog: {
        async create(args) {
          auditCalls.push(args);
        },
      },
    },
    documentsService: {
      async createDocument(args) {
        createdCalls.push(args);
        return {
          id: "doc-1",
          code: args.code,
          title: args.title,
          documentType: args.documentType,
          department: args.department,
        };
      },
    },
  };

  let route = loadRoute("src/app/api/documents/create/route.ts", mocks);
  let response = await route.POST({
    async json() {
      return {};
    },
  });
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-1" } });
  route = loadRoute("src/app/api/documents/create/route.ts", mocks);
  response = await route.POST({
    async json() {
      return { title: "Missing code" };
    },
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid document payload");

  route = loadRoute("src/app/api/documents/create/route.ts", mocks);
  response = await route.POST({
    async json() {
      return {
        code: "DOC-001",
        title: "Safety Manual",
        description: "Bridge procedures",
        documentType: "MANUAL",
        department: "QHSSE",
        retentionPeriod: "THREE_YEARS",
        effectiveDate: "2026-03-28T00:00:00.000Z",
        contentUrl: "https://example.com/doc.pdf",
        fileName: "doc.pdf",
        fileSize: 2048,
      };
    },
  });

  assert.equal(response.status, 201);
  assert.equal(createdCalls.length, 1);
  assert.equal(createdCalls[0].createdById, "user-1");
  assert.equal(createdCalls[0].retentionPeriod, "THREE_YEARS");
  assert.equal(createdCalls[0].effectiveDate.toISOString(), "2026-03-28T00:00:00.000Z");
  assert.equal(auditCalls.length, 1);
  assert.deepEqual(auditCalls[0].data.metadataJson, {
    code: "DOC-001",
    title: "Safety Manual",
    documentType: "MANUAL",
    department: "QHSSE",
  });
});

test("documents list route enforces auth and forwards query filters to prisma", async () => {
  const findManyCalls = [];
  const countCalls = [];
  const mocks = {
    getServerSession: async () => null,
    prisma: {
      documentControl: {
        async findMany(args) {
          findManyCalls.push(args);
          return [{ id: "doc-2", code: "DOC-002" }];
        },
        async count(args) {
          countCalls.push(args);
          return 7;
        },
      },
    },
  };

  let route = loadRoute("src/app/api/documents/list/route.ts", mocks);
  let response = await route.GET({ url: "https://example.com/api/documents/list" });
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-2" } });
  route = loadRoute("src/app/api/documents/list/route.ts", mocks);
  response = await route.GET({
    url: "https://example.com/api/documents/list?status=PUBLISHED&department=QHSSE&limit=25&offset=50",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    data: [{ id: "doc-2", code: "DOC-002" }],
    total: 7,
    limit: 25,
    offset: 50,
  });
  assert.deepEqual(findManyCalls[0].where, {
    status: "PUBLISHED",
    department: "QHSSE",
  });
  assert.equal(findManyCalls[0].take, 25);
  assert.equal(findManyCalls[0].skip, 50);
  assert.deepEqual(countCalls[0], {
    where: {
      status: "PUBLISHED",
      department: "QHSSE",
    },
  });
});

test("documents history route enforces auth and handles missing and found records", async () => {
  const historyCalls = [];
  const mocks = {
    getServerSession: async () => null,
    prisma: {},
    documentsService: {
      async getDocumentHistory(id) {
        historyCalls.push(id);
        if (id === "missing") {
          return null;
        }

        return {
          id,
          revisions: [{ id: "rev-1", version: "1.0" }],
        };
      },
    },
  };

  let route = loadRoute("src/app/api/documents/[id]/history/route.ts", mocks);
  let response = await route.GET(
    {},
    { params: Promise.resolve({ id: "doc-3" }) }
  );
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-3" } });
  route = loadRoute("src/app/api/documents/[id]/history/route.ts", mocks);
  response = await route.GET(
    {},
    { params: Promise.resolve({ id: "missing" }) }
  );
  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Document not found");

  route = loadRoute("src/app/api/documents/[id]/history/route.ts", mocks);
  response = await route.GET(
    {},
    { params: Promise.resolve({ id: "doc-3" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    id: "doc-3",
    revisions: [{ id: "rev-1", version: "1.0" }],
  });
  assert.deepEqual(historyCalls, ["missing", "doc-3"]);
});

test("documents update and delete routes enforce role-aware auth and write audit logs", async () => {
  const updateCalls = [];
  const deleteCalls = [];
  const auditCalls = [];
  const mocks = {
    getServerSession: async () => null,
    prisma: {
      auditLog: {
        async create(args) {
          auditCalls.push(args);
        },
      },
    },
    documentsService: {
      async updateDocument(id, args) {
        updateCalls.push({ id, args });
        return { id, title: args.title ?? "Updated title" };
      },
      async deleteDocument(id, userId, userRole) {
        deleteCalls.push({ id, userId, userRole });
        return { success: true, id };
      },
    },
  };

  let route = loadRoute("src/app/api/documents/[id]/update/route.ts", mocks);
  let response = await route.PUT(
    { async json() { return {}; } },
    { params: Promise.resolve({ id: "doc-4" }) }
  );
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-4", role: "QMR" } });
  route = loadRoute("src/app/api/documents/[id]/update/route.ts", mocks);
  response = await route.PUT(
    { async json() { return { title: "" }; } },
    { params: Promise.resolve({ id: "doc-4" }) }
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid document update payload");

  route = loadRoute("src/app/api/documents/[id]/update/route.ts", mocks);
  response = await route.PUT(
    {
      async json() {
        return {
          title: "Revised Manual",
          description: "Updated section",
          fileName: "manual-v2.pdf",
          fileSize: 5120,
        };
      },
    },
    { params: Promise.resolve({ id: "doc-4" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(updateCalls[0], {
    id: "doc-4",
    args: {
      title: "Revised Manual",
      description: "Updated section",
      fileName: "manual-v2.pdf",
      fileSize: 5120,
      userId: "user-4",
      userRole: "QMR",
    },
  });
  assert.equal(auditCalls[0].data.action, "DOCUMENT_CONTROL_UPDATED");

  mocks.getServerSession = async () => null;
  route = loadRoute("src/app/api/documents/[id]/delete/route.ts", mocks);
  response = await route.DELETE(
    {},
    { params: Promise.resolve({ id: "doc-4" }) }
  );
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-4", role: "QMR" } });
  route = loadRoute("src/app/api/documents/[id]/delete/route.ts", mocks);
  response = await route.DELETE(
    {},
    { params: Promise.resolve({ id: "doc-4" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(deleteCalls[0], {
    id: "doc-4",
    userId: "user-4",
    userRole: "QMR",
  });
  assert.equal(auditCalls[1].data.action, "DOCUMENT_CONTROL_DELETED");
});

test("documents approval routes validate requests and forward approval lifecycle actions", async () => {
  const submitCalls = [];
  const approveCalls = [];
  const rejectCalls = [];
  const mocks = {
    getServerSession: async () => null,
    prisma: {},
    documentsService: {
      async submitForApproval(id, userId, userRole) {
        submitCalls.push({ id, userId, userRole });
        return { id, status: "PENDING_APPROVAL" };
      },
      async approveDocument(id, approvalId, userId, userRole, comments) {
        approveCalls.push({ id, approvalId, userId, userRole, comments });
        return { id, approvalId, status: "APPROVED" };
      },
      async rejectDocument(id, approvalId, userId, rejectionReason) {
        rejectCalls.push({ id, approvalId, userId, rejectionReason });
        return { id, approvalId, status: "REJECTED" };
      },
    },
  };

  let route = loadRoute("src/app/api/documents/[id]/submit-approval/route.ts", mocks);
  let response = await route.POST(
    {},
    { params: Promise.resolve({ id: "doc-5" }) }
  );
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-5", role: "QMR" } });
  route = loadRoute("src/app/api/documents/[id]/submit-approval/route.ts", mocks);
  response = await route.POST(
    {},
    { params: Promise.resolve({ id: "doc-5" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(submitCalls[0], {
    id: "doc-5",
    userId: "user-5",
    userRole: "QMR",
  });

  route = loadRoute("src/app/api/documents/[id]/approvals/[approvalId]/route.ts", mocks);
  response = await route.POST(
    { async json() { return {}; } },
    { params: Promise.resolve({ id: "doc-5", approvalId: "appr-1" }) }
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid action. Must be "approve" or "reject"');

  route = loadRoute("src/app/api/documents/[id]/approvals/[approvalId]/route.ts", mocks);
  response = await route.POST(
    { async json() { return { action: "reject" }; } },
    { params: Promise.resolve({ id: "doc-5", approvalId: "appr-1" }) }
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Rejection reason is required");

  route = loadRoute("src/app/api/documents/[id]/approvals/[approvalId]/route.ts", mocks);
  response = await route.POST(
    { async json() { return { action: "approve", comments: "Looks good" }; } },
    { params: Promise.resolve({ id: "doc-5", approvalId: "appr-1" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(approveCalls[0], {
    id: "doc-5",
    approvalId: "appr-1",
    userId: "user-5",
    userRole: "QMR",
    comments: "Looks good",
  });

  route = loadRoute("src/app/api/documents/[id]/approvals/[approvalId]/route.ts", mocks);
  response = await route.POST(
    { async json() { return { action: "reject", rejectionReason: "Wrong revision" }; } },
    { params: Promise.resolve({ id: "doc-5", approvalId: "appr-1" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(rejectCalls[0], {
    id: "doc-5",
    approvalId: "appr-1",
    userId: "user-5",
    rejectionReason: "Wrong revision",
  });
});

test("documents distribute and acknowledge routes validate payloads and forward user context", async () => {
  const auditCalls = [];
  const distributeCalls = [];
  const acknowledgeCalls = [];
  const mocks = {
    getServerSession: async () => null,
    prisma: {
      auditLog: {
        async create(args) {
          auditCalls.push(args);
        },
      },
    },
    documentsService: {
      async distributeDocument(id, recipientIds, userId, userRole) {
        distributeCalls.push({ id, recipientIds, userId, userRole });
        return recipientIds.map((recipientId) => ({ id: `${id}-${recipientId}`, recipientId }));
      },
      async acknowledgeDocument(id, userId, remarks) {
        acknowledgeCalls.push({ id, userId, remarks });
        return { id, acknowledgedById: userId, remarks: remarks ?? null };
      },
    },
  };

  let route = loadRoute("src/app/api/documents/[id]/distribute/route.ts", mocks);
  let response = await route.POST(
    { async json() { return { recipientIds: ["user-a"] }; } },
    { params: Promise.resolve({ id: "doc-6" }) }
  );
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-6", role: "DIRECTOR" } });
  route = loadRoute("src/app/api/documents/[id]/distribute/route.ts", mocks);
  response = await route.POST(
    { async json() { return { recipientIds: [] }; } },
    { params: Promise.resolve({ id: "doc-6" }) }
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid document distribution payload");

  route = loadRoute("src/app/api/documents/[id]/distribute/route.ts", mocks);
  response = await route.POST(
    { async json() { return { recipientIds: ["user-a", "user-b"] }; } },
    { params: Promise.resolve({ id: "doc-6" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(distributeCalls[0], {
    id: "doc-6",
    recipientIds: ["user-a", "user-b"],
    userId: "user-6",
    userRole: "DIRECTOR",
  });
  assert.equal(auditCalls[0].data.action, "DOCUMENT_CONTROL_DISTRIBUTED");
  assert.deepEqual(auditCalls[0].data.metadataJson, { recipientCount: 2 });

  mocks.getServerSession = async () => null;
  route = loadRoute("src/app/api/documents/[id]/acknowledge/route.ts", mocks);
  response = await route.POST(
    { async json() { return {}; } },
    { params: Promise.resolve({ id: "doc-6" }) }
  );
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-7" } });
  route = loadRoute("src/app/api/documents/[id]/acknowledge/route.ts", mocks);
  response = await route.POST(
    { async json() { return { remarks: "Received and read" }; } },
    { params: Promise.resolve({ id: "doc-6" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(acknowledgeCalls[0], {
    id: "doc-6",
    userId: "user-7",
    remarks: "Received and read",
  });
});

test("crew document detail route enforces office access, normalizes GET response, validates PUT, and deletes safely", async () => {
  await withSuppressedConsole(["info"], async () => {
  const updateCalls = [];
  const deleteCalls = [];
  const auditCalls = [];
  const deleteFileSafeCalls = [];
  const accessDenied = {
    status: 403,
    body: { error: "Forbidden" },
    async json() {
      return this.body;
    },
  };
  const mocks = {
    getServerSession: async () => ({ user: { id: "user-8" } }),
    officeApiAccess: {
      ensureOfficeApiPathAccess: () => null,
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
    documentTypes: {
      isKnownDocumentType(value) {
        return ["PASSPORT", "SEAMAN_BOOK"].includes(value);
      },
    },
    uploadPath: {
      getMaxFileSize() {
        return 5 * 1024 * 1024;
      },
      generateCrewDocumentFilename() {
        return "crew-document.pdf";
      },
      buildCrewDocumentFilePath() {
        return "/tmp/crew-document.pdf";
      },
      getRelativePath() {
        return "crew/crew-document.pdf";
      },
      getAbsolutePath(relativePath) {
        return `/abs/${relativePath}`;
      },
      deleteFileSafe(filePath) {
        deleteFileSafeCalls.push(filePath);
      },
      resolveStoredFileUrl(fileUrl) {
        return fileUrl ? `resolved:${fileUrl}` : null;
      },
    },
    fsPromises: {
      async writeFile() {},
      async unlink() {},
    },
    prisma: {
      crewDocument: {
        async findUnique(args) {
          if (args.where.id === "missing") {
            return null;
          }

          if (args.include) {
            return {
              id: args.where.id,
              crewId: "crew-1",
              docType: "PASSPORT",
              docNumber: "P-001",
              issueDate: new Date("2026-01-01T00:00:00.000Z"),
              expiryDate: new Date("2027-01-01T00:00:00.000Z"),
              createdAt: new Date("2026-01-05T00:00:00.000Z"),
              updatedAt: new Date("2026-01-06T00:00:00.000Z"),
              fileUrl: "/api/files/crew/passport.pdf",
              crew: { id: "crew-1", fullName: "Crew One" },
            };
          }

          return {
            id: args.where.id,
            crewId: "crew-1",
            docType: "PASSPORT",
            docNumber: "P-001",
            fileUrl: "/api/files/crew/passport.pdf",
          };
        },
        async findFirst(args) {
          if (args.where.docNumber === "DUP-001") {
            return { id: "dup-1" };
          }
          return null;
        },
        async update(args) {
          updateCalls.push(args);
          return {
            id: args.where.id,
            crewId: "crew-1",
            docType: args.data.docType,
            docNumber: args.data.docNumber,
            issueDate: args.data.issueDate,
            expiryDate: args.data.expiryDate,
            fileUrl: args.data.fileUrl ?? null,
            crew: { id: "crew-1", fullName: "Crew One" },
          };
        },
        async delete(args) {
          deleteCalls.push(args);
          return { id: args.where.id };
        },
      },
      crew: {
        async findUnique() {
          return { fullName: "Crew One", rank: "Master", crewCode: "C-001" };
        },
      },
      auditLog: {
        async create(args) {
          auditCalls.push(args);
        },
      },
    },
  };

  let route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  let response = await route.GET(
    {},
    { params: Promise.resolve({ id: "doc-crew-1" }) }
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.fileUrl, "resolved:/api/files/crew/passport.pdf");
  assert.equal(response.body.issueDate, "2026-01-01T00:00:00.000Z");
  assert.equal(response.body.updatedAt, "2026-01-06T00:00:00.000Z");

  mocks.officeApiAccess.ensureOfficeApiPathAccess = () => accessDenied;
  route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  response = await route.GET(
    {},
    { params: Promise.resolve({ id: "doc-crew-1" }) }
  );
  assert.equal(response.status, 403);

  mocks.officeApiAccess.ensureOfficeApiPathAccess = () => null;
  route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  response = await route.PUT(
    {
      async formData() {
        return new Map();
      },
    },
    { params: Promise.resolve({ id: "doc-crew-1" }) }
  );
  assert.equal(response.status, 400);
  assert.match(response.body.error, /required/i);

  route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  response = await route.PUT(
    {
      async formData() {
        return new Map([
          ["docType", "unknown_doc"],
          ["docNumber", "P-001"],
          ["issueDate", "2026-01-01"],
          ["expiryDate", "2027-01-01"],
        ]);
      },
    },
    { params: Promise.resolve({ id: "doc-crew-1" }) }
  );
  assert.equal(response.status, 400);
  assert.match(response.body.error, /Unknown document type/i);

  route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  response = await route.PUT(
    {
      async formData() {
        return new Map([
          ["docType", "passport"],
          ["docNumber", "DUP-001"],
          ["issueDate", "2026-01-01"],
          ["expiryDate", "2027-01-01"],
        ]);
      },
    },
    { params: Promise.resolve({ id: "doc-crew-1" }) }
  );
  assert.equal(response.status, 409);

  route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  response = await route.PUT(
    {
      async formData() {
        return new Map([
          ["docType", "passport"],
          ["docNumber", "PASS-7788"],
          ["issueDate", "2026-01-01"],
          ["expiryDate", "2027-01-01"],
          ["remarks", "renewed"],
        ]);
      },
    },
    { params: Promise.resolve({ id: "doc-crew-1" }) }
  );
  assert.equal(response.status, 200);
  assert.equal(updateCalls[0].data.docType, "PASSPORT");
  assert.equal(updateCalls[0].data.docNumber, "PASS-7788");
  assert.equal(updateCalls[0].data.remarks, "renewed");
  assert.equal(auditCalls[0].data.action, "CREW_DOCUMENT_UPDATED");

  route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  response = await route.DELETE(
    {},
    { params: Promise.resolve({ id: "missing" }) }
  );
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/documents/[id]/route.ts", mocks);
  response = await route.DELETE(
    {},
    { params: Promise.resolve({ id: "doc-crew-1" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(deleteCalls[0], { where: { id: "doc-crew-1" } });
  assert.deepEqual(deleteFileSafeCalls, ["/abs/crew/passport.pdf"]);
  assert.equal(auditCalls[1].data.action, "CREW_DOCUMENT_DELETED");
  });
});

test("legacy documents route GET filters crew portal scope and masks sensitive documents", async () => {
  const findManyCalls = [];
  const accessDenied = {
    status: 403,
    body: { error: "Forbidden" },
    async json() {
      return this.body;
    },
  };
  const mocks = {
    session: {
      user: {
        id: "crew-user-1",
        roles: ["CREW_PORTAL"],
      },
    },
    apiMiddleware: {
      withPermission(_module, _level, handler) {
        return async (req) => handler(req, mocks.session);
      },
    },
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
    },
    permissions: {
      UserRole: { CREW_PORTAL: "CREW_PORTAL", QHSSE: "QHSSE" },
      DataSensitivity: { RED: "RED", AMBER: "AMBER", GREEN: "GREEN" },
      hasSensitivityAccess(roles, sensitivity) {
        if (sensitivity === "RED") {
          return roles.includes("QHSSE");
        }
        if (sensitivity === "AMBER") {
          return roles.includes("QHSSE");
        }
        return true;
      },
    },
    officeApiAccess: {
      ensureOfficeApiPathAccess: () => null,
    },
    masking: {
      maskDocumentNumber(value) {
        return `masked:${value}`;
      },
    },
    uploadPath: {
      resolveStoredFileUrl(fileUrl) {
        return fileUrl ? `resolved:${fileUrl}` : null;
      },
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
        async findMany(args) {
          findManyCalls.push(args);
          return [
            {
              id: "legacy-doc-1",
              crewId: "crew-user-1",
              docNumber: "ABC123",
              sensitivity: "RED",
              fileUrl: "/api/files/red.pdf",
              crew: { id: "crew-user-1", fullName: "Crew User" },
            },
            {
              id: "legacy-doc-2",
              crewId: "crew-user-1",
              docNumber: "XYZ789",
              sensitivity: "GREEN",
              fileUrl: "/api/files/green.pdf",
              crew: { id: "crew-user-1", fullName: "Crew User" },
            },
          ];
        },
      },
    },
  };

  let route = loadRoute("src/app/api/documents/route.ts", mocks);
  let response = await route.GET({});
  assert.equal(response.status, 200);
  assert.deepEqual(findManyCalls[0].where, { crewId: "crew-user-1" });
  assert.equal(response.body[0].docNumber, "masked:ABC123");
  assert.equal(response.body[0].fileUrl, null);
  assert.equal(response.body[1].docNumber, "XYZ789");
  assert.equal(response.body[1].fileUrl, "resolved:/api/files/green.pdf");

  mocks.officeApiAccess.ensureOfficeApiPathAccess = () => accessDenied;
  route = loadRoute("src/app/api/documents/route.ts", mocks);
  response = await route.GET({});
  assert.equal(response.status, 403);
});

test("legacy documents route POST validates uploads, enforces crew portal scope, and stores document records", async () => {
  await withSuppressedConsole(["log", "error"], async () => {
    const createCalls = [];
    const auditCalls = [];
    const writeFileCalls = [];
    const mocks = {
      session: {
        user: {
          id: "crew-user-2",
          roles: ["CREW_PORTAL"],
        },
      },
      apiMiddleware: {
        withPermission(_module, _level, handler) {
          return async (req) => handler(req, mocks.session);
        },
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      },
      permissions: {
        UserRole: { CREW_PORTAL: "CREW_PORTAL", QHSSE: "QHSSE" },
        DataSensitivity: { RED: "RED", AMBER: "AMBER", GREEN: "GREEN" },
        hasSensitivityAccess() {
          return true;
        },
      },
      officeApiAccess: {
        ensureOfficeApiPathAccess: () => null,
      },
      documentTypes: {
        isKnownDocumentType(value) {
          return ["PASSPORT", "SEAMAN_BOOK"].includes(value);
        },
      },
      uploadPath: {
        getMaxFileSize() {
          return 5 * 1024 * 1024;
        },
        generateCrewDocumentFilename() {
          return "passport.pdf";
        },
        buildCrewDocumentFilePath() {
          return "/tmp/passport.pdf";
        },
        getRelativePath() {
          return "crew/passport.pdf";
        },
        resolveStoredFileUrl(fileUrl) {
          return fileUrl;
        },
      },
      fsPromises: {
        async writeFile(filePath, buffer) {
          writeFileCalls.push({ filePath, size: buffer.length });
        },
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
        crew: {
          async findUnique(args) {
            if (args.where.id === "missing") {
              return null;
            }

            if (args.select && "fullName" in args.select) {
              return { fullName: "Crew Two", rank: "AB", crewCode: "C-002" };
            }

            return { id: args.where.id };
          },
        },
        crewDocument: {
          async findFirst(args) {
            if (args.where.docNumber === "DUP-001") {
              return { id: "dup-1" };
            }
            return null;
          },
          async create(args) {
            createCalls.push(args);
            return {
              id: "legacy-created-1",
              crewId: args.data.crewId,
              docType: args.data.docType,
              fileUrl: args.data.fileUrl,
            };
          },
        },
        auditLog: {
          async create(args) {
            auditCalls.push(args);
          },
        },
      },
    };

    const createRequest = (entries) => ({
      async formData() {
        return new Map(entries);
      },
    });

    let route = loadRoute("src/app/api/documents/route.ts", mocks);
    let response = await route.POST(
      createRequest([
        ["seafarerId", ""],
        ["docType", ""],
      ])
    );
    assert.equal(response.status, 400);
    assert.match(response.body.error, /Missing required fields/i);

    route = loadRoute("src/app/api/documents/route.ts", mocks);
    response = await route.POST(
      createRequest([
        ["seafarerId", "other-crew"],
        ["docType", "passport"],
        ["docNumber", "P-001"],
        ["issueDate", "2026-01-01"],
        ["file", { name: "passport.pdf", type: "application/pdf", size: 10, async arrayBuffer() { return Buffer.from("pdf"); } }],
      ])
    );
    assert.equal(response.status, 403);

    route = loadRoute("src/app/api/documents/route.ts", mocks);
    response = await route.POST(
      createRequest([
        ["seafarerId", "crew-user-2"],
        ["docType", "unknown"],
        ["docNumber", "P-001"],
        ["issueDate", "2026-01-01"],
        ["file", { name: "passport.pdf", type: "application/pdf", size: 10, async arrayBuffer() { return Buffer.from("pdf"); } }],
      ])
    );
    assert.equal(response.status, 400);
    assert.match(response.body.error, /Unknown document type/i);

    route = loadRoute("src/app/api/documents/route.ts", mocks);
    response = await route.POST(
      createRequest([
        ["seafarerId", "crew-user-2"],
        ["docType", "passport"],
        ["docNumber", "DUP-001"],
        ["issueDate", "2026-01-01"],
        ["file", { name: "passport.pdf", type: "application/pdf", size: 10, async arrayBuffer() { return Buffer.from("pdf"); } }],
      ])
    );
    assert.equal(response.status, 409);

    route = loadRoute("src/app/api/documents/route.ts", mocks);
    response = await route.POST(
      createRequest([
        ["seafarerId", "crew-user-2"],
        ["docType", "passport"],
        ["docNumber", "P-7788"],
        ["issueDate", "2026-01-01"],
        ["expiryDate", "2027-01-01"],
        ["remarks", " uploaded "],
        ["file", { name: "passport.pdf", type: "application/pdf", size: 10, async arrayBuffer() { return Buffer.from("pdf"); } }],
      ])
    );
    assert.equal(response.status, 201);
    assert.equal(writeFileCalls.length, 1);
    assert.deepEqual(createCalls[0].data, {
      crewId: "crew-user-2",
      docType: "PASSPORT",
      docNumber: "P-7788",
      issueDate: new Date("2026-01-01"),
      expiryDate: new Date("2027-01-01"),
      remarks: "uploaded",
      fileUrl: "/api/files/crew/passport.pdf",
    });
    assert.equal(auditCalls[0].data.action, "CREW_DOCUMENT_CREATED");
  });
});
