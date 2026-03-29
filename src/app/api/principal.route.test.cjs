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

function createNextServerMock() {
  class MockNextResponse {
    constructor(body, init = {}) {
      this.type = "response";
      this.status = init.status ?? 200;
      this.body = body;
      this.headers = init.headers ?? {};
    }

    async json() {
      return this.body;
    }
  }

  return {
    NextResponse: Object.assign(MockNextResponse, {
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
    }),
  };
}

function loadRoute(moduleRelativePath, mocks) {
  const modulePath = path.join(process.cwd(), moduleRelativePath);
  delete require.cache[require.resolve(modulePath)];

  return withMockedModuleLoad(
    {
      "next/server": createNextServerMock(),
      "next-auth": { getServerSession: mocks.getServerSession },
      "@/lib/auth": { authOptions: { provider: "mock" } },
      "@/lib/prisma": { prisma: mocks.prisma },
      "@/lib/principal-session": mocks.principalSession,
      "@/lib/application-flow-state": mocks.applicationFlowState,
      "@/lib/crew-ops": mocks.crewOps ?? {},
      "fs/promises": mocks.fsPromises ?? {},
      path,
    },
    () => require(modulePath)
  );
}

test("principal applications list/detail routes enforce principal session and normalize flow metadata", async () => {
  const principalDenied = {
    status: 403,
    body: { error: "Principal access required" },
    async json() {
      return this.body;
    },
  };
  const findManyCalls = [];
  const findFirstCalls = [];
  const session = {
    user: {
      id: "principal-user-1",
      principalId: "pr-1",
      principalName: "Atlas",
    },
  };
  const mocks = {
    getServerSession: async () => session,
    principalSession: {
      ensurePrincipalSession: () => null,
    },
    applicationFlowState: {
      parseApplicationFlowState() {
        return { cvReadyAt: "2026-03-01T00:00:00.000Z", cvReadyBy: "ops-1" };
      },
      resolveHgiApplicationStage({ hasPrepareJoining, status }) {
        return hasPrepareJoining ? "PRE_JOINING" : `STATUS_${status}`;
      },
    },
    prisma: {
      application: {
        async findMany(args) {
          findManyCalls.push(args);
          return [
            {
              id: "app-1",
              status: "OFFERED",
              attachments: "{}",
              crew: {
                id: "crew-1",
                fullName: "Crew One",
                rank: "Master",
                nationality: "Indonesia",
                prepareJoinings: [{ id: "pj-1" }],
              },
              principal: { id: "pr-1", name: "Atlas" },
            },
          ];
        },
        async findFirst(args) {
          findFirstCalls.push(args);
          if (args.where.id === "missing") {
            return null;
          }
          return {
            id: args.where.id,
            crewId: "crew-1",
            status: "OFFERED",
            attachments: "{}",
            crew: {
              id: "crew-1",
              fullName: "Crew One",
              rank: "Master",
              nationality: "Indonesia",
              dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
              passportNumber: "P-001",
              seamanBookNumber: "SB-001",
              phone: "123",
              email: "crew1@example.com",
              documents: [],
              prepareJoinings: [{ id: "pj-1" }],
            },
            principal: { id: "pr-1", name: "Atlas" },
          };
        },
      },
    },
  };

  let route = loadRoute("src/app/api/principal/applications/route.ts", mocks);
  let response = await route.GET({ url: "https://example.com/api/principal/applications?status=ALL" });
  assert.equal(response.status, 200);
  assert.deepEqual(findManyCalls[0].where, {
    principalId: "pr-1",
    status: { in: ["OFFERED", "ACCEPTED", "REJECTED"] },
  });
  assert.equal(response.body.total, 1);
  assert.equal(response.body.principal.name, "Atlas");
  assert.equal(response.body.data[0].hgiStage, "PRE_JOINING");

  route = loadRoute("src/app/api/principal/applications/route.ts", mocks);
  response = await route.GET({ url: "https://example.com/api/principal/applications?status=ACCEPTED" });
  assert.equal(response.status, 200);
  assert.equal(findManyCalls[1].where.status, "ACCEPTED");

  mocks.principalSession.ensurePrincipalSession = () => principalDenied;
  route = loadRoute("src/app/api/principal/applications/route.ts", mocks);
  response = await route.GET({ url: "https://example.com/api/principal/applications" });
  assert.equal(response.status, 403);

  mocks.principalSession.ensurePrincipalSession = () => null;
  route = loadRoute("src/app/api/principal/applications/[id]/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "missing" }) });
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/principal/applications/[id]/route.ts", mocks);
  response = await route.GET({}, { params: Promise.resolve({ id: "app-1" }) });
  assert.equal(response.status, 200);
  assert.equal(findFirstCalls[1].where.principalId, "pr-1");
  assert.equal(response.body.hgiStage, "PRE_JOINING");
  assert.equal(response.body.cvReadyBy, "ops-1");
});

test("principal application decision route validates note, enforces offered status, and handles approve/reject side effects", async () => {
  const transactionCalls = [];
  const session = {
    user: {
      id: "principal-user-2",
      principalId: "pr-2",
      principalName: "Oceanic",
    },
  };
  const updateCalls = [];
  const crewUpdateCalls = [];
  const prepareJoiningCreateCalls = [];
  const auditLogCalls = [];
  const mocks = {
    getServerSession: async () => session,
    principalSession: {
      ensurePrincipalSession: () => null,
    },
    applicationFlowState: {
      parseApplicationFlowState() {
        return { cvReadyAt: null, cvReadyBy: null };
      },
      resolveHgiApplicationStage({ status }) {
        return status;
      },
      stringifyApplicationFlowState(_current, patch) {
        return JSON.stringify(patch);
      },
    },
    prisma: {
      application: {
        async findFirst(args) {
          if (args.where.id === "missing") {
            return null;
          }
          if (args.where.id === "not-offered") {
            return {
              id: "not-offered",
              crewId: "crew-2",
              principalId: "pr-2",
              status: "REVIEWING",
              remarks: null,
              attachments: "{}",
            };
          }
          return {
            id: args.where.id,
            crewId: "crew-2",
            principalId: "pr-2",
            status: "OFFERED",
            remarks: "Previous note",
            attachments: "{}",
          };
        },
      },
      $transaction: async (fn) => {
        transactionCalls.push(true);
        return fn({
          application: {
            async update(args) {
              updateCalls.push(args);
              return {
                id: args.where.id,
                status: args.data.status,
                attachments: args.data.attachments,
                crew: {
                  id: "crew-2",
                  fullName: "Crew Two",
                  rank: "Chief Officer",
                  prepareJoinings: args.data.status === "ACCEPTED" ? [{ id: "pj-2" }] : [],
                },
                principal: { id: "pr-2", name: "Oceanic" },
              };
            },
          },
          crew: {
            async update(args) {
              crewUpdateCalls.push(args);
            },
          },
          prepareJoining: {
            async findFirst() {
              return null;
            },
            async create(args) {
              prepareJoiningCreateCalls.push(args);
            },
          },
          auditLog: {
            async create(args) {
              auditLogCalls.push(args);
            },
          },
        });
      },
    },
  };

  let route = loadRoute("src/app/api/principal/applications/[id]/decision/route.ts", mocks);
  let response = await route.POST(
    { async json() { return { decision: "APPROVE", note: "ok" }; } },
    { params: Promise.resolve({ id: "app-2" }) }
  );
  assert.equal(response.status, 400);

  route = loadRoute("src/app/api/principal/applications/[id]/decision/route.ts", mocks);
  response = await route.POST(
    { async json() { return { decision: "APPROVE", note: "Approved by owner" }; } },
    { params: Promise.resolve({ id: "missing" }) }
  );
  assert.equal(response.status, 404);

  route = loadRoute("src/app/api/principal/applications/[id]/decision/route.ts", mocks);
  response = await route.POST(
    { async json() { return { decision: "APPROVE", note: "Approved by owner" }; } },
    { params: Promise.resolve({ id: "not-offered" }) }
  );
  assert.equal(response.status, 400);

  route = loadRoute("src/app/api/principal/applications/[id]/decision/route.ts", mocks);
  response = await route.POST(
    { async json() { return { decision: "APPROVE", note: "Approved by owner" }; } },
    { params: Promise.resolve({ id: "app-approve" }) }
  );
  assert.equal(response.status, 200);
  assert.equal(transactionCalls.length, 1);
  assert.equal(updateCalls[0].data.status, "ACCEPTED");
  assert.equal(crewUpdateCalls.length, 1);
  assert.equal(prepareJoiningCreateCalls.length, 1);
  assert.equal(auditLogCalls[0].data.action, "OWNER_APPROVED_APPLICATION");
  assert.equal(response.body.message, "Submission approved");

  route = loadRoute("src/app/api/principal/applications/[id]/decision/route.ts", mocks);
  response = await route.POST(
    { async json() { return { decision: "REJECT", note: "Not suitable for current vessel" }; } },
    { params: Promise.resolve({ id: "app-reject" }) }
  );
  assert.equal(response.status, 200);
  assert.equal(updateCalls[1].data.status, "REJECTED");
  assert.equal(auditLogCalls[1].data.action, "OWNER_REJECTED_APPLICATION");
  assert.equal(response.body.message, "Submission rejected");
});

test("principal application cv route returns crew json view for accessible application", async () => {
  const principalDenied = {
    status: 403,
    body: { error: "Principal access required" },
    async json() {
      return this.body;
    },
  };
  const session = {
    user: {
      id: "principal-user-3",
      principalId: "pr-3",
      principalName: "Maritime Co",
    },
  };
  const mocks = {
    getServerSession: async () => session,
    principalSession: {
      ensurePrincipalSession: () => null,
    },
    prisma: {
      application: {
        async findFirst(args) {
          if (args.where.id === "missing") {
            return null;
          }
          return {
            id: args.where.id,
            crew: {
              id: "crew-3",
              crewCode: "C-003",
              fullName: "Crew Three",
              rank: "AB",
              nationality: "Indonesia",
              placeOfBirth: "Jakarta",
              dateOfBirth: new Date("1992-05-01T00:00:00.000Z"),
              phone: "999",
              email: "crew3@example.com",
              address: "Dock Street",
              crewStatus: "ACTIVE",
              documents: [],
              assignments: [],
            },
          };
        },
      },
    },
    crewOps: {
      async generateCrewCvPdf() {
        return { success: true, path: "/generated/cv.pdf" };
      },
    },
    fsPromises: {
      async readFile() {
        return Buffer.from("pdf");
      },
    },
  };

  let route = loadRoute("src/app/api/principal/applications/[id]/cv/route.ts", mocks);
  let response = await route.GET(
    { url: "https://example.com/api/principal/applications/app-3/cv" },
    { params: Promise.resolve({ id: "missing" }) }
  );
  assert.equal(response.status, 404);

  response = await route.GET(
    { url: "https://example.com/api/principal/applications/app-3/cv" },
    { params: Promise.resolve({ id: "app-3" }) }
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.fullName, "Crew Three");

  mocks.principalSession.ensurePrincipalSession = () => principalDenied;
  route = loadRoute("src/app/api/principal/applications/[id]/cv/route.ts", mocks);
  response = await route.GET(
    { url: "https://example.com/api/principal/applications/app-3/cv" },
    { params: Promise.resolve({ id: "app-3" }) }
  );
  assert.equal(response.status, 403);
});
