const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  parseApplicationFlowState,
  stringifyApplicationFlowState,
  resolveHgiApplicationStage,
  getHgiStageMeta,
} = require("./application-flow-state.ts");

test("parseApplicationFlowState returns defaults for empty and invalid values", () => {
  assert.deepEqual(parseApplicationFlowState(null), { files: [] });
  assert.deepEqual(parseApplicationFlowState(""), { files: [] });
  assert.deepEqual(parseApplicationFlowState("{not-json"), { files: [] });
});

test("parseApplicationFlowState accepts legacy attachment arrays and filters blank entries", () => {
  assert.deepEqual(parseApplicationFlowState('["cv.pdf","","  ",123,"medical.pdf"]'), {
    files: ["cv.pdf", "medical.pdf"],
  });
});

test("parseApplicationFlowState normalizes object payloads and drops non-string metadata", () => {
  assert.deepEqual(
    parseApplicationFlowState(
      JSON.stringify({
        files: ["cv.pdf", "", null, "passport.pdf"],
        hgiStage: "CV_READY",
        cvReadyAt: "2026-03-27T00:00:00.000Z",
        cvReadyBy: 123,
      })
    ),
    {
      files: ["cv.pdf", "passport.pdf"],
      hgiStage: "CV_READY",
      cvReadyAt: "2026-03-27T00:00:00.000Z",
      cvReadyBy: null,
    }
  );
});

test("stringifyApplicationFlowState merges patch data over the parsed current state", () => {
  const next = stringifyApplicationFlowState(
    JSON.stringify({
      files: ["cv.pdf"],
      hgiStage: "DOCUMENT_CHECK",
      cvReadyAt: null,
      cvReadyBy: null,
    }),
    {
      hgiStage: "CV_READY",
      cvReadyAt: "2026-03-28T00:00:00.000Z",
      cvReadyBy: "ops-1",
    }
  );

  assert.deepEqual(JSON.parse(next), {
    files: ["cv.pdf"],
    hgiStage: "CV_READY",
    cvReadyAt: "2026-03-28T00:00:00.000Z",
    cvReadyBy: "ops-1",
  });
});

test("resolveHgiApplicationStage prioritizes prepare joining and explicit flow stage", () => {
  assert.equal(
    resolveHgiApplicationStage({
      status: "ACCEPTED",
      attachments: JSON.stringify({ files: [], hgiStage: "OWNER_APPROVED" }),
      hasPrepareJoining: true,
    }),
    "PRE_JOINING"
  );

  assert.equal(
    resolveHgiApplicationStage({
      status: "REVIEWING",
      attachments: JSON.stringify({ files: [], hgiStage: "SENT_TO_OWNER" }),
      hasPrepareJoining: false,
    }),
    "SENT_TO_OWNER"
  );
});

test("resolveHgiApplicationStage falls back to status mapping when no explicit stage exists", () => {
  assert.equal(
    resolveHgiApplicationStage({
      status: "REVIEWING",
      attachments: JSON.stringify({ files: ["cv.pdf"], cvReadyAt: "2026-03-27T00:00:00.000Z" }),
    }),
    "CV_READY"
  );

  assert.equal(resolveHgiApplicationStage({ status: "RECEIVED" }), "DRAFT");
  assert.equal(resolveHgiApplicationStage({ status: "OFFERED" }), "SENT_TO_OWNER");
  assert.equal(resolveHgiApplicationStage({ status: "UNKNOWN" }), "CLOSED");
});

test("getHgiStageMeta returns stable labels and default closed fallback", () => {
  assert.deepEqual(getHgiStageMeta("PRE_JOINING"), {
    label: "Pre-Joining",
    nextStep: "Operational team continues mobilization from the Prepare Joining board.",
  });

  assert.deepEqual(getHgiStageMeta("SENT_TO_OWNER"), {
    label: "Sent to Principal",
    nextStep: "Wait for the principal decision in the principal portal.",
  });

  assert.deepEqual(getHgiStageMeta("UNLISTED_STAGE"), {
    label: "Closed",
    nextStep: "This record is closed and no longer active in the HGI candidate pipeline.",
  });
});
