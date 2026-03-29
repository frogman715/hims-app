type ReadinessDocument = {
  id: string;
  docType: string;
  expiryDate: Date | null;
};

type ReadinessMedicalCheck = {
  id: string;
  expiryDate: Date;
  result: string;
};

type ReadinessOrientation = {
  id: string;
  startDate: Date;
  status: string;
  remarks: string | null;
};

type ReadinessPrepareJoining = {
  id: string;
  status: string;
  orientationCompleted: boolean;
  trainingRemarks: string | null;
  vessel: {
    name: string;
  } | null;
  principal: {
    name: string;
  } | null;
};

type ReadinessAssignment = {
  id: string;
  status: string;
  vessel: {
    name: string;
  } | null;
  principal: {
    name: string;
  } | null;
};

export type CrewReadinessSource = {
  id: string;
  crewCode: string | null;
  fullName: string;
  rank: string;
  status: string;
  crewStatus: string;
  passportNumber: string | null;
  passportExpiry: Date | null;
  seamanBookNumber: string | null;
  seamanBookExpiry: Date | null;
  documents: ReadinessDocument[];
  medicalChecks: ReadinessMedicalCheck[];
  orientations: ReadinessOrientation[];
  prepareJoinings: ReadinessPrepareJoining[];
  assignments: ReadinessAssignment[];
};

export type ReadinessGapType =
  | "PASSPORT"
  | "SEAMAN_BOOK"
  | "MEDICAL"
  | "TRAINING";

export type ReadinessItemStatus =
  | "READY"
  | "MISSING"
  | "EXPIRED"
  | "EXPIRING_SOON"
  | "UNVERIFIED"
  | "NOT_REQUIRED"
  | "PENDING";

export type CrewReadinessGap = {
  type: ReadinessGapType;
  label: string;
  status: Exclude<ReadinessItemStatus, "READY" | "NOT_REQUIRED">;
  detail: string;
};

export type CrewReadinessAlert = {
  id: string;
  label: string;
  status: "EXPIRING_SOON";
  expiryDate: string | null;
  detail: string;
};

export type CrewReadinessRecord = {
  id: string;
  crewCode: string | null;
  fullName: string;
  rank: string;
  status: string;
  crewStatus: string;
  isReadyToDeploy: boolean;
  deploymentContext: string | null;
  checks: {
    passport: {
      status: ReadinessItemStatus;
      expiryDate: string | null;
      detail: string;
    };
    seamanBook: {
      status: ReadinessItemStatus;
      expiryDate: string | null;
      detail: string;
    };
    medical: {
      status: ReadinessItemStatus;
      expiryDate: string | null;
      detail: string;
    };
    training: {
      status: ReadinessItemStatus;
      expiryDate: string | null;
      detail: string;
    };
  };
  gaps: CrewReadinessGap[];
  alerts: CrewReadinessAlert[];
};

export type CrewReadinessDashboard = {
  generatedAt: string;
  expiryWarningDays: number;
  totals: {
    crewPool: number;
    readyToDeploy: number;
    notReady: number;
    expiringSoon: number;
  };
  missingItemsSummary: Array<{
    type: ReadinessGapType;
    label: string;
    count: number;
  }>;
  readyToDeploy: CrewReadinessRecord[];
  notReady: CrewReadinessRecord[];
  expiringSoon: Array<
    CrewReadinessAlert & {
      crewId: string;
      crewCode: string | null;
      fullName: string;
      rank: string;
    }
  >;
  crew: CrewReadinessRecord[];
};

export const READINESS_EXPIRY_WARNING_DAYS = 30;

