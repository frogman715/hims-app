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
      "@/lib/permission-middleware": mocks.permissionMiddleware,
      "@/lib/api-middleware": mocks.apiMiddleware ?? {},
      "@/lib/error-handler": mocks.errorHandler ?? {},
      "@/lib/crew-ops": mocks.crewOps ?? {},
      "@/lib/upload-path": mocks.uploadPath ?? {},
    },
    () => require(modulePath)
  );
}

test("seafarer biodata route enforces auth, permission, not-found, and assignment transformation", async () => {
  const mocks = {
    getServerSession: async () => null,
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      checkPermission: () => true,
    },
    prisma: {
      crew: {
        async findUnique(args) {
          if (args.where.id === "missing") {
            return null;
          }

          return {
            id: args.where.id,
            fullName: "Captain One",
            assignments: [
              {
                id: "asg-1",
                rank: "Master",
                startDate: new Date("2026-01-10T00:00:00.000Z"),
                endDate: null,
                status: "ONBOARD",
                vessel: { id: "v-1", name: "MV Alpha" },
                principal: { id: "p-1", name: "Atlas" },
                remarks: "Current assignment",
              },
            ],
            applications: [
              {
                id: "app-1",
                position: "Master",
                applicationDate: new Date("2025-12-01T00:00:00.000Z"),
                status: "APPROVED",
              },
            ],
            documents: [
              {
                id: "doc-1",
                docType: "PASSPORT",
                docNumber: "P-001",
                issueDate: new Date("2026-01-01T00:00:00.000Z"),
                expiryDate: new Date("2027-01-01T00:00:00.000Z"),
                remarks: null,
              },
            ],
          };
        },
      },
    },
  };

  let route = loadRoute("src/app/api/seafarers/[id]/biodata/route.ts", mocks);
  let response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-1" } });
  mocks.permissionMiddleware.checkPermission = () => false;
  route = loadRoute("src/app/api/seafarers/[id]/biodata/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.checkPermission = () => true;
  route = loadRoute("src/app/api/seafarers/[id]/biodata/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/seafarers/[id]/biodata/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
  assert.equal(response.status, 200);
  assert.equal(response.body.assignments[0].signOnDate.toISOString(), "2026-01-10T00:00:00.000Z");
  assert.equal(response.body.assignments[0].signOffPlan.toISOString(), "2026-01-10T00:00:00.000Z");
  assert.equal(response.body.assignments[0].signOffDate, null);
  assert.equal(response.body.assignments[0].vessel.name, "MV Alpha");
});

test("seafarer documents route enforces auth, permission, and resolves stored file urls", async () => {
  const mocks = {
    getServerSession: async () => null,
    permissionMiddleware: {
      PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS" },
      checkPermission: () => true,
    },
    uploadPath: {
      resolveStoredFileUrl(fileUrl) {
        return fileUrl ? `resolved:${fileUrl}` : null;
      },
    },
    prisma: {
      crew: {
        async findUnique(args) {
          return args.where.id === "missing" ? null : { id: args.where.id };
        },
      },
      crewDocument: {
        async findMany() {
          return [
            {
              id: "doc-2",
              docType: "PASSPORT",
              fileUrl: "/api/files/crew/passport.pdf",
            },
          ];
        },
      },
    },
  };

  let route = loadRoute("src/app/api/seafarers/[id]/documents/route.ts", mocks);
  let response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
  assert.equal(response.status, 401);

  mocks.getServerSession = async () => ({ user: { id: "user-2" } });
  mocks.permissionMiddleware.checkPermission = () => false;
  route = loadRoute("src/app/api/seafarers/[id]/documents/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
  assert.equal(response.status, 403);

  mocks.permissionMiddleware.checkPermission = () => true;
  route = loadRoute("src/app/api/seafarers/[id]/documents/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/seafarers/[id]/documents/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, [
    {
      id: "doc-2",
      docType: "PASSPORT",
      fileUrl: "resolved:/api/files/crew/passport.pdf",
    },
  ]);
});

test("seafarer document receipts routes enforce auth and validate create payloads", async () => {
  await withSuppressedConsole(["error"], async () => {
    const createCalls = [];
    const mocks = {
      getServerSession: async () => null,
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
        checkPermission: (_session, _module, level) => level !== "EDIT_ACCESS" ? true : true,
      },
      prisma: {
        crew: {
          async findUnique(args) {
            return args.where.id === "missing" ? null : { id: args.where.id };
          },
        },
        documentReceipt: {
          async findMany() {
            return [{ id: "receipt-1", crewId: "crew-1" }];
          },
          async create(args) {
            createCalls.push(args);
            return {
              id: "receipt-2",
              crewId: args.data.crewId,
              crewName: args.data.crewName,
              crewStatus: args.data.crewStatus,
              items: args.data.items.create,
            };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    let response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-3" } });
    mocks.permissionMiddleware.checkPermission = () => false;
    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "crew-1" }) });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [{ id: "receipt-1", crewId: "crew-1" }]);

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.POST(
      { async json() { return {}; } },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-3" } });
    mocks.permissionMiddleware.checkPermission = (_session, _module, level) => level === "EDIT_ACCESS" ? false : true;
    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.POST(
      { async json() { return {}; } },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.POST(
      { async json() { return { crewStatus: "NEW", items: [] }; } },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Crew name is required");

    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.POST(
      {
        async json() {
          return {
            crewName: "Crew One",
            crewStatus: "BAD",
            items: [{ certificateName: "Passport" }],
          };
        },
      },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Invalid crew status");

    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.POST(
      {
        async json() {
          return {
            crewName: "Crew One",
            crewStatus: "NEW",
            items: [],
          };
        },
      },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "At least one document item is required");

    route = loadRoute("src/app/api/seafarers/[id]/document-receipts/route.ts", mocks);
    response = await route.POST(
      {
        async json() {
          return {
            crewName: "  Crew One  ",
            crewStatus: "EX_CREW",
            notes: "  urgent  ",
            items: [
              {
                certificateName: " Passport ",
                certificateNumber: " P-777 ",
                remarks: " original ",
              },
            ],
          };
        },
      },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 201);
    assert.equal(createCalls.length, 1);
    assert.equal(createCalls[0].data.crewName, "Crew One");
    assert.equal(createCalls[0].data.crewStatus, "EX_CREW");
    assert.equal(createCalls[0].data.notes, "urgent");
    assert.deepEqual(createCalls[0].data.items.create[0], {
      certificateName: "Passport",
      certificateNumber: "P-777",
      issueDate: undefined,
      expiryDate: undefined,
      remarks: "original",
      orderIndex: 0,
    });
  });
});

test("seafarer detail route supports auth-gated read and normalized updates", async () => {
  await withSuppressedConsole(["error"], async () => {
    const updateCalls = [];
    const mocks = {
      getServerSession: async () => null,
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
        checkPermission: () => true,
      },
      crewOps: {
        isCrewOperationalStatus(value) {
          return ["ACTIVE", "ONBOARD"].includes(value);
        },
      },
      prisma: {
        crew: {
          async findUnique(args) {
            return args.where.id === "missing"
              ? null
              : { id: args.where.id, fullName: "Crew Detail" };
          },
          async update(args) {
            updateCalls.push(args);
            return {
              id: args.where.id,
              fullName: args.data.fullName,
              crewStatus: args.data.crewStatus ?? null,
              emergencyContact: args.data.emergencyContact,
              heightCm: args.data.heightCm,
              weightKg: args.data.weightKg,
            };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    let response = await route.GET({}, { params: Promise.resolve({ id: "crew-9" }) });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-9" } });
    mocks.permissionMiddleware.checkPermission = () => false;
    route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "crew-9" }) });
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "crew-9" }) });
    assert.equal(response.status, 200);
    assert.equal(response.body.fullName, "Crew Detail");

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    response = await route.PUT(
      { async json() { return {}; } },
      { params: Promise.resolve({ id: "crew-9" }) }
    );
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-9" } });
    mocks.permissionMiddleware.checkPermission = (_s, _m, level) => level !== "EDIT_ACCESS";
    route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    response = await route.PUT(
      { async json() { return { fullName: "Crew Detail" }; } },
      { params: Promise.resolve({ id: "crew-9" }) }
    );
    assert.equal(response.status, 403);

    mocks.permissionMiddleware.checkPermission = () => true;
    route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    response = await route.PUT(
      { async json() { return { rank: "AB" }; } },
      { params: Promise.resolve({ id: "crew-9" }) }
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Invalid seafarer payload");

    route = loadRoute("src/app/api/seafarers/[id]/route.ts", mocks);
    response = await route.PUT(
      {
        async json() {
          return {
            fullName: "  Crew Detail Updated  ",
            nationality: "  Indonesia ",
            crewStatus: "ACTIVE",
            emergencyContactName: "Jane",
            emergencyContactPhone: "12345",
            heightCm: "182",
            weightKg: "78",
            coverallSize: " XL ",
          };
        },
      },
      { params: Promise.resolve({ id: "crew-9" }) }
    );
    assert.equal(response.status, 200);
    assert.equal(updateCalls.length, 1);
    assert.deepEqual(updateCalls[0], {
      where: { id: "crew-9" },
      data: {
        fullName: "Crew Detail Updated",
        nationality: "Indonesia",
        dateOfBirth: null,
        placeOfBirth: null,
        phone: null,
        email: null,
        rank: undefined,
        crewStatus: "ACTIVE",
        emergencyContactName: "Jane",
        emergencyContactRelation: null,
        emergencyContactPhone: "12345",
        emergencyContact: "Jane • 12345",
        heightCm: 182,
        weightKg: 78,
        coverallSize: "XL",
        shoeSize: null,
        waistSize: null,
      },
    });
  });
});

