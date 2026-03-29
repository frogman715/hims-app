const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { buildSeafarerBiodataQualitySnapshot } = require("./seafarer-biodata-quality.ts");

test("seafarer biodata quality snapshot flags critical and warning gaps from one shared rule set", () => {
  const snapshot = buildSeafarerBiodataQualitySnapshot(
    {
      id: "crew-1",
      rank: null,
      nationality: "",
      dateOfBirth: null,
      placeOfBirth: null,
      phone: null,
      email: null,
      crewStatus: "AVAILABLE",
      emergencyContactName: "Jane",
      emergencyContactPhone: null,
    },
    {
      now: new Date("2026-03-28T00:00:00.000Z"),
      expiryWarningDays: 30,
      documents: [
        { id: "doc-1", docType: "Passport", expiryDate: "2026-03-20T00:00:00.000Z" },
        { id: "doc-2", docType: "Medical Certificate", expiryDate: "2026-04-10T00:00:00.000Z" },
      ],
      assignments: [],
      latestSeaServiceRecord: {
        vesselType: null,
        flag: null,
        grt: null,
        engineOutput: null,
      },
    }
  );

  assert.equal(snapshot.readinessStatus, "NOT_READY");
  assert.equal(snapshot.hasPassport, true);
  assert.equal(snapshot.hasSeamanBook, false);
  assert.equal(snapshot.hasMedical, true);
  assert.equal(snapshot.expiredDocuments.length, 1);
  assert.deepEqual(
    snapshot.issues.map((issue) => issue.code),
    [
      "MISSING_RANK",
      "MISSING_NATIONALITY",
      "MISSING_BIRTH_DETAILS",
      "MISSING_CONTACT",
      "MISSING_EMERGENCY_CONTACT",
      "MISSING_MANDATORY_DOCUMENTS",
      "EXPIRED_DOCUMENTS",
      "INCOMPLETE_SEA_SERVICE",
      "NO_ACTIVE_ASSIGNMENT",
    ]
  );
});

test("seafarer biodata quality snapshot returns ready when operational identity is complete", () => {
  const snapshot = buildSeafarerBiodataQualitySnapshot(
    {
      id: "crew-2",
      rank: "Chief Officer",
      nationality: "Indonesia",
      dateOfBirth: "1991-02-10T00:00:00.000Z",
      placeOfBirth: "Jakarta",
      phone: "0812",
      email: null,
      crewStatus: "ONBOARD",
      emergencyContactName: "Jane",
      emergencyContactPhone: "0813",
    },
    {
      now: new Date("2026-03-28T00:00:00.000Z"),
      documents: [
        { id: "doc-1", docType: "Passport", expiryDate: "2027-03-20T00:00:00.000Z" },
        { id: "doc-2", docType: "Seaman Book", expiryDate: "2027-04-20T00:00:00.000Z" },
        { id: "doc-3", docType: "Medical Certificate", expiryDate: "2026-09-20T00:00:00.000Z" },
      ],
      assignments: [{ status: "ONBOARD" }],
      latestSeaServiceRecord: {
        vesselType: "Bulk Carrier",
        flag: "SG",
        grt: 50000,
        engineOutput: "10200 kW",
      },
    }
  );

  assert.equal(snapshot.readinessStatus, "READY");
  assert.deepEqual(snapshot.issues, []);
});
