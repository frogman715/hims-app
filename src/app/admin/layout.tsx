import type { ReactNode } from "react";
import { requireAuthorizedUser } from "@/lib/authz";
import { ADMIN_ALLOWED_ROLES } from "@/lib/admin-access";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    allowedRoles: ADMIN_ALLOWED_ROLES,
    redirectOnDisallowed: "/dashboard",
  });
  return <>{children}</>;
}
