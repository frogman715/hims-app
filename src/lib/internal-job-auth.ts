import { NextRequest } from "next/server";

export function hasValidInternalJobToken(req: NextRequest) {
  const expected = process.env.COMPLIANCE_JOB_TOKEN || process.env.NEXTAUTH_SECRET;
  if (!expected) {
    return false;
  }

  const provided = req.headers.get("x-internal-job-token");
  return Boolean(provided) && provided === expected;
}
