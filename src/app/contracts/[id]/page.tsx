'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLoadingState, WorkspaceState } from '@/components/layout/WorkspaceState';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface EmploymentContract {
  id: string;
  contractNumber: string;
  contractKind: 'SEA' | 'OFFICE_PKL';
  seaType?: 'KOREA' | 'BAHAMAS_PANAMA' | 'TANKER_LUNDQVIST' | 'OTHER' | null;
  maritimeLaw?: string | null;
  cbaReference?: string | null;
  wageScaleHeaderId?: string | null;
  guaranteedOTHours?: number | null;
  overtimeRate?: string | null;
  onboardAllowance?: number | null;
  homeAllotment?: number | null;
  specialAllowance?: number | null;
  templateVersion?: string | null;
  crewId: string;
  vesselId?: string | null;
  principalId?: string | null;
  rank: string;
  contractStart: string;
  contractEnd: string;
  status: string;
  basicWage: number;
  currency: string;
  crew: {
    id: string;
    fullName: string;
    nationality: string | null;
    dateOfBirth: string | null;
    passportNumber?: string | null;
    address?: string | null;
  };
  vessel?: {
    id: string;
    name: string;
    flag?: string | null;
    imoNumber?: string | null;
  } | null;
  principal?: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
  wageScaleHeader?: {
    name: string;
    principalId: string;
  } | null;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(value?: number | null, currency = 'USD') {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Not recorded';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function getContractKindLabel(contract: EmploymentContract) {
  return contract.contractKind === 'SEA' ? 'SEA Contract' : 'Office PKL Contract';
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export default function ContractDetailPage() {
  const params = useParams();
  const [contract, setContract] = useState<EmploymentContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? (response.status === 404 ? 'Contract not found' : 'Failed to load contract'));
        setContract(null);
        return;
      }

      setContract(payload as EmploymentContract);
    } catch (fetchError) {
      console.error('Failed to load contract:', fetchError);
      setError('Failed to load contract');
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <WorkspaceLoadingState label="Loading contract detail..." />;
  }

  if (error || !contract) {
    return (
      <WorkspaceState
        eyebrow="Contracts Desk"
        title="Contract record not available"
        description={error ?? 'The requested contract record is no longer available in the controlled contract register.'}
        tone="danger"
        action={(
          <Link href="/contracts" className="inline-flex items-center rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800">
            Return to Contract Register
          </Link>
        )}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Contracts Desk</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Contract Detail</h1>
              <p className="mt-2 text-sm text-slate-600">
                Review the final contract record, linked crew, vessel, principal, and compensation references from the live API record.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:border-emerald-500 hover:text-emerald-800"
              >
                Print Contract
              </button>
              <Link
                href="/contracts"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                Back to Contracts
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contract Number</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{contract.contractNumber}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contract Type</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{getContractKindLabel(contract)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rank</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{contract.rank}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
              <p className="mt-2">
                <StatusBadge status={contract.status} />
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Contract Terms</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Start Date" value={formatDate(contract.contractStart)} />
                <Field label="End Date" value={formatDate(contract.contractEnd)} />
                <Field label="Basic Wage" value={formatMoney(contract.basicWage, contract.currency)} />
                <Field label="Currency" value={contract.currency || 'Not recorded'} />
                <Field label="SEA Type" value={contract.seaType || 'Not recorded'} />
                <Field label="Template Version" value={contract.templateVersion || 'Not recorded'} />
                <Field label="Maritime Law" value={contract.maritimeLaw || 'Not recorded'} />
                <Field label="CBA Reference" value={contract.cbaReference || 'Not recorded'} />
                <Field label="Wage Scale Header" value={contract.wageScaleHeader?.name || 'Not linked'} />
                <Field label="Guaranteed OT Hours" value={contract.guaranteedOTHours?.toString() || 'Not recorded'} />
                <Field label="Overtime Rate" value={contract.overtimeRate || 'Not recorded'} />
                <Field label="Onboard Allowance" value={formatMoney(contract.onboardAllowance, contract.currency)} />
                <Field label="Home Allotment" value={formatMoney(contract.homeAllotment, contract.currency)} />
                <Field label="Special Allowance" value={formatMoney(contract.specialAllowance, contract.currency)} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Crew Information</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Full Name" value={contract.crew.fullName || 'Not recorded'} />
                <Field label="Nationality" value={contract.crew.nationality || 'Not recorded'} />
                <Field label="Date of Birth" value={formatDate(contract.crew.dateOfBirth)} />
                <Field label="Passport Number" value={contract.crew.passportNumber || 'Restricted or not recorded'} />
                <div className="md:col-span-2">
                  <Field label="Address" value={contract.crew.address || 'Restricted or not recorded'} />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Vessel Link</h2>
              <div className="mt-5 grid gap-5">
                <Field label="Vessel" value={contract.vessel?.name || 'Not linked'} />
                <Field label="Flag" value={contract.vessel?.flag || 'Not recorded'} />
                <Field label="IMO Number" value={contract.vessel?.imoNumber || 'Not recorded'} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Principal Link</h2>
              <div className="mt-5 grid gap-5">
                <Field label="Principal" value={contract.principal?.name || 'Not linked'} />
                <Field label="Principal Address" value={contract.principal?.address || 'Not recorded'} />
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-amber-900">Edit Workflow</h2>
              <p className="mt-3 text-sm text-amber-900">
                Contract editing stays in the main contracts desk to avoid duplicate edit flows. Return to the contracts list if this record needs to be updated or regenerated.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/contracts?edit=${contract.id}`}
                  className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:border-amber-500"
                >
                  Edit in Contracts Desk
                </Link>
                <Link
                  href="/contracts"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                >
                  Open Contracts Desk
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