test("seafarer search route returns empty results for short query and transforms paged matches", async () => {
  await withSuppressedConsole(["error"], async () => {
    const countCalls = [];
    const findManyCalls = [];
    const mocks = {
      apiMiddleware: {
        withPermission(_module, _level, handler) {
          return async (req) => handler(req, { user: { id: "user-search" } });
        },
      },
      permissionMiddleware: {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS" },
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
          async count(args) {
            countCalls.push(args);
            return 1;
          },
          async findMany(args) {
            findManyCalls.push(args);
            return [
              {
                id: "crew-search-1",
                fullName: "Captain Search",
                rank: "Master",
                status: "ACTIVE",
                nationality: "Indonesia",
                passportNumber: "P-100",
                passportExpiry: new Date("2027-01-01T00:00:00.000Z"),
                seamanBookNumber: "SB-100",
                seamanBookExpiry: null,
                phone: "123",
                email: "captain@example.com",
                dateOfBirth: new Date("1990-03-10T00:00:00.000Z"),
                assignments: [
                  {
                    rank: "Master",
                    status: "ONBOARD",
                    startDate: new Date("2026-02-01T00:00:00.000Z"),
                    endDate: null,
                    vessel: { name: "MV Search" },
                    principal: { name: "Atlas" },
                  },
                ],
                applications: [
                  {
                    status: "APPROVED",
                    applicationDate: new Date("2026-01-15T00:00:00.000Z"),
                    principal: { name: "Atlas" },
                    vesselType: "Bulk Carrier",
                  },
                ],
                documents: [
                  {
                    id: "exp-1",
                    docType: "PASSPORT",
                    docNumber: "P-100",
                    expiryDate: new Date("2026-09-01T00:00:00.000Z"),
                  },
                ],
              },
            ];
          },
        },
      },
    };

    let route = loadRoute("src/app/api/seafarers/search/route.ts", mocks);
    let response = await route.GET({ url: "https://example.com/api/seafarers/search?q=a" });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      results: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    route = loadRoute("src/app/api/seafarers/search/route.ts", mocks);
    response = await route.GET({
      url: "https://example.com/api/seafarers/search?q=cap&page=2&pageSize=60",
    });
    assert.equal(response.status, 200);
    assert.equal(countCalls.length, 1);
    assert.equal(findManyCalls.length, 1);
    assert.equal(findManyCalls[0].take, 50);
    assert.equal(findManyCalls[0].skip, 50);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.page, 2);
    assert.equal(response.body.pageSize, 50);
    assert.equal(response.body.results[0].fullName, "Captain Search");
    assert.equal(response.body.results[0].latestAssignment.vesselName, "MV Search");
    assert.equal(response.body.results[0].latestApplication.vesselType, "Bulk Carrier");
    assert.equal(response.body.results[0].expiringDocuments[0].expiryDate, "2026-09-01T00:00:00.000Z");
    assert.equal(typeof response.body.results[0].age, "number");
  });
});
