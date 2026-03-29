const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  DOCUMENT_TYPES,
  getDocumentTypeLabel,
  isKnownDocumentType,
  getDocumentTypesByCategory,
  getAllDocumentTypes,
} = require("./document-types.ts");

test("document type helpers expose stable labels and category filtering", () => {
  assert.equal(getDocumentTypeLabel("PASSPORT"), "PASPOR (Passport)");
  assert.equal(getDocumentTypeLabel("UNKNOWN_DOC"), "UNKNOWN_DOC");
  assert.equal(isKnownDocumentType(" passport "), true);
  assert.equal(isKnownDocumentType("unknown_doc"), false);
  assert.equal(isKnownDocumentType(null), false);

  const identityTypes = getDocumentTypesByCategory("identity");
  assert.equal(identityTypes.some((item) => item.value === "PASSPORT"), true);
  assert.equal(identityTypes.every((item) => item.category === "identity"), true);
  assert.equal(getAllDocumentTypes(), DOCUMENT_TYPES);
});
