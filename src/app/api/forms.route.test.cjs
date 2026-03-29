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
      "@/lib/prisma": { prisma: mocks.prisma ?? {} },
      "@/lib/error-handler": mocks.errorHandler ?? {},
      "@/lib/office-api-access": mocks.officeApiAccess ?? {},
      fs: mocks.fs ?? {},
      "fs/promises": mocks.fsPromises ?? {},
      xlsx: mocks.xlsx ?? {},
    },
    () => require(modulePath)
  );
}

test("form reference route enforces access and lists categorized template files only", async () => {
  await withSuppressedConsole(["error"], async () => {
    const mockFs = {
      readdirSync(target) {
        if (target.endsWith("src/form_reference")) {
          return ["CR", "AD", "README.txt"];
        }
        if (target.endsWith(path.join("src/form_reference", "CR"))) {
          return ["CR-01.docx", "ignore.tmp", "CR-02.xlsx"];
        }
        if (target.endsWith(path.join("src/form_reference", "AD"))) {
          return ["AD-01.pdf"];
        }
        return [];
      },
      statSync(target) {
        return {
          isDirectory() {
            return target.endsWith("CR") || target.endsWith("AD");
          },
        };
      },
    };
    const mocks = {
      getServerSession: async () => null,
      fs: mockFs,
    };

    let route = loadRoute("src/app/api/crewing/form-reference/route.ts", mocks);
    let response = await route.GET();
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { roles: ["CREWING"] } });
    route = loadRoute("src/app/api/crewing/form-reference/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 403);

    mocks.getServerSession = async () => ({ user: { roles: ["HR"], isSystemAdmin: false } });
    route = loadRoute("src/app/api/crewing/form-reference/route.ts", mocks);
    response = await route.GET();
    assert.equal(response.status, 200);
    assert.equal(response.body.categories.length, 2);
    assert.equal(response.body.categories[0].categoryCode, "hgf-ad");
    assert.deepEqual(response.body.categories[1].forms, [
      { filename: "CR-01.docx", type: "docx" },
      { filename: "CR-02.xlsx", type: "xlsx" },
    ]);
  });
});

test("form reference download route validates query and serves template file", async () => {
  await withSuppressedConsole(["error"], async () => {
    const mockFs = {
      existsSync(filePath) {
        return filePath.endsWith(path.join("src/form_reference", "CR", "CR-01.docx"));
      },
      readFileSync() {
        return Buffer.from("docx-content");
      },
    };
    const mocks = {
      getServerSession: async () => null,
      fs: mockFs,
    };

    let route = loadRoute("src/app/api/crewing/form-reference/download/route.ts", mocks);
    let response = await route.GET({ url: "https://example.com/api/crewing/form-reference/download" });
    assert.equal(response.status, 401);

    mocks.getServerSession = async () => ({ user: { roles: ["DIRECTOR"], isSystemAdmin: false } });
    route = loadRoute("src/app/api/crewing/form-reference/download/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/crewing/form-reference/download?category=hgf-cr" });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/crewing/form-reference/download/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/crewing/form-reference/download?category=bad&filename=x.docx" });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/crewing/form-reference/download/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/crewing/form-reference/download?category=hgf-cr&filename=../evil.docx" });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/crewing/form-reference/download/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/crewing/form-reference/download?category=hgf-cr&filename=CR-01.docx" });
    assert.equal(response.status, 200);
    assert.equal(response.headers["Content-Type"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    assert.equal(response.headers["Content-Disposition"], 'attachment; filename="CR-01.docx"');
  });
});

test("form reference generate route validates params, checks crew, and returns renamed filled file", async () => {
  await withSuppressedConsole(["error", "log"], async () => {
    const mockFs = {
      existsSync(filePath) {
        return filePath.endsWith(path.join("src/form_reference", "CR", "CR-02.pdf"));
      },
      readFileSync() {
        return Buffer.from("pdf-template");
      },
    };
    const mocks = {
      getServerSession: async () => ({ user: { roles: ["HR"], isSystemAdmin: false } }),
      fs: mockFs,
      prisma: {
        crew: {
          async findUnique(args) {
            return args.where.id === "missing"
              ? null
              : {
                  id: "crew-1",
                  fullName: "Crew One",
                  rank: "Master",
                };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/crewing/form-reference/generate/route.ts", mocks);
    let response = await route.GET({ url: "https://example.com/api/crewing/form-reference/generate?category=hgf-cr&filename=CR-02.pdf" });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/crewing/form-reference/generate/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/crewing/form-reference/generate?category=bad&filename=CR-02.pdf&crewId=crew-1" });
    assert.equal(response.status, 400);

    route = loadRoute("src/app/api/crewing/form-reference/generate/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/crewing/form-reference/generate?category=hgf-cr&filename=CR-02.pdf&crewId=missing" });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/crewing/form-reference/generate/route.ts", mocks);
    response = await route.GET({ url: "https://example.com/api/crewing/form-reference/generate?category=hgf-cr&filename=CR-02.pdf&crewId=crew-1" });
    assert.equal(response.status, 200);
    assert.equal(response.headers["Content-Type"], "application/pdf");
    assert.match(response.headers["Content-Disposition"], /cr-02_crew_one\.pdf/i);
  });
});

test("letter guarantee route enforces office access and returns generated form payload", async () => {
  await withSuppressedConsole(["error"], async () => {
    const accessDenied = {
      status: 403,
      body: { error: "Forbidden" },
      async json() {
        return this.body;
      },
    };
    const mocks = {
      getServerSession: async () => ({ user: { id: "ops-1" } }),
      officeApiAccess: {
        ensureOfficeApiPathAccess: () => null,
      },
      errorHandler: {},
      prisma: {
        prepareJoining: {
          async findUnique(args) {
            if (args.where.id === "missing") {
              return null;
            }
            if (args.where.id === "no-principal") {
              return {
                id: "no-principal",
                principalId: null,
                crew: { fullName: "Crew One" },
                principal: null,
                forms: [],
              };
            }
            return {
              id: args.where.id,
              principalId: "pr-1",
              departureDate: new Date("2026-04-15T00:00:00.000Z"),
              departurePort: "Jakarta",
              crew: {
                id: "crew-1",
                fullName: "Crew One",
                rank: "Master",
                dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
                passportNumber: "P-001",
                seamanBookNumber: "SB-001",
              },
              principal: {
                id: "pr-1",
                name: "Atlas",
                registrationNumber: "REG-1",
                address: "Harbor Road",
                contactPerson: "Jane",
                email: "atlas@example.com",
                phone: "123",
              },
              forms: [{ id: "form-1", status: "DRAFT" }],
            };
          },
        },
      },
    };

    let route = loadRoute("src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts", mocks);
    let response = await route.GET({}, { params: Promise.resolve({ prepareJoiningId: "missing" }) });
    assert.equal(response.status, 404);

    route = loadRoute("src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ prepareJoiningId: "no-principal" }) });
    assert.equal(response.status, 400);

    mocks.officeApiAccess.ensureOfficeApiPathAccess = () => accessDenied;
    route = loadRoute("src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ prepareJoiningId: "pj-1" }) });
    assert.equal(response.status, 403);

    mocks.officeApiAccess.ensureOfficeApiPathAccess = () => null;
    route = loadRoute("src/app/api/forms/letter-guarantee/[prepareJoiningId]/route.ts", mocks);
    response = await route.GET({}, { params: Promise.resolve({ prepareJoiningId: "pj-1" }) });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.principalName, "Atlas");
    assert.equal(response.body.data.crewTable[0].name, "Crew One");
    assert.match(response.body.html, /Letter of Guarantee/i);
  });
});
