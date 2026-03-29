const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  registerTsNode,
  withMockedModuleLoad,
  withSuppressedConsoleError,
} = require("./test-harness.cjs");

registerTsNode({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

function loadErrorHandler() {
  const modulePath = path.join(process.cwd(), "src/lib/error-handler.ts");
  delete require.cache[require.resolve(modulePath)];
  return withMockedModuleLoad(
    {
      "next/server": {
        NextResponse: {
          json(body, init = {}) {
            return {
              status: init.status ?? 200,
              async text() {
                return JSON.stringify(body);
              },
            };
          },
        },
      },
    },
    () => require(modulePath)
  );
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

test("error handler maps auth, api, prisma, and generic errors to stable responses", async () => {
  await withSuppressedConsoleError(async () => {
    const {
      ApiError,
      handleApiError,
    } = loadErrorHandler();

    const authResponse = handleApiError(new Error("Authentication token expired"));
    assert.equal(authResponse.status, 401);
    assert.deepEqual(await readJson(authResponse), {
      error: "Authentication required. Please sign in again.",
      code: "AUTHENTICATION_ERROR",
    });

    const apiResponse = handleApiError(new ApiError(403, "Forbidden", "FORBIDDEN", { reason: "x" }));
    assert.equal(apiResponse.status, 403);
    assert.deepEqual(await readJson(apiResponse), {
      error: "Forbidden",
      code: "FORBIDDEN",
    });

    const prismaDuplicate = handleApiError({ code: "P2002" });
    assert.equal(prismaDuplicate.status, 409);
    assert.deepEqual(await readJson(prismaDuplicate), {
      error: "A record with this value already exists",
      code: "DUPLICATE_ENTRY",
    });

    const generic = handleApiError(new Error("boom"));
    assert.equal(generic.status, 500);
    assert.deepEqual(await readJson(generic), {
      error: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
  });
});

test("validation helpers enforce required fields and safe pagination", async () => {
  await withSuppressedConsoleError(async () => {
    const {
      validateRequired,
      validatePagination,
      handleSessionError,
    } = loadErrorHandler();

    assert.throws(() => validateRequired("", "email"), /email is required/);
    assert.deepEqual(validatePagination("500", "3"), { limit: 100, offset: 3 });
    assert.throws(() => validatePagination("0", "0"), /Invalid limit parameter/);
    assert.throws(() => validatePagination("10", "-1"), /Invalid offset parameter/);

    const sessionResponse = handleSessionError("documents-api");
    assert.equal(sessionResponse.status, 401);
    assert.deepEqual(await readJson(sessionResponse), {
      error: "Your session has expired. Please sign in again.",
      code: "SESSION_EXPIRED",
    });
  });
});
