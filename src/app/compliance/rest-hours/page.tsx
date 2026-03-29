import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import RestHourRegisterClient from "./RestHourRegisterClient";
import { getRestHourRegisterData } from "@/lib/compliance-rest-hours";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RestHourRegisterPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  const data = await getRestHourRegisterData();

  return (
    <div className="section-stack mx-auto max-w-7xl px-6 py-8">
      <WorkspaceHero
        eyebrow="MLC Welfare"
        title="Digital rest-hour register"
        subtitle="Capture daily work and rest hours per vessel and crew, expose MLC minimum rest breaches, and close manual register gaps before audit or deployment."
        helperLinks={[
          { href: "/compliance/welfare", label: "Welfare tracker" },
          { href: "/compliance/fleet-board", label: "Fleet readiness" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Generated", value: formatTimestamp(data.generatedAt), detail: "Latest register snapshot." },
          { label: "Desk Scope", value: "Daily log", detail: "Use for operational monitoring and compliance review." },
          { label: "Standard", value: "MLC Rest Rules", detail: "Monitor minimum rest coverage before escalation." },
        ]}
      />

      <div className="space-y-6">
        <RestHourRegisterClient initialData={data} />
      </div>
    </div>
  );
}
