const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  UserRole,
  ModuleName,
  PermissionLevel,
  DataSensitivity,
  getEffectivePermissionLevel,
  hasPermission,
  hasSensitivityAccess,
  canAccessData,
  validateCrewPortalAccess,
  getAccessibleModules,
  getModulePermission,
} = require("./permissions.ts");

test("permission helpers resolve highest effective level and honor overrides", () => {
  assert.equal(
    getEffectivePermissionLevel([UserRole.HR, UserRole.ACCOUNTING], ModuleName.contracts),
    PermissionLevel.VIEW_ACCESS
  );
  assert.equal(
    getEffectivePermissionLevel(UserRole.ACCOUNTING, ModuleName.contracts, [
      { role: "ACCOUNTING", moduleKey: "contracts", level: "FULL_ACCESS" },
    ]),
    PermissionLevel.FULL_ACCESS
  );
  assert.equal(
    hasPermission(UserRole.CDMO, ModuleName.documents, PermissionLevel.FULL_ACCESS),
    true
  );
  assert.equal(
    hasPermission(UserRole.ACCOUNTING, ModuleName.contracts, PermissionLevel.EDIT_ACCESS),
    false
  );
});

test("sensitivity and combined data access checks stay aligned", () => {
  assert.equal(hasSensitivityAccess(UserRole.HR, DataSensitivity.RED), true);
  assert.equal(hasSensitivityAccess(UserRole.OPERATIONAL, DataSensitivity.RED), false);
  assert.equal(
    canAccessData(
      UserRole.HR,
      ModuleName.crew,
      DataSensitivity.AMBER,
      PermissionLevel.VIEW_ACCESS
    ),
    true
  );
  assert.equal(
    canAccessData(
      UserRole.OPERATIONAL,
      ModuleName.medical,
      DataSensitivity.RED,
      PermissionLevel.VIEW_ACCESS
    ),
    false
  );
});

test("permission helpers expose accessible module lists and crew portal restriction", () => {
  assert.equal(validateCrewPortalAccess(UserRole.CREW_PORTAL, "user-1", "user-1"), true);
  assert.equal(validateCrewPortalAccess(UserRole.CREW_PORTAL, "user-2", "user-1"), false);
  assert.equal(validateCrewPortalAccess(UserRole.DIRECTOR, "user-2", "user-1"), true);

  const accountingModules = getAccessibleModules(UserRole.ACCOUNTING);
  assert.equal(accountingModules.includes(ModuleName.accounting), true);
  assert.equal(accountingModules.includes(ModuleName.agencyFees), true);
  assert.equal(accountingModules.includes(ModuleName.medical), false);

  assert.equal(
    getModulePermission(UserRole.CDMO, ModuleName.documents),
    PermissionLevel.FULL_ACCESS
  );
});
