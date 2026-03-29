const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getFleetRiskBadgeClasses, getFleetActivityBadgeClasses } = require("./fleet-ui.ts");

test("fleet risk badge classes stay stable across severity levels", () => {
  assert.equal(getFleetRiskBadgeClasses("CRITICAL"), "bg-rose-100 text-rose-700");
  assert.equal(getFleetRiskBadgeClasses("HIGH"), "bg-amber-100 text-amber-800");
  assert.equal(getFleetRiskBadgeClasses("MEDIUM"), "bg-cyan-100 text-cyan-800");
  assert.equal(getFleetRiskBadgeClasses("LOW"), "bg-emerald-100 text-emerald-700");
});

test("fleet activity badge classes distinguish crew movement and compliance states", () => {
  assert.equal(getFleetActivityBadgeClasses("PLANNED"), "bg-cyan-100 text-cyan-800");
  assert.equal(getFleetActivityBadgeClasses("ASSIGNED"), "bg-blue-100 text-blue-700");
  assert.equal(getFleetActivityBadgeClasses("ACTIVE"), "bg-indigo-100 text-indigo-700");
  assert.equal(getFleetActivityBadgeClasses("ONBOARD"), "bg-emerald-100 text-emerald-700");
  assert.equal(getFleetActivityBadgeClasses("NON_COMPLIANT"), "bg-rose-100 text-rose-700");
  assert.equal(getFleetActivityBadgeClasses("NO_RECORD"), "bg-amber-100 text-amber-800");
  assert.equal(getFleetActivityBadgeClasses("UNKNOWN"), "bg-slate-100 text-slate-600");
});
