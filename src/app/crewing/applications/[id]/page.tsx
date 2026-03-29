'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserRole } from '@/lib/permissions';
import { getApplicationWorkflowMeta } from '@/lib/application-workflow';
import { buildMaritimeRegulatoryReadiness } from '@/lib/maritime-regulatory-readiness';
import { normalizeToUserRoles } from '@/lib/type-guards';

interface CrewDocumentSummary {
  id: string;
  docType: string;
  docNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
}

interface MedicalCheckSummary {
  id: string;
  checkDate: string;
  expiryDate: string;
  clinicName: string;
  doctorName?: string | null;
  result: string;
  remarks?: string | null;
}

interface SeaServiceSummary {
  id: string;
  vesselName: string;
  companyName?: string | null;
  vesselType?: string | null;
  flag?: string | null;
  grt?: number | null;
  engineOutput?: string | null;
  rank: string;
  signOnDate: string;
  signOffDate?: string | null;
  status: string;
  verificationStatus: string;
  remarks?: string | null;
}

interface CrewProfile {
  id: string;
  fullName: string | null;
  nationality?: string | null;
  rank?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  seamanBookNumber?: string | null;
  seamanBookExpiry?: string | null;
  status?: string | null;
  crewStatus?: string | null;
  documents?: CrewDocumentSummary[];
  medicalChecks?: MedicalCheckSummary[];
  seaServiceHistories?: SeaServiceSummary[];
}

interface ApplicationDetail {
  id: string;
  crewId: string;
  position: string | null;
  appliedRank?: string | null;
  applicationDate: string | null;
  status: string;
  hgiStage: string;
  cvReadyAt?: string | null;
  hasPrepareJoining?: boolean;
  remarks: string | null;
  vesselType: string | null;
  seafarer?: CrewProfile;
  crew?: CrewProfile;
  principal?: {
    id: string;
    name: string;
  } | null;
}

interface TransitionAction {
  label: string;
  nextStatus: string;
  tone: string;
}

const REQUIRED_DOCUMENTS = [
  { key: 'passport', label: 'Passport', match: ['PASSPORT'] },
  { key: 'seaman-book', label: 'Seaman Book', match: ['SEAMAN_BOOK'] },
  { key: 'medical', label: 'Medical Certificate', match: ['MEDICAL', 'MEDICAL_RESULT'] },
  { key: 'stcw', label: 'STCW Basic Suite', match: ['STCW_BST', 'STCW_AFF', 'STCW_MEFA', 'STCW_SCRB'] },
  { key: 'visa', label: 'Visa / Travel Clearance', match: ['VISA', 'SCHENGEN_VISA_NL'] },
] as const;

function getWorkflowOwner(stage: string) {
  switch (stage) {
    case 'DRAFT':
    case 'DOCUMENT_CHECK':
    case 'CV_READY':
      return 'Crewing Document Control';
    case 'SUBMITTED_TO_DIRECTOR':
    case 'DIRECTOR_APPROVED':
      return 'Director';
    case 'SENT_TO_OWNER':
    case 'OWNER_APPROVED':
    case 'OWNER_REJECTED':
      return 'Principal';
    case 'PRE_JOINING':
      return 'Operational Control';
    default:
      return 'Review Only';
  }
}

