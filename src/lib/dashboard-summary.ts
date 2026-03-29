const ACTIVE_VESSEL_STATUSES = ["ACTIVE"];
const ONBOARD_ASSIGNMENT_STATUSES = ["ONBOARD"];
const OPERATIONAL_ASSIGNMENT_STATUSES = ["PLANNED", "ASSIGNED", "ACTIVE", "ONBOARD"];
const PREPARE_JOINING_ALERT_STATUSES = ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL"];
const PREPARE_JOINING_OPERATIONAL_STATUSES = [...PREPARE_JOINING_ALERT_STATUSES, "READY"];

type Countable = {
  count(args?: unknown): Promise<number>;
};

export type DashboardSummaryQueryLayer = {
  assignment: Countable;
  prepareJoining: Countable;
  application: Countable;
  crew: Countable;
  vessel: Countable;
};

export async function getDashboardSummaryMetrics(db: DashboardSummaryQueryLayer) {
  const [crewReady, crewOnBoard, prepareJoiningAlerts, pendingApplications, totalCrew, activeVessels, onboardVessels, operationalVessels] =
    await Promise.all([
      db.assignment.count({ where: { status: "PLANNED" } }),
      db.assignment.count({ where: { status: { in: ONBOARD_ASSIGNMENT_STATUSES } } }),
      db.prepareJoining.count({ where: { status: { in: PREPARE_JOINING_ALERT_STATUSES } } }),
      db.application.count({ where: { status: { in: ["RECEIVED", "REVIEWING"] } } }),
      db.crew.count(),
      db.vessel.count({ where: { status: { in: ACTIVE_VESSEL_STATUSES } } }),
      db.vessel.count({
        where: {
          assignments: {
            some: {
              status: { in: ONBOARD_ASSIGNMENT_STATUSES },
            },
          },
        },
      }),
      db.vessel.count({
        where: {
          status: { in: ACTIVE_VESSEL_STATUSES },
          OR: [
            {
              assignments: {
                some: {
                  status: { in: OPERATIONAL_ASSIGNMENT_STATUSES },
                },
              },
            },
            {
              prepareJoinings: {
                some: {
                  status: { in: PREPARE_JOINING_OPERATIONAL_STATUSES },
                },
              },
            },
          ],
        },
      }),
    ]);

  return {
    crewReady,
    crewOnBoard,
    prepareJoiningAlerts,
    pendingApplications,
    totalCrew,
    activeVessels,
    onboardVessels,
    operationalVessels,
  };
}

