const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("ts-node/register");

const {
  uploadDocument,
  deleteDocument,
  validateFile,
} = require("./file-operations.ts");

test("validateFile enforces size, mime type, and extension rules", () => {
  const validFile = new File(["hello"], "doc.pdf", { type: "application/pdf" });
  const invalidType = new File(["hello"], "doc.exe", { type: "application/x-msdownload" });
  const largeFile = new File([Buffer.alloc(6)], "doc.pdf", { type: "application/pdf" });

  assert.deepEqual(validateFile(validFile, { maxSize: 10 }), { valid: true });
  assert.deepEqual(validateFile(largeFile, { maxSize: 5 }), {
    valid: false,
    error: "File size exceeds maximum of 0.00000476837158203125MB",
  });
  assert.deepEqual(validateFile(invalidType), {
    valid: false,
    error: "File type application/x-msdownload is not allowed",
  });
});

test("uploadDocument writes allowed files and deleteDocument removes them safely", async () => {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const file = new File(["enterprise-ready"], "manual.txt", { type: "text/plain" });
  const uploaded = await uploadDocument(file);

  assert.equal(uploaded.fileName.endsWith(".txt"), true);
  assert.equal(uploaded.fileUrl.startsWith("/uploads/documents/"), true);
  assert.equal(fs.existsSync(uploaded.filePath), true);

  const deletion = await deleteDocument(uploaded.fileUrl);
  assert.deepEqual(deletion, { success: true });
  assert.equal(fs.existsSync(uploaded.filePath), false);
});

test("deleteDocument rejects unsafe file names and tolerates missing files", async () => {
  assert.deepEqual(await deleteDocument("/uploads/documents/evil?.txt"), {
    success: false,
    error: "Invalid file name format: evil?.txt",
  });

  assert.deepEqual(await deleteDocument("/uploads/documents/missing-file.txt"), {
    success: true,
  });
});
