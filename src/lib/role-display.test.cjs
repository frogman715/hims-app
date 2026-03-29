const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getRoleDisplayName } = require("./role-display.ts");

test("getRoleDisplayName resolves user-facing labels and system admin suffix", () => {
  assert.equal(getRoleDisplayName("cdmo"), "Crewing Document Control");
  assert.equal(getRoleDisplayName("crew"), "Crew Portal");
  assert.equal(getRoleDisplayName("ga_driver", true), "General Affair / Driver (System Admin)");
  assert.equal(getRoleDisplayName("unlisted"), "User");
});
