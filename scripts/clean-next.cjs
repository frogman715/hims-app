const fs = require("fs");
const path = require("path");

const nextDir = path.join(process.cwd(), ".next");

try {
  fs.rmSync(nextDir, { recursive: true, force: true });
} catch (error) {
  console.error("[clean-next] failed to remove .next", error);
  process.exitCode = 1;
}
