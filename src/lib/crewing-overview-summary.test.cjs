const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getCrewingOverviewSummaryMetrics } = require("./crewing-overview-summary.ts");

test("getCrewingOverviewSummaryMetrics returns active fleet based overview counters", async () => {
  const countFactory = (values) => ({
    async count() {
      return values.shift();
    },
  });

  const db = {
    crew: countFactory([12]),
    principal: countFactory([4]),
    vessel: countFactory([9]),
    assignment: countFactory([7, 5]),
    application: countFactory([6, 3]),
    interview: countFactory([2]),
    prepareJoining: countFactory([8]),
    crewReplacement: countFactory([1]),
    crewDocument: countFactory([11, 18, 20]),
    documentReceipt: countFactory([14]),
    orientation: countFactory([2]),
    crewSignOff: countFactory([4]),
    externalCompliance: countFactory([5]),
  };

  const result = await getCrewingOverviewSummaryMetrics(db, new Date("2026-03-24T00:00:00.000Z"));

  assert.deepEqual(result, {
    activeSeafarers: 12,
    principalCount: 4,
    vesselCount: 9,
    activeAssignments: 7,
    plannedAssignments: 5,
    pendingApplications: 6,
    applicationInProgress: 3,
    scheduledInterviews: 2,
    prepareJoiningInProgress: 8,
    crewReplacementPending: 1,
    documentsExpiringSoon: 11,
    compliantDocuments: 18,
    totalDocuments: 20,
    documentReceiptsTotal: 14,
    trainingInProgress: 2,
    signOffThisMonth: 4,
    externalComplianceActive: 5,
  });
});
