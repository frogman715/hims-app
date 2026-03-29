'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { canAccessOfficePath } from '@/lib/office-access';
import { normalizeToUserRoles } from '@/lib/type-guards';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { pushAppNotice } from '@/lib/app-notice';

interface EmploymentContract {
  id: string;
  contractNumber: string;
  contractKind: 'SEA' | 'OFFICE_PKL';
  seaType?: 'KOREA' | 'BAHAMAS_PANAMA' | 'TANKER_LUNDQVIST' | 'OTHER';
  maritimeLaw?: string;
  cbaReference?: string;
  wageScaleHeaderId?: string;
  guaranteedOTHours?: number;
  overtimeRate?: string;
  onboardAllowance?: number;
  homeAllotment?: number;
  specialAllowance?: number;
  templateVersion?: string;
  crewId: string;
  vesselId?: string;
  principalId?: string;
  rank: string;
  contractStart: string;
  contractEnd: string;
  status: string;
  basicWage: number;
  currency: string;
  crew?: {
    fullName: string;
  };
  vessel?: {
    name: string;
  };
  principal?: {
    name: string;
  };
  wageScaleHeader?: {
    name: string;
  };
}

interface CrewSearchOption {
  id: string;
  fullName: string;
  rank: string;
}

interface VesselOption {
  id: string;
  name: string;
  principalId?: string | null;
}

interface PrincipalOption {
  id: string;
  name: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createInitialFormData(crewId = '') {
  return {
    contractNumber: '',
    contractKind: 'SEA' as 'SEA' | 'OFFICE_PKL',
    seaType: '' as '' | 'KOREA' | 'BAHAMAS_PANAMA' | 'TANKER_LUNDQVIST' | 'OTHER',
    maritimeLaw: '',
    cbaReference: '',
    wageScaleHeaderId: '',
    guaranteedOTHours: '',
    overtimeRate: '',
    onboardAllowance: '',
    homeAllotment: '',
    specialAllowance: '',
    templateVersion: '',
    crewId,
    vesselId: '',
    principalId: '',
    rank: '',
    contractStart: '',
    contractEnd: '',
    status: 'DRAFT',
    basicWage: '',
    currency: 'USD'
  };
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
  CANCELLED: 'Cancelled',
};

export default function ContractsPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<EmploymentContract | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'SEA' | 'OFFICE_PKL'>('ALL');
  const [crewSearch, setCrewSearch] = useState('');
  const [crewOptions, setCrewOptions] = useState<CrewSearchOption[]>([]);
  const [vesselOptions, setVesselOptions] = useState<VesselOption[]>([]);
  const [principalOptions, setPrincipalOptions] = useState<PrincipalOption[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(createInitialFormData);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageContracts = canAccessOfficePath('/api/contracts', userRoles, isSystemAdmin, 'POST');

  const selectedCrew = useMemo(
    () =>
      crewOptions.find((crew) => crew.id === formData.crewId)
      ?? (editingContract?.crew && editingContract.crewId === formData.crewId
        ? { id: editingContract.crewId, fullName: editingContract.crew.fullName, rank: editingContract.rank }
        : null),
    [crewOptions, editingContract, formData.crewId]
  );
  const selectedVessel = vesselOptions.find((vessel) => vessel.id === formData.vesselId) ?? null;
  const selectedPrincipal = principalOptions.find((principal) => principal.id === formData.principalId) ?? null;
  const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE').length;
  const expiringSoonContracts = contracts.filter((contract) => {
    if (contract.status !== 'ACTIVE') {
      return false;
    }

    const endDate = new Date(contract.contractEnd);
    const diffDays = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }).length;
  const totalContractValue = contracts
    .filter((contract) => contract.status === 'ACTIVE')
    .reduce((sum, contract) => sum + contract.basicWage, 0);
  const contractFormSteps = [
    {
      label: 'Step 1',
      title: 'Select Crew Case',
      detail: 'Start from the correct seafarer record before connecting vessel, principal, or wage terms.',
    },
    {
      label: 'Step 2',
      title: 'Set Contract Framework',
      detail: 'Define contract type, legal references, dates, and operating status using one controlled structure.',
    },
    {
      label: 'Step 3',
      title: 'Complete Commercial Terms',
      detail: 'Capture wage and allowance values clearly so payroll, allotment, and deployment review stay aligned.',
    },
  ];

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLookupLoading(true);
        const [vesselsResponse, principalsResponse] = await Promise.all([
          fetch('/api/vessels'),
          fetch('/api/principals'),
        ]);

        if (vesselsResponse.ok) {
          const vesselsData = await vesselsResponse.json();
          if (Array.isArray(vesselsData)) {
            setVesselOptions(
              vesselsData.reduce<VesselOption[]>((accumulator, item) => {
                if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
                  return accumulator;
                }
                accumulator.push({
                  id: item.id,
                  name: item.name,
                  principalId: typeof item.principalId === 'string' ? item.principalId : null,
                });
                return accumulator;
              }, [])
            );
          }
        }

