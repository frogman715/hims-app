const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const projectRoot = process.cwd();
const envFiles = [".env", ".env.local", ".env.production", ".env.production.local"];

for (const file of envFiles) {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const parsed = dotenv.parse(fs.readFileSync(fullPath));
  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const port = process.env.PORT || "3000";
  const baseUrl = process.env.APP_BASE_URL || `http://127.0.0.1:${port}`;
  const token = process.env.COMPLIANCE_JOB_TOKEN || process.env.NEXTAUTH_SECRET;

  if (!token) {
    throw new Error("Missing COMPLIANCE_JOB_TOKEN or NEXTAUTH_SECRET for internal escalation job.");
  }

  const response = await fetch(`${baseUrl}/api/compliance/escalations/notify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-job-token": token,
    },
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Escalation notify failed (${response.status}): ${bodyText}`);
  }

  console.log(`[escalation-job] ${new Date().toISOString()} ${bodyText}`);
}

main().catch((error) => {
  console.error("[escalation-job] failed", error);
  process.exitCode = 1;
});
