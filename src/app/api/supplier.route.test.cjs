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
      "@/lib/supplier/service": mocks.supplierService,
      "@prisma/client": {
        SupplierStatus: {
          ACTIVE: "ACTIVE",
          INACTIVE: "INACTIVE",
        },
        SupplierType: {
          VENDOR: "VENDOR",
          CONTRACTOR: "CONTRACTOR",
        },
      },
    },
    () => require(modulePath)
  );
}

test("supplier stats and performance routes enforce auth and forward service calls", async () => {
  await withSuppressedConsole(["error"], async () => {
    const performanceCalls = [];
    const mocks = {
      getServerSession: async () => null,
      supplierService: {
        async getSupplierStats() {
          return { totalSuppliers: 12, activeSuppliers: 10 };
        },
        async getSupplierPerformanceRanking(limit) {
          performanceCalls.push(limit);
          return [{ supplierId: "sup-1", score: 92 }];
        },
      },
    };

    let route = loadRoute("src/app/api/supplier/stats/route.ts", mocks);
    let response = await route.GET();
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-1" } });
    route = loadRoute("src/app/api/supplier/stats/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { totalSuppliers: 12, activeSuppliers: 10 });

    route = loadRoute("src/app/api/supplier/performance/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/supplier/performance?limit=15" });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [{ supplierId: "sup-1", score: 92 }]);
    assert.deepEqual(performanceCalls, [15]);
  });
});

test("supplier list and register routes enforce auth and normalize query/body forwarding", async () => {
  await withSuppressedConsole(["error"], async () => {
    const listCalls = [];
    const registerCalls = [];
    const mocks = {
      getServerSession: async () => null,
      supplierService: {
        async listSuppliers(args) {
          listCalls.push(args);
          return { data: [{ id: "sup-2", name: "Atlas Vendor" }], total: 1 };
        },
        async registerSupplier(args) {
          registerCalls.push(args);
          return { id: "sup-3", ...args };
        },
      },
    };

    let route = loadRoute("src/app/api/supplier/list/route.ts", mocks);
    let response = await route.GET({ url: "https://example.com/api/supplier/list" });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-2" } });
    route = loadRoute("src/app/api/supplier/list/route.ts", mocks);
    response = await route.GET({
      url: "https://example.com/api/supplier/list?status=ACTIVE&type=VENDOR&limit=30&offset=10",
    });
    assert.equal(response.status, 200);
    assert.deepEqual(listCalls[0], {
      status: "ACTIVE",
      supplierType: "VENDOR",
      limit: 30,
      offset: 10,
    });
    assert.deepEqual(response.body, { data: [{ id: "sup-2", name: "Atlas Vendor" }], total: 1 });

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/supplier/list/route.ts", mocks);
    response = await route.POST({ async json() { return {}; } });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-2" } });
    route = loadRoute("src/app/api/supplier/list/route.ts", mocks);
    response = await route.POST({
      async json() {
        return {
          supplierCode: "SUP-003",
          name: "Oceanic Services",
          supplierType: "CONTRACTOR",
          contactPerson: "Jane",
          email: "jane@example.com",
          phone: "12345",
          address: "Harbor Road",
        };
      },
    });
    assert.equal(response.status, 201);
    assert.deepEqual(registerCalls[0], {
      supplierCode: "SUP-003",
      name: "Oceanic Services",
      supplierType: "CONTRACTOR",
      contactPerson: "Jane",
      email: "jane@example.com",
      phone: "12345",
      address: "Harbor Road",
    });
  });
});

test("supplier compliance routes enforce auth and forward list/create payloads", async () => {
  await withSuppressedConsole(["error"], async () => {
    const listCalls = [];
    const recordCalls = [];
    const mocks = {
      getServerSession: async () => null,
      supplierService: {
        async listSupplierCompliance(id) {
          listCalls.push(id);
          return [{ id: "comp-1", supplierId: id, status: "OPEN" }];
        },
        async recordSupplierCompliance(args) {
          recordCalls.push(args);
          return { id: "comp-2", ...args };
        },
      },
    };

    let route = loadRoute("src/app/api/supplier/[id]/compliance/route.ts", mocks);
    let response = await route.GET({}, { params: Promise.resolve({ id: "sup-9" }) });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-3" } });
    route = loadRoute("src/app/api/supplier/[id]/compliance/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ id: "sup-9" }) });
    assert.equal(response.status, 200);
    assert.deepEqual(listCalls, ["sup-9"]);
    assert.deepEqual(response.body, [{ id: "comp-1", supplierId: "sup-9", status: "OPEN" }]);

    mocks.getServerSession = async () => null;
    route = loadRoute("src/app/api/supplier/[id]/compliance/route.ts", mocks);
    response = await route.POST(
      { async json() { return {}; } },
      { params: Promise.resolve({ id: "sup-9" }) }
    );
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { id: "user-3" } });
    route = loadRoute("src/app/api/supplier/[id]/compliance/route.ts", mocks);
    response = await route.POST(
      {
        async json() {
          return {
            requirement: "ISO 9001",
            status: "PENDING",
            dueDate: "2026-04-15T00:00:00.000Z",
            evidence: "cert.pdf",
            notes: "Initial submission",
          };
        },
      },
      { params: Promise.resolve({ id: "sup-9" }) }
    );
    assert.equal(response.status, 201);
    assert.equal(recordCalls[0].supplierId, "sup-9");
    assert.equal(recordCalls[0].requirement, "ISO 9001");
    assert.equal(recordCalls[0].status, "PENDING");
    assert.equal(recordCalls[0].dueDate.toISOString(), "2026-04-15T00:00:00.000Z");
    assert.equal(recordCalls[0].evidence, "cert.pdf");
    assert.equal(recordCalls[0].notes, "Initial submission");
  });
});
