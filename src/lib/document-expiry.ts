export type DocumentExpiryState = "NO_EXPIRY" | "EXPIRED" | "EXPIRING_SOON" | "VALID";

export const DOCUMENT_CONTROL_WARNING_MONTHS = 14;

export function getDocumentControlExpiryThreshold(reference: Date): Date {
  const threshold = new Date(reference.getTime());
  threshold.setMonth(threshold.getMonth() + DOCUMENT_CONTROL_WARNING_MONTHS);
  return threshold;
}

export function getDocumentExpiryState(
  expiryDate: string | null | undefined,
  reference = new Date()
): DocumentExpiryState {
  if (!expiryDate) {
    return "NO_EXPIRY";
  }

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return "NO_EXPIRY";
  }

  const threshold = getDocumentControlExpiryThreshold(reference);

  if (expiry <= reference) {
    return "EXPIRED";
  }

  if (expiry <= threshold) {
    return "EXPIRING_SOON";
  }

  return "VALID";
}

export function getDocumentExpiryPresentation(
  expiryDate: string | null | undefined,
  reference = new Date()
): { label: string; className: string } {
  const state = getDocumentExpiryState(expiryDate, reference);

  switch (state) {
    case "EXPIRED":
      return { label: "Expired", className: "bg-rose-100 text-rose-700" };
    case "EXPIRING_SOON":
      return { label: "Expiring Soon", className: "bg-amber-100 text-amber-700" };
    case "VALID":
      return { label: "Valid", className: "bg-emerald-100 text-emerald-700" };
    default:
      return { label: "No Expiry", className: "bg-gray-100 text-gray-700" };
  }
}
