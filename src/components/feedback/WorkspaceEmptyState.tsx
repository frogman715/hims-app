"use client";

import { FileSearch } from "lucide-react";

interface WorkspaceEmptyStateProps {
  title: string;
  message: string;
}

export function WorkspaceEmptyState({ title, message }: WorkspaceEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <FileSearch className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}
