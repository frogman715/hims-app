type BasicDocument = {
  docType: string;
  expiryDate?: string | Date | null;
};

type BasicMedicalCheck = {
  result?: string | null;
  expiryDate?: string | Date | null;
};

type RegulatoryStatus = "APPROVED" | "WARNING" | "EXPIRED" | "PENDING" | "FAILED";

export type MaritimeRegulatoryBucket = {
  code: "MLC_2006" | "STCW_2010" | "TRAVEL_DOCUMENTS";
  label: string;
  status: RegulatoryStatus;
  detail: string;
};

function diffMonths(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function normaliseDateInput(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function expiryStatus(expiryDate?: string | Date | null): RegulatoryStatus {
  if (!expiryDate) {
    return "PENDING";
  }

  const today = new Date();
  const expiry = normaliseDateInput(expiryDate);
  if (!expiry) {
    return "PENDING";
  }
  if (expiry < today) {
    return "EXPIRED";
  }
  if (diffMonths(today, expiry) <= 3) {
    return "WARNING";
  }
  return "APPROVED";
}

function worstStatus(statuses: RegulatoryStatus[]): RegulatoryStatus {
  if (statuses.includes("FAILED")) return "FAILED";
  if (statuses.includes("EXPIRED")) return "EXPIRED";
  if (statuses.includes("WARNING")) return "WARNING";
  if (statuses.includes("PENDING")) return "PENDING";
  return "APPROVED";
}

function summarizeMedical(result?: string | null, expiryDate?: string | Date | null): RegulatoryStatus {
  const normalized = result?.trim().toUpperCase() ?? "PENDING";
  if (normalized === "FAIL" || normalized === "UNFIT") {
    return "FAILED";
  }
  if (normalized === "PASS" || normalized === "FIT") {
    return expiryStatus(expiryDate);
  }
  return "PENDING";
}

function findFirstMatch(documents: BasicDocument[], tokens: string[]) {
  return documents.find((document) => tokens.some((token) => document.docType.includes(token)));
}

export function buildMaritimeRegulatoryReadiness(input: {
  documents: BasicDocument[];
  passportExpiry?: string | Date | null;
  seamanBookExpiry?: string | Date | null;
  medicalChecks?: BasicMedicalCheck[];
}) {
  const documents = input.documents ?? [];
  const latestMedical = input.medicalChecks?.[0];

  const passport = findFirstMatch(documents, ["PASSPORT"]);
  const seamanBook = findFirstMatch(documents, ["SEAMAN_BOOK"]);
  const visa = findFirstMatch(documents, ["VISA", "SCHENGEN_VISA_NL"]);
  const stcwSuite = [
    findFirstMatch(documents, ["STCW_BST"]),
    findFirstMatch(documents, ["STCW_AFF"]),
    findFirstMatch(documents, ["STCW_MEFA"]),
    findFirstMatch(documents, ["STCW_SCRB"]),
  ];

  const travelStatuses = [
    expiryStatus(passport?.expiryDate ?? input.passportExpiry),
    expiryStatus(seamanBook?.expiryDate ?? input.seamanBookExpiry),
    visa ? expiryStatus(visa.expiryDate) : "PENDING",
  ];

  const stcwStatuses = stcwSuite.map((document) => (document ? expiryStatus(document.expiryDate) : "PENDING"));
  const medicalStatus = summarizeMedical(latestMedical?.result, latestMedical?.expiryDate);

  const buckets: MaritimeRegulatoryBucket[] = [
    {
      code: "MLC_2006",
      label: "MLC 2006 Medical Fitness",
      status: medicalStatus,
      detail:
        medicalStatus === "APPROVED"
          ? "Medical fitness evidence is in place for operational review."
          : medicalStatus === "FAILED"
            ? "Medical result indicates a blocker for deployment."
            : medicalStatus === "WARNING"
              ? "Medical fitness is nearing expiry and needs follow-up."
              : medicalStatus === "EXPIRED"
                ? "Medical fitness has expired and blocks deployment."
                : "Medical fitness evidence is incomplete or not yet confirmed.",
    },
    {
      code: "STCW_2010",
      label: "STCW 2010 Core Certificates",
      status: worstStatus(stcwStatuses),
      detail:
        worstStatus(stcwStatuses) === "APPROVED"
          ? "Core STCW certificates are currently valid."
          : worstStatus(stcwStatuses) === "WARNING"
            ? "One or more core STCW certificates will expire soon."
            : worstStatus(stcwStatuses) === "EXPIRED"
              ? "At least one core STCW certificate has expired."
              : "One or more core STCW certificates are missing or pending verification.",
    },
    {
      code: "TRAVEL_DOCUMENTS",
      label: "Passport / Seaman Book / Visa",
      status: worstStatus(travelStatuses),
      detail:
        worstStatus(travelStatuses) === "APPROVED"
          ? "Travel papers are valid for owner review and mobilization planning."
          : worstStatus(travelStatuses) === "WARNING"
            ? "Travel papers are nearing expiry and should be reviewed before release."
            : worstStatus(travelStatuses) === "EXPIRED"
              ? "A critical travel paper has expired."
              : "Travel document package is incomplete or pending review.",
    },
  ];

  return {
    buckets,
    overallStatus: worstStatus(buckets.map((bucket) => bucket.status)),
  };
}

export function buildOperationalRegulatoryReadiness(input: {
  passportValid: boolean;
  seamanBookValid: boolean;
  certificatesValid: boolean;
  medicalValid: boolean;
  visaValid: boolean;
}) {
  const buckets: MaritimeRegulatoryBucket[] = [
    {
      code: "MLC_2006",
      label: "MLC 2006 Medical Fitness",
      status: input.medicalValid ? "APPROVED" : "PENDING",
      detail: input.medicalValid
        ? "Medical validity is confirmed in the operational joining file."
        : "Medical validity is still pending and blocks release readiness.",
    },
    {
      code: "STCW_2010",
      label: "STCW 2010 Core Certificates",
      status: input.certificatesValid ? "APPROVED" : "PENDING",
      detail: input.certificatesValid
        ? "Certificate validity and endorsements are confirmed."
        : "Certificate validity or endorsements still need operational confirmation.",
    },
    {
      code: "TRAVEL_DOCUMENTS",
      label: "Passport / Seaman Book / Visa",
      status: input.passportValid && input.seamanBookValid && input.visaValid ? "APPROVED" : "PENDING",
      detail:
        input.passportValid && input.seamanBookValid && input.visaValid
          ? "Core travel papers are marked valid for joining release."
          : "Passport, seaman book, or visa checks are still incomplete.",
    },
  ];

  return {
    buckets,
    overallStatus: worstStatus(buckets.map((bucket) => bucket.status)),
  };
}
