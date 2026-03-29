const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { normalizeRoleToken, normalizeRoleTokens } = require("./role-normalization.ts");

test("normalizeRoleToken trims, uppercases, and applies business aliases", () => {
  assert.equal(normalizeRoleToken(" document "), "CDMO");
  assert.equal(normalizeRoleToken("driver"), "GA_DRIVER");
  assert.equal(normalizeRoleToken("operational"), "OPERATIONAL");
  assert.equal(normalizeRoleToken("   "), null);
  assert.equal(normalizeRoleToken(null), null);
});

test("normalizeRoleTokens flattens sources, removes invalid values, and deduplicates", () => {
  assert.deepEqual(
    normalizeRoleTokens("document", ["driver", "OPERATIONAL", "", "driver"], null, undefined),
    ["CDMO", "GA_DRIVER", "OPERATIONAL"]
  );
});
