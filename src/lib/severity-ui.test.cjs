const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getSeverityBadgeClasses } = require("./severity-ui.ts");

test("getSeverityBadgeClasses maps grouped severities to stable tones", () => {
  assert.equal(getSeverityBadgeClasses("critical"), "bg-rose-100 text-rose-700");
  assert.equal(getSeverityBadgeClasses("URGENT"), "bg-amber-100 text-amber-800");
  assert.equal(getSeverityBadgeClasses("pending"), "bg-cyan-100 text-cyan-800");
  assert.equal(getSeverityBadgeClasses("VERIFIED"), "bg-emerald-100 text-emerald-700");
  assert.equal(getSeverityBadgeClasses("unknown"), "bg-slate-100 text-slate-700");
});
