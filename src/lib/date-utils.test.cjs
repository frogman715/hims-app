const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  formatDocumentDate,
  getDaysRemaining,
  getExpiryStatus,
} = require("./date-utils.ts");

function withFrozenNow(isoString, run) {
  const RealDate = Date;

  class FakeDate extends RealDate {
    constructor(value) {
      if (arguments.length === 0) {
        super(isoString);
        return;
      }
      super(value);
    }

    static now() {
      return new RealDate(isoString).getTime();
    }

    static parse(value) {
      return RealDate.parse(value);
    }

    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  }

  global.Date = FakeDate;

  try {
    run();
  } finally {
    global.Date = RealDate;
  }
}

test("formatDocumentDate keeps placeholders and returns original text for invalid input", () => {
  assert.equal(formatDocumentDate(null), "-");
  assert.equal(formatDocumentDate("not-a-date"), "not-a-date");
});

test("formatDocumentDate formats valid dates in Jakarta-friendly label form", () => {
  assert.equal(formatDocumentDate("2026-03-27T00:00:00.000Z"), "27 Mar 2026");
});

test("getDaysRemaining and getExpiryStatus classify active, expiring, and expired dates", () => {
  withFrozenNow("2026-03-27T00:00:00.000Z", () => {
    assert.equal(getDaysRemaining("2026-03-30T00:00:00.000Z"), 3);
    assert.equal(getDaysRemaining("2026-03-26T00:00:00.000Z"), -1);
    assert.equal(getDaysRemaining(null), null);

    assert.equal(getExpiryStatus("2026-03-26T00:00:00.000Z"), "EXPIRED");
    assert.equal(getExpiryStatus("2026-05-01T00:00:00.000Z"), "EXPIRING");
    assert.equal(getExpiryStatus("2026-09-01T00:00:00.000Z"), "ACTIVE");
    assert.equal(getExpiryStatus(undefined), "UNKNOWN");
  });
});
