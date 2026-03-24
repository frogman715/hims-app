import type { ReactNode } from "react";
import { requireAuthorizedUser } from "@/lib/authz";

export default async function HrLayout({ children }: { children: ReactNode }) {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    allowedRoles: ["DIRECTOR", "HR", "HR_ADMIN"],
    redirectOnDisallowed: "/dashboard",
  });
  return <>{children}</>;
}
