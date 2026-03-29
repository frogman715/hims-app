const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  DOCUMENT_CONTROL_WARNING_MONTHS,
  getDocumentControlExpiryThreshold,
  getDocumentExpiryState,
  getDocumentExpiryPresentation,
} = require("./document-expiry.ts");

test("document expiry threshold uses the configured warning window", () => {
  const reference = new Date("2026-03-27T00:00:00.000Z");
  const threshold = getDocumentControlExpiryThreshold(reference);

  assert.equal(DOCUMENT_CONTROL_WARNING_MONTHS, 14);
  assert.equal(threshold.toISOString(), "2027-05-27T00:00:00.000Z");
});

test("document expiry state distinguishes expired, expiring soon, valid, and missing values", () => {
  const reference = new Date("2026-03-27T00:00:00.000Z");

  assert.equal(getDocumentExpiryState(null, reference), "NO_EXPIRY");
  assert.equal(getDocumentExpiryState("invalid-date", reference), "NO_EXPIRY");
  assert.equal(getDocumentExpiryState("2026-03-27T00:00:00.000Z", reference), "EXPIRED");
  assert.equal(getDocumentExpiryState("2027-05-27T00:00:00.000Z", reference), "EXPIRING_SOON");
  assert.equal(getDocumentExpiryState("2027-05-28T00:00:00.000Z", reference), "VALID");
});

test("document expiry presentation keeps labels and classes aligned with the state", () => {
  const reference = new Date("2026-03-27T00:00:00.000Z");

  assert.deepEqual(getDocumentExpiryPresentation(undefined, reference), {
    label: "No Expiry",
    className: "bg-gray-100 text-gray-700",
  });
  assert.deepEqual(getDocumentExpiryPresentation("2026-03-20T00:00:00.000Z", reference), {
    label: "Expired",
    className: "bg-rose-100 text-rose-700",
  });
  assert.deepEqual(getDocumentExpiryPresentation("2027-01-01T00:00:00.000Z", reference), {
    label: "Expiring Soon",
    className: "bg-amber-100 text-amber-700",
  });
  assert.deepEqual(getDocumentExpiryPresentation("2028-01-01T00:00:00.000Z", reference), {
    label: "Valid",
    className: "bg-emerald-100 text-emerald-700",
  });
});
