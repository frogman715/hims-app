const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  APP_ROLES,
  OFFICE_ROLES,
  CREW_ROLES,
  ALL_APP_ROLES,
  CREW_ROLE_SET,
  OFFICE_ROLE_SET,
} = require("./roles.ts");

test("role collections keep office and crew partitions stable", () => {
  assert.equal(OFFICE_ROLES.includes(APP_ROLES.DIRECTOR), true);
  assert.equal(OFFICE_ROLES.includes(APP_ROLES.CREW_PORTAL), false);
  assert.deepEqual(CREW_ROLES, [APP_ROLES.CREW, APP_ROLES.CREW_PORTAL]);
  assert.equal(ALL_APP_ROLES.includes(APP_ROLES.HR_ADMIN), true);
  assert.equal(CREW_ROLE_SET.has(APP_ROLES.CREW), true);
  assert.equal(CREW_ROLE_SET.has(APP_ROLES.CDMO), false);
  assert.equal(OFFICE_ROLE_SET.has(APP_ROLES.ACCOUNTING), true);
  assert.equal(OFFICE_ROLE_SET.has(APP_ROLES.CREW_PORTAL), false);
});
