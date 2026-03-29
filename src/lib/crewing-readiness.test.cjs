const test = require("node:test");
const assert = require("node:assert/strict");

require("ts-node/register");

const {
  READINESS_EXPIRY_WARNING_DAYS,
  buildCrewReadinessDashboard,
} = require("./crewing-readiness.ts");

test("buildCrewReadinessDashboard separates ready crew, gaps, and expiring alerts", () => {
  const dashboard = buildCrewReadinessDashboard(
    [
      {
        id: "crew-ready",
        crewCode: "C-001",
        fullName: "Ready Crew",
        rank: "Chief Officer",
        status: "ACTIVE",
        crewStatus: "ACTIVE",
        passportNumber: "P-001",
        passportExpiry: new Date("2027-03-01T00:00:00.000Z"),
        seamanBookNumber: "SB-001",
        seamanBookExpiry: new Date("2027-04-01T00:00:00.000Z"),
        documents: [],
        medicalChecks: [
          {
            id: "med-1",
            expiryDate: new Date("2026-09-01T00:00:00.000Z"),
            result: "FIT",
          },
        ],
        orientations: [
          {
            id: "ori-1",
            startDate: new Date("2026-03-10T00:00:00.000Z"),
            status: "COMPLETED",
            remarks: null,
          },
        ],
        prepareJoinings: [],
        assignments: [
          {
            id: "asg-1",
            status: "ONBOARD",
            vessel: { name: "MV Aurora" },
            principal: { name: "Hanmarine" },
          },
        ],
      },
      {
        id: "crew-gap",
        crewCode: "C-002",
        fullName: "Gap Crew",
        rank: "OS",
        status: "ACTIVE",
        crewStatus: "ACTIVE",
        passportNumber: "P-002",
        passportExpiry: new Date("2026-04-05T00:00:00.000Z"),
        seamanBookNumber: null,
        seamanBookExpiry: null,
        documents: [],
        medicalChecks: [
          {
            id: "med-2",
            expiryDate: new Date("2026-04-02T00:00:00.000Z"),
            result: "PASS",
          },
        ],
        orientations: [],
        prepareJoinings: [
          {
            id: "pj-1",
            status: "TRAINING",
            orientationCompleted: false,
            trainingRemarks: "Orientation still pending confirmation.",
            vessel: { name: "MV Bima" },
            principal: { name: "Atlas" },
          },
        ],
        assignments: [],
      },
    ],
    new Date("2026-03-27T00:00:00.000Z")
  );

  assert.equal(READINESS_EXPIRY_WARNING_DAYS, 30);
  assert.deepEqual(dashboard.totals, {
    crewPool: 2,
    readyToDeploy: 1,
    notReady: 1,
    expiringSoon: 2,
  });

  assert.equal(dashboard.readyToDeploy[0].fullName, "Ready Crew");
  assert.equal(dashboard.readyToDeploy[0].deploymentContext, "ONBOARD • MV Aurora / Hanmarine");
  assert.equal(dashboard.readyToDeploy[0].checks.training.status, "READY");

  assert.equal(dashboard.notReady[0].fullName, "Gap Crew");
  assert.equal(dashboard.notReady[0].deploymentContext, "TRAINING • MV Bima / Atlas");
  assert.deepEqual(
    dashboard.notReady[0].gaps.map((gap) => ({ type: gap.type, status: gap.status })),
    [
      { type: "SEAMAN_BOOK", status: "MISSING" },
      { type: "TRAINING", status: "PENDING" },
    ]
  );

  assert.deepEqual(dashboard.missingItemsSummary, [
    { type: "SEAMAN_BOOK", label: "Seaman Book", count: 1 },
    { type: "TRAINING", label: "Training / Orientation", count: 1 },
  ]);

  assert.deepEqual(
    dashboard.expiringSoon.map((item) => ({
      crewId: item.crewId,
      label: item.label,
      expiryDate: item.expiryDate,
    })),
    [
      {
        crewId: "crew-gap",
        label: "Medical Clearance",
        expiryDate: "2026-04-02T00:00:00.000Z",
      },
      {
        crewId: "crew-gap",
        label: "Passport",
        expiryDate: "2026-04-05T00:00:00.000Z",
      },
    ]
  );
});

test("buildCrewReadinessDashboard marks unverifiable evidence as not ready", () => {
  const dashboard = buildCrewReadinessDashboard(
    [
      {
        id: "crew-unverified",
        crewCode: null,
        fullName: "Unverified Crew",
        rank: "AB",
        status: "ACTIVE",
        crewStatus: "ACTIVE",
        passportNumber: "P-003",
        passportExpiry: null,
        seamanBookNumber: "SB-003",
        seamanBookExpiry: null,
        documents: [
          {
            id: "doc-1",
            docType: "Passport",
            expiryDate: null,
          },
          {
            id: "doc-2",
            docType: "Seaman Book",
            expiryDate: null,
          },
          {
            id: "doc-3",
            docType: "Medical Certificate",
            expiryDate: null,
          },
        ],
        medicalChecks: [
          {
            id: "med-3",
            expiryDate: new Date("2026-07-01T00:00:00.000Z"),
            result: "PENDING",
          },
        ],
        orientations: [],
        prepareJoinings: [],
        assignments: [],
      },
    ],
    new Date("2026-03-27T00:00:00.000Z")
  );

  assert.equal(dashboard.readyToDeploy.length, 0);
  assert.equal(dashboard.notReady[0].checks.passport.status, "UNVERIFIED");
  assert.equal(dashboard.notReady[0].checks.seamanBook.status, "UNVERIFIED");
  assert.equal(dashboard.notReady[0].checks.medical.status, "UNVERIFIED");
  assert.equal(dashboard.notReady[0].checks.training.status, "NOT_REQUIRED");
});
