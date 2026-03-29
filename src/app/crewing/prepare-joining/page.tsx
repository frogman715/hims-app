"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, type ChangeEvent, type FocusEvent } from "react";
import Link from "next/link";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { canAccessOfficePath } from "@/lib/office-access";
import { getPrepareJoiningHgiStatusMeta } from "@/lib/prepare-joining-flow";
import { buildOperationalRegulatoryReadiness } from "@/lib/maritime-regulatory-readiness";
import { Button } from "@/components/ui/Button";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { StatusBadge } from "@/components/ui/StatusBadge";

const PREPARE_JOINING_LINEAR_FLOW = [
  {
    label: "Principal Approved",
    helper: "Principal has approved the candidate and operational receives the handoff here.",
  },
  {
    label: "Pre-Joining",
    helper: "Operational clears medical, documents, visa, contract release, and briefing.",
  },
  {
    label: "Ready to Onboard",
    helper: "Final checks are complete and the crew member can be released to move.",
  },
  {
    label: "Onboarded",
    helper: "Crew has moved out of office handling and the operational record remains for traceability.",
  },
] as const;

interface PrepareJoining {
  id: string;
  crewId: string;
  vesselId: string | null;
  principalId: string | null;
  status: string;
  passportValid: boolean;
  seamanBookValid: boolean;
  certificatesValid: boolean;
  medicalValid: boolean;
  visaValid: boolean;
  medicalCheckDate: string | null;
  medicalExpiry: string | null;
  orientationDate: string | null;
  orientationCompleted: boolean;
  departureDate: string | null;
  departurePort: string | null;
  arrivalPort: string | null;
  flightNumber: string | null;
  ticketBooked: boolean;
  hotelBooked: boolean;
  hotelName: string | null;
  transportArranged: boolean;
  remarks: string | null;
  
  // MCU Section
  mcuScheduled: boolean;
  mcuScheduledDate: string | null;
  mcuCompleted: boolean;
  mcuCompletedDate: string | null;
  mcuDoctorName: string | null;
  mcuClinicName: string | null;
  mcuResult: string | null;
  mcuRestrictions: string | null;
  mcuRemarks: string | null;
  vaccineYellowFever: boolean;
  vaccineHepatitisA: boolean;
  vaccineHepatitisB: boolean;
  vaccineTyphoid: boolean;
  vaccineOther: string | null;
  vaccineExpiryDate: string | null;

  // Equipment Section
  safetyLifeJacket: boolean;
  safetyHelmet: boolean;
  safetyShoes: boolean;
  safetyGloves: boolean;
  safetyHarnessVest: boolean;
  workUniform: boolean;
  workIDCard: boolean;
  workAccessCard: boolean;
  workStationery: boolean;
  workToolsProvided: boolean;
  personalPassport: boolean;
  personalVisa: boolean;
  personalTickets: boolean;
  personalVaccineCard: boolean;
  personalMedicalCert: boolean;
  vesselStatroomAssigned: boolean;
  vesselStatroomNumber: string | null;
  vesselContractSigned: boolean;
  vesselBriefingScheduled: boolean;
  vesselBriefingDate: string | null;
  vesselOrientationDone: boolean;
  vesselEmergencyDrill: boolean;

  // Pre-Departure Section
  preDepartureDocCheck: boolean;
  preDepartureEquipCheck: boolean;
  preDepartureMedicalOK: boolean;
  preDepartureEmergency: boolean;
  preDepartureSalaryOK: boolean;
  preDeparturePerDiem: boolean;
  preDepartureFinalCheck: boolean;
  preDepartureApprovedBy: string | null;
  preDepartureApprovedAt: string | null;
  preDepartureChecklistBy: string | null;
  
  crew: {
    id: string;
    fullName: string;
    rank: string;
    nationality: string | null;
    phone: string | null;
  };
  vessel: {
    id: string;
    name: string;
    type: string;
  } | null;
  principal: {
    id: string;
    name: string;
  } | null;
  principalChecklistSummary?: {
    requiredTemplateCount: number;
    approvedRequiredCount: number;
    missingRequiredCount: number;
    blockers: string[];
  };
  documentCompleteness?: {
    status: "COMPLETE" | "INCOMPLETE" | "EXPIRED" | "NEEDS_REVIEW";
    nextAction: string;
    missing: string[];
    needsReview: string[];
    expired: number;
  };
  continuity?: {
    currentStep: "APPROVED_APPLICATION" | "DOCUMENTS" | "PREPARE_JOINING" | "DISPATCH" | "DISPATCHED" | "CANCELLED";
    currentStepLabel: string;
    blockingIssue: string;
    nextAction: string;
    recommendedStatus: string;
    statusAligned: boolean;
    statusNote: string | null;
  };
}

const PREPARE_JOINING_SEQUENCE = [
  {
    label: "Medical",
    helper: "MCU schedule, medical validity, and clinic result.",
  },
  {
    label: "Visa / Seaman Book / Certificates",
    helper: "Passport, seaman book, certificates, endorsements, and visa readiness.",
  },
  {
    label: "Contract / Principal Requirements",
    helper: "Contract is signed and required principal forms are cleared.",
  },
  {
    label: "Briefing / Understanding",
    helper: "Joining briefing and handover understanding are recorded.",
  },
  {
    label: "Ready to Onboard",
    helper: "Travel, routing, final review, and release to onboard movement.",
  },
] as const;

