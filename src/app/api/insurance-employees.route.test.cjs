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
      "next-auth/next": { getServerSession: mocks.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/permission-middleware": mocks.permissionMiddleware,
    },
    () => require(modulePath)
  );
}

test("insurance collection route enforces auth/permission and forwards create/list payloads", async () => {
  await withSuppressedConsole(["error"], async () => {
    const createCalls = [];
    const mocks = {
      getServerSession: async () => null,
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
        checkPermission: () => true,
      },
      prisma: {
        insuranceRecord: {
          async findMany() {
            return [{ id: "ins-1", crew: { fullName: "Crew One" }, vessel: { name: "MV One" }, principal: { name: "Atlas" } }];
          },
          async create(args) {
            createCalls.push(args);
            return {
              id: "ins-2",
              ...args.data,
              crew: { fullName: "Crew One" },
              vessel: { name: "MV One" },
              principal: { name: "Atlas" },
            };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/insurance/route.ts", mocks);
    let response = await route.GET();
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-1" } });
    mocks.permissionMiddleware.checkPermission = () => false;
    route = loadRoute("src/app/api/insurance/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/insurance/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 200);
    assert.equal(response.body[0].id, "ins-1");

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/insurance/route.ts", mocks);
    response = await route.POST({ async json() { return {}; } });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-1" } });
    mocks.permissionMiddleware.checkPermission = (_s, _m, level) => level !== "EDIT_ACCESS";
    route = loadRoute("src/app/api/insurance/route.ts", mocks);
    response = await route.POST({ async json() { return {}; } });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/insurance/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          crewId: "crew-1",
          vesselId: "vessel-1",
          principalId: "pr-1",
          insuranceType: "P&I",
          provider: "Marine Insure",
          policyNumber: "POL-001",
          coverageAmount: 500000,
          premiumAmount: 15000,
          currency: "USD",
          startDate: "2026-01-01T00:00:00.000Z",
          expiryDate: "2026-12-31T00:00:00.000Z",
          status: "ACTIVE",
        };
      },
    });
    assert.equal(response.status, 201);
    assert.equal(createCalls[0].data.startDate.toISOString(), "2026-01-01T00:00:00.000Z");
    assert.equal(createCalls[0].data.expiryDate.toISOString(), "2026-12-31T00:00:00.000Z");
  });
});

test("insurance detail route enforces auth/permission and supports get/update/delete", async () => {
  await withSuppressedConsole(["error"], async () => {
    const updateCalls = [];
    const deleteCalls = [];
    const mocks = {
      getServerSession: async () => null,
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
        checkPermission: () => true,
      },
      prisma: {
        insuranceRecord: {
          async findUnique(args) {
            return args.where.id === "missing"
              ? null
              : { id: args.where.id, crew: { fullName: "Crew One" }, vessel: { name: "MV One" }, principal: { name: "Atlas" } };
          },
          async update(args) {
            updateCalls.push(args);
            return {
              id: args.where.id,
              ...args.data,
              crew: { fullName: "Crew One" },
              vessel: { name: "MV One" },
              principal: { name: "Atlas" },
            };
          },
          async delete(args) {
            deleteCalls.push(args);
          },
        },
      },
    };

    let route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    let response = await route.GET({}, { params: Promise.resolve({ id: "ins-1" }) });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-2" } });
    mocks.permissionMiddleware.checkPermission = () => false;
    route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "ins-1" }) });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "ins-1" }) });
    assert.equal(response.status, 200);

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    response = await route.PUT({ async json() { return {}; } }, { params: Promise.resolve({ id: "ins-1" }) });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-2" } });
    mocks.permissionMiddleware.checkPermission = (_s, _m, level) => level !== "EDIT_ACCESS";
    route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    response = await route.PUT({ async json() { return {}; } }, { params: Promise.resolve({ id: "ins-1" }) });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    response = await route.PUT(
      {
        async json() {
          return {
            crewId: "crew-1",
            vesselId: "vessel-1",
            principalId: "pr-1",
            insuranceType: "Medical",
            provider: "Marine Insure",
            policyNumber: "POL-009",
            coverageAmount: 750000,
            premiumAmount: 25000,
            currency: "USD",
            startDate: "2026-02-01T00:00:00.000Z",
            expiryDate: "2027-02-01T00:00:00.000Z",
            status: "ACTIVE",
          };
        },
      },
      { params: Promise.resolve({ id: "ins-1" }) }
    );
    assert.equal(response.status, 200);
    assert.equal(updateCalls[0].data.insuranceType, "Medical");
    assert.equal(updateCalls[0].data.startDate.toISOString(), "2026-02-01T00:00:00.000Z");

    route = loadRoute("src/app/api/insurance/[id]/route.ts", mocks);
    response = await route.DELETE({}, { params: Promise.resolve({ id: "ins-1" }) });
    assert.equal(response.status, 200);
    assert.deepEqual(deleteCalls[0], { where: { id: "ins-1" } });
  });
});

test("employees route enforces auth/permission and forwards query filters", async () => {
  await withSuppressedConsole(["error"], async () => {
    const findManyCalls = [];
    const mocks = {
      getServerSession: async () => null,
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS" },
        checkPermission: () => true,
      },
      prisma: {
        employee: {
          async findMany(args) {
            findManyCalls.push(args);
            return [{ id: "emp-1", fullName: "Jane Doe", department: "HR", status: "ACTIVE" }];
          },
        },
      },
    };

    let route = loadRoute("src/app/api/employees/route.ts", mocks);
    let response = await route.GET({ url: "https://example.com/api/employees" });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-3" } });
    mocks.permissionMiddleware.checkPermission = () => false;
    route = loadRoute("src/app/api/employees/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/employees" });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/employees/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/employees?department=HR&status=ACTIVE" });
    assert.equal(response.status, 200);
    assert.deepEqual(findManyCalls[0], {
      where: {
        department: "HR",
        status: "ACTIVE",
      },
      orderBy: {
        fullName: "asc",
      },
    });
    assert.equal(response.body[0].id, "emp-1");
  });
});
