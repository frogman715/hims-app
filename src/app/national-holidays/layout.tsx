import type { ReactNode } from "react";
import { OFFICE_ROLES, requireUser } from "@/lib/authz";

export default async function NationalHolidaysLayout({ children }: { children: ReactNode }) {
  await requireUser({
    redirectIfCrew: "/m/crew",
    allowedRoles: [...OFFICE_ROLES],
    redirectOnDisallowed: "/dashboard",
  });
  return <>{children}</>;
}
