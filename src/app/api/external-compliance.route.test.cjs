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
      "@/lib/api-middleware": mocks.apiMiddleware ?? {},
      "@/lib/permission-middleware": mocks.permissionMiddleware ?? {},
      "@/lib/error-handler": mocks.errorHandler ?? {},
    },
    () => require(modulePath)
  );
}

test("external compliance collection route lists filtered records and validates create payload", async () => {
  const createCalls = [];
  const findManyCalls = [];
  const session = { user: { id: "user-1" } };
  class MockApiError extends Error {
    constructor(statusCode, message, code) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }
  const mocks = {
    apiMiddleware: {
      withPermission(_module, _level, handler) {
        return async (req) => {
          try {
            return await handler(req, session);
          } catch (error) {
            return mocks.errorHandler.handleApiError(error);
          }
        };
      },
    },
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS", FULL_ACCESS: "FULL_ACCESS" },
    },
    errorHandler: {
      ApiError: MockApiError,
      validateRequired(value, field) {
        if (!value) {
          throw new MockApiError(400, `${field} is required`, "VALIDATION_ERROR");
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
    prisma: {
      externalCompliance: {
        async findMany(args) {
          findManyCalls.push(args);
          return [{ id: "ec-1", crew: { id: "crew-1", fullName: "Crew One", rank: "Master", status: "ACTIVE" } }];
        },
        async create(args) {
          createCalls.push(args);
          return {
            id: "ec-2",
            ...args.data,
            crew: { id: "crew-1", fullName: "Crew One", rank: "Master" },
          };
        },
      },
      crew: {
        async findUnique(args) {
          return args.where.id === "missing" ? null : { id: args.where.id };
        },
      },
    },
  };

  let route = loadRoute("src/app/api/external-compliance/route.ts", mocks);
  let response = await route.GET({
    url: "https://example.com/api/external-compliance?crewId=crew-1&systemType=DEPHUB_CERTIFICATE&status=PENDING",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(findManyCalls[0].where, {
    crewId: "crew-1",
    systemType: "DEPHUB_CERTIFICATE",
    status: "PENDING",
  });
  assert.equal(response.body.total, 1);

  route = loadRoute("src/app/api/external-compliance/route.ts", mocks);
  response = await route.POST({ async json() { return {}; } });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");

  route = loadRoute("src/app/api/external-compliance/route.ts", mocks);
  response = await route.POST({
    async json() {
      return { crewId: "crew-1", systemType: "BAD_TYPE" };
    },
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_SYSTEM_TYPE");

  route = loadRoute("src/app/api/external-compliance/route.ts", mocks);
  response = await route.POST({
    async json() {
      return { crewId: "missing", systemType: "DEPHUB_CERTIFICATE" };
    },
  });
  assert.equal(response.status, 404);
  assert.equal(response.body.code, "CREW_NOT_FOUND");

  route = loadRoute("src/app/api/external-compliance/route.ts", mocks);
  response = await route.POST({
    async json() {
      return {
        crewId: "crew-1",
        systemType: "DEPHUB_CERTIFICATE",
        certificateId: "CERT-1",
        issueDate: "2026-03-01T00:00:00.000Z",
        expiryDate: "2026-12-01T00:00:00.000Z",
        verificationUrl: "https://verify.example.com",
        notes: "Pending check",
      };
    },
  });
  assert.equal(response.status, 201);
  assert.equal(createCalls[0].data.status, "PENDING");
  assert.equal(createCalls[0].data.issueDate.toISOString(), "2026-03-01T00:00:00.000Z");
});

test("external compliance detail route forwards get/update/delete through permission wrapper", async () => {
  const updateCalls = [];
  const deleteCalls = [];
  const session = { user: { id: "user-2" } };
  const mocks = {
    apiMiddleware: {
      withPermission(_module, _level, handler) {
        return async (req, context) => handler(req, session, context);
      },
    },
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS", FULL_ACCESS: "FULL_ACCESS" },
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
    prisma: {
      externalCompliance: {
        async findUnique(args) {
          return args.where.id === "missing" ? null : { id: args.where.id, crew: { id: "crew-2" } };
        },
        async update(args) {
          updateCalls.push(args);
          return { id: args.where.id, ...args.data, crew: { id: "crew-2", fullName: "Crew Two", rank: "AB" } };
        },
        async delete(args) {
          deleteCalls.push(args);
        },
      },
    },
  };

  let route = loadRoute("src/app/api/external-compliance/[id]/route.ts", mocks);
  let response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/external-compliance/[id]/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "ec-2" }) });
  assert.equal(response.status, 200);

  route = loadRoute("src/app/api/external-compliance/[id]/route.ts", mocks);
  response = await route.PUT(
    { async json() { return { status: "BAD" }; } },
    { params: Promise.resolve({ id: "ec-2" }) }
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_STATUS");

  route = loadRoute("src/app/api/external-compliance/[id]/route.ts", mocks);
  response = await route.PUT(
    {
      async json() {
        return {
          certificateId: "CERT-2",
          issueDate: "2026-03-05T00:00:00.000Z",
          expiryDate: "2026-12-31T00:00:00.000Z",
          status: "VERIFIED",
          verificationUrl: "https://verify.example.com/2",
          notes: "Verified",
        };
      },
    },
    { params: Promise.resolve({ id: "ec-2" }) }
  );
  assert.equal(response.status, 200);
  assert.equal(updateCalls[0].data.status, "VERIFIED");
  assert.equal(updateCalls[0].data.issueDate.toISOString(), "2026-03-05T00:00:00.000Z");

  route = loadRoute("src/app/api/external-compliance/[id]/route.ts", mocks);
  response = await route.DELETE({}, { params: Promise.resolve({ id: "ec-2" }) });
  assert.equal(response.status, 200);
  assert.deepEqual(deleteCalls[0], { where: { id: "ec-2" } });
});

test("external compliance verify and stats routes handle auth and aggregate status correctly", async () => {
  await withSuppressedConsole(["error"], async () => {
    const session = { user: { id: "user-3" } };
    const mocks = {
      getServerSession: async () => null,
      apiMiddleware: {
        withPermission(_module, _level, handler) {
          return async () => handler();
        },
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS", FULL_ACCESS: "FULL_ACCESS" },
        checkPermission: () => true,
      },
      errorHandler: {
        handleApiError(error) {
          return {
            status: error.statusCode ?? 500,
            body: { error: error.message },
            async json() {
              return this.body;
            },
          };
        },
      },
      prisma: {
        externalCompliance: {
          async findUnique(args) {
            if (args.where.id === "missing") {
              return null;
            }
            return {
              id: args.where.id,
              systemType: "DEPHUB_CERTIFICATE",
              expiryDate: new Date("2026-12-01T00:00:00.000Z"),
              crew: { id: "crew-3", fullName: "Crew Three", rank: "Oiler" },
            };
          },
          async update(args) {
            return {
              id: args.where.id,
              status: args.data.status,
              crew: { id: "crew-3", fullName: "Crew Three", rank: "Oiler", status: "ACTIVE" },
            };
          },
          async findMany() {
            return [
              { systemType: "DEPHUB_CERTIFICATE", status: "VERIFIED", expiryDate: new Date("2026-12-01T00:00:00.000Z") },
              { systemType: "DEPHUB_CERTIFICATE", status: "PENDING", expiryDate: new Date("2026-12-01T00:00:00.000Z") },
              { systemType: "SCHENGEN_VISA_NL", status: "PENDING", expiryDate: new Date("2020-01-01T00:00:00.000Z") },
            ];
          },
        },
      },
    };

    let route = loadRoute("src/app/api/external-compliance/[id]/verify/route.ts", mocks);
    let response = await route.POST({}, { params: Promise.resolve({ id: "ec-3" }) });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => session;
    route = loadRoute("src/app/api/external-compliance/[id]/verify/route.ts", mocks);
    response = await route.POST({}, { params: Promise.resolve({ id: "missing" }) });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/external-compliance/[id]/verify/route.ts", mocks);
    response = await route.POST({}, { params: Promise.resolve({ id: "ec-3" }) });
    assert.equal(response.status, 200);
    assert.equal(response.body.compliance.status, "VERIFIED");
    assert.equal(response.body.verification.isValid, true);

    route = loadRoute("src/app/api/external-compliance/stats/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      dephub: { total: 2, verified: 1, expired: 0, pending: 1 },
      schengen: { total: 1, verified: 0, expired: 1, pending: 0 },
    });
  });
});
