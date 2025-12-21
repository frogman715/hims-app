/**
 * /hgqs Layout
 * Sidebar navigation for HGQS module
 */

import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import Link from "next/link";
import { redirect } from "next/navigation";

interface HGQSLayoutProps {
  children: ReactNode;
}

export default async function HGQSLayout({ children }: HGQSLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const canAccessQuality = checkPermission(session, "quality", PermissionLevel.VIEW_ACCESS);
  if (!canAccessQuality) {
    redirect("/dashboard");
  }

  const canEdit = checkPermission(session, "quality", PermissionLevel.EDIT_ACCESS);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold">HGQS</h1>
          <p className="text-gray-400 text-sm mt-1">Quality Management System</p>
        </div>

        <nav className="px-4 py-6 space-y-2">
          {/* Risk Management */}
          <div>
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk</p>
            <Link
              href="/hgqs/risks"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
            >
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Risk Management
            </Link>
            {canEdit && (
              <Link
                href="/hgqs/risks/new"
                className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition text-sm ml-2"
              >
                <span className="mr-2">+</span>
                New Risk
              </Link>
            )}
          </div>

          {/* Audit Management */}
          <div>
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Audit</p>
            <Link
              href="/hgqs/audits"
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Audit Management
            </Link>
            {canEdit && (
              <Link
                href="/hgqs/audits/new"
                className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition text-sm ml-2"
              >
                <span className="mr-2">+</span>
                New Audit
              </Link>
            )}
          </div>

          <hr className="my-4 border-gray-700" />

          {/* User Info */}
          <div className="px-4 py-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            <p className="text-xs text-blue-400 mt-2">
              {canEdit ? "Edit Access" : "View Only"}
            </p>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">HGQS - Quality Management System</h2>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
