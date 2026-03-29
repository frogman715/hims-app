const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const { getPrepareJoiningContinuity } = require("./prepare-joining-continuity.ts");

test("prepare joining continuity keeps document blockers ahead of later checklist statuses", () => {
  const continuity = getPrepareJoiningContinuity({
    status: "MEDICAL",
    documentCompleteness: {
      status: "INCOMPLETE",
      nextAction: "Upload the missing required document for this crew record.",
      missing: ["Visa / Travel Clearance"],
      needsReview: [],
      expired: 0,
    },
    principalBlockers: [],
    medicalValid: false,
    mcuCompleted: false,
    vesselContractSigned: false,
    orientationCompleted: false,
    vesselOrientationDone: false,
    vesselBriefingScheduled: false,
    ticketBooked: false,
    transportArranged: false,
    departureDate: null,
    departurePort: null,
    arrivalPort: null,
    preDepartureFinalCheck: false,
  });

  assert.equal(continuity.currentStep, "DOCUMENTS");
  assert.equal(continuity.recommendedStatus, "DOCUMENTS");
  assert.equal(continuity.statusAligned, false);
  assert.match(continuity.statusNote, /still at DOCUMENTS/);
});

test("prepare joining continuity moves linearly to dispatch once prerequisites are clear", () => {
  const continuity = getPrepareJoiningContinuity({
    status: "TRAVEL",
    documentCompleteness: {
      status: "COMPLETE",
      nextAction: "No document action required right now.",
      missing: [],
      needsReview: [],
      expired: 0,
    },
    principalBlockers: [],
    medicalValid: true,
    mcuCompleted: true,
    vesselContractSigned: true,
    orientationCompleted: true,
    vesselOrientationDone: false,
    vesselBriefingScheduled: false,
    ticketBooked: true,
    transportArranged: true,
    departureDate: "2026-04-10T00:00:00.000Z",
    departurePort: "Jakarta",
    arrivalPort: "Singapore",
    preDepartureFinalCheck: true,
  });

  assert.equal(continuity.currentStep, "DISPATCH");
  assert.equal(continuity.recommendedStatus, "READY");
  assert.match(continuity.nextAction, /Move the workflow status to READY/);
});