const PASSPORT_TYPES = ["PASSPORT", "PASPOR"];
const SEAMAN_BOOK_TYPES = ["SEAMAN_BOOK", "SEAMANBOOK", "SEAMAN_BOOK", "SEAMAN BOOK", "BOOK"];
const MEDICAL_DOCUMENT_TYPES = [
  "MEDICAL",
  "MEDICAL_CERTIFICATE",
  "MEDICAL_CERT",
  "MEDICAL_EXAM",
  "MEDICAL_EXAM_CERT",
  "NATIONAL_MEDICAL_EXAM_CERT",
  "FLAG_STATE_MEDICAL_EXAM_CERT",
  "MEDICAL_RESULT",
  "MCU",
];
const POSITIVE_MEDICAL_RESULTS = ["PASS", "PASSED", "FIT", "FIT_TO_WORK", "FIT_FOR_DUTY"];
const COMPLETED_TRAINING_STATUSES = ["COMPLETED", "PASSED", "DONE"];

function normalizeValue(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function formatDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function formatReadableDate(value: Date | null) {
  if (!value) {
    return "No expiry date";
  }

  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function hasAcceptedDocument(docType: string, acceptedTypes: string[]) {
  const normalized = normalizeValue(docType);
  return acceptedTypes.some((acceptedType) => normalized.includes(normalizeValue(acceptedType)));
}

function getBestExpiry(expiryDates: Array<Date | null>) {
  return expiryDates
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
}

function evaluateIdentityRequirement(
  label: string,
  documents: ReadinessDocument[],
  acceptedTypes: string[],
  fallbackNumber: string | null,
  fallbackExpiry: Date | null,
  now: Date,
  warningDate: Date
) {
  const matchingDocuments = documents.filter((document) => hasAcceptedDocument(document.docType, acceptedTypes));
  const hasPresence = matchingDocuments.length > 0 || Boolean(fallbackNumber?.trim());
  const bestExpiry = getBestExpiry([
    fallbackExpiry,
    ...matchingDocuments.map((document) => document.expiryDate),
  ]);

  if (!hasPresence) {
    return {
      status: "MISSING" as const,
      expiryDate: null,
      detail: `${label} is not on file.`,
    };
  }

  if (!bestExpiry) {
    return {
      status: "UNVERIFIED" as const,
      expiryDate: null,
      detail: `${label} is on file but no expiry date is recorded.`,
    };
  }

  if (bestExpiry < now) {
    return {
      status: "EXPIRED" as const,
      expiryDate: formatDate(bestExpiry),
      detail: `${label} expired on ${formatReadableDate(bestExpiry)}.`,
    };
  }

  if (bestExpiry <= warningDate) {
    return {
      status: "EXPIRING_SOON" as const,
      expiryDate: formatDate(bestExpiry),
      detail: `${label} expires on ${formatReadableDate(bestExpiry)}.`,
    };
  }

  return {
    status: "READY" as const,
    expiryDate: formatDate(bestExpiry),
    detail: `${label} valid until ${formatReadableDate(bestExpiry)}.`,
  };
}

function evaluateMedicalRequirement(
  documents: ReadinessDocument[],
  medicalChecks: ReadinessMedicalCheck[],
  now: Date,
  warningDate: Date
) {
  const passingMedicalCheck = medicalChecks.find((item) => POSITIVE_MEDICAL_RESULTS.includes(normalizeValue(item.result)));
  const medicalDocuments = documents.filter((document) => hasAcceptedDocument(document.docType, MEDICAL_DOCUMENT_TYPES));
  const bestMedicalDocumentExpiry = getBestExpiry(medicalDocuments.map((document) => document.expiryDate));

  if (passingMedicalCheck) {
    if (passingMedicalCheck.expiryDate < now) {
      return {
        status: "EXPIRED" as const,
        expiryDate: formatDate(passingMedicalCheck.expiryDate),
        detail: `Latest medical clearance expired on ${formatReadableDate(passingMedicalCheck.expiryDate)}.`,
      };
    }

    if (passingMedicalCheck.expiryDate <= warningDate) {
      return {
        status: "EXPIRING_SOON" as const,
        expiryDate: formatDate(passingMedicalCheck.expiryDate),
        detail: `Latest medical clearance expires on ${formatReadableDate(passingMedicalCheck.expiryDate)}.`,
      };
    }

    return {
      status: "READY" as const,
      expiryDate: formatDate(passingMedicalCheck.expiryDate),
      detail: `Latest medical clearance valid until ${formatReadableDate(passingMedicalCheck.expiryDate)}.`,
    };
  }

  if (bestMedicalDocumentExpiry) {
    if (bestMedicalDocumentExpiry < now) {
      return {
        status: "EXPIRED" as const,
        expiryDate: formatDate(bestMedicalDocumentExpiry),
        detail: `Medical evidence on file expired on ${formatReadableDate(bestMedicalDocumentExpiry)}.`,
      };
    }

    if (bestMedicalDocumentExpiry <= warningDate) {
      return {
        status: "EXPIRING_SOON" as const,
        expiryDate: formatDate(bestMedicalDocumentExpiry),
        detail: `Medical evidence on file expires on ${formatReadableDate(bestMedicalDocumentExpiry)}.`,
      };
    }

    return {
      status: "READY" as const,
      expiryDate: formatDate(bestMedicalDocumentExpiry),
      detail: `Medical evidence on file valid until ${formatReadableDate(bestMedicalDocumentExpiry)}.`,
    };
  }

  if (medicalChecks.length > 0 || medicalDocuments.length > 0) {
    return {
      status: "UNVERIFIED" as const,
      expiryDate: null,
      detail: "Medical data exists but no current passing clearance with a valid expiry is recorded.",
    };
  }

  return {
    status: "MISSING" as const,
    expiryDate: null,
    detail: "No medical clearance is recorded.",
  };
}

function evaluateTrainingRequirement(
  prepareJoining: ReadinessPrepareJoining | null,
  orientation: ReadinessOrientation | null
) {
  if (prepareJoining) {
    if (prepareJoining.orientationCompleted) {
      return {
        status: "READY" as const,
        expiryDate: null,
        detail: "Prepare Joining orientation is marked complete.",
      };
    }

    return {
      status: "PENDING" as const,
      expiryDate: null,
      detail: prepareJoining.trainingRemarks?.trim() || "Prepare Joining orientation is still pending.",
    };
  }

  if (!orientation) {
    return {
      status: "NOT_REQUIRED" as const,
      expiryDate: null,
      detail: "No structured training or orientation requirement is recorded in the current dataset.",
    };
  }

  if (COMPLETED_TRAINING_STATUSES.includes(normalizeValue(orientation.status))) {
    return {
      status: "READY" as const,
      expiryDate: null,
      detail: "Latest recorded orientation is completed.",
    };
  }

  return {
    status: "PENDING" as const,
    expiryDate: null,
    detail: orientation.remarks?.trim() || `Latest recorded orientation is ${orientation.status}.`,
  };
}

function buildDeploymentContext(
  prepareJoining: ReadinessPrepareJoining | null,
  assignment: ReadinessAssignment | null
) {
  if (prepareJoining) {
    const context = [prepareJoining.vessel?.name, prepareJoining.principal?.name].filter(Boolean);
    if (context.length > 0) {
      return `${prepareJoining.status} • ${context.join(" / ")}`;
    }
    return prepareJoining.status;
  }

  if (assignment) {
    const context = [assignment.vessel?.name, assignment.principal?.name].filter(Boolean);
    if (context.length > 0) {
      return `${assignment.status} • ${context.join(" / ")}`;
    }
    return assignment.status;
  }

  return null;
}

export function buildCrewReadinessDashboard(
  crews: CrewReadinessSource[],
  now = new Date()
): CrewReadinessDashboard {
  const warningDate = new Date(now);
  warningDate.setDate(warningDate.getDate() + READINESS_EXPIRY_WARNING_DAYS);

  const crew = crews.map((member) => {
    const latestPrepareJoining = member.prepareJoinings[0] ?? null;
    const latestOrientation = member.orientations[0] ?? null;
    const latestAssignment = member.assignments[0] ?? null;

    const passport = evaluateIdentityRequirement(
      "Passport",
      member.documents,
      PASSPORT_TYPES,
      member.passportNumber,
      member.passportExpiry,
      now,
      warningDate
    );
    const seamanBook = evaluateIdentityRequirement(
      "Seaman book",
      member.documents,
      SEAMAN_BOOK_TYPES,
      member.seamanBookNumber,
      member.seamanBookExpiry,
      now,
      warningDate
    );
    const medical = evaluateMedicalRequirement(member.documents, member.medicalChecks, now, warningDate);
    const training = evaluateTrainingRequirement(latestPrepareJoining, latestOrientation);

    const gaps: CrewReadinessGap[] = [];

    if (passport.status !== "READY" && passport.status !== "EXPIRING_SOON") {
      gaps.push({
        type: "PASSPORT",
        label: "Passport",
        status: passport.status,
        detail: passport.detail,
      });
    }

    if (seamanBook.status !== "READY" && seamanBook.status !== "EXPIRING_SOON") {
      gaps.push({
        type: "SEAMAN_BOOK",
        label: "Seaman Book",
        status: seamanBook.status,
        detail: seamanBook.detail,
      });
    }

    if (medical.status !== "READY" && medical.status !== "EXPIRING_SOON") {
      gaps.push({
        type: "MEDICAL",
        label: "Medical Clearance",
        status: medical.status,
        detail: medical.detail,
      });
    }

    if (training.status === "PENDING") {
      gaps.push({
        type: "TRAINING",
        label: "Training / Orientation",
        status: training.status,
        detail: training.detail,
      });
    }

    const alerts: CrewReadinessAlert[] = [];

    if (passport.status === "EXPIRING_SOON") {
      alerts.push({
        id: `${member.id}-passport`,
        label: "Passport",
        status: "EXPIRING_SOON",
        expiryDate: passport.expiryDate,
        detail: passport.detail,
      });
    }

    if (seamanBook.status === "EXPIRING_SOON") {
      alerts.push({
        id: `${member.id}-seaman-book`,
        label: "Seaman Book",
        status: "EXPIRING_SOON",
        expiryDate: seamanBook.expiryDate,
        detail: seamanBook.detail,
      });
    }

    if (medical.status === "EXPIRING_SOON") {
      alerts.push({
        id: `${member.id}-medical`,
        label: "Medical Clearance",
        status: "EXPIRING_SOON",
        expiryDate: medical.expiryDate,
        detail: medical.detail,
      });
    }

    return {
      id: member.id,
      crewCode: member.crewCode,
      fullName: member.fullName,
      rank: member.rank,
      status: member.status,
      crewStatus: member.crewStatus,
      isReadyToDeploy: gaps.length === 0,
      deploymentContext: buildDeploymentContext(latestPrepareJoining, latestAssignment),
      checks: {
        passport,
        seamanBook,
        medical,
        training,
      },
      gaps,
      alerts,
    };
  });

  const readyToDeploy = crew.filter((member) => member.isReadyToDeploy);
  const notReady = crew.filter((member) => !member.isReadyToDeploy);
  const expiringSoon = crew
    .flatMap((member) =>
      member.alerts.map((alert) => ({
        ...alert,
        crewId: member.id,
        crewCode: member.crewCode,
        fullName: member.fullName,
        rank: member.rank,
      }))
    )
    .sort((left, right) => {
      const leftTime = left.expiryDate ? new Date(left.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.expiryDate ? new Date(right.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    });

  const missingItemsMap = new Map<ReadinessGapType, { type: ReadinessGapType; label: string; count: number }>();
  for (const member of notReady) {
    for (const gap of member.gaps) {
      const current = missingItemsMap.get(gap.type);
      if (current) {
        current.count += 1;
      } else {
        missingItemsMap.set(gap.type, {
          type: gap.type,
          label: gap.label,
          count: 1,
        });
      }
    }
  }

  const missingItemsSummary = Array.from(missingItemsMap.values()).sort((left, right) => right.count - left.count);

  return {
    generatedAt: now.toISOString(),
    expiryWarningDays: READINESS_EXPIRY_WARNING_DAYS,
    totals: {
      crewPool: crew.length,
      readyToDeploy: readyToDeploy.length,
      notReady: notReady.length,
      expiringSoon: expiringSoon.length,
    },
    missingItemsSummary,
    readyToDeploy,
    notReady,
    expiringSoon,
    crew,
  };
}
