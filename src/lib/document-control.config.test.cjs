const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  getRequiredDocumentRules,
  summarizeCrewCompleteness,
} = require("./document-control/config.ts");

test("getRequiredDocumentRules resolves one authoritative rule set per crew context", () => {
  const baseIdentity = {
    crewId: "crew-1",
    fullName: "Crew One",
    rank: "OS",
    status: "ACTIVE",
    crewStatus: "ACTIVE",
    assignments: [],
  };

  assert.deepEqual(
    getRequiredDocumentRules(baseIdentity).map((rule) => rule.code),
    ["PASSPORT", "SEAMAN_BOOK", "BST", "NATIONAL_MEDICAL_EXAM_CERT", "SEA", "VISA"]
  );

  assert.deepEqual(
    getRequiredDocumentRules({
      ...baseIdentity,
      rank: "Chief Officer",
    }).map((rule) => rule.code),
    [
      "PASSPORT",
      "SEAMAN_BOOK",
      "BST",
      "NATIONAL_MEDICAL_EXAM_CERT",
      "COC_IJAZAH_NAUTICA",
      "COE_ENDORSEMENT",
      "AFF",
      "MEFA",
      "SCRB",
      "SEA",
      "VISA",
    ]
  );

  assert.deepEqual(
    getRequiredDocumentRules({
      ...baseIdentity,
      assignments: [{ status: "PLANNED" }],
    }).map((rule) => rule.code),
    [
      "PASSPORT",
      "SEAMAN_BOOK",
      "BST",
      "NATIONAL_MEDICAL_EXAM_CERT",
      "SEA",
      "VISA",
    ]
  );
});

test("summarizeCrewCompleteness derives incomplete, expired, and review statuses from uploaded documents", () => {
  const referenceDate = new Date("2026-03-26T00:00:00.000Z");
  const identity = {
    crewId: "crew-2",
    fullName: "Licensed Joining Crew",
    rank: "Chief Officer",
    status: "ACTIVE",
    crewStatus: "ACTIVE",
    assignments: [{ status: "PLANNED" }],
  };

  const summary = summarizeCrewCompleteness(
    [
      { id: "d1", docType: "PASSPORT", expiryDate: "2027-01-01T00:00:00.000Z" },
      { id: "d2", docType: "SEAMAN BOOK", expiryDate: "2026-01-01T00:00:00.000Z" },
      { id: "d3", docType: "BST", expiryDate: "2026-08-01T00:00:00.000Z" },
      { id: "d4", docType: "MC", expiryDate: null },
      { id: "d5", docType: "COC", expiryDate: "2028-01-01T00:00:00.000Z" },
      { id: "d6", docType: "COE", expiryDate: "2028-02-01T00:00:00.000Z" },
      { id: "d7", docType: "AFF", expiryDate: "2028-03-01T00:00:00.000Z" },
      { id: "d8", docType: "MEFA", expiryDate: "2028-04-01T00:00:00.000Z" },
      { id: "d9", docType: "SCRB", expiryDate: "2028-05-01T00:00:00.000Z" },
      { id: "d10", docType: "SEA", expiryDate: null },
    ],
    identity,
    referenceDate
  );

  assert.equal(summary.status, "EXPIRED");
  assert.equal(summary.totalRequired, 11);
  assert.equal(summary.complete, 8);
  assert.equal(summary.present, 10);
  assert.equal(summary.expired, 1);
  assert.equal(summary.expiringSoon, 0);
  assert.deepEqual(summary.missing, ["Visa / Travel Clearance"]);
  assert.deepEqual(summary.needsReview, ["Medical Certificate"]);
  assert.equal(summary.nextAction, "Replace expired required document and update the upload record.");

  const expiredRequirement = summary.requirements.find((item) => item.code === "SEAMAN_BOOK");
  const reviewRequirement = summary.requirements.find((item) => item.code === "NATIONAL_MEDICAL_EXAM_CERT");
  const missingRequirement = summary.requirements.find((item) => item.code === "VISA");

  assert.equal(expiredRequirement?.status, "EXPIRED");
  assert.equal(reviewRequirement?.status, "NEEDS_REVIEW");
  assert.equal(missingRequirement?.status, "INCOMPLETE");
  assert.equal(missingRequirement?.matchedDocumentType, null);
});
