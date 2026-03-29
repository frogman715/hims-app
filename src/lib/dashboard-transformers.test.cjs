const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  groupCrewDocumentsByCrew,
  groupCrewContractsByCrew,
  buildCrewMovementItems,
} = require("./dashboard-transformers.ts");

test("groupCrewDocumentsByCrew merges rows under the same crew", () => {
  const result = groupCrewDocumentsByCrew([
    {
      docType: "PASSPORT",
      expiryDate: new Date("2026-06-01T00:00:00.000Z"),
      crew: { fullName: "Ricky", id: "crew-1" },
    },
    {
      docType: "SEAMAN_BOOK",
      expiryDate: new Date("2026-07-01T00:00:00.000Z"),
      crew: { fullName: "Ricky", id: "crew-1" },
    },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].crewId, "crew-1");
  assert.equal(result[0].documents.length, 2);
});

test("groupCrewContractsByCrew transforms contract alerts per crew", () => {
  const result = groupCrewContractsByCrew(
    [
      {
        id: "contract-1",
        contractNumber: "C-001",
        contractEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        crew: { fullName: "Budi", id: "crew-2" },
        crewId: "crew-2",
        vesselId: "vessel-1",
        vessel: { name: "MV Alpha" },
        principal: { name: "Hanmarine" },
      },
    ],
    () => ({
      daysRemaining: 10,
      band: "CRITICAL",
      nextAction: "Arrange reliever",
    })
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].contracts.length, 1);
  assert.equal(result[0].contracts[0].vesselName, "MV Alpha");
  assert.equal(result[0].contracts[0].principalName, "Hanmarine");
});

test("buildCrewMovementItems normalizes principal fallback and action labels", () => {
  const result = buildCrewMovementItems([
    {
      status: "PLANNED",
      crew: { fullName: "Asep", rank: "COOK" },
      vessel: { name: "MV Beta", principal: null },
      principal: { name: "Fallback Principal" },
    },
    {
      status: "ONBOARD",
      crew: { fullName: "Deni", rank: null },
      vessel: { name: "MV Gamma", principal: { name: "Main Principal" } },
      principal: null,
    },
  ]);

  assert.deepEqual(result, [
    {
      seafarer: "Asep",
      rank: "COOK",
      principal: "Fallback Principal",
      vessel: "MV Beta",
      status: "PLANNED",
      nextAction: "Prepare for sign-on",
    },
    {
      seafarer: "Deni",
      rank: "N/A",
      principal: "Main Principal",
      vessel: "MV Gamma",
      status: "ONBOARD",
      nextAction: "Onboard",
    },
  ]);
});
