/**
 * /hgqs/audits/[id]
 * Audit Detail Page
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import AuditDetailContent from "./AuditDetailContent";

export const metadata: Metadata = {
  title: "Audit Details - HGQS",
};

interface AuditDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  const { id } = await params;
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

  const hasView = checkPermission(session, "quality", PermissionLevel.VIEW_ACCESS);
  if (!hasView) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AuditDetailContent auditId={id} canEdit={canEdit} />
      </div>
    </div>
  );
}
