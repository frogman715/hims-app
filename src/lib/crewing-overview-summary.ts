type Countable = {
  count(args?: unknown): Promise<number>;
};

export type CrewingOverviewSummaryQueryLayer = {
  crew: Countable;
  principal: Countable;
  vessel: Countable;
  assignment: Countable;
  application: Countable;
  interview: Countable;
  prepareJoining: Countable;
  crewReplacement: Countable;
  crewDocument: Countable;
  documentReceipt: Countable;
  orientation: Countable;
  crewSignOff: Countable;
  externalCompliance: Countable;
};

export async function getCrewingOverviewSummaryMetrics(
  db: CrewingOverviewSummaryQueryLayer,
  now = new Date()
) {
  const fourteenMonthsFromNow = new Date(now.getTime());
  fourteenMonthsFromNow.setMonth(fourteenMonthsFromNow.getMonth() + 14);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const activeAssignmentStatuses = ["ONBOARD", "ASSIGNED", "ACTIVE"];
  const plannedAssignmentStatuses = ["PLANNED", "ASSIGNED"];

  const [
    activeSeafarers,
    principalCount,
    vesselCount,
    activeAssignments,
    plannedAssignments,
    pendingApplications,
    applicationInProgress,
    scheduledInterviews,
    prepareJoiningInProgress,
    crewReplacementPending,
    documentsExpiringSoon,
    compliantDocuments,
    totalDocuments,
    documentReceiptsTotal,
    trainingInProgress,
    signOffThisMonth,
    externalComplianceActive,
  ] = await Promise.all([
    db.crew.count({ where: { status: { in: ["STANDBY", "ONBOARD", "OFF_SIGNED"] } } }),
    db.principal.count(),
    db.vessel.count({ where: { status: "ACTIVE" } }),
    db.assignment.count({ where: { status: { in: activeAssignmentStatuses } } }),
    db.assignment.count({ where: { status: { in: plannedAssignmentStatuses } } }),
    db.application.count({ where: { status: { in: ["RECEIVED", "REVIEWING"] } } }),
    db.application.count({ where: { status: { in: ["INTERVIEW", "PASSED", "OFFERED", "ACCEPTED"] } } }),
    db.interview.count({ where: { status: "SCHEDULED" } }),
    db.prepareJoining.count({ where: { status: { in: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY"] } } }),
    db.crewReplacement.count({ where: { status: { in: ["PENDING", "APPROVED"] } } }),
    db.crewDocument.count({
      where: {
        expiryDate: { lte: fourteenMonthsFromNow, gte: now },
        isActive: true,
      },
    }),
    db.crewDocument.count({
      where: {
        OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
      },
    }),
    db.crewDocument.count(),
    db.documentReceipt.count(),
    db.orientation.count({ where: { status: { not: "COMPLETED" } } }),
    db.crewSignOff.count({
      where: {
        signOffDate: { gte: startOfMonth, lt: startOfNextMonth },
      },
    }),
    db.externalCompliance.count({ where: { status: { in: ["PENDING", "VERIFIED"] } } }),
  ]);

  return {
    activeSeafarers,
    principalCount,
    vesselCount,
    activeAssignments,
    plannedAssignments,
    pendingApplications,
    applicationInProgress,
    scheduledInterviews,
    prepareJoiningInProgress,
    crewReplacementPending,
    documentsExpiringSoon,
    compliantDocuments,
    totalDocuments,
    documentReceiptsTotal,
    trainingInProgress,
    signOffThisMonth,
    externalComplianceActive,
  };
}
