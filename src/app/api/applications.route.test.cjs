const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  registerTsNode,
  withMockedModuleLoad,
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
      "@/lib/permission-middleware": mocks.permissionMiddleware,
      "@/lib/error-handler": mocks.errorHandler,
      "@/lib/application-flow-state": mocks.applicationFlowState,
    },
    () => require(modulePath)
  );
}

test("applications collection route enforces permissions, applies filters, and normalizes flow metadata", async () => {
  const findManyCalls = [];
  const createCalls = [];
  const mocks = {
    getServerSession: async () => null,
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      applicationsGuard: () => true,
      checkPermission: () => true,
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
    applicationFlowState: {
      parseApplicationFlowState(value) {
        return value
          ? { cvReadyAt: "2026-03-01T00:00:00.000Z", cvReadyBy: "ops-1" }
          : { cvReadyAt: null, cvReadyBy: null };
      },
      resolveHgiApplicationStage({ hasPrepareJoining, status }) {
        return hasPrepareJoining ? "PREPARE_JOINING" : `STATUS_${status}`;
      },
      stringifyApplicationFlowState(_current, patch) {
        return JSON.stringify(patch);
      },
    },
    prisma: {
      application: {
        async findMany(args) {
          findManyCalls.push(args);
          return [
            {
              id: "app-1",
              crewId: "crew-1",
              status: "RECEIVED",
              attachments: '{"hgiStage":"DRAFT"}',
              crew: {
                id: "crew-1",
                fullName: "Crew One",
                nationality: "Indonesia",
                rank: "Master",
                phone: "123",
                email: "crew@example.com",
                prepareJoinings: [{ id: "pj-1" }],
              },
              principal: { id: "pr-1", name: "Atlas" },
            },
          ];
        },
        async create(args) {
          createCalls.push(args);
          return {
            id: "app-2",
            crewId: args.data.crewId,
            position: args.data.position,
            vesselType: args.data.vesselType,
            principalId: args.data.principalId,
            applicationDate: args.data.applicationDate,
            status: "RECEIVED",
            remarks: args.data.remarks,
            attachments: args.data.attachments,
            crew: {
              id: "crew-2",
              fullName: "Crew Two",
              nationality: "Indonesia",
              rank: "Chief Officer",
              phone: "456",
              email: "crew2@example.com",
              prepareJoinings: [],
            },
            principal: { id: "pr-2", name: "Oceanic" },
          };
        },
      },
    },
  };

  let route = loadRoute("src/app/api/applications/route.ts", mocks);
  let response = await route.GET({ url: "https://example.com/api/applications" });
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-1" } });
  mocks.permissionMiddleware.applicationsGuard = () => false;
  route = loadRoute("src/app/api/applications/route.ts", mocks);
  response = await route.GET({ url: "https://example.com/api/applications" });
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.applicationsGuard = () => true;
  route = loadRoute("src/app/api/applications/route.ts", mocks);
  response = await route.GET({
    url: "https://example.com/api/applications?status=RECEIVED&crewId=crew-1&principalId=pr-1",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(findManyCalls[0].where, {
    status: "RECEIVED",
    crewId: "crew-1",
    principalId: "pr-1",
  });
  assert.equal(response.body.total, 1);
  assert.equal(response.body.data[0].hgiStage, "PREPARE_JOINING");
  assert.equal(response.body.data[0].cvReadyBy, "ops-1");
  assert.equal(response.body.data[0].hasPrepareJoining, true);

  mocks.getServerSession = async () => null;
  route = loadRoute("src/app/api/applications/route.ts", mocks);
  response = await route.POST({ async json() { return {}; } });
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-2" } });
  mocks.permissionMiddleware.checkPermission = () => false;
  route = loadRoute("src/app/api/applications/route.ts", mocks);
  response = await route.POST({ async json() { return { crewId: "crew-2", position: "CO" }; } });
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.checkPermission = () => true;
  route = loadRoute("src/app/api/applications/route.ts", mocks);
  response = await route.POST({ async json() { return { position: "CO" }; } });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");

  route = loadRoute("src/app/api/applications/route.ts", mocks);
  response = await route.POST({
    async json() {
      return {
        crewId: "crew-2",
        position: " Chief Officer ",
        vesselType: "Bulk Carrier",
        principalId: "pr-2",
        applicationDate: "2026-03-28T00:00:00.000Z",
        remarks: " shortlisted ",
      };
    },
  });
  assert.equal(response.status, 201);
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].data.crewId, "crew-2");
  assert.equal(createCalls[0].data.position, "Chief Officer");
  assert.equal(createCalls[0].data.status, "RECEIVED");
  assert.match(createCalls[0].data.attachments, /DRAFT/);
  assert.equal(response.body.hgiStage, "STATUS_RECEIVED");
  assert.equal(response.body.hasPrepareJoining, false);
});

