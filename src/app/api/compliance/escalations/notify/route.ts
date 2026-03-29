import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { dispatchEscalationNotifications } from "@/lib/compliance-escalation-notifications";
import { handleApiError } from "@/lib/error-handler";
import { hasValidInternalJobToken } from "@/lib/internal-job-auth";

const permissionWrappedPost = withPermission(
  "compliance",
  PermissionLevel.EDIT_ACCESS,
  async () => {
    try {
      const result = await dispatchEscalationNotifications();
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

export async function POST(req: NextRequest, context: unknown) {
  if (hasValidInternalJobToken(req)) {
    try {
      const result = await dispatchEscalationNotifications();
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  }

  return permissionWrappedPost(req, context);
}
