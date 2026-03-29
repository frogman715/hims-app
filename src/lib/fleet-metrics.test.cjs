const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getFleetRiskLevel, summarizeFleetRows } = require("./fleet-metrics.ts");
const { getFleetActivityBadgeClasses, getFleetRiskBadgeClasses } = require("./fleet-ui.ts");

test("getFleetRiskLevel returns LOW for clear vessels", () => {
  assert.equal(
    getFleetRiskLevel({
      expiringDocuments: 0,
      externalIssues: 0,
      openNonconformities: 0,
      mobilizationQueue: 0,
    }),
    "LOW"
  );
});

test("getFleetRiskLevel escalates to HIGH and CRITICAL with blockers", () => {
  assert.equal(
    getFleetRiskLevel({
      expiringDocuments: 1,
      externalIssues: 0,
      openNonconformities: 1,
      mobilizationQueue: 0,
    }),
    "HIGH"
  );

  assert.equal(
    getFleetRiskLevel({
      expiringDocuments: 2,
      externalIssues: 1,
      openNonconformities: 1,
      mobilizationQueue: 4,
    }),
    "CRITICAL"
  );
});

test("summarizeFleetRows aggregates totals consistently", () => {
  const summary = summarizeFleetRows([
    { activeCrew: 12, mobilizationQueue: 2, riskLevel: "LOW" },
    { activeCrew: 8, mobilizationQueue: 1, riskLevel: "HIGH" },
    { activeCrew: 5, mobilizationQueue: 0, riskLevel: "CRITICAL" },
  ]);

  assert.deepEqual(summary, {
    activeVessels: 3,
    activeCrew: 25,
    mobilizationQueue: 3,
    highRiskVessels: 2,
  });
});

test("fleet badge helpers keep operational statuses distinct", () => {
  assert.equal(getFleetActivityBadgeClasses("PLANNED"), "bg-cyan-100 text-cyan-800");
  assert.equal(getFleetActivityBadgeClasses("ASSIGNED"), "bg-blue-100 text-blue-700");
  assert.equal(getFleetActivityBadgeClasses("ACTIVE"), "bg-indigo-100 text-indigo-700");
  assert.equal(getFleetActivityBadgeClasses("ONBOARD"), "bg-emerald-100 text-emerald-700");
  assert.equal(getFleetActivityBadgeClasses("CRITICAL"), "bg-rose-100 text-rose-700");
});

test("fleet risk badge helpers keep severity colors stable", () => {
  assert.equal(getFleetRiskBadgeClasses("MEDIUM"), "bg-cyan-100 text-cyan-800");
  assert.equal(getFleetRiskBadgeClasses("HIGH"), "bg-amber-100 text-amber-800");
  assert.equal(getFleetRiskBadgeClasses("CRITICAL"), "bg-rose-100 text-rose-700");
});
