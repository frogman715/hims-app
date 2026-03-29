export type FleetRiskInput = {
  expiringDocuments: number;
  externalIssues: number;
  openNonconformities: number;
  mobilizationQueue: number;
};

export type FleetSummaryInput = Array<{
  activeCrew: number;
  mobilizationQueue: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}>;

export function getFleetRiskLevel(input: FleetRiskInput) {
  const score =
    input.expiringDocuments * 2 +
    input.externalIssues * 2 +
    input.openNonconformities * 3 +
    (input.mobilizationQueue > 3 ? 1 : 0);

  if (score >= 8) return "CRITICAL" as const;
  if (score >= 5) return "HIGH" as const;
  if (score >= 2) return "MEDIUM" as const;
  return "LOW" as const;
}

export function summarizeFleetRows(rows: FleetSummaryInput) {
  return {
    activeVessels: rows.length,
    activeCrew: rows.reduce((sum, row) => sum + row.activeCrew, 0),
    mobilizationQueue: rows.reduce((sum, row) => sum + row.mobilizationQueue, 0),
    highRiskVessels: rows.filter((row) => row.riskLevel === "HIGH" || row.riskLevel === "CRITICAL").length,
  };
}