test("application detail route enforces permissions, maps detail payload, and guards update workflow", async () => {
  const updateCalls = [];
  const findUniqueCalls = [];
  const mocks = {
    getServerSession: async () => null,
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      applicationsGuard: () => true,
      checkPermission: () => true,
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
    applicationFlowState: {
      parseApplicationFlowState() {
        return { cvReadyAt: "2026-03-10T00:00:00.000Z", cvReadyBy: "ops-2" };
      },
      resolveHgiApplicationStage() {
        return "INTERVIEW";
      },
    },
    prisma: {
      application: {
        async findUnique(args) {
          findUniqueCalls.push(args);
          if (args.where.id === "missing") {
            return null;
          }

          if (args.select) {
            return args.where.id === "closed"
              ? { id: "closed", status: "ACCEPTED" }
              : { id: args.where.id, status: "RECEIVED" };
          }

          return {
            id: args.where.id,
            crewId: "crew-7",
            position: "Master",
            status: "REVIEWING",
            attachments: "{}",
            crew: {
              id: "crew-7",
              fullName: "Crew Seven",
              dateOfBirth: new Date("1991-05-01T00:00:00.000Z"),
              placeOfBirth: "Jakarta",
              nationality: "Indonesia",
              rank: "Master",
              phone: "777",
              email: "crew7@example.com",
              address: "Harbor Road",
              passportNumber: "P-777",
              passportExpiry: new Date("2027-01-01T00:00:00.000Z"),
              seamanBookNumber: "SB-777",
              seamanBookExpiry: new Date("2027-02-01T00:00:00.000Z"),
              prepareJoinings: [{ id: "pj-7" }],
            },
            principal: { id: "pr-7", name: "Atlas" },
          };
        },
        async update(args) {
          updateCalls.push(args);
          return {
            id: args.where.id,
            position: args.data.position ?? "Master",
            principal: { id: "pr-8", name: "Updated Principal" },
            crew: { id: "crew-7", fullName: "Crew Seven" },
          };
        },
      },
    },
  };

  let route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  let response = await route.GET({}, { params: Promise.resolve({ id: "app-7" }) });
  assert.equal(response.status, 403);

  mocks.getServerSession = async () => ({ user: { id: "user-7" } });
  mocks.permissionMiddleware.applicationsGuard = () => false;
  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "app-7" }) });
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.applicationsGuard = () => true;
  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "app-7" }) });
  assert.equal(response.status, 200);
  assert.equal(response.body.hgiStage, "INTERVIEW");
  assert.equal(response.body.seafarerId, "crew-7");
  assert.equal(response.body.appliedRank, "Master");
  assert.equal(response.body.seafarer.fullName, "Crew Seven");
  assert.equal(response.body.hasPrepareJoining, true);

  mocks.getServerSession = async () => null;
  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.PUT(
    { async json() { return {}; } },
    { params: Promise.resolve({ id: "app-7" }) }
  );
  assert.equal(response.status, 403);

  mocks.getServerSession = async () => ({ user: { id: "user-7" } });
  mocks.permissionMiddleware.checkPermission = () => false;
  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.PUT(
    { async json() { return { position: "Chief Officer" }; } },
    { params: Promise.resolve({ id: "app-7" }) }
  );
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.checkPermission = () => true;
  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.PUT(
    { async json() { return { status: "INVALID" }; } },
    { params: Promise.resolve({ id: "app-7" }) }
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid application update payload");

  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.PUT(
    { async json() { return { position: "Chief Officer" }; } },
    { params: Promise.resolve({ id: "missing" }) }
  );
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.PUT(
    { async json() { return { position: "Chief Officer" }; } },
    { params: Promise.resolve({ id: "closed" }) }
  );
  assert.equal(response.status, 400);
  assert.match(response.body.error, /Closed applications are locked/i);

  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.PUT(
    { async json() { return { status: "PASSED" }; } },
    { params: Promise.resolve({ id: "app-7" }) }
  );
  assert.equal(response.status, 400);
  assert.match(response.body.error, /controlled workflow transition/i);

  route = loadRoute("src/app/api/applications/[id]/route.ts", mocks);
  response = await route.PUT(
    {
      async json() {
        return {
          position: " Chief Officer ",
          vesselType: "Bulk Carrier",
          principalId: "pr-8",
          remarks: "ignored by route",
        };
      },
    },
    { params: Promise.resolve({ id: "app-7" }) }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(updateCalls[0], {
    where: { id: "app-7" },
    data: {
      position: "Chief Officer",
      vesselType: "Bulk Carrier",
      principal: { connect: { id: "pr-8" } },
    },
    include: {
      crew: {
        select: {
          id: true,
          fullName: true,
          nationality: true,
          rank: true,
          phone: true,
          email: true,
        },
      },
      principal: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  assert.ok(findUniqueCalls.length >= 4);
});
