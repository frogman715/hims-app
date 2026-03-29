/**
 * /hgqs/risks
 * Risk Management Dashboard
 * Lists all risks with filtering, sorting, and quick actions
 */

import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import RiskListContent from "./RiskListContent";

export const metadata: Metadata = {
  title: "HGQS - Risk Management",
  description: "ISO 9001:2015 Risk Management Dashboard",
};

export default async function RisksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="text-gray-600 mt-2">Please log in to access HGQS</p>
        </div>
      </div>
    );
  }

  const hasAccess = checkPermission(session, "quality", PermissionLevel.VIEW_ACCESS);
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Forbidden</h1>
          <p className="text-gray-600 mt-2">You do not have permission to access Risk Management</p>
        </div>
      </div>
    );
  }

  const canEdit = checkPermission(session, "quality", PermissionLevel.EDIT_ACCESS);

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Quality Workspace"
        title="Risk Management"
        subtitle="ISO 9001:2015 clause 6.1 risk assessment and treatment tracked in one structured quality workspace."
        helperLinks={[
          { href: "/quality/risks", label: "Risk Register" },
          { href: "/hgqs/audits", label: "Audit Management" },
          { href: "/nonconformity", label: "Non-Conformities" },
        ]}
        actions={canEdit ? (
          <Link
            href="/hgqs/risks/new"
            className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            New Risk
          </Link>
        ) : null}
      />
        <RiskListContent canEdit={canEdit} />
    </div>
  );
}
