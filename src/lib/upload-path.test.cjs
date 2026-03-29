const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "@/lib/crew-ops") {
    return {
      classifyCrewDocumentFolder(docType) {
        const normalized = String(docType).trim().toUpperCase();
        if (normalized.includes("PASSPORT") || normalized === "PASPOR") return "passport";
        if (normalized.includes("SEAMAN") && normalized.includes("BOOK")) return "seamanbook";
        if (normalized.includes("MEDICAL") || normalized === "MC" || normalized.includes("YELLOW_FEVER")) {
          return "medical";
        }
        if (normalized.includes("VISA")) return "visa";
        return "certificates";
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const uploadPath = require("./upload-path.ts");

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

function withTempUploadBase(run) {
  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), "hims-upload-path-"));
  const previousBase = process.env.UPLOAD_BASE_DIR;
  process.env.UPLOAD_BASE_DIR = tempBase;

  try {
    return run(tempBase);
  } finally {
    if (previousBase === undefined) {
      delete process.env.UPLOAD_BASE_DIR;
    } else {
      process.env.UPLOAD_BASE_DIR = previousBase;
    }
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
}

function withSuppressedConsoleError(run) {
  const original = console.error;
  console.error = () => {};
  try {
    return run();
  } finally {
    console.error = original;
  }
}

test("upload path helpers create sanitized folders and file paths under configured base dir", () => {
  withTempUploadBase((base) => {
    process.env.UPLOAD_MAX_SIZE_MB = "25";

    assert.equal(uploadPath.getUploadBaseDir(), base);
    assert.equal(uploadPath.getMaxFileSize(), 25 * 1024 * 1024);

    const crewDir = uploadPath.ensureCrewUploadDir("crew/42", "John Doe/Chief");
    assert.equal(crewDir, path.join(base, "crew42_JohnDoeChief"));
    assert.equal(fs.existsSync(crewDir), true);

    const filePath = uploadPath.buildCrewFilePath("crew/42", "John Doe/Chief", "../passport scan.pdf");
    assert.equal(filePath, path.join(base, "crew42_JohnDoeChief", ".._passport_scan.pdf"));

    const docPath = uploadPath.buildCrewDocumentFilePath("crew/42", "visa copy.pdf", "visa");
    assert.equal(docPath, path.join(base, "crew-files", "crew42", "visa", "visa_copy.pdf"));
    assert.equal(fs.existsSync(path.dirname(docPath)), true);
  });
});

test("upload path helpers resolve relative URLs and generate stable filenames", () => {
  withTempUploadBase((base) => {
    const absolute = path.join(base, "crew-files", "crew42", "passport", "passport.pdf");
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, "ok");

    assert.equal(uploadPath.getRelativePath(absolute), "crew-files/crew42/passport/passport.pdf");
    assert.equal(
      uploadPath.getAbsolutePath("crew-files/crew42/passport/passport.pdf"),
      absolute
    );
    assert.equal(
      uploadPath.resolveStoredFileUrl("/api/files/crew-files/crew42/passport/passport.pdf"),
      "/api/files/crew-files/crew42/passport/passport.pdf"
    );
    assert.equal(
      uploadPath.resolveStoredFileUrl("/api/files/crew-files/crew42/passport/missing.pdf"),
      null
    );
    assert.equal(uploadPath.resolveStoredFileUrl("https://cdn.example.com/passport.pdf"), "/https://cdn.example.com/passport.pdf");

    withFrozenNow("2026-03-28T00:00:00.000Z", () => {
      assert.equal(
        uploadPath.generateSafeFilename("crew42", "Passport Scan", "scan.JPG"),
        "20260328_crew42_passport_scan.jpg"
      );
    });

    assert.equal(
      uploadPath.generateCrewDocumentFilename({
        crewName: "Jane Doe",
        rank: "Chief Officer",
        docType: "Medical Certificate",
        docNumber: "MED/123",
        extension: "PDF",
        issuedAt: new Date("2026-03-28T00:00:00.000Z"),
      }),
      "20260328_JANE_DOE_CHIEF_OFFICER_MEDICAL_CERTIFICATE_MED_123.pdf"
    );
  });
});

test("upload path safety helpers prevent deleting files outside the upload base", () => {
  withTempUploadBase((base) => {
    const safeFile = path.join(base, "crew42.txt");
    const outsideFile = path.join(os.tmpdir(), "outside-upload-path.txt");
    fs.writeFileSync(safeFile, "ok");
    fs.writeFileSync(outsideFile, "nope");

    assert.equal(uploadPath.isPathSafe(safeFile), true);
    assert.equal(uploadPath.isPathSafe(outsideFile), false);
    assert.equal(uploadPath.deleteFileSafe(safeFile), true);
    assert.equal(fs.existsSync(safeFile), false);
    assert.equal(withSuppressedConsoleError(() => uploadPath.deleteFileSafe(outsideFile)), false);
    assert.equal(fs.existsSync(outsideFile), true);

    fs.rmSync(outsideFile, { force: true });
  });
});
