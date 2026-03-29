export function getSeverityBadgeClasses(severity: string) {
  const normalized = severity.toUpperCase();

  if (["CRITICAL", "REJECTED", "EXPIRED"].includes(normalized)) {
    return "bg-rose-100 text-rose-700";
  }

  if (["HIGH", "URGENT", "ESCALATED"].includes(normalized)) {
    return "bg-amber-100 text-amber-800";
  }

  if (["MEDIUM", "PENDING", "IN_PROGRESS", "OPEN"].includes(normalized)) {
    return "bg-cyan-100 text-cyan-800";
  }

  if (["LOW", "COMPLETED", "VERIFIED", "CLOSED"].includes(normalized)) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}
