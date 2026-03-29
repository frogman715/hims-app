/**
 * /hgqs/audits/new
 * Create New Audit
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import AuditFormContent from "../AuditFormContent";

export const metadata: Metadata = {
  title: "Create Audit - HGQS",
};

export default async function NewAuditPage() {
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

  const canEdit = checkPermission(session, "quality", PermissionLevel.EDIT_ACCESS);
  if (!canEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Forbidden</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Quality Workspace"
        title="Create New Audit"
        subtitle="Create a new audit record with clear scope, schedule, and ownership so the quality workflow stays traceable from planning to closure."
        helperLinks={[
          { href: "/hgqs/audits", label: "Audit Management" },
          { href: "/quality/qmr-dashboard", label: "QMR Dashboard" },
        ]}
      />
      <div className="mx-auto w-full max-w-2xl">
        <AuditFormContent />
      </div>
    </div>
  );
}
