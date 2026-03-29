'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { AppRole } from '@/lib/roles';
import { OFFICE_ROLES } from '@/lib/roles';

interface ReceiptListItem {
  id: string;
  crewId: string;
  crew: {
    id: string;
    fullName: string;
    rank: string | null;
  };
  vesselName: string | null;
  crewStatus: 'NEW' | 'EX_CREW';
  deliveryLocation: string | null;
  deliveryDate: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    certificateName: string;
    certificateNumber: string | null;
  }>;
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export default function DocumentReceiptDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRoles = session?.user?.roles;
  const roles = useMemo<AppRole[]>(() => {
    return Array.isArray(userRoles) ? (userRoles as AppRole[]) : [];
  }, [userRoles]);
  const hasOfficeAccess = useMemo(() => {
    return roles.some((role) => (OFFICE_ROLES as readonly AppRole[]).includes(role));
  }, [roles]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session) {
      router.replace('/auth/signin');
      setIsAuthorized(false);
      return;
    }

    if (!hasOfficeAccess) {
      router.replace('/dashboard');
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [status, session, hasOfficeAccess, router]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const receiptsRes = await fetch('/api/document-receipts');

        if (receiptsRes.ok) {
          const receiptsData = await receiptsRes.json();
          setReceipts(Array.isArray(receiptsData) ? receiptsData : []);
        } else {
          const payload = await receiptsRes.json().catch(() => null);
          throw new Error(payload?.error ?? 'Failed to load document receipts');
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading document receipt data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthorized]);

  const filteredReceipts = useMemo(() => {
    if (!filter.trim()) {
      return receipts;
    }
    const lower = filter.trim().toLowerCase();
    return receipts.filter((receipt) => {
      const crewName = receipt.crew?.fullName?.toLowerCase() ?? '';
      const vessel = receipt.vesselName?.toLowerCase() ?? '';
      return crewName.includes(lower) || vessel.includes(lower);
    });
  }, [filter, receipts]);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    return [
      { label: 'Crewing', href: hasOfficeAccess ? '/crewing' : undefined },
      { label: 'Seafarers', href: hasOfficeAccess ? '/crewing/seafarers' : undefined },
      { label: 'Documents', href: hasOfficeAccess ? '/crewing/documents' : undefined },
      { label: 'Receipts' },
    ];
  }, [hasOfficeAccess]);

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    return parsed.toLocaleDateString();
  };

  const getReceiptDeskAction = (receipt: ReceiptListItem) => {
    if (receipt.items.length === 0) {
      return {
        label: 'Check handover contents',
        helper: 'Receipt exists without listed documents. Confirm whether the physical handover was recorded completely.',
        status: 'REJECTED',
      };
    }

    if (!receipt.deliveryDate || !receipt.deliveryLocation) {
      return {
        label: 'Complete receipt trace',
        helper: 'Location or delivery date is still missing. Keep this receipt under office follow-up.',
        status: 'PENDING_REVIEW',
      };
    }

    return {
      label: 'Archive reference only',
      helper: 'Receipt is complete. Use it as audit support when document ownership or handover timing is questioned.',
      status: 'APPROVED',
    };
  };

  if (status === 'loading' || (session && !isAuthorized)) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading document receipt workspace...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const incompleteTraceCount = filteredReceipts.filter((receipt) => !receipt.deliveryDate || !receipt.deliveryLocation).length;
  const emptyReceiptCount = filteredReceipts.filter((receipt) => receipt.items.length === 0).length;

  return (
    <div className="section-stack">
      <Breadcrumbs items={breadcrumbItems} />
      <WorkspaceHero
        eyebrow="Document Receipts"
        title="Crew document receipts"
        subtitle="Review archived proof of physical document handover between crew members, vessels, and office desks."
        helperLinks={[
          { href: '/crewing/documents', label: 'Document Desk' },
          { href: '/dashboard', label: 'Dashboard' },
        ]}
        highlights={[
          { label: 'Visible Receipts', value: filteredReceipts.length, detail: 'Receipt records matching the current search scope.' },
          { label: 'Incomplete Trace', value: incompleteTraceCount, detail: 'Receipts still missing delivery date or location.' },
          { label: 'Empty Contents', value: emptyReceiptCount, detail: 'Receipts without listed document contents that need verification.' },
        ]}
        actions={(
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/crewing')}>
              Back to Crewing
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm text-slate-700 xl:col-span-2">
            Use this register to trace where original certificates were handed over, what was included, and which entries still need document-office clarification.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visible Receipts</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{filteredReceipts.length}</p>
            <p className="mt-1 text-sm text-slate-600">Records matching the current search scope.</p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Receipt Entry</h2>
          <p className="mt-1 text-sm text-slate-600">
            New receipt entry is temporarily hidden from the active office flow until the crewing receipt API is fully aligned.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Receipt History</h2>
              <p className="mt-1 text-sm text-slate-600">Search by crew name or vessel name to inspect archived handover records.</p>
            </div>
            <Input
              id="receipt-filter"
              type="search"
              label="Search Register"
              placeholder="Crew or vessel"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              wrapperClassName="w-full lg:w-80"
            />
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Loading document receipt history...
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              No document receipt records are available for the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Crew</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vessel / Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Handover</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Documents</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Desk Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredReceipts.map((receipt) => {
                    const deskAction = getReceiptDeskAction(receipt);

                    return (
                      <tr key={receipt.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-4 py-4 text-sm text-slate-900">
                          <div className="font-semibold">{receipt.crew?.fullName ?? '-'}</div>
                          <div className="mt-1 text-xs text-slate-500">{receipt.crew?.rank ?? 'Rank not recorded'}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-900">
                          <div>{receipt.vesselName ?? '-'}</div>
                          <div className="mt-1 text-xs text-slate-500">{receipt.crewStatus === 'NEW' ? 'New Crew' : 'Ex Crew'}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-900">
                          <div>{receipt.deliveryLocation ?? 'Location not recorded'}</div>
                          <div className="mt-1 text-xs text-slate-500">Delivery: {formatDate(receipt.deliveryDate)}</div>
                          <div className="mt-1 text-xs text-slate-400">Created: {formatDate(receipt.createdAt)}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-900">
                          {receipt.items.length === 0 ? (
                            <span className="text-xs text-slate-500">No listed documents</span>
                          ) : (
                            <ul className="space-y-1">
                              {receipt.items.slice(0, 3).map((item) => (
                                <li key={item.id} className="text-xs leading-5 text-slate-700">
                                  {item.certificateName}
                                  {item.certificateNumber ? ` (${item.certificateNumber})` : ''}
                                </li>
                              ))}
                            </ul>
                          )}
                          {receipt.items.length > 3 ? (
                            <span className="mt-2 inline-block text-xs text-slate-500">+{receipt.items.length - 3} more documents</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-900">
                          <div className="space-y-2">
                            <StatusBadge status={deskAction.status} label={deskAction.label} />
                            <p className="max-w-xs text-xs leading-5 text-slate-600">{deskAction.helper}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-900">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="!px-3 !py-2 !text-xs"
                              onClick={() => router.push(`/crewing/seafarers/${receipt.crewId}/documents`)}
                            >
                              Crew Documents
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="!px-3 !py-2 !text-xs"
                              onClick={() => router.push(`/crewing/seafarers/${receipt.crewId}/biodata`)}
                            >
                              Biodata
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
