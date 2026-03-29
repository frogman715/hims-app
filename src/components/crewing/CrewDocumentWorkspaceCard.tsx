import {
  DOCUMENT_PHASES,
  formatDocumentReviewLabel,
  getFolderStatusLabel,
  type DocumentCompletenessStatus,
  type CrewDocumentWorkspaceView,
} from '@/lib/document-control';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

type CrewDocumentWorkspaceCardProps = {
  workspace: CrewDocumentWorkspaceView;
};

function getStatusBadgeClasses(status: DocumentCompletenessStatus) {
  switch (status) {
    case 'COMPLETE':
      return 'border border-emerald-300 bg-emerald-50 text-emerald-800';
    case 'INCOMPLETE':
      return 'border border-amber-300 bg-amber-50 text-amber-800';
    case 'EXPIRED':
      return 'border border-rose-300 bg-rose-50 text-rose-800';
    case 'NEEDS_REVIEW':
    default:
      return 'border border-sky-300 bg-sky-50 text-sky-800';
  }
}

export function CrewDocumentWorkspaceCard({ workspace }: CrewDocumentWorkspaceCardProps) {
  const phaseOne = DOCUMENT_PHASES[0];
  const hasOfficeFolderPath = Boolean(workspace.officeFolderPath);
  const hasNextcloudLink = Boolean(workspace.nextcloudUrl);

  return (
    <Card variant="elevated" className="border-slate-200">
      <CardHeader className="mb-5 border-slate-200">
        <CardTitle className="text-slate-900">Document Workspace</CardTitle>
        <CardDescription className="mt-2 text-slate-600">
          Phase 1 keeps HIMS read-only for office documents. Folder path and Nextcloud linkage are planned here,
          while filing stays manual under the office SOP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Folder status</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{getFolderStatusLabel(workspace.folderStatus)}</p>
            <p className="mt-1 text-sm text-slate-600">{formatDocumentReviewLabel(workspace)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Completeness</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-bold text-emerald-900">
                {workspace.documentCompleteness.complete}/{workspace.documentCompleteness.totalRequired}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(workspace.documentCompleteness.status)}`}
              >
                {workspace.documentCompleteness.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-emerald-800">
              {workspace.documentCompleteness.percent}% of required documents are currently complete from uploaded HIMS data
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Expiry summary</p>
            <p className="mt-2 text-sm font-semibold text-amber-900">
              {workspace.expiryAlerts.expiringSoon} expiring soon • {workspace.expiryAlerts.expired} expired
            </p>
            <p className="mt-1 text-sm text-amber-800">3-month watch window for the planned workspace</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office folder path</p>
            <p className="mt-2 break-all font-mono text-sm text-slate-900">
              {workspace.officeFolderPath || 'Not linked yet'}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Store the verified office path in HIMS. Do not create or modify the office folder from the VPS yet.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Read-only actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hasOfficeFolderPath ? (
                <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  Open Folder: linked path stored
                </span>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-400"
                >
                  Open Folder
                </button>
              )}
              {hasNextcloudLink ? (
                <a
                  href={workspace.nextcloudUrl ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
                >
                  Open Nextcloud
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-400"
                >
                  Open Nextcloud
                </button>
              )}
              <button
                type="button"
                disabled
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-400"
              >
                Create Folder
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">{phaseOne.risk}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next action</p>
            <p className="mt-3 text-sm font-medium text-slate-900">{workspace.documentCompleteness.nextAction}</p>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <p>Missing: {workspace.missingDocuments.length}</p>
              <p>Needs review: {workspace.needsReviewDocuments.length}</p>
              <p>Expired required documents: {workspace.expiryAlerts.expired}</p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Phase 1 operating note</p>
            <ul className="mt-3 space-y-2 text-sm text-blue-900">
              {phaseOne.scope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Required document rule set</p>
              <p className="mt-1 text-sm text-slate-700">
                Every row below is computed from the crew-specific requirement rule set and the actual uploaded documents in HIMS.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {workspace.requiredDocuments.length} active requirement{workspace.requiredDocuments.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Requirement</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Matched upload</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Operational note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {workspace.requiredDocuments.map((requirement) => (
                  <tr key={requirement.code}>
                    <td className="px-3 py-3 text-sm font-semibold text-slate-900">{requirement.label}</td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(requirement.status)}`}>
                        {requirement.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">{requirement.matchedDocumentType ?? 'No uploaded match'}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      {requirement.requiresExpiry
                        ? requirement.expiryDate
                          ? new Date(requirement.expiryDate).toLocaleDateString('en-GB')
                          : 'Expiry metadata required'
                        : 'Not expiry-driven'}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">{requirement.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