function getPrimaryAction(stage: string, options: { canDocumentFlow: boolean; canDirectorFlow: boolean }): TransitionAction | null {
  switch (stage) {
    case 'DRAFT':
      return options.canDocumentFlow
        ? { label: 'Begin Document Review', nextStatus: 'REVIEWING', tone: 'bg-blue-600 hover:bg-blue-700' }
        : null;
    case 'CV_READY':
      return options.canDocumentFlow
        ? { label: 'Submit for Director Review', nextStatus: 'INTERVIEW', tone: 'bg-cyan-700 hover:bg-cyan-800' }
        : null;
    case 'SUBMITTED_TO_DIRECTOR':
      return options.canDirectorFlow
        ? { label: 'Approve for Principal Review', nextStatus: 'PASSED', tone: 'bg-emerald-600 hover:bg-emerald-700' }
        : null;
    case 'DIRECTOR_APPROVED':
      return options.canDirectorFlow
        ? { label: 'Release to Principal', nextStatus: 'OFFERED', tone: 'bg-indigo-600 hover:bg-indigo-700' }
        : null;
    default:
      return null;
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function calculateAge(value?: string | null) {
  if (!value) {
    return null;
  }

  const dob = new Date(value);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthOffset = now.getMonth() - dob.getMonth();
  if (monthOffset < 0 || (monthOffset === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function diffMonths(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function getExpiryStatus(expiryDate?: string | null) {
  if (!expiryDate) {
    return { status: 'PENDING', label: 'Missing expiry', detail: 'No validity date recorded.' };
  }

  const today = new Date();
  const expiry = new Date(expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    return { status: 'PENDING', label: 'Invalid date', detail: 'Review the document record.' };
  }

  if (expiry < today) {
    return { status: 'EXPIRED', label: 'Expired', detail: `Expired on ${formatDate(expiryDate)}.` };
  }

  if (diffMonths(today, expiry) <= 3) {
    return { status: 'WARNING', label: 'Expiring Soon', detail: `Valid until ${formatDate(expiryDate)}.` };
  }

  return { status: 'APPROVED', label: 'Valid', detail: `Valid until ${formatDate(expiryDate)}.` };
}

function normaliseMedicalResult(result?: string | null) {
  const normalized = result?.trim().toUpperCase() ?? 'PENDING';
  if (normalized === 'PASS' || normalized === 'FIT') {
    return { status: 'APPROVED', label: 'Fit for Duty' };
  }
  if (normalized === 'FAIL' || normalized === 'UNFIT') {
    return { status: 'FAILED', label: 'Not Fit' };
  }
  return { status: 'PENDING', label: 'Medical Review Pending' };
}

function formatDocLabel(docType: string) {
  return docType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ApplicationDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const userRoles = normalizeToUserRoles(session?.user?.roles);
  const canDocumentFlow = userRoles.includes(UserRole.CDMO);
  const canDirectorFlow = userRoles.includes(UserRole.DIRECTOR);

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') {
      return;
    }

    if (!session) {
      router.push('/auth/signin');
    }
  }, [router, session, sessionStatus]);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/applications/${id}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload) {
          throw new Error(payload?.error || 'Failed to load application detail');
        }

        setApplication(payload as ApplicationDetail);
      } catch (fetchError) {
        console.error('Error fetching application detail:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load application detail');
      } finally {
        setLoading(false);
      }
    };

    if (id && session) {
      fetchApplication();
    }
  }, [id, session]);

  const crew = useMemo(() => {
    if (!application) {
      return null;
    }

    return application.crew ?? application.seafarer ?? null;
  }, [application]);

  const dossier = useMemo(() => {
    if (!application || !crew) {
      return null;
    }

    const documents = crew.documents ?? [];
    const medicalChecks = crew.medicalChecks ?? [];
    const seaServices = crew.seaServiceHistories ?? [];
    const latestMedical = medicalChecks[0] ?? null;
    const age = calculateAge(crew.dateOfBirth);
    const totalSeaServices = seaServices.length;
    const lastContract = seaServices[0] ?? null;
    const validDocuments = documents.filter((document) => getExpiryStatus(document.expiryDate).status === 'APPROVED').length;
    const expiringDocuments = documents.filter((document) => getExpiryStatus(document.expiryDate).status === 'WARNING').length;
    const expiredDocuments = documents.filter((document) => getExpiryStatus(document.expiryDate).status === 'EXPIRED').length;

    const keyDocuments = REQUIRED_DOCUMENTS.map((requirement) => {
      let matchedDocument = documents.find((document) => requirement.match.some((token) => document.docType.includes(token)));
      if (!matchedDocument && requirement.key === 'passport' && crew.passportNumber) {
        matchedDocument = {
          id: 'passport-master',
          docType: 'PASSPORT',
          docNumber: crew.passportNumber,
          issueDate: null,
          expiryDate: crew.passportExpiry ?? null,
          remarks: null,
        };
      }
      if (!matchedDocument && requirement.key === 'seaman-book' && crew.seamanBookNumber) {
        matchedDocument = {
          id: 'seaman-book-master',
          docType: 'SEAMAN_BOOK',
          docNumber: crew.seamanBookNumber,
          issueDate: null,
          expiryDate: crew.seamanBookExpiry ?? null,
          remarks: null,
        };
      }

      const readiness = getExpiryStatus(matchedDocument?.expiryDate);
      return {
        ...requirement,
        document: matchedDocument,
        readiness,
      };
    });

    return {
      age,
      documents,
      keyDocuments,
      latestMedical,
      medicalChecks,
      seaServices,
      totalSeaServices,
      lastContract,
      validDocuments,
      expiringDocuments,
      expiredDocuments,
    };
  }, [application, crew]);

  const regulatoryReadiness = useMemo(
    () =>
      buildMaritimeRegulatoryReadiness({
        documents: dossier?.documents ?? [],
        passportExpiry: crew?.passportExpiry,
        seamanBookExpiry: crew?.seamanBookExpiry,
        medicalChecks: dossier?.medicalChecks ?? [],
      }),
    [crew?.passportExpiry, crew?.seamanBookExpiry, dossier?.documents, dossier?.medicalChecks]
  );

  const handleTransition = async (nextStatus: string) => {
    try {
      setSaving(true);
      setError(null);
      let remarks: string | undefined;

      if (nextStatus === 'CANCELLED') {
        const note = window.prompt('Enter a closure note for audit trail:');
        if (!note || note.trim().length < 3) {
          setSaving(false);
          setError('A clear closure note is required before closing this nomination.');
          return;
        }
        remarks = note.trim();
      }

      const response = await fetch(`/api/crewing/applications/${id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus: nextStatus, remarks }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update application');
      }

      setApplication((payload?.data ?? payload) as ApplicationDetail);
    } catch (transitionError) {
      console.error('Error updating application detail:', transitionError);
      setError(transitionError instanceof Error ? transitionError.message : 'Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!application || !crew || !dossier) {
    return (
      <section className="surface-card border-rose-200 bg-rose-50 p-8">
        <h2 className="text-lg font-semibold text-rose-900">Nomination record not found</h2>
        <p className="mt-2 text-sm text-rose-700">{error || 'The requested nomination dossier could not be loaded.'}</p>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={() => router.push('/crewing/applications')}>
            Return to Nomination Desk
          </Button>
        </div>
      </section>
    );
  }

  const displayName = crew.fullName?.trim() || `Crew ${application.crewId}`;
  const workflow = getApplicationWorkflowMeta(application.hgiStage);
  const primaryAction = getPrimaryAction(application.hgiStage, { canDocumentFlow, canDirectorFlow });
  const showReject =
    (canDocumentFlow && ['DRAFT', 'DOCUMENT_CHECK', 'CV_READY'].includes(application.hgiStage)) ||
    (canDirectorFlow && ['SUBMITTED_TO_DIRECTOR', 'DIRECTOR_APPROVED'].includes(application.hgiStage));
  const isClosed = ['PRE_JOINING', 'OWNER_REJECTED', 'CLOSED'].includes(application.hgiStage);
  const statusLabel = workflow.label;
  const medicalState = normaliseMedicalResult(dossier.latestMedical?.result);

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Candidate Review Dossier</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This dossier is structured for office and principal review: profile snapshot, sea service track record, document readiness, and the next governed approval action.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push('/crewing/applications')}>
              Return to Nomination Desk
            </Button>
            <Link href={`/crewing/seafarers/${crew.id}`} className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Open Crew Profile
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="surface-card border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nomination Stage</p>
          <div className="mt-3">
            <StatusBadge status={application.hgiStage} label={statusLabel} className="px-3 py-2" />
          </div>
          <p className="mt-3 text-sm text-slate-600">{workflow.nextStep}</p>
        </section>
        <section className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sea Service Record</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{dossier.totalSeaServices}</p>
          <p className="mt-2 text-sm text-slate-600">
            {dossier.lastContract ? `Last service: ${dossier.lastContract.rank} on ${dossier.lastContract.vesselName}` : 'No sea service history recorded yet.'}
          </p>
        </section>
        <section className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document Readiness</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{dossier.validDocuments}</p>
          <p className="mt-2 text-sm text-slate-600">
            {dossier.expiredDocuments > 0
              ? `${dossier.expiredDocuments} expired and ${dossier.expiringDocuments} expiring soon.`
              : dossier.expiringDocuments > 0
                ? `${dossier.expiringDocuments} key items need renewal planning.`
                : 'Controlled documents currently read as operationally valid.'}
          </p>
        </section>
        <section className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medical Fitness</p>
          <div className="mt-3">
            <StatusBadge status={medicalState.status} label={medicalState.label} className="px-3 py-2" />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {dossier.latestMedical
              ? `Latest check at ${dossier.latestMedical.clinicName} valid until ${formatDate(dossier.latestMedical.expiryDate)}.`
              : 'No medical check has been attached to the crew record yet.'}
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
        <div className="space-y-6">
          <section className="surface-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Snapshot</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{displayName}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {crew.nationality || 'Nationality not recorded'}
                  {crew.rank ? ` • Current rank ${crew.rank}` : ''}
                  {dossier.age ? ` • ${dossier.age} years old` : ''}
                </p>
              </div>
              <StatusBadge status={crew.crewStatus || crew.status || 'PENDING'} label={crew.crewStatus || crew.status || 'Profile Pending'} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <div className="text-sm text-slate-500">Applied Position</div>
                <div className="mt-1 font-semibold text-slate-900">{application.position || application.appliedRank || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Principal</div>
                <div className="mt-1 font-semibold text-slate-900">{application.principal?.name || 'Open nomination / any principal'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Preferred Vessel Type</div>
                <div className="mt-1 font-semibold text-slate-900">{application.vesselType || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Application Date</div>
                <div className="mt-1 font-semibold text-slate-900">{formatDate(application.applicationDate)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Current Workflow Owner</div>
                <div className="mt-1 font-semibold text-slate-900">{getWorkflowOwner(application.hgiStage)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Contact</div>
                <div className="mt-1 font-semibold text-slate-900">{crew.phone || crew.email || 'Not recorded'}</div>
              </div>
            </div>

            {crew.address ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered Address</p>
                <p className="mt-2 text-sm text-slate-700">{crew.address}</p>
              </div>
            ) : null}
          </section>

          <section className="surface-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sea Service Track Record</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Recent onboard experience</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Principal review should focus on recent rank exposure, vessel familiarity, and recency of sea service.
                </p>
              </div>
              <Link href={`/crewing/seafarers/${crew.id}`} className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800">
                Full crew profile
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {dossier.seaServices.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No verified sea service history is attached yet. Principal review should wait for service evidence or updated crew history.
                </div>
              ) : (
                dossier.seaServices.map((service) => (
                  <article key={service.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">{service.vesselName}</h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {service.rank}
                          {service.vesselType ? ` • ${service.vesselType}` : ''}
                          {service.companyName ? ` • ${service.companyName}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={service.status} label={service.status === 'ONGOING' ? 'Onboard' : 'Completed'} />
                        <StatusBadge
                          status={service.verificationStatus === 'VERIFIED' ? 'APPROVED' : 'PENDING'}
                          label={service.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending Verification'}
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Service Window</span>
                        {formatDate(service.signOnDate)} - {formatDate(service.signOffDate)}
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Flag</span>
                        {service.flag || '—'}
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">GRT</span>
                        {service.grt ? service.grt.toLocaleString('en-US') : '—'}
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Engine Output</span>
                        {service.engineOutput || '—'}
                      </div>
                    </div>
                    {service.remarks ? <p className="mt-3 text-sm text-slate-600">{service.remarks}</p> : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="surface-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document Readiness</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Key compliance and travel papers</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Show only the readiness signal principal needs: validity, missing items, and whether office can proceed to mobilization.
                </p>
              </div>
              <Link href={`/crewing/seafarers/${crew.id}/documents`} className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800">
                Open crew documents
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {dossier.keyDocuments.map((item) => (
                <article key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{item.label}</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.document ? formatDocLabel(item.document.docType) : 'No linked document record'}
                      </p>
                    </div>
                    <StatusBadge status={item.readiness.status} label={item.readiness.label} />
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    <p>{item.document ? `No. ${item.document.docNumber}` : 'Record not linked yet.'}</p>
                    <p className="mt-1">{item.readiness.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            {dossier.documents.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Additional supporting documents</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dossier.documents.slice(0, 8).map((document) => {
                    const readiness = getExpiryStatus(document.expiryDate);
                    return (
                      <div key={document.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                        {formatDocLabel(document.docType)} • {readiness.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <section className="surface-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Regulatory Readiness</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">International maritime compliance signal</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Use this view to frame the nomination against core deployment controls commonly reviewed under MLC 2006 and STCW 2010.
                </p>
              </div>
              <StatusBadge
                status={regulatoryReadiness.overallStatus}
                label={
                  regulatoryReadiness.overallStatus === 'APPROVED'
                    ? 'Regulatory Ready'
                    : regulatoryReadiness.overallStatus === 'WARNING'
                      ? 'Regulatory Follow-Up'
                      : regulatoryReadiness.overallStatus === 'EXPIRED'
                        ? 'Regulatory Blocker'
                        : 'Regulatory Review Pending'
                }
              />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {regulatoryReadiness.buckets.map((bucket) => (
                <article key={bucket.code} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{bucket.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{bucket.code.replace(/_/g, ' ')}</p>
                    </div>
                    <StatusBadge status={bucket.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{bucket.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review Decision Pack</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Action and release control</h3>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={`/api/forms/cr-02/${application.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Download CR-02 Review Form
              </a>
              <Link
                href={`/crewing/seafarers/${crew.id}/documents`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800"
              >
                Review Crew Documents
              </Link>

              {canDocumentFlow && application.hgiStage === 'DOCUMENT_CHECK' ? (
                <button
                  type="button"
                  disabled={saving || Boolean(application.cvReadyAt)}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      setError(null);
                      const response = await fetch(`/api/crewing/applications/${id}/cv-ready`, { method: 'POST' });
                      const payload = await response.json().catch(() => null);
                      if (!response.ok) {
                        throw new Error(payload?.error || 'Failed to mark CV ready');
                      }
                      setApplication((payload ?? null) as ApplicationDetail);
                    } catch (markError) {
                      setError(markError instanceof Error ? markError.message : 'Failed to mark CV ready');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : application.cvReadyAt ? 'CV Ready Recorded' : 'Confirm CV Ready'}
                </button>
              ) : null}

              {primaryAction ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleTransition(primaryAction.nextStatus)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${primaryAction.tone} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {saving ? 'Saving...' : primaryAction.label}
                </button>
              ) : null}

              {showReject ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleTransition('CANCELLED')}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Close Nomination with Note'}
                </button>
              ) : null}
            </div>
          </section>

          <section className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Principal Review Context</p>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">Next governed step</p>
                <p className="mt-1">{workflow.nextStep}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-slate-900">Review scope</p>
                <p className="mt-1">
                  Principal should evaluate suitability, recent vessel exposure, and readiness of controlled travel papers before releasing the case to mobilization.
                </p>
              </div>
              {application.hgiStage === 'SENT_TO_OWNER' ? (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-900">
                  Waiting for principal decision in the principal portal. Office users should not override this stage from the internal desk.
                </div>
              ) : null}
              {!canDocumentFlow && !canDirectorFlow ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  Review-only access. Workflow changes stay limited to governed office roles so the nomination trail remains auditable.
                </div>
              ) : null}
              {isClosed ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                  This nomination is closed for traceability. Continue any live crew mobilization only from Prepare Joining.
                </div>
              ) : null}
            </div>
          </section>

          <section className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medical and Remarks</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Latest medical status</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {dossier.latestMedical
                        ? `${dossier.latestMedical.clinicName} • checked ${formatDate(dossier.latestMedical.checkDate)}`
                        : 'No medical record attached yet.'}
                    </p>
                  </div>
                  <StatusBadge status={medicalState.status} label={medicalState.label} />
                </div>
              </div>

              {application.remarks ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">Office remarks</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{application.remarks}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No office remarks recorded yet. Use remarks only for controlled review notes that help the next decision owner.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
