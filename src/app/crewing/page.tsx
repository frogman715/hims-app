import CrewingClient from "./CrewingClient";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";

export default async function CrewingPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "crewing",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
  });

  return <CrewingClient />;
}