        if (principalsResponse.ok) {
          const principalsData = await principalsResponse.json();
          if (Array.isArray(principalsData)) {
            setPrincipalOptions(
              principalsData.reduce<PrincipalOption[]>((accumulator, item) => {
                if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
                  return accumulator;
                }
                accumulator.push({ id: item.id, name: item.name });
                return accumulator;
              }, [])
            );
          }
        }
      } catch (error) {
        console.error('Error fetching contract lookup data:', error);
      } finally {
        setLookupLoading(false);
      }
    };

    fetchLookups();
  }, []);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const trimmedQuery = crewSearch.trim();
    if (trimmedQuery.length < 2) {
      setCrewOptions((current) => {
        if (selectedCrew && !current.some((crew) => crew.id === selectedCrew.id)) {
          return [selectedCrew, ...current];
        }
        return current;
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/seafarers/search?q=${encodeURIComponent(trimmedQuery)}&pageSize=12`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { results?: unknown };
        const results = Array.isArray(data.results) ? data.results : [];
        const normalized = results.reduce<CrewSearchOption[]>((accumulator, item) => {
          if (!isRecord(item) || typeof item.id !== 'string' || typeof item.fullName !== 'string') {
            return accumulator;
          }
          accumulator.push({
            id: item.id,
            fullName: item.fullName,
            rank: typeof item.rank === 'string' ? item.rank : '',
          });
          return accumulator;
        }, []);
        setCrewOptions(normalized);
      } catch (error) {
        console.error('Error searching crew:', error);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [crewSearch, selectedCrew, showForm]);

  useEffect(() => {
    if (!formData.vesselId || formData.principalId) {
      return;
    }

    const vessel = vesselOptions.find((item) => item.id === formData.vesselId);
    if (vessel?.principalId) {
      setFormData((current) => ({
        ...current,
        principalId: vessel.principalId ?? '',
      }));
    }
  }, [formData.principalId, formData.vesselId, vesselOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canManageContracts) {
      setFormError('This role can review contracts but cannot create or update them.');
      return;
    }

    if (!formData.crewId) {
      setFormError('Select a crew member before saving the contract.');
      return;
    }

    try {
      const url = editingContract ? `/api/contracts/${editingContract.id}` : '/api/contracts';
      const method = editingContract ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractNumber: formData.contractNumber,
          contractKind: formData.contractKind,
          seaType: formData.seaType || null,
          maritimeLaw: formData.maritimeLaw || null,
          cbaReference: formData.cbaReference || null,
          wageScaleHeaderId: formData.wageScaleHeaderId || null,
          guaranteedOTHours: formData.guaranteedOTHours ? parseInt(formData.guaranteedOTHours) : null,
          overtimeRate: formData.overtimeRate || null,
          onboardAllowance: formData.onboardAllowance ? parseFloat(formData.onboardAllowance) : null,
          homeAllotment: formData.homeAllotment ? parseFloat(formData.homeAllotment) : null,
          specialAllowance: formData.specialAllowance ? parseFloat(formData.specialAllowance) : null,
          templateVersion: formData.templateVersion || null,
          crewId: formData.crewId,
          vesselId: formData.vesselId || null,
          principalId: formData.principalId || null,
          rank: formData.rank,
          contractStart: formData.contractStart,
          contractEnd: formData.contractEnd,
          status: formData.status,
          basicWage: parseFloat(formData.basicWage),
          currency: formData.currency
        }),
      });

      if (response.ok) {
        setFormData(createInitialFormData());
        setCrewSearch('');
        setFormError(null);
        setShowForm(false);
        setEditingContract(null);
        setFeedback({
          tone: 'success',
          message: editingContract ? 'Contract updated successfully.' : 'Contract registered successfully.',
        });
        router.replace('/contracts');
        fetchContracts();
      } else {
        const payload = await response.json().catch(() => null);
        setFormError(payload?.error || `Contract ${editingContract ? 'update' : 'creation'} failed.`);
      }
    } catch (error) {
      console.error('Error:', error);
      setFormError(`Contract ${editingContract ? 'update' : 'creation'} failed.`);
    }
  };

  const handleEdit = useCallback((contract: EmploymentContract) => {
    if (!canManageContracts) {
      return;
    }
    setEditingContract(contract);
    setFormData({
      contractNumber: contract.contractNumber,
      contractKind: contract.contractKind,
      seaType: contract.seaType || '',
      maritimeLaw: contract.maritimeLaw || '',
      cbaReference: contract.cbaReference || '',
      wageScaleHeaderId: contract.wageScaleHeaderId || '',
      guaranteedOTHours: contract.guaranteedOTHours?.toString() || '',
      overtimeRate: contract.overtimeRate || '',
      onboardAllowance: contract.onboardAllowance?.toString() || '',
      homeAllotment: contract.homeAllotment?.toString() || '',
      specialAllowance: contract.specialAllowance?.toString() || '',
      templateVersion: contract.templateVersion || '',
      crewId: contract.crewId,
      vesselId: contract.vesselId || '',
      principalId: contract.principalId || '',
      rank: contract.rank,
      contractStart: contract.contractStart.split('T')[0],
      contractEnd: contract.contractEnd.split('T')[0],
      status: contract.status,
      basicWage: contract.basicWage.toString(),
      currency: contract.currency
    });
    setCrewSearch(contract.crew?.fullName || '');
    setCrewOptions((current) => {
      const existing = current.some((crew) => crew.id === contract.crewId);
      if (existing || !contract.crew?.fullName) {
        return current;
      }
      return [
        {
          id: contract.crewId,
          fullName: contract.crew.fullName,
          rank: contract.rank,
        },
        ...current,
      ];
    });
    setFormError(null);
    setShowForm(true);
  }, [canManageContracts]);

  const handleCancel = () => {
    setShowForm(false);
    setEditingContract(null);
    setFormData(createInitialFormData());
    setCrewSearch('');
    setFormError(null);
    router.replace('/contracts');
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    const mode = searchParams.get('mode');
    const crewId = searchParams.get('crewId') ?? '';

    if (editId) {
      if (contracts.length === 0) {
        return;
      }

      const targetContract = contracts.find((contract) => contract.id === editId);
      if (!targetContract) {
        return;
      }

      if (editingContract?.id === targetContract.id && showForm) {
        return;
      }

      handleEdit(targetContract);
      return;
    }

    if (mode === 'new') {
      if (!showForm || editingContract || formData.crewId !== crewId) {
        setEditingContract(null);
        setFormData(createInitialFormData(crewId));
        setCrewSearch('');
        setFormError(null);
        setShowForm(true);
      }
    }
  }, [contracts, editingContract, formData.crewId, handleEdit, searchParams, showForm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCrewSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = crewOptions.find((crew) => crew.id === selectedId) ?? null;
    setFormData((current) => ({
      ...current,
      crewId: selectedId,
      rank: current.rank || selected?.rank || '',
    }));
    if (selected) {
      setCrewSearch(selected.fullName);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManageContracts) return;

    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingDeleteId(null);
        setFeedback({ tone: 'success', message: 'Contract removed from the register.' });
        fetchContracts();
      } else {
        setFeedback({ tone: 'danger', message: 'Contract could not be removed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: 'Contract could not be removed.' });
    }
  };

  const handleGenerateDocument = async (contractId: string, type: string) => {
    try {
      const response = await fetch(`/api/documents/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id: contractId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${contractId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        pushAppNotice({
          tone: 'error',
          title: 'Document generation failed',
          message: error.error || 'The contract document could not be generated.',
        });
      }
    } catch (error) {
      console.error('Error generating document:', error);
      pushAppNotice({
        tone: 'error',
        title: 'Document generation failed',
        message: 'The contract document could not be generated.',
      });
    }
  };

  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Contract Control"
        title="Employment contracts"
        subtitle="Manage sea contracts and office PKL agreements in one controlled workspace with clear ownership, expiry exposure, and print readiness."
        helperLinks={[
          { href: '/crewing/crew-list', label: 'Crew onboard' },
          { href: '/crewing/prepare-joining', label: 'Prepare joining' },
          { href: '/crewing/applications', label: 'Applications' },
        ]}
        highlights={[
          { label: 'Total Contracts', value: contracts.length.toLocaleString('id-ID'), detail: 'All registered contract records.' },
          { label: 'Active Contracts', value: activeContracts.toLocaleString('id-ID'), detail: 'Live agreements currently in force.' },
          { label: 'Expiring ≤ 30 Days', value: expiringSoonContracts.toLocaleString('id-ID'), detail: 'Renewal and reliever planning pressure.' },
          { label: 'Active Contract Value', value: `$${totalContractValue.toLocaleString('en-US')}`, detail: 'Current basic wage exposure for active contracts.' },
        ]}
        actions={(
          <>
            <button
              type="button"
              onClick={() => router.push('/crewing')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
            >
              Back to crewing
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canManageContracts) {
                  return;
                }
                if (showForm) {
                  handleCancel();
                  return;
                }
                setEditingContract(null);
                setFormData(createInitialFormData());
                setCrewSearch('');
                setFormError(null);
                setShowForm(true);
                router.replace('/contracts?mode=new');
              }}
              disabled={!canManageContracts}
              className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canManageContracts ? (showForm ? 'Close Intake Form' : 'Register Contract') : 'View only'}
            </button>
          </>
        )}
      />

      <div className="mb-8 rounded-2xl border border-sky-200 bg-sky-50 px-6 py-5">
        <p className="text-sm font-semibold text-sky-900">How to use this page</p>
        <p className="mt-1 text-sm text-sky-800">
          {canManageContracts
            ? 'Use Contracts for operational contract preparation and review. Select the crew member first, then connect vessel and principal. Vessel Assignment and transport remain in GA / Driver, while Prepare Joining remains in Operational.'
            : 'This role can review contract records and print contract documents. Contract creation, update, and deletion remain with the assigned contract owner.'}
        </p>
      </div>

      {feedback ? (
        <div className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${feedback.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {feedback.message}
        </div>
      ) : null}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-white to-blue-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{editingContract ? 'Update Employment Contract' : 'Register Employment Contract'}</h2>
            <p className="text-gray-700">
              {editingContract
                ? 'Revise this agreement only when the approved contract terms, linked desk data, or commercial basis has changed.'
                : 'Create one controlled employment agreement for a confirmed crew, contract type, and deployment context.'}
            </p>
          </div>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {contractFormSteps.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
          {formError ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}
          <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white/70 p-5 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Crew</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedCrew?.fullName || 'Select crew from search results'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vessel</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedVessel?.name || 'Optional until vessel confirmed'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Principal</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedPrincipal?.name || 'Optional until principal confirmed'}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contract Number *
                </label>
                <input
                  type="text"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Contract number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contract Type *
                </label>
                <select
                  name="contractKind"
                  value={formData.contractKind}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                    <option value="SEA">Sea Employment Agreement</option>
                    <option value="OFFICE_PKL">Office PKL Agreement</option>
                </select>
              </div>
              {formData.contractKind === 'SEA' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SEA Type
                    </label>
                    <select
                      name="seaType"
                      value={formData.seaType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    >
                      <option value="">Select SEA Type</option>
                      <option value="KOREA">Korea</option>
                      <option value="BAHAMAS_PANAMA">Bahamas / Panama</option>
                      <option value="TANKER_LUNDQVIST">Tanker (Lundqvist)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maritime Law
                    </label>
                    <input
                      type="text"
                      name="maritimeLaw"
                      value={formData.maritimeLaw}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. Bahamas, Panama, Korea"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CBA Reference
                    </label>
                    <input
                      type="text"
                      name="cbaReference"
                      value={formData.cbaReference}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. Lundqvist CBA 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Wage Scale Header ID
                    </label>
                    <input
                      type="text"
                      name="wageScaleHeaderId"
                      value={formData.wageScaleHeaderId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="Wage scale header ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Guaranteed OT Hours
                    </label>
                    <input
                      type="number"
                      name="guaranteedOTHours"
                      value={formData.guaranteedOTHours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. 103"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Overtime Rate
                    </label>
                    <input
                      type="text"
                      name="overtimeRate"
                      value={formData.overtimeRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. 125%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Onboard Allowance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="onboardAllowance"
                      value={formData.onboardAllowance}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="Cash advance on board"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Home Allotment
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="homeAllotment"
                      value={formData.homeAllotment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="Monthly remittance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Allowance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="specialAllowance"
                      value={formData.specialAllowance}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="SA for certain ships"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Template Version
                    </label>
                    <input
                      type="text"
                      name="templateVersion"
                      value={formData.templateVersion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="SEA template revision"
                    />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Crew Search *
                </label>
                <input
                  type="text"
                  value={crewSearch}
                  onChange={(e) => setCrewSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Search by crew name, rank, passport, nationality, or phone"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Type at least 2 characters, then select the correct crew record below.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Crew Record *
                </label>
                <select
                  name="crewId"
                  value={formData.crewId}
                  onChange={handleCrewSelection}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">{crewSearch.trim().length >= 2 ? 'Select matched crew' : 'Search crew first'}</option>
                  {crewOptions.map((crew) => (
                    <option key={crew.id} value={crew.id}>
                      {crew.fullName}{crew.rank ? ` • ${crew.rank}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vessel (Optional)
                </label>
                <select
                  name="vesselId"
                  value={formData.vesselId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">{lookupLoading ? 'Loading vessels...' : 'Select vessel if assigned'}</option>
                  {vesselOptions.map((vessel) => (
                    <option key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Principal (Optional)
                </label>
                <select
                  name="principalId"
                  value={formData.principalId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">{lookupLoading ? 'Loading principals...' : 'Select principal if confirmed'}</option>
                  {principalOptions.map((principal) => (
                    <option key={principal.id} value={principal.id}>
                      {principal.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rank *
                </label>
                <select
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Select Rank</option>
                  <option value="MASTER">Master</option>
                  <option value="CHIEF_OFFICER">Chief Officer</option>
                  <option value="SECOND_OFFICER">Second Officer</option>
                  <option value="THIRD_OFFICER">Third Officer</option>
                  <option value="CHIEF_ENGINEER">Chief Engineer</option>
                  <option value="SECOND_ENGINEER">Second Engineer</option>
                  <option value="THIRD_ENGINEER">Third Engineer</option>
                  <option value="FOURTH_ENGINEER">Fourth Engineer</option>
                  <option value="ELECTRICAL_OFFICER">Electrical Officer</option>
                  <option value="BOATSWAIN">Boatswain</option>
                  <option value="ABLE_SEAMAN">Able Seaman</option>
                  <option value="ORDINARY_SEAMAN">Ordinary Seaman</option>
                  <option value="OILER">Oiler</option>
                  <option value="WIPER">Wiper</option>
                  <option value="MOTORMAN">Motorman</option>
                  <option value="CHIEF_COOK">Chief Cook</option>
                  <option value="COOK">Cook</option>
                  <option value="STEWARD">Steward</option>
                  <option value="CADET">Cadet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="contractStart"
                  value={formData.contractStart}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="contractEnd"
                  value={formData.contractEnd}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SEK">SEK</option>
                  <option value="NOK">NOK</option>
                  <option value="DKK">DKK</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Basic Wage *
                </label>
                <input
                  type="number"
                  name="basicWage"
                  value={formData.basicWage}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Allowance
                </label>
                <input
                  type="number"
                  name="specialAllowance"
                  value={formData.specialAllowance}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Onboard Allowance
                </label>
                <input
                  type="number"
                  name="onboardAllowance"
                  value={formData.onboardAllowance}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Home Allotment *
                </label>
                <input
                  type="number"
                  name="homeAllotment"
                  value={formData.homeAllotment}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {editingContract ? 'Save Contract Update' : 'Register Contract'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Close Without Saving
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contracts List */}
      <div className="bg-gradient-to-r from-white to-gray-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
        {/* Metrics Dashboard */}
        <div className="px-8 py-6 border-b border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Total Contracts</p>
                  <p className="text-2xl font-extrabold text-gray-900">{contracts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Active Contracts</p>
                  <p className="text-2xl font-extrabold text-gray-900">{activeContracts}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Expiring Soon</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {expiringSoonContracts}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Total Value</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    ${totalContractValue.toLocaleString('en-US')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-gray-900">All Contracts</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Contracts ({contracts.length})
              </button>
              <button
                onClick={() => setFilter('SEA')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'SEA'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                SEA Contracts ({contracts.filter(c => c.contractKind === 'SEA').length})
              </button>
              <button
                onClick={() => setFilter('OFFICE_PKL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'OFFICE_PKL'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Office PKL Contracts
              </button>
            </div>
          </div>
        </div>

        {pendingDeleteId ? (
          <div className="border-b border-rose-200 bg-rose-50 px-8 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">Remove this contract record?</p>
                <p className="mt-1 text-sm text-rose-800">Use removal only when the contract was created by mistake and should not remain in the controlled register.</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPendingDeleteId(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Keep Record
                </button>
                <button type="button" onClick={() => handleDelete(pendingDeleteId)} className="rounded-lg border border-red-200 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                  Confirm Removal
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700 font-semibold">No contracts found.</p>
            <p className="mt-2 text-sm text-gray-500">Register the first controlled contract when crew, vessel, and principal are confirmed for contract preparation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contract #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SEA Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Crew</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vessel</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Days Left</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monthly Wage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contracts
                  .filter(contract => filter === 'ALL' || contract.contractKind === filter)
                  .sort((a, b) => new Date(b.contractStart).getTime() - new Date(a.contractStart).getTime())
                  .map((contract) => {
                    const endDate = new Date(contract.contractEnd);
                    const now = new Date();
                    const diffTime = endDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = diffDays <= 30 && diffDays >= 0 && contract.status === 'ACTIVE';
                    
                    return (
                      <tr key={contract.id} className={`hover:bg-gray-100 ${isExpiringSoon ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{contract.contractNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                            contract.contractKind === 'SEA'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {contract.contractKind === 'SEA' ? 'SEA' : 'Office PKL'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contract.contractKind === 'SEA' ? (
                            <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                              contract.seaType === 'KOREA' ? 'bg-red-100 text-red-800' :
                              contract.seaType === 'BAHAMAS_PANAMA' ? 'bg-yellow-100 text-yellow-800' :
                              contract.seaType === 'TANKER_LUNDQVIST' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {contract.seaType === 'KOREA' ? 'Korea' :
                               contract.seaType === 'BAHAMAS_PANAMA' ? 'Bahamas/Panama' :
                               contract.seaType === 'TANKER_LUNDQVIST' ? 'Tanker' :
                               contract.seaType || '-'}
                            </span>
                          ) : (
                            <span className="text-gray-700">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{contract.crew?.fullName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{contract.rank}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{contract.vessel?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{contract.principal?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{new Date(contract.contractStart).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{new Date(contract.contractEnd).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>
                            {contract.status === 'ACTIVE' ? (diffDays > 0 ? `${diffDays} days` : 'Expired') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                            contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            contract.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            contract.status === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.currency} {contract.basicWage.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                              className="rounded-lg border border-blue-200 px-3 py-2 text-blue-700 hover:bg-blue-50"
                              title="Open Contract"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => handleEdit(contract)}
                              className="rounded-lg border border-emerald-200 px-3 py-2 text-emerald-700 hover:bg-emerald-50"
                              title="Edit Contract"
                            >
                              Edit
                            </button>
                            {contract.contractKind === 'SEA' && (
                              <button
                                onClick={() => handleGenerateDocument(contract.id, 'sea_agreement')}
                                className="rounded-lg border border-purple-200 px-3 py-2 text-purple-700 hover:bg-purple-50"
                                title="Generate SEA PDF"
                              >
                                PDF
                              </button>
                            )}
                            {contract.contractKind === 'OFFICE_PKL' && (
                              <button
                                onClick={() => handleGenerateDocument(contract.id, 'pkl_contract')}
                                className="rounded-lg border border-purple-200 px-3 py-2 text-purple-700 hover:bg-purple-50"
                                title="Generate PKL PDF"
                              >
                                PDF
                              </button>
                            )}
                            <button
                              onClick={() => setPendingDeleteId(contract.id)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                              title="Delete Contract"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
