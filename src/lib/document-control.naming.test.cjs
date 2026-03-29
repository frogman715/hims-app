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
  formatCrewFolderName,
  buildCrewFolderPath,
  formatDocumentFileName,
  formatInboxUploadFileName,
} = require("./document-control/naming.ts");

function withFrozenNow(isoString, run) {
  const RealDate = Date;

  class FakeDate extends RealDate {
    constructor(value) {
      if (arguments.length === 0) {
        super(isoString);
        return;
      }
      super(value);
    }

    static now() {
      return new RealDate(isoString).getTime();
    }

    static parse(value) {
      return RealDate.parse(value);
    }

    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  }

  global.Date = FakeDate;
  try {
    run();
  } finally {
    global.Date = RealDate;
  }
}

test("document control naming builds sanitized crew folder paths", () => {
  const seed = {
    crewId: "crew/42",
    crewCode: " HGI 0042 ",
    fullName: "John / Doe, Jr.",
    rank: "Chief Officer",
  };

  assert.equal(formatCrewFolderName(seed), "HGI_0042__JOHN_DOE_JR__CHIEF_OFFICER");
  assert.equal(buildCrewFolderPath(seed), "HGI/CREW/HGI_0042__JOHN_DOE_JR__CHIEF_OFFICER");
});

test("formatDocumentFileName normalizes date, version, and extension", () => {
  assert.equal(
    formatDocumentFileName({
      crewCode: " hgi-001 ",
      crewName: "Ignored Name",
      documentCode: "medical certificate",
      issueDate: "2026-03-27T00:00:00.000Z",
      version: 3,
      extension: "PDF",
    }),
    "20260327_HGI_001_MEDICAL_CERTIFICATE_V03.pdf"
  );

  assert.equal(
    formatDocumentFileName({
      crewName: "Jane Doe",
      documentCode: "passport",
      issueDate: "invalid-date",
    }),
    "UNDATED_JANE_DOE_PASSPORT_V01"
  );
});

test("formatInboxUploadFileName uses current date and sanitized segments", () => {
  withFrozenNow("2026-03-28T00:00:00.000Z", () => {
    assert.equal(
      formatInboxUploadFileName({
        uploaderInitials: "ab",
        crewName: "Jane Doe",
        documentCode: "SEA contract",
        extension: ".PDF",
      }),
      "20260328_INBOX_AB_JANE_DOE_SEA_CONTRACT.pdf"
    );
  });
});
