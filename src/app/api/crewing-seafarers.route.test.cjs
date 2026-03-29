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
        status: init.status ?? 200,
        body,
        async json() {
          return body;
        },
      };
    },
  };
}

function createApiErrorMock() {
  return class ApiError extends Error {
    constructor(status, message, code, details) {
      super(message);
      this.status = status;
      this.code = code;
      this.details = details;
    }
  };
}

function loadRoute(moduleRelativePath, mocks) {
  const modulePath = path.join(process.cwd(), moduleRelativePath);
  const crewingTypesPath = path.join(process.cwd(), "src/types/crewing.ts");
  const seafarerQualityPath = path.join(process.cwd(), "src/lib/seafarer-biodata-quality.ts");
  delete require.cache[require.resolve(modulePath)];
  delete require.cache[require.resolve(crewingTypesPath)];
  delete require.cache[require.resolve(seafarerQualityPath)];

  const ApiError = createApiErrorMock();

  return withMockedModuleLoad(
    {
      "next/server": { NextResponse: createNextResponseMock() },
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/api-middleware": {
        withPermission(_module, _level, handler) {
          return async (req, context) => handler(req, { user: { id: "user-1" } }, context);
        },
      },
      "@/lib/permission-middleware": {
        PermissionLevel: { VIEW_ACCESS: "VIEW_ACCESS", EDIT_ACCESS: "EDIT_ACCESS" },
      },
      "@/lib/error-handler": {
        ApiError,
        handleApiError(error) {
          return {
            status: error.status ?? 500,
            body: {
              error: error.message,
              code: error.code,
              details: error.details,
            },
            async json() {
              return this.body;
            },
          };
        },
      },
      "@/lib/document-control": {
        buildCrewDocumentWorkspaceView() {
          return { status: "OK" };
        },
      },
      "@/types/crewing": require(crewingTypesPath),
      "@/lib/seafarer-biodata-quality": require(seafarerQualityPath),
    },
    () => require(modulePath)
  );
}

test("crewing seafarer detail route rejects future date of birth and incomplete emergency contact", async () => {
  await withSuppressedConsole(["error"], async () => {
    const updateCalls = [];
    const mocks = {
      prisma: {
        crew: {
          async findUnique(args) {
            return args.where.id === "missing" ? null : { id: args.where.id, fullName: "Crew One" };
          },
          async update(args) {
            updateCalls.push(args);
            return { id: args.where.id, ...args.data };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/crewing/seafarers/[id]/route.ts", mocks);
    let response = await route.PUT(
      {
        async json() {
          return {
            fullName: "Crew One",
            dateOfBirth: "2099-01-01T00:00:00.000Z",
          };
        },
      },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "VALIDATION_ERROR");
    assert.match(JSON.stringify(response.body.details), /Date of birth cannot be in the future/);

    route = loadRoute("src/app/api/crewing/seafarers/[id]/route.ts", mocks);
    response = await route.PUT(
      {
        async json() {
          return {
            fullName: "Crew One",
            emergencyContactName: "Jane",
          };
        },
      },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 400);
    assert.match(JSON.stringify(response.body.details), /Emergency contact phone is required/);

    route = loadRoute("src/app/api/crewing/seafarers/[id]/route.ts", mocks);
    response = await route.PUT(
      {
        async json() {
          return {
            fullName: "Crew One",
            nationality: "Indonesia",
            dateOfBirth: "1990-01-01T00:00:00.000Z",
            placeOfBirth: "Jakarta",
            emergencyContactName: "Jane",
            emergencyContactPhone: "0812",
          };
        },
      },
      { params: Promise.resolve({ id: "crew-1" }) }
    );
    assert.equal(response.status, 200);
    assert.equal(updateCalls.length, 1);
    assert.equal(updateCalls[0].data.fullName, "Crew One");
    assert.equal(updateCalls[0].data.nationality, "Indonesia");
  });
});

test("crewing data quality route uses shared biodata rules for blocked and advisory crews", async () => {
  const route = loadRoute("src/app/api/crewing/data-quality/route.ts", {
    prisma: {
      crew: {
        async findMany() {
          return [
            {
              id: "crew-gap",
              crewCode: "C-001",
              fullName: "Gap Crew",
              rank: null,
              crewStatus: "AVAILABLE",
              status: "ACTIVE",
              nationality: null,
              dateOfBirth: null,
              placeOfBirth: null,
              phone: null,
              email: null,
              emergencyContactName: null,
              emergencyContactPhone: null,
              documents: [
                {
                  id: "doc-passport",
                  docType: "Passport",
                  expiryDate: new Date("2026-04-10T00:00:00.000Z"),
                },
              ],
              assignments: [],
              seaServiceHistories: [],
            },
            {
              id: "crew-ready",
              crewCode: "C-002",
              fullName: "Ready Crew",
              rank: "Master",
              crewStatus: "ONBOARD",
              status: "ACTIVE",
              nationality: "Indonesia",
              dateOfBirth: new Date("1991-02-10T00:00:00.000Z"),
              placeOfBirth: "Jakarta",
              phone: "123",
              email: null,
              emergencyContactName: "Jane",
              emergencyContactPhone: "456",
              documents: [
                { id: "doc-1", docType: "Passport", expiryDate: new Date("2027-04-10T00:00:00.000Z") },
                { id: "doc-2", docType: "Seaman Book", expiryDate: new Date("2027-04-10T00:00:00.000Z") },
                { id: "doc-3", docType: "Medical Certificate", expiryDate: new Date("2026-10-10T00:00:00.000Z") },
              ],
              assignments: [{ id: "asg-1", status: "ONBOARD", startDate: new Date("2026-01-01T00:00:00.000Z"), vessel: { id: "v-1", name: "MV A" } }],
              seaServiceHistories: [
                {
                  vesselType: "Bulk Carrier",
                  flag: "SG",
                  grt: 50000,
                  engineOutput: "10000 kW",
                },
              ],
            },
          ];
        },
      },
    },
  });

  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.data[0].id, "crew-gap");
  assert.ok(response.body.summary.byType.MISSING_RANK >= 1);
  assert.ok(response.body.summary.byType.MISSING_MANDATORY_DOCUMENTS >= 1);
  assert.ok(response.body.summary.highSeverity >= 1);
});
