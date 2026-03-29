import type { DocumentCompletenessStatus } from "@/lib/document-control";

export type PrepareJoiningWorkflowStatus =
  | "PENDING"
  | "DOCUMENTS"
  | "MEDICAL"
  | "TRAINING"
  | "TRAVEL"
  | "READY"
  | "DISPATCHED"
  | "CANCELLED";

export interface PrepareJoiningDocumentSnapshot {
  status: DocumentCompletenessStatus;
  nextAction: string;
  missing: string[];
  needsReview: string[];
  expired: number;
}

export interface PrepareJoiningContinuityInput {
  status: PrepareJoiningWorkflowStatus;
  documentCompleteness: PrepareJoiningDocumentSnapshot;
  principalBlockers?: string[];
  medicalValid: boolean;
  mcuCompleted: boolean;
  vesselContractSigned: boolean;
  orientationCompleted: boolean;
  vesselOrientationDone: boolean;
  vesselBriefingScheduled: boolean;
  ticketBooked: boolean;
  transportArranged: boolean;
  departureDate?: string | null;
  departurePort?: string | null;
  arrivalPort?: string | null;
  preDepartureFinalCheck: boolean;
}

export interface PrepareJoiningContinuityResult {
  currentStep: "APPROVED_APPLICATION" | "DOCUMENTS" | "PREPARE_JOINING" | "DISPATCH" | "DISPATCHED" | "CANCELLED";
  currentStepLabel: string;
  blockingIssue: string;
  nextAction: string;
  recommendedStatus: PrepareJoiningWorkflowStatus;
  statusAligned: boolean;
  statusNote: string | null;
}

function buildStatusNote(current: PrepareJoiningWorkflowStatus, recommended: PrepareJoiningWorkflowStatus) {
  if (current === recommended || current === "DISPATCHED" || current === "CANCELLED") {
    return null;
  }

  return `Workflow status is ${current}, but operationally this case is still at ${recommended}.`;
}

export function getPrepareJoiningContinuity(input: PrepareJoiningContinuityInput): PrepareJoiningContinuityResult {
  const principalBlockers = input.principalBlockers ?? [];
  const briefingReady = Boolean(
    input.orientationCompleted || input.vesselOrientationDone || input.vesselBriefingScheduled
  );
  const dispatchTravelReady = Boolean(input.ticketBooked && input.transportArranged);

  if (input.status === "CANCELLED") {
    return {
      currentStep: "CANCELLED",
      currentStepLabel: "Cancelled",
      blockingIssue: "Operational processing is stopped for this prepare-joining record.",
      nextAction: "Keep the record for history only.",
      recommendedStatus: "CANCELLED",
      statusAligned: true,
      statusNote: null,
    };
  }

  if (input.status === "DISPATCHED") {
    return {
      currentStep: "DISPATCHED",
      currentStepLabel: "Dispatched",
      blockingIssue: "No blocking issue. Crew movement has been released from this workflow.",
      nextAction: "Wait for onboard confirmation and close any remaining operational follow-up.",
      recommendedStatus: "DISPATCHED",
      statusAligned: true,
      statusNote: null,
    };
  }

  if (input.documentCompleteness.status !== "COMPLETE") {
    const blockingIssue =
      input.documentCompleteness.status === "EXPIRED"
        ? "Required uploaded documents are expired."
        : input.documentCompleteness.status === "NEEDS_REVIEW"
          ? "Uploaded documents still need review before document clearance is true."
          : "Required uploaded documents are still missing.";

    return {
      currentStep: "DOCUMENTS",
      currentStepLabel: "Documents",
      blockingIssue,
      nextAction: input.documentCompleteness.nextAction,
      recommendedStatus: "DOCUMENTS",
      statusAligned: input.status === "DOCUMENTS" || input.status === "PENDING",
      statusNote: buildStatusNote(input.status, "DOCUMENTS"),
    };
  }

  if (!input.medicalValid || !input.mcuCompleted) {
    return {
      currentStep: "PREPARE_JOINING",
      currentStepLabel: "Prepare Joining",
      blockingIssue: "Medical clearance is not complete yet.",
      nextAction: "Complete MCU and mark the medical check as valid before moving forward.",
      recommendedStatus: "MEDICAL",
      statusAligned: input.status === "MEDICAL",
      statusNote: buildStatusNote(input.status, "MEDICAL"),
    };
  }

  if (!input.vesselContractSigned || principalBlockers.length > 0) {
    return {
      currentStep: "PREPARE_JOINING",
      currentStepLabel: "Prepare Joining",
      blockingIssue:
        principalBlockers[0] ??
        "Contract signing or required principal-form clearance is still incomplete.",
      nextAction: input.vesselContractSigned
        ? "Clear the required principal-form blockers before moving this case to dispatch review."
        : "Record the signed contract and clear required principal forms before moving forward.",
      recommendedStatus: "TRAINING",
      statusAligned: input.status === "TRAINING",
      statusNote: buildStatusNote(input.status, "TRAINING"),
    };
  }

  if (!briefingReady) {
    return {
      currentStep: "PREPARE_JOINING",
      currentStepLabel: "Prepare Joining",
      blockingIssue: "Orientation or vessel briefing is not recorded yet.",
      nextAction: "Record office orientation or vessel briefing before dispatch review.",
      recommendedStatus: "TRAINING",
      statusAligned: input.status === "TRAINING",
      statusNote: buildStatusNote(input.status, "TRAINING"),
    };
  }

  if (!dispatchTravelReady) {
    return {
      currentStep: "DISPATCH",
      currentStepLabel: "Dispatch",
      blockingIssue: "Travel booking or transport arrangement is still incomplete.",
      nextAction: "Complete ticket booking and transport arrangement before final release.",
      recommendedStatus: "TRAVEL",
      statusAligned: input.status === "TRAVEL",
      statusNote: buildStatusNote(input.status, "TRAVEL"),
    };
  }

  if (!input.preDepartureFinalCheck) {
    return {
      currentStep: "DISPATCH",
      currentStepLabel: "Dispatch",
      blockingIssue: "Final pre-departure check is still open.",
      nextAction: "Complete the final pre-departure check, then move the case to READY.",
      recommendedStatus: "TRAVEL",
      statusAligned: input.status === "TRAVEL",
      statusNote: buildStatusNote(input.status, "TRAVEL"),
    };
  }

  if (!input.departureDate || !input.departurePort || !input.arrivalPort) {
    return {
      currentStep: "DISPATCH",
      currentStepLabel: "Dispatch",
      blockingIssue: "Departure route details are incomplete.",
      nextAction: "Set departure date, departure port, and arrival port before dispatch release.",
      recommendedStatus: "TRAVEL",
      statusAligned: input.status === "TRAVEL",
      statusNote: buildStatusNote(input.status, "TRAVEL"),
    };
  }

  if (input.status !== "READY") {
    return {
      currentStep: "DISPATCH",
      currentStepLabel: "Dispatch",
      blockingIssue: "No blocking issue. This case is ready for final dispatch review.",
      nextAction: "Move the workflow status to READY, then release to DISPATCHED when crew movement is confirmed.",
      recommendedStatus: "READY",
      statusAligned: false,
      statusNote: buildStatusNote(input.status, "READY"),
    };
  }

  return {
    currentStep: "DISPATCH",
    currentStepLabel: "Dispatch",
    blockingIssue: "No blocking issue. Final dispatch review is clear.",
    nextAction: "Release the case to DISPATCHED when the crew departs.",
    recommendedStatus: "READY",
    statusAligned: true,
    statusNote: null,
  };
}
