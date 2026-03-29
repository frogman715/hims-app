"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import PhotoUpload from "../PhotoUpload";
import { InlineConfirmStrip } from "@/components/feedback/InlineConfirmStrip";
import { InlineNotice } from "@/components/feedback/InlineNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { canAccessOfficePath } from "@/lib/office-access";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { buildSeafarerBiodataQualitySnapshot } from "@/lib/seafarer-biodata-quality";
import { getStatusPresentation } from "@/lib/ui-vocabulary";

interface Seafarer {
  id: string;
  fullName: string | null;
  status?: string | null;
  crewStatus?: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  createdAt: string;
  updatedAt: string;
  placeOfBirth: string | null;
  rank: string | null;
  phone: string | null;
  email: string | null;
  photoUrl?: string | null;
  heightCm: number | null;
  weightKg: number | null;
  coverallSize: string | null;
  shoeSize: string | null;
  waistSize: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  seaServiceSummary: {
    totalContracts: number;
    totalSeaDays: number;
    lastRank: string | null;
    lastVessel: string | null;
  };
  seaServiceHistories: Array<{
    id: string;
    vesselName: string;
    imoNumber: string | null;
    companyName: string | null;
    flag: string | null;
    vesselType: string | null;
    grt: number | null;
    engineOutput: string | null;
    rank: string;
    department: string | null;
    signOnDate: string;
    signOffDate: string | null;
    portOfSignOn: string | null;
    portOfSignOff: string | null;
    contractType: string | null;
    status: string;
    reasonForSignOff: string | null;
    sourceDocumentType: string | null;
    verificationStatus: string;
    verifiedAt: string | null;
    verifiedBy: {
      id: string;
      name: string;
    } | null;
    remarks: string | null;
  }>;
  assignments: Array<{
    id: string;
    rank: string | null;
    signOnDate: string | null;
    signOffPlan: string | null;
    signOffDate?: string | null;
    status: string | null;
    vessel: {
      id: string;
      name: string;
    } | null;
    principal: {
      id: string;
      name: string;
    } | null;
  }>;
  applications: Array<{
    id: string;
    position: string | null;
    applicationDate: string | null;
    status: string | null;
  }>;
  documents: Array<{
    id: string;
    docType: string | null;
    docNumber: string | null;
    issueDate: string | null;
    expiryDate: string | null;
    remarks?: string;
    fileUrl?: string;
  }>;
}

interface SeaServiceFormState {
  vesselName: string;
  companyName: string;
  vesselType: string;
  grt: string;
  engineOutput: string;
  flag: string;
  rank: string;
  signOnDate: string;
  signOffDate: string;
  status: "COMPLETED" | "ONGOING" | "TERMINATED";
  sourceDocumentType: string;
  remarks: string;
}

interface ActiveSeafarerResponse {
  id: string;
  fullName: string | null;
  status?: string | null;
  crewStatus?: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  createdAt: string;
  updatedAt: string;
  placeOfBirth: string | null;
  rank: string | null;
  phone: string | null;
  email: string | null;
  photoUrl?: string | null;
  heightCm: number | null;
  weightKg: number | null;
  coverallSize: string | null;
  shoeSize: string | null;
  waistSize: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  seaServiceSummary?: {
    totalContracts: number;
    totalSeaDays: number;
    lastRank: string | null;
    lastVessel: string | null;
  } | null;
  seaServiceHistories?: Array<{
    id: string;
    vesselName: string;
    imoNumber: string | null;
    companyName: string | null;
    flag: string | null;
    vesselType: string | null;
    grt: number | null;
    engineOutput: string | null;
    rank: string;
    department: string | null;
    signOnDate: string;
    signOffDate: string | null;
    portOfSignOn: string | null;
    portOfSignOff: string | null;
    contractType: string | null;
    status: string;
    reasonForSignOff: string | null;
    sourceDocumentType: string | null;
    verificationStatus: string;
    verifiedAt: string | null;
    verifiedBy: {
      id: string;
      name: string;
    } | null;
    remarks: string | null;
  }> | null;
  assignments?: Array<{
    id: string;
    rank: string | null;
    signOnDate?: string | null;
    signOffPlan?: string | null;
    signOffDate?: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string | null;
    vessel: {
      id: string;
      name: string;
    } | null;
    principal: {
      id: string;
      name: string;
    } | null;
  }> | null;
  applications?: Array<{
    id: string;
    position: string | null;
    applicationDate: string | null;
    status: string | null;
  }> | null;
  documents?: Array<{
    id: string;
    docType: string | null;
    docNumber: string | null;
    issueDate: string | null;
    expiryDate: string | null;
    remarks?: string | null;
    fileUrl?: string | null;
  }> | null;
}

