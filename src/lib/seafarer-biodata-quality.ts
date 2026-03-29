export type SeafarerBiodataIssueSeverity = "critical" | "warning";

export type SeafarerBiodataIssueCode =
  | "MISSING_RANK"
  | "MISSING_NATIONALITY"
  | "MISSING_BIRTH_DETAILS"
  | "MISSING_CONTACT"
  | "MISSING_EMERGENCY_CONTACT"
  | "MISSING_MANDATORY_DOCUMENTS"
  | "EXPIRED_DOCUMENTS"
  | "EXPIRING_DOCUMENTS"
  | "MISSING_SEA_SERVICE"
  | "INCOMPLETE_SEA_SERVICE"
  | "NO_ACTIVE_ASSIGNMENT";

export interface SeafarerBiodataQualityIssue {
  code: SeafarerBiodataIssueCode;
  severity: SeafarerBiodataIssueSeverity;
  title: string;
  detail: string;
}

interface QualityCrewIdentity {
  id: string;
  rank?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | Date | null;
  placeOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  crewStatus?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

interface QualityDocument {
  id: string;
  docType?: string | null;
  expiryDate?: string | Date | null;
}

interface QualityAssignment {
  status?: string | null;
}

interface QualitySeaServiceRecord {
  vesselType?: string | null;
  flag?: string | null;
  grt?: number | null;
  engineOutput?: string | null;
}

interface QualitySnapshotOptions {
  documents: QualityDocument[];
  assignments?: QualityAssignment[];
  latestSeaServiceRecord?: QualitySeaServiceRecord | null;
  now?: Date;
  expiryWarningDays?: number;
}

const ACTIVE_ASSIGNMENT_STATUSES = new Set(["ONBOARD", "PLANNED", "ASSIGNED", "ACTIVE"]);
const PASSPORT_TYPES = new Set(["PASSPORT", "PASPOR"]);
const SEAMAN_BOOK_TYPES = new Set(["SEAMAN_BOOK", "SEAMANBOOK", "SEAMAN_BOOK_BOOK", "SEAMAN_BOOKS"]);
const MEDICAL_TYPES = new Set(["MEDICAL", "MCU", "MEDICAL_CERTIFICATE", "MEDICAL_CERTIFICATE_CERTIFICATE"]);

function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalizeDocType(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function parseDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasDocumentType(documents: QualityDocument[], acceptedTypes: Set<string>) {
  return documents.some((document) => acceptedTypes.has(normalizeDocType(document.docType)));
}

export function buildSeafarerBiodataQualitySnapshot(
  crew: QualityCrewIdentity,
  options: QualitySnapshotOptions
) {
  const now = options.now ?? new Date();
  const expiryWarningDays = options.expiryWarningDays ?? 30;
  const expiryThreshold = new Date(now.getTime());
  expiryThreshold.setDate(expiryThreshold.getDate() + expiryWarningDays);

  const documents = options.documents ?? [];
  const assignments = options.assignments ?? [];
  const latestSeaServiceRecord = options.latestSeaServiceRecord ?? null;

  const expiredDocuments = documents.filter((document) => {
    const expiryDate = parseDate(document.expiryDate);
    return expiryDate !== null && expiryDate < now;
  });

  const expiringDocuments = documents.filter((document) => {
    const expiryDate = parseDate(document.expiryDate);
    return expiryDate !== null && expiryDate >= now && expiryDate <= expiryThreshold;
  });

  const hasPassport = hasDocumentType(documents, PASSPORT_TYPES);
  const hasSeamanBook = hasDocumentType(documents, SEAMAN_BOOK_TYPES);
  const hasMedical = hasDocumentType(documents, MEDICAL_TYPES);
  const hasActiveAssignment = assignments.some((assignment) =>
    ACTIVE_ASSIGNMENT_STATUSES.has((assignment.status ?? "").trim().toUpperCase())
  );

  const seaServiceGaps = latestSeaServiceRecord
    ? [
        latestSeaServiceRecord.vesselType ? null : "vessel type",
        latestSeaServiceRecord.flag ? null : "flag",
        latestSeaServiceRecord.grt !== null && latestSeaServiceRecord.grt !== undefined ? null : "GRT",
        latestSeaServiceRecord.engineOutput ? null : "engine output",
      ].filter(Boolean)
    : [];

  const issues: SeafarerBiodataQualityIssue[] = [];

  if (!normalizeOptionalString(crew.rank)) {
    issues.push({
      code: "MISSING_RANK",
      severity: "critical",
      title: "Rank missing",
      detail: "Crew rank must be recorded before assignment review and CV preparation.",
    });
  }

  if (!normalizeOptionalString(crew.nationality)) {
    issues.push({
      code: "MISSING_NATIONALITY",
      severity: "critical",
      title: "Nationality missing",
      detail: "Nationality is required for document control, principal submission, and export outputs.",
    });
  }

  if (!parseDate(crew.dateOfBirth) || !normalizeOptionalString(crew.placeOfBirth)) {
    issues.push({
      code: "MISSING_BIRTH_DETAILS",
      severity: "critical",
      title: "Birth details incomplete",
      detail: "Date of birth and place of birth must both be recorded for biodata and compliance forms.",
    });
  }

  if (!normalizeOptionalString(crew.phone) && !normalizeOptionalString(crew.email)) {
    issues.push({
      code: "MISSING_CONTACT",
      severity: "critical",
      title: "Contact details missing",
      detail: "At least one direct contact channel is required for operational follow-up.",
    });
  }

  if (!normalizeOptionalString(crew.emergencyContactName) || !normalizeOptionalString(crew.emergencyContactPhone)) {
    issues.push({
      code: "MISSING_EMERGENCY_CONTACT",
      severity: "warning",
      title: "Emergency contact incomplete",
      detail: "Emergency contact name and phone should both be available before deployment.",
    });
  }

  if (!hasPassport || !hasSeamanBook || !hasMedical) {
    const missingDocs = [
      hasPassport ? null : "passport",
      hasSeamanBook ? null : "seaman book",
      hasMedical ? null : "medical certificate",
    ]
      .filter(Boolean)
      .join(", ");

    issues.push({
      code: "MISSING_MANDATORY_DOCUMENTS",
      severity: "critical",
      title: "Mandatory documents incomplete",
      detail: `Missing or not yet recorded: ${missingDocs}.`,
    });
  }

  if (expiredDocuments.length > 0) {
    issues.push({
      code: "EXPIRED_DOCUMENTS",
      severity: "critical",
      title: "Expired documents found",
      detail: `${expiredDocuments.length} document(s) already expired and need immediate action.`,
    });
  } else if (expiringDocuments.length > 0) {
    issues.push({
      code: "EXPIRING_DOCUMENTS",
      severity: "warning",
      title: "Documents expiring soon",
      detail: `${expiringDocuments.length} document(s) expire within ${expiryWarningDays} days.`,
    });
  }

  if (!latestSeaServiceRecord) {
    issues.push({
      code: "MISSING_SEA_SERVICE",
      severity: "critical",
      title: "Sea service history missing",
      detail: "Add verified sea service to support CV quality and principal submission.",
    });
  } else if (seaServiceGaps.length > 0) {
    issues.push({
      code: "INCOMPLETE_SEA_SERVICE",
      severity: "warning",
      title: "Sea service needs completion",
      detail: `Latest service record still needs: ${seaServiceGaps.join(", ")}.`,
    });
  }

  if ((crew.crewStatus ?? "").trim().toUpperCase() === "AVAILABLE" && !hasActiveAssignment) {
    issues.push({
      code: "NO_ACTIVE_ASSIGNMENT",
      severity: "warning",
      title: "Available without active assignment",
      detail: "Crew is marked available but not linked to an active assignment or onboard plan.",
    });
  }

  return {
    hasPassport,
    hasSeamanBook,
    hasMedical,
    hasActiveAssignment,
    expiredDocuments,
    expiringDocuments,
    latestSeaServiceRecord,
    seaServiceGaps,
    issues,
    readinessStatus: issues.some((issue) => issue.severity === "critical")
      ? "NOT_READY"
      : issues.length > 0
        ? "REVIEW_REQUIRED"
        : "READY",
  } as const;
}
