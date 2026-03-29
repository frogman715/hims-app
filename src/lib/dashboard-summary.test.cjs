const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getDashboardSummaryMetrics } = require("./dashboard-summary.ts");

test("getDashboardSummaryMetrics queries and returns normalized fleet counters", async () => {
  const calls = [];
  const countFactory = (name, values) => ({
    async count(args) {
      calls.push({ name, args });
      return values.shift();
    },
  });

  const db = {
    assignment: countFactory("assignment", [4, 2]),
    prepareJoining: countFactory("prepareJoining", [3]),
    application: countFactory("application", [5]),
    crew: countFactory("crew", [40]),
    vessel: countFactory("vessel", [8, 3, 6]),
  };

  const result = await getDashboardSummaryMetrics(db);

  assert.deepEqual(result, {
    crewReady: 4,
    crewOnBoard: 2,
    prepareJoiningAlerts: 3,
    pendingApplications: 5,
    totalCrew: 40,
    activeVessels: 8,
    onboardVessels: 3,
    operationalVessels: 6,
  });

  assert.equal(calls.length, 8);
});
