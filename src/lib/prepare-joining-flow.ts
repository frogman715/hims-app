export function getPrepareJoiningHgiStatusMeta(status: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "Principal Approved Intake",
        detail: "Principal Approved",
        badgeTone: "bg-slate-500/10 text-slate-700",
        nextStep: "Operational starts the prepare joining checklist from the principal-approved handoff.",
      };
    case "DOCUMENTS":
      return {
        label: "Pre-Joining: Documents & Visa",
        detail: "Pre-Joining",
        badgeTone: "bg-blue-500/10 text-blue-600",
        nextStep: "Validate passport, seaman book, certificates, endorsements, and visa requirements.",
      };
    case "MEDICAL":
      return {
        label: "Pre-Joining: Medical",
        detail: "Pre-Joining",
        badgeTone: "bg-emerald-500/10 text-emerald-600",
        nextStep: "Complete MCU, medical validity, and any medical restrictions before contract release.",
      };
    case "TRAINING":
      return {
        label: "Pre-Joining: Briefing & Understanding",
        detail: "Pre-Joining",
        badgeTone: "bg-purple-500/10 text-purple-600",
        nextStep: "Complete office briefing, vessel understanding, and joining orientation records.",
      };
    case "TRAVEL":
      return {
        label: "Pre-Joining: Contract / Travel",
        detail: "Pre-Joining",
        badgeTone: "bg-orange-500/10 text-orange-600",
        nextStep: "Finalize contract release, travel routing, and final departure arrangements.",
      };
    case "READY":
      return {
        label: "Ready to Onboard",
        detail: "Ready to Onboard",
        badgeTone: "bg-teal-500/10 text-teal-600",
        nextStep: "Final office review is complete. Crew can be released for onboard movement.",
      };
    case "DISPATCHED":
      return {
        label: "Onboarded",
        detail: "Onboarded",
        badgeTone: "bg-indigo-500/10 text-indigo-600",
        nextStep: "Crew movement is completed. Keep the record for traceability and close remaining notes.",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        detail: "Closed",
        badgeTone: "bg-red-500/10 text-red-600",
        nextStep: "Stop operational work and keep the record for history.",
      };
    default:
      return {
        label: status,
        detail: status,
        badgeTone: "bg-slate-500/10 text-slate-700",
        nextStep: "Review the operational record and confirm the next office action.",
      };
  }
}
