export type HgiApplicationStage =
  | "DRAFT"
  | "DOCUMENT_CHECK"
  | "CV_READY"
  | "SUBMITTED_TO_DIRECTOR"
  | "DIRECTOR_APPROVED"
  | "SENT_TO_OWNER"
  | "OWNER_APPROVED"
  | "OWNER_REJECTED"
  | "PRE_JOINING"
  | "CLOSED";

type ApplicationFlowPayload = {
  files: string[];
  hgiStage?: HgiApplicationStage;
  cvReadyAt?: string | null;
  cvReadyBy?: string | null;
};

const DEFAULT_FLOW_PAYLOAD: ApplicationFlowPayload = {
  files: [],
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseApplicationFlowState(raw: string | null | undefined): ApplicationFlowPayload {
  if (!raw) {
    return { ...DEFAULT_FLOW_PAYLOAD };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return {
        files: parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0),
      };
    }

    if (isObjectRecord(parsed)) {
      const files = Array.isArray(parsed.files)
        ? parsed.files.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];

      return {
        files,
        hgiStage: typeof parsed.hgiStage === "string" ? (parsed.hgiStage as HgiApplicationStage) : undefined,
        cvReadyAt: typeof parsed.cvReadyAt === "string" ? parsed.cvReadyAt : null,
        cvReadyBy: typeof parsed.cvReadyBy === "string" ? parsed.cvReadyBy : null,
      };
    }
  } catch {
    return { ...DEFAULT_FLOW_PAYLOAD };
  }

  return { ...DEFAULT_FLOW_PAYLOAD };
}

export function stringifyApplicationFlowState(raw: string | null | undefined, patch: Partial<ApplicationFlowPayload>) {
  const current = parseApplicationFlowState(raw);

  return JSON.stringify({
    ...current,
    ...patch,
    files: patch.files ?? current.files,
  });
}

export function resolveHgiApplicationStage(options: {
  status: string;
  attachments?: string | null;
  hasPrepareJoining?: boolean;
}): HgiApplicationStage {
  const flow = parseApplicationFlowState(options.attachments);

  if (options.status === "ACCEPTED" && options.hasPrepareJoining) {
    return "PRE_JOINING";
  }

  if (flow.hgiStage) {
    return flow.hgiStage;
  }

  switch (options.status) {
    case "RECEIVED":
      return "DRAFT";
    case "REVIEWING":
      return flow.cvReadyAt ? "CV_READY" : "DOCUMENT_CHECK";
    case "INTERVIEW":
      return "SUBMITTED_TO_DIRECTOR";
    case "PASSED":
      return "DIRECTOR_APPROVED";
    case "OFFERED":
      return "SENT_TO_OWNER";
    case "ACCEPTED":
      return "OWNER_APPROVED";
    case "REJECTED":
      return "OWNER_REJECTED";
    default:
      return "CLOSED";
  }
}

export function getHgiStageMeta(stage: HgiApplicationStage | string) {
  switch (stage) {
    case "DRAFT":
      return {
        label: "Draft",
        nextStep: "Document team reviews the nomination package and starts the document check.",
      };
    case "DOCUMENT_CHECK":
      return {
        label: "Document Check",
        nextStep: "Validate certificates, expiry dates, and upload completeness before CV release.",
      };
    case "CV_READY":
      return {
        label: "CV Ready",
        nextStep: "Document team can now submit the completed package to director review.",
      };
    case "SUBMITTED_TO_DIRECTOR":
      return {
        label: "Submitted to Director",
        nextStep: "Director reviews the completed candidate package for final internal approval.",
      };
    case "DIRECTOR_APPROVED":
      return {
        label: "Director Approved",
        nextStep: "Release the approved candidate to the principal for final review.",
      };
    case "SENT_TO_OWNER":
      return {
        label: "Sent to Principal",
        nextStep: "Wait for the principal decision in the principal portal.",
      };
    case "OWNER_APPROVED":
      return {
        label: "Principal Approved",
        nextStep: "Operational team can now start the prepare joining process.",
      };
    case "OWNER_REJECTED":
      return {
        label: "Principal Rejected",
        nextStep: "The principal decision is final. Keep the rejection note for traceability.",
      };
    case "PRE_JOINING":
      return {
        label: "Pre-Joining",
        nextStep: "Operational team continues mobilization from the Prepare Joining board.",
      };
    default:
      return {
        label: "Closed",
        nextStep: "This record is closed and no longer active in the HGI candidate pipeline.",
      };
  }
}
