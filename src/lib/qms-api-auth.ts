import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function requireQmsApiAccess(requiredLevel: PermissionLevel) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!checkPermission(session, "quality", requiredLevel)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}