function calculateAge(isoDate: string | null): number | null {
  if (!isoDate) {
    return null;
  }

  const birthDate = new Date(isoDate);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getCrewDisplayName(seafarer: Pick<Seafarer, "id" | "fullName">) {
  const normalized = seafarer.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${seafarer.id}`;
}

function formatDisplayDate(value: string | null | undefined, fallback = "Not specified") {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleDateString();
}

function formatDurationDays(signOnDate: string, signOffDate: string | null) {
  const start = new Date(signOnDate);
  const end = signOffDate ? new Date(signOffDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Not available";
  }

  const milliseconds = end.getTime() - start.getTime();
  const wholeDays = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  return `${wholeDays > 0 ? wholeDays : 0} days`;
}

function mapActiveSeafarerResponse(data: ActiveSeafarerResponse): Seafarer {
  return {
    id: data.id,
    fullName: data.fullName,
    status: data.status ?? null,
    crewStatus: data.crewStatus ?? null,
    dateOfBirth: data.dateOfBirth,
    nationality: data.nationality,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    placeOfBirth: data.placeOfBirth,
    rank: data.rank,
    phone: data.phone,
    email: data.email,
    photoUrl: data.photoUrl ?? null,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    coverallSize: data.coverallSize,
    shoeSize: data.shoeSize,
    waistSize: data.waistSize,
    emergencyContactName: data.emergencyContactName,
    emergencyContactRelation: data.emergencyContactRelation,
    emergencyContactPhone: data.emergencyContactPhone,
    seaServiceSummary: data.seaServiceSummary ?? {
      totalContracts: 0,
      totalSeaDays: 0,
      lastRank: null,
      lastVessel: null,
    },
    seaServiceHistories: Array.isArray(data.seaServiceHistories) ? data.seaServiceHistories : [],
    assignments: Array.isArray(data.assignments)
      ? data.assignments.map((assignment) => ({
          id: assignment.id,
          rank: assignment.rank,
          signOnDate: assignment.signOnDate ?? assignment.startDate,
          signOffPlan:
            assignment.signOffPlan ??
            assignment.signOffDate ??
            assignment.endDate ??
            assignment.signOnDate ??
            assignment.startDate,
          signOffDate: assignment.signOffDate ?? assignment.endDate,
          status: assignment.status,
          vessel: assignment.vessel,
          principal: assignment.principal,
        }))
      : [],
    applications: Array.isArray(data.applications) ? data.applications : [],
    documents: Array.isArray(data.documents) ? data.documents : [],
  };
}

const initialSeaServiceFormState: SeaServiceFormState = {
  vesselName: "",
  companyName: "",
  vesselType: "",
  grt: "",
  engineOutput: "",
  flag: "",
  rank: "",
  signOnDate: "",
  signOffDate: "",
  status: "COMPLETED",
  sourceDocumentType: "",
  remarks: "",
};

export default function SeafarerBiodataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [isArchivingCrew, setIsArchivingCrew] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isArchiveConfirmationOpen, setIsArchiveConfirmationOpen] = useState(false);
  const [pendingDocumentDelete, setPendingDocumentDelete] = useState<{ id: string; docType: string } | null>(null);
  const [isSeaServiceFormOpen, setIsSeaServiceFormOpen] = useState(false);
  const [seaServiceForm, setSeaServiceForm] = useState<SeaServiceFormState>(initialSeaServiceFormState);
  const [seaServiceError, setSeaServiceError] = useState<string | null>(null);
  const [isCreatingSeaService, setIsCreatingSeaService] = useState(false);
  const fallbackPhotoSrc = "/logo.png";
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageBiodata = canAccessOfficePath("/api/crewing/seafarers", userRoles, isSystemAdmin, "POST");
  const canManageAssignments = canAccessOfficePath("/api/assignments", userRoles, isSystemAdmin, "POST");
  const canManageDocuments = canAccessOfficePath("/api/documents", userRoles, isSystemAdmin, "POST");
  const canArchiveCrew = session?.user?.isSystemAdmin === true;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!isActionMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!actionMenuRef.current) {
        return;
      }
      if (!actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActionMenuOpen]);

  const fetchSeafarerBiodata = useCallback(async () => {
    try {
      setLoadError(null);
      setLoadErrorCode(null);
      const response = await fetch(`/api/crewing/seafarers/${seafarerId}`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setSeafarer(mapActiveSeafarerResponse(data));
        setPhotoLoadError(false);
      } else {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.error ||
          (response.status === 404
            ? "Seafarer record was not found in the active crew database."
            : response.status === 403
              ? "You do not have permission to open this biodata."
              : response.status === 401
                ? "Your session expired. Please sign in again."
                : "Seafarer biodata could not be loaded.");
        console.error("Failed to fetch seafarer biodata", {
          seafarerId,
          status: response.status,
          error: payload?.error,
        });
        setSeafarer(null);
        setLoadError(message);
        setLoadErrorCode(payload?.code || String(response.status));
      }
    } catch (error) {
      console.error("Error fetching seafarer biodata:", error);
      setSeafarer(null);
      setLoadError("Seafarer biodata could not be loaded. Check API or database connectivity.");
      setLoadErrorCode("FETCH_FAILED");
    } finally {
      setLoading(false);
    }
  }, [seafarerId]);

  useEffect(() => {
    if (session && seafarerId) {
      fetchSeafarerBiodata();
    }
  }, [session, seafarerId, fetchSeafarerBiodata]);

  const handleArchiveCrew = useCallback(async () => {
    if (!canArchiveCrew || !seafarer) {
      return;
    }

    try {
      setIsArchivingCrew(true);
      setFeedback(null);
      const response = await fetch(`/api/crewing/seafarers/${seafarer.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message: payload?.error || "Crew record could not be archived.",
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: payload?.message || "Crew record archived successfully.",
      });
      router.push("/crewing/seafarers");
    } catch (error) {
      console.error("Error archiving crew:", error);
      setFeedback({
        tone: "error",
        message: "Crew record could not be archived.",
      });
    } finally {
      setIsArchivingCrew(false);
      setIsActionMenuOpen(false);
      setIsArchiveConfirmationOpen(false);
    }
  }, [canArchiveCrew, router, seafarer]);

  const handleDeleteDocument = useCallback(
    async (documentId: string, documentType: string) => {
      try {
        setFeedback(null);
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setFeedback({
            tone: "error",
            message: payload?.error || `${documentType} could not be deleted.`,
          });
          return;
        }

        setFeedback({
          tone: "success",
          message: payload?.message || `${documentType} deleted successfully.`,
        });
        setPendingDocumentDelete(null);
        await fetchSeafarerBiodata();
      } catch (error) {
        console.error("Error deleting document:", error);
        setFeedback({
          tone: "error",
          message: error instanceof Error ? error.message : `${documentType} could not be deleted.`,
        });
      }
    },
    [fetchSeafarerBiodata]
  );

  const handleSeaServiceFieldChange = useCallback(
    (field: keyof SeaServiceFormState, value: string) => {
      setSeaServiceForm((current) => ({
        ...current,
        [field]: value,
        ...(field === "status" && value === "ONGOING" ? { signOffDate: "" } : {}),
      }));
    },
    []
  );

  const handleCreateSeaService = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!seafarer) {
        return;
      }

      try {
        setIsCreatingSeaService(true);
        setSeaServiceError(null);

        const response = await fetch(`/api/crewing/seafarers/${seafarer.id}/sea-service-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vesselName: seaServiceForm.vesselName.trim(),
            companyName: seaServiceForm.companyName.trim() || null,
            vesselType: seaServiceForm.vesselType.trim() || null,
            grt: seaServiceForm.grt.trim().length > 0 ? Number.parseInt(seaServiceForm.grt, 10) : null,
            engineOutput: seaServiceForm.engineOutput.trim() || null,
            flag: seaServiceForm.flag.trim() || null,
            rank: seaServiceForm.rank.trim(),
            signOnDate: seaServiceForm.signOnDate,
            signOffDate: seaServiceForm.status === "ONGOING" ? null : seaServiceForm.signOffDate || null,
            status: seaServiceForm.status,
            sourceDocumentType: seaServiceForm.sourceDocumentType.trim() || null,
            remarks: seaServiceForm.remarks.trim() || null,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setSeaServiceError(payload?.error || "Failed to create sea service history.");
          return;
        }

        setSeaServiceForm(initialSeaServiceFormState);
        setIsSeaServiceFormOpen(false);
        await fetchSeafarerBiodata();
      } catch (error) {
        console.error("Error creating sea service history:", error);
        setSeaServiceError("Failed to create sea service history.");
      } finally {
        setIsCreatingSeaService(false);
      }
    },
    [fetchSeafarerBiodata, seaServiceForm, seafarer]
  );

  const getStatusText = (status: string | null | undefined) => {
    return getStatusPresentation(status).label;
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading seafarer biodata...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (loadError) {
    return (
      <div className="section-stack">
        <section className="surface-card p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Crew Profile</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Unable to open seafarer biodata</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The record could not be loaded from the active crew database.</p>
        </section>
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-rose-800">Request failed</h3>
          <p className="mt-2 text-sm text-rose-700">{loadError}</p>
          <p className="mt-3 text-xs text-rose-600">
            Crew ID: {seafarerId}
            {loadErrorCode ? ` • Code: ${loadErrorCode}` : ""}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setLoading(true);
                void fetchSeafarerBiodata();
              }}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Try again
            </button>
            <Link
              href="/crewing/seafarers"
              className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Open seafarer list
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!seafarer) {
    return (
      <div className="section-stack">
        <section className="surface-card p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Crew Profile</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Seafarer not found</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The requested profile could not be found in the active crew register.</p>
        </section>
      </div>
    );
  }

  const now = new Date();
  const biodataQuality = buildSeafarerBiodataQualitySnapshot(
    {
      id: seafarer.id,
      rank: seafarer.rank,
      nationality: seafarer.nationality,
      dateOfBirth: seafarer.dateOfBirth,
      placeOfBirth: seafarer.placeOfBirth,
      phone: seafarer.phone,
      email: seafarer.email,
      crewStatus: seafarer.crewStatus,
      emergencyContactName: seafarer.emergencyContactName,
      emergencyContactPhone: seafarer.emergencyContactPhone,
    },
    {
      now,
      expiryWarningDays: 425,
      documents: seafarer.documents,
      assignments: seafarer.assignments,
      latestSeaServiceRecord: seafarer.seaServiceHistories[0] ?? null,
    }
  );
  const expiredDocumentsCount = biodataQuality.expiredDocuments.length;
  const expiringDocumentsCount = biodataQuality.expiringDocuments.length;
  const activeAssignments = seafarer.assignments.filter((assignment) =>
    ["ONBOARD", "PLANNED", "ASSIGNED", "ACTIVE"].includes((assignment.status ?? "").toUpperCase())
  );
  const currentAssignment = seafarer.assignments.find((assignment) =>
    ["ONBOARD", "PLANNED", "ASSIGNED", "ACTIVE"].includes((assignment.status ?? "").toUpperCase())
  ) ?? null;
  const crewCode = seafarer.id;
  const latestSeaServiceRecord = seafarer.seaServiceHistories[0] ?? null;
  const readinessIssues: Array<{
    severity: "critical" | "warning";
    title: string;
    detail: string;
    href?: string;
    cta?: string;
  }> = biodataQuality.issues.map((issue) => ({
    severity: issue.severity,
    title: issue.title,
    detail: issue.detail,
    href:
      issue.code === "MISSING_MANDATORY_DOCUMENTS" ||
      issue.code === "EXPIRED_DOCUMENTS" ||
      issue.code === "EXPIRING_DOCUMENTS"
        ? `/crewing/seafarers/${seafarer.id}/documents`
        : issue.code === "MISSING_SEA_SERVICE" || issue.code === "INCOMPLETE_SEA_SERVICE"
          ? "#sea-service-history"
          : issue.code === "NO_ACTIVE_ASSIGNMENT"
            ? `/crewing/assignments/new?seafarerId=${seafarer.id}`
            : `/crewing/seafarers/${seafarer.id}`,
    cta:
      issue.code === "MISSING_MANDATORY_DOCUMENTS" ||
      issue.code === "EXPIRED_DOCUMENTS" ||
      issue.code === "EXPIRING_DOCUMENTS"
        ? "Review documents"
        : issue.code === "MISSING_SEA_SERVICE" || issue.code === "INCOMPLETE_SEA_SERVICE"
          ? latestSeaServiceRecord
            ? "Complete sea service"
            : "Add sea service"
          : issue.code === "NO_ACTIVE_ASSIGNMENT"
            ? "Create assignment"
            : "Update biodata",
  }));

  const readinessStatus =
    biodataQuality.readinessStatus === "NOT_READY"
      ? "NOT READY"
      : biodataQuality.readinessStatus === "REVIEW_REQUIRED"
        ? "REVIEW REQUIRED"
        : "READY";
  const assignmentSetupBlocked = !seafarer.rank;
  const assignmentSetupHelper = assignmentSetupBlocked
    ? "Rank must be recorded before creating a clean assignment record."
    : currentAssignment
      ? "One active assignment is already linked on this profile."
      : "Assignment desk is clear for a new operational record.";
  const documentActionHelper = canManageDocuments
    ? expiredDocumentsCount > 0 ||
      !biodataQuality.hasPassport ||
      !biodataQuality.hasSeamanBook ||
      !biodataQuality.hasMedical
      ? "Core document blockers need action before operational release."
      : "Document set is stable. Use this page for renewal and review."
    : "Document review only. Updates stay with Document Staff.";
  const readinessStatusClasses =
    readinessStatus === "READY"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : readinessStatus === "REVIEW REQUIRED"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className="section-stack">
        {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}

        {isArchiveConfirmationOpen && seafarer ? (
          <InlineConfirmStrip
            title="Archive crew record?"
            message={`${getCrewDisplayName(seafarer)} will be set to inactive for controlled cleanup. Active assignments must already be closed.`}
            confirmLabel="Confirm Archive"
            cancelLabel="Keep Record Active"
            onCancel={() => setIsArchiveConfirmationOpen(false)}
            onConfirm={handleArchiveCrew}
            isProcessing={isArchivingCrew}
          />
        ) : null}

        {pendingDocumentDelete ? (
          <InlineConfirmStrip
            tone="error"
            title="Delete document record?"
            message={`Remove ${pendingDocumentDelete.docType} from this crew profile and document register.`}
            confirmLabel="Confirm Delete"
            cancelLabel="Keep Document"
            onCancel={() => setPendingDocumentDelete(null)}
            onConfirm={() => void handleDeleteDocument(pendingDocumentDelete.id, pendingDocumentDelete.docType)}
          />
        ) : null}

        <section className="surface-card p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left side - Photo and name */}
            <div className="flex items-start space-x-6 flex-1">
              {/* Photo Upload Component */}
              <div className="flex-shrink-0">
                {canManageBiodata ? (
                  <PhotoUpload
                    seafarerId={seafarer.id}
                    currentPhotoUrl={seafarer.photoUrl || undefined}
                    onPhotoUpdated={(photoUrl) => {
                      setPhotoLoadError(false);
                      setSeafarer({ ...seafarer, photoUrl });
                    }}
                  />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
                    {seafarer.photoUrl && !photoLoadError ? (
                      <Image
                        src={seafarer.photoUrl || fallbackPhotoSrc}
                        alt={getCrewDisplayName(seafarer)}
                        width={192}
                        height={192}
                        unoptimized
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (target.src.endsWith(fallbackPhotoSrc)) {
                            setPhotoLoadError(true);
                            return;
                          }
                          setPhotoLoadError(false);
                          target.src = fallbackPhotoSrc;
                        }}
                      />
                    ) : (
                      <span>{getCrewDisplayName(seafarer).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Name and description */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Crew profile</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{getCrewDisplayName(seafarer)}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Complete seafarer biodata, readiness status, document control, and sea service history.</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                  <span><span className="font-medium text-slate-800">Rank:</span> {seafarer.rank || "Not specified"}</span>
                  <span><span className="font-medium text-slate-800">Crew ID:</span> {crewCode}</span>
                  <span><span className="font-medium text-slate-800">Nationality:</span> {seafarer.nationality || "Not specified"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={seafarer.status} label={`Crew Pool: ${getStatusText(seafarer.status)}`} />
                  <StatusBadge status={seafarer.crewStatus} label={`Operational: ${getStatusText(seafarer.crewStatus)}`} />
                </div>
              </div>
            </div>

            {/* Action menu */}
            <div className="relative flex flex-wrap gap-2" ref={actionMenuRef}>
              {canManageBiodata ? (
                <button
                  type="button"
                  onClick={() => setIsActionMenuOpen((previous) => !previous)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-haspopup="menu"
                  aria-expanded={isActionMenuOpen}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Manage Crew Record
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : null}
              {canManageBiodata && isActionMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  <Link
                    href={`/crewing/seafarers/${seafarer.id}`}
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">📝</span>
                    <span>Edit biodata and contact details</span>
                  </Link>
                  <Link
                    href={`/crewing/seafarers/${seafarer.id}/documents`}
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">📄</span>
                    <span>{canManageDocuments ? "Manage documents & certificates" : "Review documents & certificates"}</span>
                  </Link>
                  {canManageAssignments && !assignmentSetupBlocked ? (
                    <Link
                      href={`/crewing/assignments/new?seafarerId=${seafarer.id}`}
                      onClick={() => setIsActionMenuOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                      role="menuitem"
                    >
                      <span className="mt-0.5 text-indigo-500">🚢</span>
                      <span>Create a new assignment record</span>
                    </Link>
                  ) : null}
                  {canManageAssignments && assignmentSetupBlocked ? (
                    <div className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-500">
                      <span className="mt-0.5">🚢</span>
                      <span>{assignmentSetupHelper}</span>
                    </div>
                  ) : null}
                  <a
                    href="#assignment-history"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">📜</span>
                    <span>View crew assignment history</span>
                  </a>
                  <a
                    href="#sea-service-history"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">🧭</span>
                    <span>Review sea service history</span>
                  </a>
                  {canArchiveCrew ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback(null);
                        setIsArchiveConfirmationOpen(true);
                      }}
                      disabled={isArchivingCrew}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      role="menuitem"
                    >
                      <span className="mt-0.5">🗂️</span>
                      <span>{isArchivingCrew ? "Archiving crew..." : "Archive crew record"}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
              {!canManageBiodata ? (
                <div className="flex flex-wrap gap-3">
                  {canManageAssignments && !assignmentSetupBlocked ? (
                    <Link
                      href={`/crewing/assignments/new?seafarerId=${seafarer.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow hover:border-indigo-500 hover:text-indigo-700"
                    >
                      <span>🚢</span>
                      Create Assignment
                    </Link>
                  ) : null}
                  {canManageAssignments && assignmentSetupBlocked ? (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                      <span>🚢</span>
                      Assignment locked: rank missing
                    </span>
                  ) : null}
                  <Link
                    href={`/crewing/seafarers/${seafarer.id}/documents`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow hover:border-emerald-500 hover:text-emerald-700"
                  >
                    <span>📄</span>
                    {canManageDocuments ? "Manage Documents" : "Review Documents"}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Operational Readiness</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${readinessStatusClasses}`}>
                  {readinessStatus}
                </span>
                <p className="text-sm text-slate-600">
                  Review this strip first before assignment decisions, document chasing, or CV release.
                </p>
              </div>
            </div>
            <Link
              href="/crewing/data-quality"
              className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Open data quality review
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {readinessIssues.length > 0 ? (
              readinessIssues.map((issue, index) => (
                <div
                  key={`${issue.title}-${index}`}
                  className={`rounded-2xl border px-4 py-4 ${
                    issue.severity === "critical" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${issue.severity === "critical" ? "text-rose-800" : "text-amber-900"}`}>
                        {issue.title}
                      </p>
                      <p className={`mt-1 text-sm ${issue.severity === "critical" ? "text-rose-700" : "text-amber-800"}`}>
                        {issue.detail}
                      </p>
                    </div>
                    {issue.href && issue.cta ? (
                      <Link
                        href={issue.href}
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          issue.severity === "critical"
                            ? "bg-rose-700 text-white hover:bg-rose-800"
                            : "bg-amber-700 text-white hover:bg-amber-800"
                        }`}
                      >
                        {issue.cta}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 md:col-span-2">
                Crew profile, key documents, and sea service baseline are complete enough for normal office processing.
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Current Assignment</p>
            <p className="mt-1 text-sm text-slate-600">
              {currentAssignment
                ? `${currentAssignment.rank || seafarer.rank || "Crew"} on ${currentAssignment.vessel?.name || "vessel TBD"}`
                : "No active assignment linked"}
            </p>
          </div>
          <Link
            href={`/crewing/seafarers/${seafarer.id}/documents`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">Documents & Certificates</p>
            <p className="mt-1 text-sm text-slate-600">{documentActionHelper}</p>
          </Link>
          <Link
            href={`/crewing/seafarers/${seafarer.id}/medical`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">Medical Record</p>
            <p className="mt-1 text-sm text-slate-600">Open medical history and fitness follow-up.</p>
          </Link>
          <Link
            href={`/crewing/seafarers/${seafarer.id}/trainings`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">Training Record</p>
            <p className="mt-1 text-sm text-slate-600">Review training history and onboard readiness support.</p>
          </Link>
          <Link
            href={`/crewing/prepare-joining`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">Prepare Joining Queue</p>
            <p className="mt-1 text-sm text-slate-600">
              {readinessStatus === "NOT READY"
                ? "Use after biodata, document, and sea service blockers are cleared."
                : "Go to the operational joining workflow for this crew pool."}
              </p>
            </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Document total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{seafarer.documents.length}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm text-rose-700">Expired documents</p>
            <p className="mt-2 text-3xl font-semibold text-rose-900">{expiredDocumentsCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Expiring in 14 months</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{expiringDocumentsCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Sea service records</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{seafarer.seaServiceSummary.totalContracts}</p>
          </div>
        </div>

        {/* Sea Service History */}
        <section id="sea-service-history" className="surface-card p-8">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-300 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Sea service history</h2>
              <p className="mt-1 text-sm text-slate-600">
                Verified service records kept as a dedicated historical register for vessel experience, rank history, and contract evidence.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Separate from assignments and applications
              </span>
              {canManageBiodata ? (
                <button
                  type="button"
                  onClick={() => {
                    setSeaServiceError(null);
                    setIsSeaServiceFormOpen((current) => !current);
                  }}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {isSeaServiceFormOpen ? "Close add form" : "Add sea service"}
                </button>
              ) : null}
            </div>
          </div>

          {canManageBiodata && isSeaServiceFormOpen ? (
            <form onSubmit={handleCreateSeaService} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Add sea service record</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Create one office record, then the summary strip and table refresh from the live app data.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Vessel name</span>
                  <input
                    required
                    value={seaServiceForm.vesselName}
                    onChange={(event) => handleSeaServiceFieldChange("vesselName", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Company / Principal</span>
                  <input
                    value={seaServiceForm.companyName}
                    onChange={(event) => handleSeaServiceFieldChange("companyName", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Vessel type</span>
                  <select
                    value={seaServiceForm.vesselType}
                    onChange={(event) => handleSeaServiceFieldChange("vesselType", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  >
                    <option value="">Select vessel type</option>
                    <option value="Bulk Carrier">Bulk Carrier</option>
                    <option value="Container Ship">Container Ship</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Offshore Support Vessel">Offshore Support Vessel</option>
                    <option value="Tugboat">Tugboat</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Flag</span>
                  <input
                    value={seaServiceForm.flag}
                    onChange={(event) => handleSeaServiceFieldChange("flag", event.target.value)}
                    placeholder="e.g. Panama"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Rank</span>
                  <input
                    required
                    value={seaServiceForm.rank}
                    onChange={(event) => handleSeaServiceFieldChange("rank", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Status</span>
                  <select
                    value={seaServiceForm.status}
                    onChange={(event) => handleSeaServiceFieldChange("status", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">GRT</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={seaServiceForm.grt}
                    onChange={(event) => handleSeaServiceFieldChange("grt", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Engine output</span>
                  <input
                    value={seaServiceForm.engineOutput}
                    onChange={(event) => handleSeaServiceFieldChange("engineOutput", event.target.value)}
                    placeholder="e.g. 9,480 kW"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Sign-on date</span>
                  <input
                    required
                    type="date"
                    value={seaServiceForm.signOnDate}
                    onChange={(event) => handleSeaServiceFieldChange("signOnDate", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Sign-off date</span>
                  <input
                    type="date"
                    value={seaServiceForm.signOffDate}
                    disabled={seaServiceForm.status === "ONGOING"}
                    onChange={(event) => handleSeaServiceFieldChange("signOffDate", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Source document</span>
                  <input
                    value={seaServiceForm.sourceDocumentType}
                    onChange={(event) => handleSeaServiceFieldChange("sourceDocumentType", event.target.value)}
                    placeholder="SEA / Discharge Certificate"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm text-slate-700 md:col-span-2 xl:col-span-1">
                  <span className="mb-1 block font-medium">Remarks</span>
                  <input
                    value={seaServiceForm.remarks}
                    onChange={(event) => handleSeaServiceFieldChange("remarks", event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </label>
              </div>
              {seaServiceError ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{seaServiceError}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isCreatingSeaService}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isCreatingSeaService ? "Saving..." : "Save sea service"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSeaServiceForm(initialSeaServiceFormState);
                    setSeaServiceError(null);
                    setIsSeaServiceFormOpen(false);
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Total contracts</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{seafarer.seaServiceSummary.totalContracts}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Total sea days</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{seafarer.seaServiceSummary.totalSeaDays}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Last rank</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{seafarer.seaServiceSummary.lastRank || "No record yet"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Last vessel</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{seafarer.seaServiceSummary.lastVessel || "No record yet"}</p>
            </div>
          </div>

          {seafarer.seaServiceHistories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Vessel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Company / Principal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Service Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {seafarer.seaServiceHistories.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 align-top text-sm text-slate-900">
                        <p className="font-semibold">{record.vesselName}</p>
                        <p className="text-xs text-slate-600">
                          IMO: {record.imoNumber || "Not recorded"} | {record.vesselType || "Type not recorded"}
                        </p>
                        <p className="text-xs text-slate-600">Flag: {record.flag || "Not recorded"}</p>
                        <p className="text-xs text-slate-600">
                          GRT: {record.grt !== null && record.grt !== undefined ? record.grt.toLocaleString("en-US") : "Not recorded"}
                          {" | "}
                          Output: {record.engineOutput || "Not recorded"}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <p>{record.companyName || "Not recorded"}</p>
                        <p className="text-xs text-slate-600">
                          {record.portOfSignOn || "Sign-on port not recorded"} to {record.portOfSignOff || "Sign-off port not recorded"}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{record.rank}</p>
                        <p className="text-xs text-slate-600">{record.department || "Department not recorded"}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <p>{formatDisplayDate(record.signOnDate)}</p>
                        <p className="text-xs text-slate-600">to {formatDisplayDate(record.signOffDate, record.status === "ONGOING" ? "Ongoing" : "Not recorded")}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <p>{formatDurationDays(record.signOnDate, record.signOffDate)}</p>
                        <p className="text-xs text-slate-600">{record.contractType || "Contract type not recorded"}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <StatusBadge status={record.status} label={getStatusText(record.status)} />
                        {record.reasonForSignOff ? (
                          <p className="mt-2 text-xs text-slate-600">{record.reasonForSignOff}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        <p className="font-medium text-slate-900">{getStatusText(record.verificationStatus)}</p>
                        <p className="text-xs text-slate-600">
                          {record.verifiedBy?.name ? `By ${record.verifiedBy.name}` : "Verifier not recorded"}
                        </p>
                        <p className="text-xs text-slate-600">{formatDisplayDate(record.verifiedAt, "Not verified yet")}</p>
                        {record.sourceDocumentType ? (
                          <p className="mt-2 text-xs text-slate-600">Source: {record.sourceDocumentType}</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <h3 className="text-sm font-semibold text-slate-900">No sea service history recorded</h3>
              <p className="mt-2 text-sm text-slate-600">
                This section is reserved for verified sea service records such as SEA evidence, discharge certificates, or other service confirmation documents.
              </p>
            </div>
          )}
        </section>

        {/* Basic Information Card */}
        <section className="surface-card p-8">
          {canArchiveCrew ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Crew deletion is controlled. Use <span className="font-semibold">Archive crew record</span> from the action menu to set this seafarer inactive after assignments are closed.
            </div>
          ) : null}
          <h2 className="mb-6 border-b border-slate-300 pb-2 text-2xl font-semibold text-slate-900">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Full Name</p>
                  <p className="text-lg font-bold text-slate-900">{getCrewDisplayName(seafarer)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200">
                  <span className="text-2xl">🎂</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Date of Birth</p>
                  {seafarer.dateOfBirth ? (
                    <>
                      <p className="text-lg font-bold text-slate-900">
                        {formatDisplayDate(seafarer.dateOfBirth)}
                      </p>
                      {(() => {
                        const age = calculateAge(seafarer.dateOfBirth);
                        return age !== null ? (
                          <p className="text-sm text-slate-600">{age} years old</p>
                        ) : null;
                      })()}
                    </>
                  ) : (
                    <p className="text-lg font-bold text-slate-900">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200">
                  <span className="text-2xl">🌍</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Nationality</p>
                  <p className="text-lg font-bold text-slate-900">{seafarer.nationality || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Member Since</p>
                  <p className="text-lg font-bold text-slate-900">{formatDisplayDate(seafarer.createdAt)}</p>
                  <p className="text-sm text-slate-600">Active crew record</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card p-8">
          <h2 className="mb-6 border-b border-slate-300 pb-2 text-2xl font-semibold text-slate-900">
            Profile & Contact Details
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-600">Place of Birth</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.placeOfBirth || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Rank / Position</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.rank || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Mobile Phone</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.phone || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Email Address</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.email || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Height</p>
              <p className="text-base font-semibold text-slate-900">
                {seafarer.heightCm ? `${seafarer.heightCm} cm` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Weight</p>
              <p className="text-base font-semibold text-slate-900">
                {seafarer.weightKg ? `${seafarer.weightKg} kg` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Coverall Size</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.coverallSize || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Safety Shoe Size</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.shoeSize || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Waist Size</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.waistSize || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Emergency Contact</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.emergencyContactName || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Relationship</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.emergencyContactRelation || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Emergency Phone</p>
              <p className="text-base font-semibold text-slate-900">{seafarer.emergencyContactPhone || 'Not specified'}</p>
            </div>
          </div>
        </section>

        {/* Current Assignment */}
        <section id="current-assignment" className="surface-card p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
              Current Assignment
            </h2>
            {activeAssignments.length > 0 ? (
              <div className="space-y-6">
                {activeAssignments
                  .slice(0, 1)
                  .map((assignment) => (
                  <div key={assignment.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.rank || "Not specified"}</h3>
                      <StatusBadge status={assignment.status} label={getStatusText(assignment.status)} className="px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Vessel:</span>
                        <span className="text-sm text-gray-900">{assignment.vessel?.name || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Principal:</span>
                        <span className="text-sm text-gray-900">{assignment.principal?.name || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Sign-On:</span>
                        <span className="text-sm text-gray-900">{formatDisplayDate(assignment.signOnDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Sign-Off Plan:</span>
                        <span className="text-sm text-gray-900">{formatDisplayDate(assignment.signOffPlan)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5M12 4.5C7.305 4.5 3.5 8.305 3.5 13S7.305 21.5 12 21.5 20.5 17.695 20.5 13 16.695 4.5 12 4.5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No current assignment</h3>
                <p className="mt-1 text-sm text-gray-700">This seafarer is not currently assigned to any vessel.</p>
              </div>
            )}
        </section>

        {/* Documents */}
        <section className="surface-card p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Documents
          </h2>
          {seafarer.documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const now = new Date();
                    const fourteenMonthsFromNow = new Date(now.getTime());
                    fourteenMonthsFromNow.setMonth(fourteenMonthsFromNow.getMonth() + 14);

                    return seafarer.documents.map((document) => {
                      const expiryDate = document.expiryDate ? new Date(document.expiryDate) : null;
                    const isExpired = expiryDate ? expiryDate < now : false;
                    const isExpiringSoon = expiryDate ? !isExpired && expiryDate <= fourteenMonthsFromNow : false;

                    return (
                      <tr key={document.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {document.docType || "Not specified"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {document.docNumber || "Not specified"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDisplayDate(document.issueDate, "—")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expiryDate ? expiryDate.toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                            isExpired
                              ? 'bg-red-100 text-red-800'
                              : isExpiringSoon
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Link
                              href={`/crewing/documents/${document.id}/view`}
                              className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                              title="View document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            {document.fileUrl && (
                              <a
                                href={document.fileUrl}
                                download
                                className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                title="Download document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </a>
                            )}
                            {!document.fileUrl ? (
                              <span className="inline-flex items-center px-3 py-2 rounded bg-slate-100 text-slate-500 text-xs font-medium">
                                No file uploaded
                              </span>
                            ) : null}
                            {canManageDocuments ? (
                              <button
                                onClick={() =>
                                  setPendingDocumentDelete({
                                    id: document.id,
                                    docType: document.docType || "document",
                                  })
                                }
                                className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                title="Delete document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-700">No documents have been uploaded for this seafarer yet.</p>
            </div>
          )}
        </section>

        {/* Sea Service History */}
        <div id="sea-service-anchor">
          {/*
            Keep Sea Service after documents so office users read the page
            from identity -> active status -> compliance docs -> service history.
          */}
        </div>

        {/* Assignment History */}
        <section id="assignment-history" className="surface-card p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Assignment History
          </h2>
          {Array.isArray(seafarer.assignments) && seafarer.assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vessel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sign-On Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sign-Off Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seafarer.assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.rank || "Not specified"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.vessel?.name || "Not specified"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDisplayDate(assignment.signOnDate, "—")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.signOffDate
                          ? formatDisplayDate(assignment.signOffDate, "—")
                          : formatDisplayDate(assignment.signOffPlan, "—")
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={assignment.status} label={getStatusText(assignment.status)} className="px-4 py-2" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5M12 4.5C7.305 4.5 3.5 8.305 3.5 13S7.305 21.5 12 21.5 20.5 17.695 20.5 13 16.695 4.5 12 4.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignment history</h3>
              <p className="mt-1 text-sm text-gray-700">This seafarer has not been assigned to any vessels yet.</p>
            </div>
          )}
        </section>

        {/* Application History */}
        <section className="surface-card p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Application History
          </h2>
          {seafarer.applications.length > 0 ? (
            <div className="space-y-3">
              {seafarer.applications.slice(0, 5).map((application) => {
                const appliedFor = application.position ?? "Not specified";
                const appliedOn = application.applicationDate
                  ? new Date(application.applicationDate).toLocaleDateString()
                  : "Not specified";

                return (
                  <div key={application.id} className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Applied for: {appliedFor}</p>
                      <p className="text-xs text-gray-700">Applied on: {appliedOn}</p>
                    </div>
                    <StatusBadge status={application.status} label={getStatusText(application.status)} className="px-4 py-2" />
                  </div>
                );
              })}
              {seafarer.applications.length > 5 && (
                <p className="pt-2 text-center text-sm text-gray-800">
                  And {seafarer.applications.length - 5} more applications...
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
              <p className="mt-1 text-sm text-gray-700">This seafarer has not submitted any applications yet.</p>
            </div>
          )}
        </section>
    </div>
  );
}
