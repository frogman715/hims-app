/**
 * /hgqs/audits
 * Audit Management Dashboard
 */

import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import AuditListContent from "./AuditListContent";

export const metadata: Metadata = {
  title: "HGQS - Audit Management",
};

export default async function AuditsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
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
        </div>
      </div>
    );
  }

  const canEdit = checkPermission(session, "quality", PermissionLevel.EDIT_ACCESS);

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Quality Workspace"
        title="Audit Management"
        subtitle="ISO 9001:2015 internal audits and compliance activities managed from one operational desk."
        helperLinks={[
          { href: "/quality/qmr-dashboard", label: "QMR Dashboard" },
          { href: "/nonconformity", label: "Non-Conformities" },
          { href: "/hgqs/risks", label: "Risk Management" },
        ]}
        actions={canEdit ? (
          <Link
            href="/hgqs/audits/new"
            className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            New Audit
          </Link>
        ) : null}
      />
        <AuditListContent />
    </div>
  );
}
