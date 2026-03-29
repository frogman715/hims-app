const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { rateLimit } = require("./rate-limit.ts");

test("rateLimit enforces request cap within a window and resets after expiry", () => {
  const originalNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;

  try {
    assert.equal(rateLimit("rl-user-a", 2, 1000), true);
    assert.equal(rateLimit("rl-user-a", 2, 1000), true);
    assert.equal(rateLimit("rl-user-a", 2, 1000), false);

    now += 1001;
    assert.equal(rateLimit("rl-user-a", 2, 1000), true);
  } finally {
    Date.now = originalNow;
  }
});

test("rateLimit tracks identifiers independently", () => {
  assert.equal(rateLimit("rl-user-b", 1, 60000), true);
  assert.equal(rateLimit("rl-user-c", 1, 60000), true);
});
