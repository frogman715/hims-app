import { CommunicationStatus, CommunicationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ACTIVE_CASE_STATUSES: CommunicationStatus[] = [
  CommunicationStatus.PENDING,
  CommunicationStatus.IN_PROGRESS,
  CommunicationStatus.ESCALATED,
];
const GRIEVANCE_TYPES: CommunicationType[] = [
  CommunicationType.COMPLAINT,
  CommunicationType.CREW_DISPUTE,
];
const WELFARE_TYPES: CommunicationType[] = [
  CommunicationType.CREW_SICK,
  CommunicationType.CREW_DEATH,
  CommunicationType.EMERGENCY,
];

export type WelfareTrackerData = {
  generatedAt: string;
  summary: {
    openGrievances: number;
    welfareCases: number;
    signOffClosuresPending: number;
    activeFleetWithoutRestRegister: number;
    onboardCrewRequiringManualRestTracking: number;
  };
  grievances: Array<{
    id: string;
    crewName: string;
    type: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
  }>;
  welfareCases: Array<{
    id: string;
    crewName: string;
    type: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
  }>;
  signOffQueue: Array<{
    id: string;
    crewName: string;
    signOffDate: string;
    status: string;
    missingItems: string[];
  }>;
};

export async function getWelfareTrackerData(): Promise<WelfareTrackerData> {
  const [cases, signOffQueueRaw, activeAssignments] = await Promise.all([
    prisma.communicationLog.findMany({
      where: {
        type: {
          in: [...GRIEVANCE_TYPES, ...WELFARE_TYPES],
        },
        status: {
          in: ACTIVE_CASE_STATUSES,
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.crewSignOff.findMany({
      where: {
        status: { not: "COMPLETED" },
        OR: [
          { debriefingCompleted: false },
          { passportReceived: false },
          { seamanBookReceived: false },
          { documentWithdrawn: false },
        ],
      },
      orderBy: { signOffDate: "asc" },
      take: 20,
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
      },
    }),
    prisma.assignment.findMany({
      where: {
        status: {
          in: ["ACTIVE", "ONBOARD", "ASSIGNED"],
        },
      },
      select: {
        crewId: true,
        vesselId: true,
      },
    }),
  ]);

  const caseCrewIds = Array.from(
    new Set(cases.map((item) => item.crewId).filter((value): value is string => Boolean(value)))
  );

  const caseCrewRecords = caseCrewIds.length
    ? await prisma.crew.findMany({
        where: { id: { in: caseCrewIds } },
        select: { id: true, fullName: true },
      })
    : [];

  const caseCrewMap = new Map(caseCrewRecords.map((item) => [item.id, item.fullName]));

  const grievances = cases
    .filter((item) => GRIEVANCE_TYPES.includes(item.type))
    .map((item) => ({
      id: item.id,
      crewName: item.crewId ? caseCrewMap.get(item.crewId) ?? "General case" : "General case",
      type: item.type,
      subject: item.subject,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));

  const welfareCases = cases
    .filter((item) => WELFARE_TYPES.includes(item.type))
    .map((item) => ({
      id: item.id,
      crewName: item.crewId ? caseCrewMap.get(item.crewId) ?? "General case" : "General case",
      type: item.type,
      subject: item.subject,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }));

  const signOffQueue = signOffQueueRaw.map((item) => {
    const missingItems: string[] = [];
    if (!item.passportReceived) missingItems.push("Passport return");
    if (!item.seamanBookReceived) missingItems.push("Seaman book return");
    if (!item.debriefingCompleted) missingItems.push("Debriefing");
    if (!item.documentWithdrawn) missingItems.push("Document withdrawal");

    return {
      id: item.id,
      crewName: item.crew.fullName,
      signOffDate: item.signOffDate.toISOString(),
      status: item.status,
      missingItems,
    };
  });

  const activeFleetWithoutRestRegister = new Set(activeAssignments.map((item) => item.vesselId)).size;
  const onboardCrewRequiringManualRestTracking = new Set(activeAssignments.map((item) => item.crewId)).size;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      openGrievances: grievances.length,
      welfareCases: welfareCases.length,
      signOffClosuresPending: signOffQueue.length,
      activeFleetWithoutRestRegister,
      onboardCrewRequiringManualRestTracking,
    },
    grievances,
    welfareCases,
    signOffQueue,
  };
}
