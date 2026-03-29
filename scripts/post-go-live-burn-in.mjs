import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

function loadEnv() {
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
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const bodyText = await response.text();
  let body = null;

  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}: ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`
    );
  }

  return body;
}

async function main() {
  loadEnv();

  const port = process.env.PORT || "3000";
  const baseUrl = process.env.APP_BASE_URL || `http://127.0.0.1:${port}`;
  const token = process.env.COMPLIANCE_JOB_TOKEN || process.env.NEXTAUTH_SECRET;

  if (!token) {
    throw new Error("Missing COMPLIANCE_JOB_TOKEN or NEXTAUTH_SECRET for burn-in monitoring.");
  }

  const headers = {
    "content-type": "application/json",
    "x-internal-job-token": token,
  };

  const health = await requestJson(`${baseUrl}/api/health`);
  const automation = await requestJson(`${baseUrl}/api/admin/system-health/automation`, {
    method: "POST",
    headers,
  });
  const escalation = await requestJson(`${baseUrl}/api/compliance/escalations/notify`, {
    method: "POST",
    headers,
  });

  const output = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    health,
    automationSummary: automation?.summary || null,
    escalationSummary: {
      generatedAt: escalation?.generatedAt || null,
      totalItems: escalation?.totalItems ?? null,
      sent: Array.isArray(escalation?.results)
        ? escalation.results.filter((item) => item.status === "SENT").length
        : 0,
      failed: Array.isArray(escalation?.results)
        ? escalation.results.filter((item) => item.status === "FAILED").length
        : 0,
      skippedDuplicate: Array.isArray(escalation?.results)
        ? escalation.results.filter((item) => item.status === "SKIPPED_DUPLICATE").length
        : 0,
    },
    liveActions: [],
  };

  if ((automation?.summary?.duplicateNominationAlerts || 0) > 0) {
    output.liveActions.push("Review duplicate nomination alerts in System Health and Applications.");
  }
  if ((automation?.summary?.stalledPrepareJoiningAlerts || 0) > 0) {
    output.liveActions.push("Assign owner and unblock stalled Prepare Joining cases.");
  }
  if ((automation?.summary?.failedEscalationNotifications || 0) > 0) {
    output.liveActions.push("Verify SMTP delivery and clear failed escalation notifications.");
  }
  if (output.liveActions.length === 0) {
    output.liveActions.push("No critical burn-in follow-up detected from automation snapshot.");
  }

  console.log(`[post-go-live-burn-in] ${JSON.stringify(output)}`);
}

main().catch((error) => {
  console.error(
    `[post-go-live-burn-in] ${new Date().toISOString()} ${JSON.stringify({
      status: "FAILED",
      error: error instanceof Error ? error.message : String(error),
    })}`
  );
  process.exitCode = 1;
});
