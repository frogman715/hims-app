const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getPrepareJoiningHgiStatusMeta } = require("./prepare-joining-flow.ts");

test("getPrepareJoiningHgiStatusMeta keeps each operational status aligned to the right handoff copy", () => {
  assert.deepEqual(getPrepareJoiningHgiStatusMeta("PENDING"), {
    label: "Principal Approved Intake",
    detail: "Principal Approved",
    badgeTone: "bg-slate-500/10 text-slate-700",
    nextStep: "Operational starts the prepare joining checklist from the principal-approved handoff.",
  });

  assert.deepEqual(getPrepareJoiningHgiStatusMeta("TRAINING"), {
    label: "Pre-Joining: Briefing & Understanding",
    detail: "Pre-Joining",
    badgeTone: "bg-purple-500/10 text-purple-600",
    nextStep: "Complete office briefing, vessel understanding, and joining orientation records.",
  });

  assert.deepEqual(getPrepareJoiningHgiStatusMeta("READY"), {
    label: "Ready to Onboard",
    detail: "Ready to Onboard",
    badgeTone: "bg-teal-500/10 text-teal-600",
    nextStep: "Final office review is complete. Crew can be released for onboard movement.",
  });
});

test("getPrepareJoiningHgiStatusMeta falls back cleanly for unknown statuses", () => {
  assert.deepEqual(getPrepareJoiningHgiStatusMeta("CUSTOM"), {
    label: "CUSTOM",
    detail: "CUSTOM",
    badgeTone: "bg-slate-500/10 text-slate-700",
    nextStep: "Review the operational record and confirm the next office action.",
  });
});
