const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  formatStatusLabel,
  formatDateLabel,
  formatDateTimeLabel,
} = require("./formatters.ts");

test("formatStatusLabel converts screaming snake case to readable labels", () => {
  assert.equal(formatStatusLabel("OWNER_APPROVED"), "Owner Approved");
  assert.equal(formatStatusLabel("in_progress"), "In Progress");
});

test("formatDateLabel returns placeholders for empty and invalid values", () => {
  assert.equal(formatDateLabel(null), "—");
  assert.equal(formatDateLabel("not-a-date"), "—");
});

test("formatDateLabel renders deterministic output for explicit locale", () => {
  assert.equal(formatDateLabel("2026-03-27T00:00:00.000Z", "en-GB"), "27 Mar 2026");
  assert.equal(formatDateLabel(new Date("2026-03-27T00:00:00.000Z"), "en-US"), "Mar 27, 2026");
});

test("formatDateTimeLabel returns fallback text and localized date time output", () => {
  assert.equal(formatDateTimeLabel(undefined), "No date");
  assert.equal(formatDateTimeLabel("invalid"), "No date");
  assert.equal(
    formatDateTimeLabel("2026-03-27T13:45:00.000Z", "en-GB"),
    "27 Mar 2026, 13:45"
  );
});
