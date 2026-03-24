import type { ReactNode } from "react";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";

export default async function NationalHolidaysLayout({ children }: { children: ReactNode }) {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "nationalHolidays",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });
  return <>{children}</>;
}
