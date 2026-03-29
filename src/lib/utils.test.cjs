const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { cn } = require("./utils.ts");

test("cn merges conditional tailwind classes with conflict resolution", () => {
  assert.equal(cn("px-2", false && "hidden", "text-sm", "px-4"), "text-sm px-4");
  assert.equal(cn("bg-red-500", ["bg-blue-500", null], { hidden: true }), "bg-blue-500 hidden");
});
