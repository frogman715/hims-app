import CrewingClient from "./CrewingClient";
import { requireUser } from "@/lib/authz";

export default async function CrewingPage() {
  await requireUser({
    redirectIfCrew: "/m/crew",
    allowedRoles: ["DIRECTOR", "CDMO", "OPERATIONAL", "HR", "ACCOUNTING"],
  });

  return <CrewingClient />;
}
