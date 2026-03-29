const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const constants = require("./constants.ts");

test("application constants keep expected safety rails and defaults", () => {
  assert.equal(constants.DOCUMENT_EXPIRY_WARNING_DAYS, 30);
  assert.equal(constants.CONTRACT_EXPIRY_WARNING_DAYS, 60);
  assert.equal(constants.DEFAULT_PAGE_SIZE, 50);
  assert.equal(constants.MAX_PAGE_SIZE, 200);
  assert.equal(constants.MAX_FILE_SIZE, 10 * 1024 * 1024);
  assert.deepEqual(constants.ALLOWED_DOCUMENT_EXTENSIONS, [".pdf", ".jpg", ".jpeg", ".png"]);
  assert.deepEqual(constants.SIUPPAK_VALID_PERIODS, ["BULANAN", "SEMESTER", "TAHUNAN"]);
  assert.equal(constants.COMPANY_NAME.length > 0, true);
  assert.equal(constants.COMPANY_EMAIL.includes("@"), true);
});
