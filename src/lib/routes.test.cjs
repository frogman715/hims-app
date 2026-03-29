const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { CREWING_DOCUMENT_RECEIPTS_ROUTE } = require("./routes.ts");

test("route constants stay stable for crewing document receipts", () => {
  assert.equal(CREWING_DOCUMENT_RECEIPTS_ROUTE, "/crewing/document-receipts");
});
