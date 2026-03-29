/**
 * /hgqs/risks/new
 * Create New Risk
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import RiskFormContent from "../RiskFormContent";

export const metadata: Metadata = {
  title: "Create Risk - HGQS",
};

export default async function NewRiskPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="text-gray-600 mt-2">Please log in</p>
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
          <p className="text-gray-600 mt-2">You do not have permission to create risks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Quality Workspace"
        title="Create New Risk"
        subtitle="Add a risk to the quality management system with clear context, assessment, and treatment ownership."
        helperLinks={[
          { href: "/hgqs/risks", label: "Risk Management" },
          { href: "/quality/risks", label: "Risk Register" },
        ]}
      />
      <div className="mx-auto w-full max-w-2xl">
        <RiskFormContent />
      </div>
    </div>
  );
}
