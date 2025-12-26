/**
 * /hgqs/audits
 * Audit Management Dashboard
 */

import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Management</h1>
            <p className="text-gray-600 mt-2">ISO 9001:2015 Internal Audits & Compliance</p>
          </div>
          {canEdit && (
            <Link
              href="/hgqs/audits/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Audit
            </Link>
          )}
        </div>
        <AuditListContent />
      </div>
    </div>
  );
}
