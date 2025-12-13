import type { ReactNode } from "react";
import { requireUser } from "@/lib/authz";

export default async function MobileGroupLayout({ children }: { children: ReactNode }) {
  await requireUser({ redirectIfOffice: "/dashboard" });
  return <>{children}</>;
}
