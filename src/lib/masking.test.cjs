const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  maskPassport,
  maskDocumentNumber,
  maskSeamanCode,
  maskCurrency,
  maskMedicalResult,
  maskMedicalRemarks,
} = require("./masking.ts");

test("masking helpers preserve only minimal identifying fragments", () => {
  assert.equal(maskPassport("C1234567"), "C1****67");
  assert.equal(maskDocumentNumber("AB123456"), "AB****56");
  assert.equal(maskSeamanCode("1234567890"), "1234****90");
  assert.equal(maskCurrency(5000), "****00");
  assert.equal(maskCurrency(-12.5), "-****50");
  assert.equal(maskMedicalResult("PASS"), "P**S");
  assert.equal(maskMedicalRemarks("Orientation note pending"), "Orientatio**************");
});

test("masking helpers return fallback placeholders for unusable values", () => {
  assert.equal(maskPassport("A1"), "****");
  assert.equal(maskDocumentNumber(""), "****");
  assert.equal(maskSeamanCode("123"), "****");
  assert.equal(maskCurrency(Number.NaN), "****");
  assert.equal(maskMedicalResult("OK"), "***");
  assert.equal(maskMedicalRemarks(""), "");
});
