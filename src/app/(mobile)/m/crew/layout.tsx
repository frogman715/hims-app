import type { ReactNode } from "react";
import { requireCrew } from "@/lib/authz";

export default async function CrewMobileLayout({ children }: { children: ReactNode }) {
  await requireCrew();
  return <>{children}</>;
}
