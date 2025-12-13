import type { ReactNode } from "react";
import { APP_ROLES, requireUser } from "@/lib/authz";

export default async function AccountingLayout({ children }: { children: ReactNode }) {
  await requireUser({
    redirectIfCrew: "/m/crew",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.ACCOUNTING],
    redirectOnDisallowed: "/dashboard",
  });
  return <>{children}</>;
}
