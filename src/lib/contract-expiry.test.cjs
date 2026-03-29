const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  getContractExpiryBand,
  getContractExpiryNextAction,
  buildContractExpiryAlert,
  selectLatestRelevantContract,
} = require("./contract-expiry.ts");

test("contract expiry band maps each threshold bucket consistently", () => {
  assert.equal(getContractExpiryBand(-1), "EXPIRED");
  assert.equal(getContractExpiryBand(15), "CRITICAL");
  assert.equal(getContractExpiryBand(40), "URGENT");
  assert.equal(getContractExpiryBand(55), "FOLLOW_UP");
  assert.equal(getContractExpiryBand(75), "EARLY_WARNING");
  assert.equal(getContractExpiryBand(120), "OK");
});

test("contract expiry next action escalates language as the contract gets closer", () => {
  assert.match(getContractExpiryNextAction(-1), /already expired/i);
  assert.match(getContractExpiryNextAction(20), /Finalize renewal/i);
  assert.match(getContractExpiryNextAction(40), /Start renewal decision/i);
  assert.match(getContractExpiryNextAction(55), /Follow up with operational team/i);
  assert.match(getContractExpiryNextAction(75), /Early warning/i);
  assert.match(getContractExpiryNextAction(120), /normal onboard review cycle/i);
});

test("buildContractExpiryAlert normalizes dates, vessel context, and action state", () => {
  const alert = buildContractExpiryAlert(
    {
      id: "contract-1",
      crewId: "crew-1",
      vessel: { id: "vessel-9", name: "MV Horizon" },
      contractNumber: "C-009",
      contractEnd: "2026-04-10T15:30:00.000Z",
    },
    new Date("2026-03-27T09:00:00.000Z")
  );

  assert.deepEqual(alert, {
    contractId: "contract-1",
    crewId: "crew-1",
    vesselId: "vessel-9",
    contractNumber: "C-009",
    contractEnd: "2026-04-10T00:00:00.000Z",
    daysRemaining: 14,
    band: "CRITICAL",
    nextAction: "Critical. Finalize renewal or confirm reliever and sign-off arrangement immediately.",
  });
});

test("selectLatestRelevantContract prefers active vessel matches and skips closed contracts", () => {
  const selected = selectLatestRelevantContract(
    [
      {
        id: "old-active",
        crewId: "crew-1",
        vesselId: "vessel-1",
        status: "ACTIVE",
        contractEnd: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "closed",
        crewId: "crew-1",
        vesselId: "vessel-1",
        status: "COMPLETED",
        contractEnd: "2026-09-01T00:00:00.000Z",
      },
      {
        id: "best-match",
        crewId: "crew-1",
        vesselId: "vessel-1",
        status: "ACTIVE",
        contractEnd: "2026-08-15T00:00:00.000Z",
      },
      {
        id: "other-vessel",
        crewId: "crew-1",
        vesselId: "vessel-2",
        status: "ACTIVE",
        contractEnd: "2026-10-01T00:00:00.000Z",
      },
    ],
    "vessel-1"
  );

  assert.equal(selected?.id, "best-match");
});

test("selectLatestRelevantContract falls back to the latest active contract when no vessel matches", () => {
  const selected = selectLatestRelevantContract([
    {
      id: "cancelled",
      crewId: "crew-2",
      vesselId: "vessel-1",
      status: "CANCELLED",
      contractEnd: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "active-a",
      crewId: "crew-2",
      vesselId: "vessel-1",
      status: "ACTIVE",
      contractEnd: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "active-b",
      crewId: "crew-2",
      vesselId: "vessel-2",
      status: "ACTIVE",
      contractEnd: "2026-09-01T00:00:00.000Z",
    },
  ], "vessel-9");

  assert.equal(selected?.id, "active-b");
});
