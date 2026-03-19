import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { dispatchEscalationNotifications } from "@/lib/compliance-escalation-notifications";
import { handleApiError } from "@/lib/error-handler";

export const POST = withPermission(
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
