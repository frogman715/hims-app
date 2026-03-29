export function getFleetRiskBadgeClasses(riskLevel: string) {
  if (riskLevel === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (riskLevel === "HIGH") return "bg-amber-100 text-amber-800";
  if (riskLevel === "MEDIUM") return "bg-cyan-100 text-cyan-800";
  return "bg-emerald-100 text-emerald-700";
}

export function getFleetActivityBadgeClasses(status: string) {
  switch (status) {
    case "PLANNED":
      return "bg-cyan-100 text-cyan-800";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-700";
    case "ACTIVE":
      return "bg-indigo-100 text-indigo-700";
    case "ONBOARD":
      return "bg-emerald-100 text-emerald-700";
    case "HIGH":
      return "bg-amber-100 text-amber-800";
    case "CRITICAL":
      return "bg-rose-100 text-rose-700";
    case "NON_COMPLIANT":
      return "bg-rose-100 text-rose-700";
    case "NO_RECORD":
      return "bg-amber-100 text-amber-800";
    case "COMPLIANT":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

