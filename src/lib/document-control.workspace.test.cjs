const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const resolved = path.join(process.cwd(), "src", request.slice(2));
    return originalResolveFilename.call(this, resolved, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const {
  getFolderStatusLabel,
  buildCrewDocumentWorkspaceView,
  formatDocumentReviewLabel,
  getDocumentWorkspaceSchemaProposal,
} = require("./document-control/workspace.ts");

test("document workspace view derives completeness, alerts, and linked status defaults", () => {
  const workspace = buildCrewDocumentWorkspaceView({
    identity: {
      crewId: "crew-1",
      fullName: "Crew One",
      rank: "Chief Officer",
      status: "ACTIVE",
      crewStatus: "ACTIVE",
      assignments: [{ status: "PLANNED" }],
    },
    documents: [
      { id: "d1", docType: "PASSPORT", expiryDate: "2027-01-01T00:00:00.000Z" },
      { id: "d2", docType: "SEAMAN BOOK", expiryDate: "2026-01-01T00:00:00.000Z" },
      { id: "d3", docType: "BST", expiryDate: "2027-05-01T00:00:00.000Z" },
      { id: "d4", docType: "MC", expiryDate: null },
      { id: "d5", docType: "COC", expiryDate: "2028-01-01T00:00:00.000Z" },
      { id: "d6", docType: "COE", expiryDate: "2028-01-01T00:00:00.000Z" },
      { id: "d7", docType: "AFF", expiryDate: "2028-01-01T00:00:00.000Z" },
      { id: "d8", docType: "MEFA", expiryDate: "2028-01-01T00:00:00.000Z" },
      { id: "d9", docType: "SCRB", expiryDate: "2028-01-01T00:00:00.000Z" },
      { id: "d10", docType: "SEA", expiryDate: null },
    ],
    stored: {
      officeFolderPath: "HGI/CREW/HGI_0001__CREW_ONE__CHIEF_OFFICER",
      lastDocumentReviewAt: "2026-03-27T00:00:00.000Z",
      lastDocumentReviewBy: "ops-1",
    },
  });

  assert.equal(workspace.folderStatus, "LINKED");
  assert.equal(workspace.documentCompleteness.status, "EXPIRED");
  assert.equal(workspace.documentCompleteness.totalRequired, 11);
  assert.equal(workspace.documentCompleteness.percent, 73);
  assert.deepEqual(workspace.missingDocuments, ["Visa / Travel Clearance"]);
  assert.deepEqual(workspace.needsReviewDocuments, ["Medical Certificate"]);
  assert.deepEqual(workspace.expiryAlerts, { expiringSoon: 0, expired: 1 });
});

test("document workspace helpers expose status labels and review summaries", () => {
  assert.equal(getFolderStatusLabel("LINKED"), "Linked");
  assert.equal(getFolderStatusLabel("REVIEW_PENDING"), "Review Pending");
  assert.equal(getFolderStatusLabel("NOT_LINKED"), "Not Linked");

  assert.equal(
    formatDocumentReviewLabel({
      lastDocumentReviewAt: "2026-03-27T00:00:00.000Z",
      lastDocumentReviewBy: "ops-1",
    }),
    "Reviewed 27 Mar 2026 by ops-1"
  );
  assert.equal(
    formatDocumentReviewLabel({
      lastDocumentReviewAt: "2026-03-27T00:00:00.000Z",
      lastDocumentReviewBy: null,
    }),
    "Reviewed 27 Mar 2026"
  );
  assert.equal(
    formatDocumentReviewLabel({
      lastDocumentReviewAt: null,
      lastDocumentReviewBy: null,
    }),
    "No review recorded"
  );
});

test("document workspace schema proposal keeps rollout guidance available", () => {
  const proposal = getDocumentWorkspaceSchemaProposal();

  assert.match(proposal.enumBlock, /CrewDocumentWorkspaceStatus/);
  assert.match(proposal.modelBlock, /model CrewDocumentWorkspace/);
  assert.equal(proposal.rationale.length > 0, true);
  assert.equal(proposal.nullableFirstMigrationPlan.length, 5);
  assert.equal(proposal.postponed.length > 0, true);
});
