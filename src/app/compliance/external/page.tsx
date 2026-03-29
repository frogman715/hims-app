'use client';

import Link from 'next/link';
import ExternalComplianceManager from '@/components/compliance/ExternalComplianceManager';
import ExternalComplianceWidget from '@/components/compliance/ExternalComplianceWidget';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';

export default function ExternalCompliancePage() {
  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="External Verification"
        title="Verification shortcuts"
        subtitle="Launch external compliance portals quickly without mixing those checks into the core crewing, document-control, or compliance workflow."
        helperLinks={[
          { href: '/crewing/documents', label: 'Document control' },
          { href: '/compliance/control-center', label: 'Compliance control center' },
          { href: '/dashboard', label: 'Dashboard' },
        ]}
        highlights={[
          { label: 'Usage', value: 'Shortcut only', detail: 'This page is a launcher, not the main working register.' },
          { label: 'KOSMA', value: 'Document control', detail: 'Training and certificate record review stays in crew documents.' },
          { label: 'Dephub / Visa', value: 'External portal', detail: 'Open official checks here, then record follow-up in the system.' },
        ]}
        actions={(
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
          >
            Back to dashboard
          </Link>
        )}
      />

      <div className="mb-6">
        <ExternalComplianceWidget />
      </div>

      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
        Use this page as a shortcut launcher only. KOSMA stays under crew document control, while Dephub and visa checks stay as external portal shortcuts.
      </div>

      <ExternalComplianceManager />
    </div>
  );
}
