import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessOfficePath, getPrimaryOfficeRole } from "@/lib/office-access";

export default async function AssignmentsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const roles = getPrimaryOfficeRole(session.user.roles, session.user.role);
  if (!canAccessOfficePath("/crewing/assignments", roles, session.user.isSystemAdmin === true)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
