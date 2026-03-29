import type { ReactNode } from "react";
import { requireUser, APP_ROLES } from "@/lib/authz";

export default async function PrincipalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser({
    allowedRoles: [APP_ROLES.PRINCIPAL],
    redirectOnDisallowed: "/dashboard",
  });

  return <>{children}</>;
}