export default function PrepareJoiningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prepareJoinings, setPrepareJoinings] = useState<PrepareJoining[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, string | null>>({});
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canEditPrepareJoining = canAccessOfficePath("/api/prepare-joining", userRoles, isSystemAdmin, "PUT");

  // Optional spinner flag keeps inline updates responsive without flashing the full-page loader.
  const fetchPrepareJoinings = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
      setError(null);
    }
    try {
      const url =
        selectedStatus === "ALL"
          ? "/api/prepare-joining"
          : `/api/prepare-joining?status=${selectedStatus}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPrepareJoinings(data.data || data);
      } else {
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (response.status === 403) {
          setError(payload?.error || "Access to prepare joining is restricted for your role.");
          return;
        }
        setError(payload?.error || "Prepare joining data could not be loaded. Please try again or contact admin.");
      }
    } catch (error) {
      console.error("Error fetching prepare joinings:", error);
      setError("Prepare joining data could not be loaded. Please try again or contact admin.");
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [router, selectedStatus]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchPrepareJoinings();
  }, [session, status, router, fetchPrepareJoinings]);

  const updatePrepareJoining = async (
    id: string,
    payload: Record<string, boolean | string | null>
  ) => {
    if (!canEditPrepareJoining) {
      return;
    }

    try {
      setUpdatingId(id);
      setFeedbackById((current) => ({ ...current, [id]: null }));
      const response = await fetch(`/api/prepare-joining/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        await fetchPrepareJoinings(false);
        return;
      }

      setFeedbackById((current) => ({
        ...current,
        [id]: data?.error || "Prepare joining update failed.",
      }));
    } catch (error) {
      console.error("Error updating checklist:", error);
      setFeedbackById((current) => ({
        ...current,
        [id]: "Prepare joining update failed.",
      }));
    } finally {
      setUpdatingId((current) => (current === id ? null : current));
    }
  };

  const updateChecklistItem = async (
    id: string,
    field: string,
    value: boolean | string | null
  ) => {
    await updatePrepareJoining(id, { [field]: value });
  };

  const handleValueCommit = (id: string, field: string) =>
    (
      event:
        | FocusEvent<HTMLInputElement | HTMLTextAreaElement>
        | ChangeEvent<HTMLSelectElement>
    ) => {
      const nextValue = event.target.value;
      updateChecklistItem(id, field, nextValue === "" ? null : nextValue);
    };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
        <p className="text-sm font-semibold text-slate-600">Loading prepare joining desk...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <section className="surface-card border-rose-200 bg-rose-50 p-6">
        <h3 className="text-lg font-semibold text-rose-900">Error Loading Prepare Joining Records</h3>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
        <div className="mt-4">
          <Button type="button" variant="danger" size="sm" onClick={() => fetchPrepareJoinings(true)}>
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  const statusOptions = [
    { value: "ALL", label: "All Stages", icon: "📋" },
    { value: "PENDING", label: "Principal Approved Intake", icon: "⏳" },
    { value: "DOCUMENTS", label: "Documents / Visa", icon: "📄" },
    { value: "MEDICAL", label: "Medical", icon: "🏥" },
    { value: "TRAINING", label: "Briefing / Handover", icon: "📚" },
    { value: "TRAVEL", label: "Contract / Travel", icon: "✈️" },
    { value: "READY", label: "Ready to Onboard", icon: "✅" },
    { value: "DISPATCHED", label: "Onboarded", icon: "🚢" },
    { value: "CANCELLED", label: "Cancelled", icon: "❌" },
  ];

  const getStatusBadge = (status: string) => {
    const item = getPrepareJoiningHgiStatusMeta(status);
    return <StatusBadge status={status} label={item.label} />;
  };

  const getProgressPercentage = (pj: PrepareJoining) => {
    const checks = [
      // Document checks (5)
      pj.passportValid,
      pj.seamanBookValid,
      pj.certificatesValid,
      pj.medicalValid,
      pj.visaValid,
      // Medical checks (2)
      pj.orientationCompleted,
      pj.mcuCompleted,
      // Travel checks (3)
      pj.ticketBooked,
      pj.hotelBooked,
      pj.transportArranged,
      // Equipment checks (5)
      pj.safetyLifeJacket,
      pj.workUniform,
      pj.personalPassport,
      pj.vesselStatroomAssigned,
      pj.vesselContractSigned,
      // Pre-departure (1)
      pj.preDepartureFinalCheck,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  const getSequenceCompletion = (pj: PrepareJoining) => {
    const blockers = pj.principalChecklistSummary?.blockers ?? [];

    return [
      {
        label: "Medical",
        complete: Boolean(pj.medicalValid && pj.mcuCompleted),
        note: pj.medicalValid && pj.mcuCompleted
          ? "Medical clearance is recorded."
          : "Complete MCU and mark medical valid.",
      },
      {
        label: "Visa / Seaman Book / Certificates",
        complete: Boolean(pj.passportValid && pj.seamanBookValid && pj.certificatesValid && pj.visaValid),
        note: pj.passportValid && pj.seamanBookValid && pj.certificatesValid && pj.visaValid
          ? "Travel documents and marine papers are valid."
          : "Complete passport, seaman book, certificates, endorsements, and visa checks.",
      },
      {
        label: "Contract / Principal Requirements",
        complete: Boolean(pj.vesselContractSigned && blockers.length === 0),
        note: pj.vesselContractSigned && blockers.length === 0
          ? "Contract release and required principal forms are clear."
          : "Confirm contract release is signed and clear required principal forms.",
      },
      {
        label: "Briefing / Understanding",
        complete: Boolean(pj.orientationCompleted || pj.vesselOrientationDone || pj.vesselBriefingScheduled),
        note: pj.orientationCompleted || pj.vesselOrientationDone || pj.vesselBriefingScheduled
          ? "Briefing and handover understanding are recorded."
          : "Record office orientation, vessel briefing, and handover understanding.",
      },
      {
        label: "Ready to Onboard",
        complete: Boolean(
          pj.ticketBooked &&
          pj.transportArranged &&
          pj.preDepartureFinalCheck &&
          (pj.status === "READY" || pj.status === "DISPATCHED")
        ),
        note:
          pj.ticketBooked &&
          pj.transportArranged &&
          pj.preDepartureFinalCheck &&
          (pj.status === "READY" || pj.status === "DISPATCHED")
            ? "Dispatch readiness is complete."
            : "Complete travel routing and final release before onboard movement.",
      },
    ];
  };

  const getCurrentSequenceIndex = (pj: PrepareJoining) => {
    const steps = getSequenceCompletion(pj);
    const firstPendingIndex = steps.findIndex((step) => !step.complete);
    return firstPendingIndex === -1 ? steps.length - 1 : firstPendingIndex;
  };

  const getCurrentSequenceStep = (pj: PrepareJoining) => {
    const steps = getSequenceCompletion(pj);
    return steps[getCurrentSequenceIndex(pj)];
  };

  const getNextSequenceStep = (pj: PrepareJoining) => {
    const steps = getSequenceCompletion(pj);
    const currentIndex = getCurrentSequenceIndex(pj);
    return currentIndex >= steps.length - 1 ? null : steps[currentIndex + 1];
  };

  const getNextAction = (status: string) => {
    const actions: Record<string, string> = {
      PENDING: "Principal approval is recorded. Operational starts the prepare joining checklist from this point.",
      DOCUMENTS: "Complete visa, seaman book, certificate, and endorsement checks before moving to medical and contract steps.",
      MEDICAL: "Follow up medical result and update any outstanding remarks.",
      TRAINING: "Confirm briefing and handover understanding completion before final release.",
      TRAVEL: "Complete contract release, ticket, hotel, transport, and departure coordination.",
      READY: "Final office review before onboard movement.",
      DISPATCHED: "Crew movement is complete. Keep the record for onboard traceability.",
      CANCELLED: "Keep the record visible for history and stop operational processing.",
    };

    return actions[status] || "Review the record and confirm the next office action.";
  };

  const getDispatchGate = (pj: PrepareJoining) => {
    const blockers = pj.principalChecklistSummary?.blockers ?? [];
    if (blockers.length > 0) {
      return {
        label: "Blocked",
        tone: "border-amber-200 bg-amber-50 text-amber-900",
        helper: "Principal checklist is still incomplete.",
      };
    }

    if (pj.status === "READY" || pj.status === "DISPATCHED") {
      return {
        label: "Clear",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
        helper: "Required checklist is complete for final onboard release.",
      };
    }

    return {
        label: "In Progress",
        tone: "border-slate-200 bg-slate-50 text-slate-900",
        helper: "Continue operational checklist work before ready-to-onboard review.",
    };
  };

  const getReadyGateBlockers = (pj: PrepareJoining) => {
    const blockers: string[] = [];
    const principalBlockers = pj.principalChecklistSummary?.blockers ?? [];

    if (!pj.principal) blockers.push("Assign principal before moving this record to READY.");
    if (principalBlockers.length > 0) blockers.push(...principalBlockers);
    if (!pj.passportValid) blockers.push("Passport validity is not confirmed.");
    if (!pj.seamanBookValid) blockers.push("Seaman book validity is not confirmed.");
    if (!pj.certificatesValid) blockers.push("Certificate validity is not confirmed.");
    if (!pj.medicalValid) blockers.push("Medical validity is not confirmed.");
    if (!pj.visaValid) blockers.push("Visa validity is not confirmed.");
    if (!pj.mcuCompleted) blockers.push("MCU completion is still pending.");
    if (!(pj.orientationCompleted || pj.vesselOrientationDone || pj.vesselBriefingScheduled)) {
      blockers.push("Orientation or vessel briefing is still pending.");
    }
    if (!pj.vesselContractSigned) blockers.push("Contract release is not signed.");
    if (!pj.ticketBooked) blockers.push("Ticket booking is not recorded.");
    if (!pj.transportArranged) blockers.push("Transport arrangement is not recorded.");
    if (!pj.departureDate) blockers.push("Departure date is missing.");
    if (!pj.departurePort) blockers.push("Departure port is missing.");
    if (!pj.arrivalPort) blockers.push("Arrival port is missing.");

    return blockers;
  };

  const getReadyGate = (pj: PrepareJoining) => {
    const blockers = getReadyGateBlockers(pj);

    if (blockers.length === 0) {
      return {
        label: "READY gate clear",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
        helper: "Core documents, medical, briefing, contract, and routing are already complete for READY review.",
        blockers,
      };
    }

    if (blockers.length <= 3) {
      return {
        label: "READY gate review required",
        tone: "border-amber-200 bg-amber-50 text-amber-900",
        helper: "A few final blockers still need follow-up before READY can be selected.",
        blockers,
      };
    }

    return {
      label: "READY gate blocked",
      tone: "border-rose-200 bg-rose-50 text-rose-900",
      helper: "Critical operational requirements are still incomplete for READY status.",
      blockers,
    };
  };

  const prepareJoiningCounts = statusOptions
    .filter((option) => option.value !== "ALL")
    .map((option) => ({
      ...option,
      count: prepareJoinings.filter((item) => item.status === option.value).length,
    }))
    .filter((option) => option.count > 0);
  const blockedByPrincipalCount = prepareJoinings.filter(
    (item) => (item.principalChecklistSummary?.blockers ?? []).length > 0
  ).length;
  const blockedByDocumentsCount = prepareJoinings.filter(
    (item) => item.documentCompleteness?.status === "INCOMPLETE" || item.documentCompleteness?.status === "EXPIRED"
  ).length;
  const readyForOnboardCount = prepareJoinings.filter(
    (item) => item.status === "READY" || item.status === "DISPATCHED"
  ).length;

  return (
    <div className="section-stack">
        <WorkspaceHero
          eyebrow="Operational Mobilization"
          title="Prepare joining operational entry"
          subtitle="Single operational entry point after principal approval, from pre-joining through ready-to-onboard and release to onboard movement."
          helperLinks={[
            { href: "/crewing/workflow", label: "Crew workflow" },
            { href: "/crewing/assignments", label: "Assignments" },
            { href: "/dashboard", label: "Dashboard" },
          ]}
          highlights={[
            { label: "Active Joinings", value: prepareJoinings.length.toLocaleString("id-ID"), detail: "Crew currently inside operational joining workflow." },
            { label: "Principal Blockers", value: blockedByPrincipalCount.toLocaleString("id-ID"), detail: "Cases waiting on principal checklist requirements." },
            { label: "Document Blockers", value: blockedByDocumentsCount.toLocaleString("id-ID"), detail: "Cases blocked by document or validity issues." },
            { label: "Ready / Onboard", value: readyForOnboardCount.toLocaleString("id-ID"), detail: "Records ready for release or already moved out of office handling." },
          ]}
          actions={(
            <Link href="/crewing/workflow" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
              Crew workflow
            </Link>
          )}
        />

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-900">Pilot guidance</p>
          <p className="mt-1 text-sm text-emerald-800">
            {canEditPrepareJoining
              ? "This page is for principal-approved crew only. Operational updates medical, documents, visa, contract release, and briefing until the crew is ready to onboard."
              : "This role can review joining progress and checklist status. Routine checklist entry remains with the assigned operational owner."}
          </p>
        </div>

        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linear handoff</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {PREPARE_JOINING_LINEAR_FLOW.map((step, index) => (
              <div key={step.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{index + 1}. {step.label}</p>
                <p className="mt-1 text-xs text-slate-600">{step.helper}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            This board starts only after principal approval. Each row shows the current operational handoff point, the blocking issue, and the next required office action so the HGI flow stays linear.
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className="action-pill text-sm"
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(135deg, #10b981, #14b8a6)",
                          color: "#ffffff",
                          borderColor: "transparent",
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Active Joinings</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{prepareJoinings.length}</p>
            <p className="mt-1 text-sm text-slate-600">Crew currently inside operational joining workflow.</p>
          </div>
          <div className="surface-card p-5 md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status Breakdown</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {prepareJoiningCounts.length > 0 ? (
                prepareJoiningCounts.map((item) => (
                  <span key={item.value} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {item.icon} {item.label}: {item.count}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No active status breakdown yet.</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Blocked by principal forms</p>
            <p className="mt-2 text-3xl font-bold text-rose-900">{blockedByPrincipalCount}</p>
            <p className="mt-1 text-sm text-rose-800">Required principal checklist items still missing or not yet approved.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Blocked by documents</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">{blockedByDocumentsCount}</p>
            <p className="mt-1 text-sm text-amber-800">Passport, seaman book, certificate, or medical gate still needs office action.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ready / onboard</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">{readyForOnboardCount}</p>
            <p className="mt-1 text-sm text-emerald-800">Records that are ready to release or already moved out of office handling.</p>
          </div>
        </div>

        {prepareJoinings.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No active prepare joining records
            </h3>
            <p className="text-slate-600">
              No principal-approved crew has entered operational pre-joining yet.
            </p>
          </div>
        ) : (
          <div className="section-stack">
            {prepareJoinings.map((pj) => {
              const progress = getProgressPercentage(pj);
              const dispatchGate = getDispatchGate(pj);
              const readyGate = getReadyGate(pj);
              const regulatoryReadiness = buildOperationalRegulatoryReadiness({
                passportValid: pj.passportValid,
                seamanBookValid: pj.seamanBookValid,
                certificatesValid: pj.certificatesValid,
                medicalValid: pj.medicalValid,
                visaValid: pj.visaValid,
              });
              const sequenceCompletion = getSequenceCompletion(pj);
              const currentSequenceStep = getCurrentSequenceStep(pj);
              const nextSequenceStep = getNextSequenceStep(pj);
              const hgiStatus = getPrepareJoiningHgiStatusMeta(pj.status);
              return (
                <div key={pj.id} className="surface-card overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-b border-emerald-100/70 p-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                          {pj.crew.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold text-slate-900">{pj.crew.fullName}</h3>
                          <p className="text-sm text-slate-600">
                            {pj.crew.rank} • {pj.crew.nationality || "N/A"}
                          </p>
                          {pj.crew.phone ? (
                            <p className="text-xs text-slate-500 mt-1">📞 {pj.crew.phone}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid w-full gap-4 sm:grid-cols-2 md:max-w-2xl md:grid-cols-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vessel
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {pj.vessel?.name || "TBD"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Principal
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {pj.principal?.name || "TBD"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </p>
                          <div className="mt-1">{getStatusBadge(pj.status)}</div>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {hgiStatus.detail}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Progress
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-emerald-100/70">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <h4 className="text-lg font-semibold text-slate-900">Checklist Progress</h4>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/crewing/seafarers/${pj.crew.id}/biodata`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          Crew Biodata
                        </Link>
                        <Link
                          href={`/crewing/seafarers/${pj.crew.id}/documents`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          Crew Documents
                        </Link>
                        {pj.principal ? (
                          <Link
                            href="/crewing/forms"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                          >
                            Principal Forms
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500">
                            Principal Forms locked
                          </span>
                        )}
                        {pj.principal && readyGate.blockers.length === 0 ? (
                          <Link
                            href={`/api/forms/letter-guarantee/${pj.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
                          >
                            Generate Letter Guarantee
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500">
                            Letter Guarantee locked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Linear continuity</p>
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Current step</p>
                            <p className="mt-2 text-base font-semibold text-cyan-950">
                              {pj.continuity?.currentStepLabel ?? "Pre-Joining"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Blocking issue</p>
                            <p className="mt-2 text-sm text-cyan-900">
                              {pj.continuity?.blockingIssue ?? "Review the current joining record."}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Next action</p>
                            <p className="mt-2 text-sm text-cyan-900">
                              {pj.continuity?.nextAction ?? getNextAction(pj.status)}
                            </p>
                          </div>
                        </div>
                        {pj.continuity?.statusNote ? (
                          <div className="mt-4 rounded-lg border border-cyan-300 bg-white/80 px-3 py-2 text-sm text-cyan-900">
                            <span className="font-semibold">Status guidance:</span> {pj.continuity.statusNote}
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Where you are now</p>
                        <p className="mt-2 text-base font-semibold text-sky-950">{currentSequenceStep.label}</p>
                        <p className="mt-1 text-sm text-sky-900">{currentSequenceStep.note}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-700">Next step</p>
                        <p className="mt-2 text-sm text-sky-900">
                          {nextSequenceStep
                            ? `${nextSequenceStep.label}: ${nextSequenceStep.note}`
                            : "Ready-to-onboard is complete. Confirm crew movement and keep onboard traceability updated."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step checklist</p>
                        <div className="mt-3 space-y-2">
                          {sequenceCompletion.map((step, index) => {
                            const currentIndex = getCurrentSequenceIndex(pj);
                            const isCurrent = currentIndex === index;
                            return (
                              <div
                                key={step.label}
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                  step.complete
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                    : isCurrent
                                    ? "border-blue-200 bg-blue-50 text-blue-900"
                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-semibold">{index + 1}. {step.label}</span>
                                  <span className="text-xs font-semibold uppercase tracking-wide">
                                    {step.complete ? "Done" : isCurrent ? "Current" : "Pending"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs">{step.note}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 md:col-span-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Regulatory Readiness</p>
                            <p className="mt-1 text-sm text-slate-600">
                              Operational framing for MLC 2006 medical fitness, STCW 2010 certificate validity, and travel paper clearance.
                            </p>
                          </div>
                          <StatusBadge
                            status={regulatoryReadiness.overallStatus}
                            label={
                              regulatoryReadiness.overallStatus === "APPROVED"
                                ? "Regulatory Ready"
                                : "Regulatory Review Pending"
                            }
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {regulatoryReadiness.buckets.map((bucket) => (
                            <StatusBadge key={`${pj.id}-${bucket.code}`} status={bucket.status} label={bucket.label} />
                          ))}
                        </div>
                      </div>
                      <div className={`rounded-xl border p-4 ${dispatchGate.tone}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide">Onboard Release Gate</p>
                        <p className="mt-2 text-sm font-semibold">{dispatchGate.label}</p>
                        <p className="mt-1 text-xs">{dispatchGate.helper}</p>
                      </div>
                      <div className={`rounded-xl border p-4 ${readyGate.tone}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide">Ready Gate</p>
                        <p className="mt-2 text-sm font-semibold">{readyGate.label}</p>
                        <p className="mt-1 text-xs">{readyGate.helper}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operational Stage</p>
                        <p className="mt-2 text-sm text-slate-700">
                          Select only the current operational stage that is already supported by completed evidence and checklist status.
                        </p>
                        {canEditPrepareJoining ? (
                          <select
                            value={pj.status}
                            onChange={(event) => updateChecklistItem(pj.id, "status", event.target.value)}
                            disabled={updatingId === pj.id}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          >
                            {statusOptions.filter((option) => option.value !== "ALL").map((option) => {
                              const isReadyBlocked =
                                readyGate.blockers.length > 0 &&
                                (option.value === "READY" || option.value === "DISPATCHED");

                              return (
                              <option key={option.value} value={option.value} disabled={isReadyBlocked}>
                                {option.label}
                              </option>
                              );
                            })}
                          </select>
                        ) : (
                          <div className="mt-2">{getStatusBadge(pj.status)}</div>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          Operational updates status step by step. `READY` and `DISPATCHED` stay locked until the release gate is clear.
                        </p>
                        {canEditPrepareJoining && readyGate.blockers.length > 0 ? (
                          <p className="mt-2 text-xs font-medium text-rose-700">
                            `READY` and `DISPATCHED` are locked until all release gate blockers are cleared.
                          </p>
                        ) : null}
                        {pj.continuity?.recommendedStatus && pj.continuity.recommendedStatus !== pj.status ? (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            Recommended current stage: {pj.continuity.recommendedStatus}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Principal Checklist</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {pj.principalChecklistSummary?.approvedRequiredCount ?? 0} / {pj.principalChecklistSummary?.requiredTemplateCount ?? 0} required forms approved
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {pj.principal
                            ? `Missing or pending required forms: ${pj.principalChecklistSummary?.missingRequiredCount ?? 0}`
                            : "Principal not assigned yet. Required forms will load after principal selection."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deployment Route</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {pj.departurePort || "Departure TBD"} {pj.arrivalPort ? `→ ${pj.arrivalPort}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {pj.departureDate ? `Departure ${new Date(pj.departureDate).toLocaleDateString("en-GB")}` : "Departure date not set"}
                        </p>
                      </div>
                    </div>
                    {readyGate.blockers.length > 0 ? (
                      <div className={`rounded-xl border px-4 py-3 ${readyGate.tone}`}>
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold">READY gate blockers</p>
                            <p className="mt-1 text-xs">{readyGate.helper}</p>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {readyGate.blockers.length} open item{readyGate.blockers.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <ul className="mt-3 grid gap-2 md:grid-cols-2">
                          {readyGate.blockers.map((blocker) => (
                            <li key={blocker} className="rounded-lg bg-white/70 px-3 py-2 text-sm">
                              {blocker}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-900">READY gate is clear</p>
                        <p className="mt-1 text-sm text-emerald-800">
                          This crew record already meets the current operational requirements for READY status review.
                        </p>
                      </div>
                    )}
                    <div className="grid gap-2 md:grid-cols-5">
                      {PREPARE_JOINING_SEQUENCE.map((step, index) => {
                        const currentIndex = getCurrentSequenceIndex(pj);
                        const isCompletedStep = sequenceCompletion[index]?.complete === true;
                        const isActiveStep = currentIndex === index && !isCompletedStep;
                        return (
                          <div
                            key={step.label}
                            className={`rounded-xl border px-3 py-3 text-sm ${
                              isCompletedStep
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : isActiveStep
                                ? "border-blue-200 bg-blue-50 text-blue-900"
                                : "border-slate-200 bg-white text-slate-500"
                            }`}
                          >
                            <p className="font-semibold">{step.label}</p>
                            <p className="mt-1 text-xs">
                              {isCompletedStep ? "Completed" : isActiveStep ? "Current step" : "Pending"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {pj.principalChecklistSummary?.blockers?.length ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-900">Principal checklist blockers</p>
                        <ul className="mt-2 space-y-1 text-sm text-amber-800">
                          {pj.principalChecklistSummary.blockers.map((blocker) => (
                            <li key={blocker}>• {blocker}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {pj.documentCompleteness && pj.documentCompleteness.status !== "COMPLETE" ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <p className="text-sm font-semibold text-rose-900">Document continuity blocker</p>
                        <p className="mt-2 text-sm text-rose-800">
                          Status: {pj.documentCompleteness.status}. {pj.documentCompleteness.nextAction}
                        </p>
                      </div>
                    ) : null}
                    {feedbackById[pj.id] ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {feedbackById[pj.id]}
                      </div>
                    ) : null}
                    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${canEditPrepareJoining ? "" : "pointer-events-none opacity-75"}`}>
                      <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                          <span className="badge-soft bg-blue-500/10 text-blue-600">📄</span>
                          <span>Documents</span>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.passportValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "passportValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Passport Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.seamanBookValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "seamanBookValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Seaman Book Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.certificatesValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "certificatesValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Certificates Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.visaValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "visaValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Visa Valid</span>
                          </label>
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                          <span className="badge-soft bg-emerald-500/10 text-emerald-600">🏥</span>
                            <span>Medical & Briefing</span>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.medicalValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "medicalValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Medical Valid</span>
                          </label>
                          <div className="ml-7">
                            <input
                              type="date"
                              key={`${pj.id}-medicalCheckDate-${pj.medicalCheckDate ?? ""}`}
                              defaultValue={pj.medicalCheckDate ? new Date(pj.medicalCheckDate).toISOString().split('T')[0] : ''}
                              onBlur={handleValueCommit(pj.id, "medicalCheckDate")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              placeholder="Check Date"
                            />
                          </div>
                          {pj.medicalExpiry ? (
                            <div className="ml-7 text-xs font-medium text-slate-500">
                              Exp: {new Date(pj.medicalExpiry).toLocaleDateString("id-ID")}
                            </div>
                          ) : null}
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.orientationCompleted}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "orientationCompleted", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Orientation Complete</span>
                          </label>
                          <div className="ml-7">
                            <input
                              type="date"
                              key={`${pj.id}-orientationDate-${pj.orientationDate ?? ""}`}
                              defaultValue={pj.orientationDate ? new Date(pj.orientationDate).toISOString().split('T')[0] : ''}
                              onBlur={handleValueCommit(pj.id, "orientationDate")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              placeholder="Orientation Date"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                          <span className="badge-soft bg-amber-500/10 text-amber-600">✈️</span>
                            <span>Contract / Travel</span>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.ticketBooked}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "ticketBooked", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Ticket Booked</span>
                          </label>
                          <div className="ml-7">
                            <input
                              type="text"
                              key={`${pj.id}-flightNumber-${pj.flightNumber ?? ""}`}
                              defaultValue={pj.flightNumber || ""}
                              onBlur={handleValueCommit(pj.id, "flightNumber")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              placeholder="Flight Number"
                            />
                          </div>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.hotelBooked}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "hotelBooked", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Hotel Booked</span>
                          </label>
                          <div className="ml-7">
                            <input
                              type="text"
                              key={`${pj.id}-hotelName-${pj.hotelName ?? ""}`}
                              defaultValue={pj.hotelName || ""}
                              onBlur={handleValueCommit(pj.id, "hotelName")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              placeholder="Hotel Name"
                            />
                          </div>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.transportArranged}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "transportArranged", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Transport Arranged</span>
                          </label>
                          <div className="ml-7 space-y-2">
                            <input
                              type="text"
                              key={`${pj.id}-departurePort-${pj.departurePort ?? ""}`}
                              defaultValue={pj.departurePort || ""}
                              onBlur={handleValueCommit(pj.id, "departurePort")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              placeholder="Departure Port"
                            />
                            <input
                              type="text"
                              key={`${pj.id}-arrivalPort-${pj.arrivalPort ?? ""}`}
                              defaultValue={pj.arrivalPort || ""}
                              onBlur={handleValueCommit(pj.id, "arrivalPort")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              placeholder="Arrival Port"
                            />
                            <input
                              type="date"
                              key={`${pj.id}-departureDate-${pj.departureDate ?? ""}`}
                              defaultValue={pj.departureDate ? new Date(pj.departureDate).toISOString().split('T')[0] : ''}
                              onBlur={handleValueCommit(pj.id, "departureDate")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              placeholder="Departure Date"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MCU SECTION */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">💉 Medical Check-up</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-red-200/70 bg-red-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-red-500/10 text-red-600">🏥</span>
                            <span>MCU Scheduling</span>
                          </div>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.mcuScheduled}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "mcuScheduled", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>MCU Scheduled</span>
                            </label>
                            <div className="ml-7">
                              <input
                                type="date"
                                key={`${pj.id}-mcuScheduledDate-${pj.mcuScheduledDate ?? ""}`}
                                defaultValue={pj.mcuScheduledDate ? new Date(pj.mcuScheduledDate).toISOString().split('T')[0] : ''}
                                onBlur={handleValueCommit(pj.id, "mcuScheduledDate")}
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Scheduled Date"
                              />
                            </div>
                            <label className="flex items-center gap-3 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.mcuCompleted}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "mcuCompleted", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>MCU Completed</span>
                            </label>
                            <div className="ml-7">
                              <input
                                type="date"
                                key={`${pj.id}-mcuCompletedDate-${pj.mcuCompletedDate ?? ""}`}
                                defaultValue={pj.mcuCompletedDate ? new Date(pj.mcuCompletedDate).toISOString().split('T')[0] : ''}
                                onBlur={handleValueCommit(pj.id, "mcuCompletedDate")}
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Completed Date"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-200/70 bg-red-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-red-500/10 text-red-600">📋</span>
                            <span>MCU Details</span>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              key={`${pj.id}-mcuDoctorName-${pj.mcuDoctorName ?? ""}`}
                              defaultValue={pj.mcuDoctorName || ''}
                              onBlur={handleValueCommit(pj.id, "mcuDoctorName")}
                              placeholder="Doctor Name"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              key={`${pj.id}-mcuClinicName-${pj.mcuClinicName ?? ""}`}
                              defaultValue={pj.mcuClinicName || ''}
                              onBlur={handleValueCommit(pj.id, "mcuClinicName")}
                              placeholder="Clinic Name"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            <select
                              value={pj.mcuResult || ''}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "mcuResult", e.target.value || null)
                              }
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Select Result --</option>
                              <option value="PASSED">✅ PASSED</option>
                              <option value="CONDITIONAL">⚠️ CONDITIONAL</option>
                              <option value="FAILED">❌ FAILED</option>
                            </select>
                            <input
                              type="text"
                              key={`${pj.id}-mcuRestrictions-${pj.mcuRestrictions ?? ""}`}
                              defaultValue={pj.mcuRestrictions || ''}
                              onBlur={handleValueCommit(pj.id, "mcuRestrictions")}
                              placeholder="Medical Restrictions (if any)"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4 md:col-span-2">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-blue-500/10 text-blue-600">💉</span>
                            <span>Vaccinations</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineYellowFever}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineYellowFever", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Yellow Fever</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineHepatitisA}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineHepatitisA", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Hepatitis A</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineHepatitisB}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineHepatitisB", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Hepatitis B</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineTyphoid}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineTyphoid", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Typhoid</span>
                            </label>
                          </div>
                          <div className="mt-3 space-y-2">
                            <input
                              type="text"
                              key={`${pj.id}-vaccineOther-${pj.vaccineOther ?? ""}`}
                              defaultValue={pj.vaccineOther || ''}
                              onBlur={handleValueCommit(pj.id, "vaccineOther")}
                              placeholder="Other Vaccinations"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            <div>
                              <label className="text-xs text-slate-600">Vaccine Expiry</label>
                              <input
                                type="date"
                                key={`${pj.id}-vaccineExpiryDate-${pj.vaccineExpiryDate ?? ""}`}
                                defaultValue={pj.vaccineExpiryDate ? new Date(pj.vaccineExpiryDate).toISOString().split('T')[0] : ''}
                                onBlur={handleValueCommit(pj.id, "vaccineExpiryDate")}
                                className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EQUIPMENT SECTION */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">👷 Equipment (Perlengkapan Crew)</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-yellow-200/70 bg-yellow-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-yellow-500/10 text-yellow-600">🛡️</span>
                            <span>Safety Equipment</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyLifeJacket}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyLifeJacket", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Life Jacket</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyHelmet}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyHelmet", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Safety Helmet</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyShoes}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyShoes", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Safety Shoes</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyGloves}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyGloves", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Safety Gloves</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyHarnessVest}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyHarnessVest", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Harness/Vest</span>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-xl border border-green-200/70 bg-green-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-green-500/10 text-green-600">👔</span>
                            <span>Work Equipment</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workUniform}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workUniform", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Uniform</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workIDCard}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workIDCard", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>ID Card</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workAccessCard}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workAccessCard", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Access Card</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workStationery}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workStationery", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Stationery</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workToolsProvided}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workToolsProvided", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Tools Provided</span>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-xl border border-purple-200/70 bg-purple-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-purple-500/10 text-purple-600">👜</span>
                            <span>Personal Items</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalPassport}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalPassport", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Passport</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalVisa}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalVisa", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Visa</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalTickets}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalTickets", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Tickets</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalVaccineCard}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalVaccineCard", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Vaccine Card</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalMedicalCert}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalMedicalCert", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Medical Cert</span>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-xl border border-cyan-200/70 bg-cyan-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-cyan-500/10 text-cyan-600">🚢</span>
                            <span>Vessel Pre-requisites</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselStatroomAssigned}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselStatroomAssigned", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Stateroom Assigned</span>
                            </label>
                            <input
                              type="text"
                              key={`${pj.id}-vesselStatroomNumber-${pj.vesselStatroomNumber ?? ""}`}
                              defaultValue={pj.vesselStatroomNumber || ""}
                              onBlur={handleValueCommit(pj.id, "vesselStatroomNumber")}
                              placeholder="Stateroom #"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselContractSigned}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselContractSigned", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Contract Signed</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselBriefingScheduled}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselBriefingScheduled", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Briefing Scheduled</span>
                            </label>
                            <input
                              type="date"
                              key={`${pj.id}-vesselBriefingDate-${pj.vesselBriefingDate ?? ""}`}
                              defaultValue={pj.vesselBriefingDate ? new Date(pj.vesselBriefingDate).toISOString().split('T')[0] : ''}
                              onBlur={handleValueCommit(pj.id, "vesselBriefingDate")}
                              className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselOrientationDone}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselOrientationDone", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Orientation Done</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselEmergencyDrill}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselEmergencyDrill", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Emergency Drill</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* READY-TO-ONBOARD SECTION */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">✅ Final Ready-to-Onboard Check</h4>
                      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureDocCheck}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureDocCheck", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ All Documents Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureEquipCheck}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureEquipCheck", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ All Equipment Ready</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureMedicalOK}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureMedicalOK", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Medical Cleared</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureEmergency}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureEmergency", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Emergency Contact OK</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureSalaryOK}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureSalaryOK", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Salary Confirmed</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDeparturePerDiem}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDeparturePerDiem", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Per Diem Confirmed</span>
                          </label>
                        </div>
                        
                        <div className="mt-6 p-4 border-t border-emerald-200 space-y-4">
                          <label className="flex items-center gap-3 text-lg text-slate-900 font-bold">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureFinalCheck}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureFinalCheck", e.target.checked)
                              }
                              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>🎯 FINAL APPROVAL - Ready to Onboard</span>
                          </label>
                          
                          <div className="ml-8">
                            <input
                              type="text"
                              key={`${pj.id}-preDepartureApprovedBy-${pj.preDepartureApprovedBy ?? ""}`}
                              defaultValue={pj.preDepartureApprovedBy || ""}
                              onBlur={handleValueCommit(pj.id, "preDepartureApprovedBy")}
                              placeholder="Approved By (Name/ID)"
                              className="w-full text-sm px-3 py-2 rounded border border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          
                          <div className="ml-8">
                            <label className="text-xs text-slate-600">Approval Date/Time</label>
                            <input
                              type="datetime-local"
                              key={`${pj.id}-preDepartureApprovedAt-${pj.preDepartureApprovedAt ?? ""}`}
                              defaultValue={pj.preDepartureApprovedAt ? new Date(pj.preDepartureApprovedAt).toISOString().slice(0, 16) : ''}
                              onBlur={handleValueCommit(pj.id, "preDepartureApprovedAt")}
                              className="w-full text-sm px-3 py-2 rounded border border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white/70 p-4 mt-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Operational Remarks
                      </p>
                      {canEditPrepareJoining ? (
                        <textarea
                          key={`${pj.id}-remarks-${pj.remarks ?? ""}`}
                          defaultValue={pj.remarks || ""}
                          onBlur={handleValueCommit(pj.id, "remarks")}
                          rows={3}
                          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          placeholder="Write operational notes, pending issues, or handover remarks"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-slate-700">{pj.remarks || "No remarks yet."}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
