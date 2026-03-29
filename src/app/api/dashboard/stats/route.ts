import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";
import { buildContractExpiryAlert, getContractExpiryBand } from "@/lib/contract-expiry";
import { getDashboardSummaryMetrics } from "@/lib/dashboard-summary";
import {
  buildContractExpiryItems,
  buildCrewMovementItems,
  buildExpiringItems,
  groupCrewContractsByCrew,
  groupCrewDocumentsByCrew,
} from "@/lib/dashboard-transformers";
import {
  ACTIVE_APPLICATION_STATUSES,
  detectDuplicateApplicationGroups,
} from "@/lib/crewing-hardening";
import { buildMaritimeRegulatoryReadiness } from "@/lib/maritime-regulatory-readiness";
import { getOfficeAutomationSnapshot } from "@/lib/office-automation";

const OPERATIONAL_ASSIGNMENT_STATUSES = ["PLANNED", "ASSIGNED", "ACTIVE", "ONBOARD"];

interface CrewWithDocuments {
  name: string;
  crewId: string;
  documents: Array<{
    type: string;
    expiryDate: Date | null;
    daysUntilExpiry: number;
  }>;
}

interface CrewWithContracts {
  name: string;
  crewId: string;
  contracts: Array<{
    vesselName: string;
    principalName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    band: string;
    nextAction: string;
    assignmentId: string;
  }>;
}

interface CrewWithIssues {
  name: string;
  crewId: string;
  documents: Array<{
    type: string;
    expiryDate: Date | null;
    daysUntilExpiry: number;
  }>;
  contracts: Array<{
    vesselName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    assignmentId: string;
  }>;
}

type DashboardTaskStatus = "OPEN" | "IN_PROGRESS" | "OVERDUE" | "COMPLETED";

function getTaskStatusFromDays(daysUntil: number): DashboardTaskStatus {
  if (daysUntil < 0) {
    return "OVERDUE";
  }

  if (daysUntil <= 3) {
    return "IN_PROGRESS";
  }

  return "OPEN";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check dashboard permission
    if (!checkPermission(session, 'dashboard', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const {
      crewReady,
      crewOnBoard,
      prepareJoiningAlerts,
      pendingApplications,
      totalCrew,
      activeVessels,
      onboardVessels,
      operationalVessels,
    } = await getDashboardSummaryMetrics(prisma);

    const crewRegulatoryRecords = await prisma.crew.findMany({
      where: {
        status: {
          in: ["STANDBY", "ONBOARD"],
        },
      },
      select: {
        id: true,
        passportExpiry: true,
        seamanBookExpiry: true,
        documents: {
          where: { isActive: true },
          select: {
            docType: true,
            expiryDate: true,
          },
        },
        medicalChecks: {
          orderBy: { checkDate: "desc" },
          take: 1,
          select: {
            result: true,
            expiryDate: true,
          },
        },
      },
    });

    let mlcMedicalAlerts = 0;
    let stcwComplianceAlerts = 0;
    let travelDocumentAlerts = 0;

    for (const crew of crewRegulatoryRecords) {
      const readiness = buildMaritimeRegulatoryReadiness({
        documents: crew.documents,
        passportExpiry: crew.passportExpiry,
        seamanBookExpiry: crew.seamanBookExpiry,
        medicalChecks: crew.medicalChecks,
      });

      readiness.buckets.forEach((bucket) => {
        if (bucket.status === "APPROVED") {
          return;
        }

        if (bucket.code === "MLC_2006") {
          mlcMedicalAlerts += 1;
        } else if (bucket.code === "STCW_2010") {
          stcwComplianceAlerts += 1;
        } else if (bucket.code === "TRAVEL_DOCUMENTS") {
          travelDocumentAlerts += 1;
        }
      });
    }

    // Calculate dates for warnings
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const fifteenMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 15, now.getDate());

    const expiredDocuments = await prisma.crewDocument.count({
      where: {
        expiryDate: {
          lte: now
        }
      }
    });

    // Documents Expiring Soon: 15 months threshold
    // Count documents where expiryDate is on or before 15 months from now
    const documentsExpiringSoon = await prisma.crewDocument.count({
      where: {
        expiryDate: {
          gt: now,
          lte: fifteenMonthsFromNow
        }
      }
    });

    // Get detailed info of crew with documents expiring soon (including already expired)
    const crewWithExpiringDocuments = await prisma.crewDocument.findMany({
      where: {
        expiryDate: {
          lte: fifteenMonthsFromNow
        }
      },
      include: {
        crew: {
          select: {
            fullName: true,
            id: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });

    const crewWithExpiringDocumentsArray = groupCrewDocumentsByCrew(crewWithExpiringDocuments) as CrewWithDocuments[];

    // Contracts Expiring Soon: live onboard contracts within the early warning window
    const onboardContracts = await prisma.employmentContract.findMany({
      where: {
        contractEnd: {
          lte: ninetyDaysFromNow,
        },
        status: {
          notIn: ['COMPLETED', 'TERMINATED', 'CANCELLED'],
        },
        crew: {
          assignments: {
            some: {
              status: {
                in: ['ONBOARD', 'ACTIVE'],
              },
            },
          },
        },
      }
    });
    const contractAlerts = onboardContracts
      .map((contract) => buildContractExpiryAlert(contract))
      .filter((item) => getContractExpiryBand(item.daysRemaining) !== "OK");
    const contractsExpiringSoon = contractAlerts.length;

    // Get detailed info of crew with contracts expiring soon
    const crewWithExpiringContracts = await prisma.employmentContract.findMany({
      where: {
        contractEnd: {
          lte: ninetyDaysFromNow
        },
        status: {
          notIn: ['COMPLETED', 'TERMINATED', 'CANCELLED'],
        },
        crew: {
          assignments: {
            some: {
              status: {
                in: ['ONBOARD', 'ACTIVE'],
              },
            },
          },
        },
      },
      include: {
        crew: {
          select: {
            fullName: true,
            id: true
          }
        },
        vessel: {
          select: {
            name: true
          }
        },
        principal: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        contractEnd: 'asc'
      }
    });

    const crewWithExpiringContractsArray = groupCrewContractsByCrew(
      crewWithExpiringContracts,
      buildContractExpiryAlert
    ) as CrewWithContracts[];

    // Combine crew with expiring documents and contracts
    const allCrewWithIssues: Record<string, CrewWithIssues> = {};

    // Add crew with expiring documents
    crewWithExpiringDocumentsArray.forEach(crew => {
      if (!allCrewWithIssues[crew.name]) {
        allCrewWithIssues[crew.name] = {
          name: crew.name,
          crewId: crew.crewId,
          documents: crew.documents,
          contracts: []
        };
      } else {
        allCrewWithIssues[crew.name].documents = crew.documents;
      }
    });

    // Add crew with expiring contracts
    crewWithExpiringContractsArray.forEach(crew => {
      if (!allCrewWithIssues[crew.name]) {
        allCrewWithIssues[crew.name] = {
          name: crew.name,
          crewId: crew.crewId,
          documents: [],
          contracts: crew.contracts
        };
      } else {
        allCrewWithIssues[crew.name].contracts = crew.contracts;
      }
    });

    const crewWithIssuesArray = Object.values(allCrewWithIssues);

    // Transform crewWithIssues into expiringItems format for dashboard
    const expiringItems = buildExpiringItems(crewWithIssuesArray);
    const contractExpiryAlerts = buildContractExpiryItems(crewWithExpiringContractsArray);

    const contractsExpiring45Days = contractExpiryAlerts.filter((item) =>
      ["EXPIRED", "CRITICAL", "URGENT"].includes(item.band)
    ).length;

    const contractsExpiring30Days = contractExpiryAlerts.filter((item) =>
      ["EXPIRED", "CRITICAL"].includes(item.band)
    ).length;

    const contractsExpiring14Days = contractExpiryAlerts.filter((item) => item.daysLeft <= 14).length;

    // TODO: Add Complaint model when needed
    // const complaints = await prisma.complaint.count();

    // Configuration constants
    const MAX_PENDING_TASKS = 10;
    const ITEMS_PER_QUERY = 5;
    const DAYS_TO_MILLISECONDS = 24 * 60 * 60 * 1000;
    const AUDIT_LOOKAHEAD_DAYS = 30;

    // Transform pending tasks into array format expected by frontend
    const pendingTasks: Array<{
      id?: string;
      dueDate: string;
      type: string;
      description: string;
      status: DashboardTaskStatus;
      link?: string;
    }> = [];

    const recentActivityFeed: Array<{
      timestamp: string;
      user: string;
      action: string;
      sortDate: string;
    }> = [];

    // Helper function to calculate days until a date
    const calculateDaysUntil = (targetDate: Date): number => {
      return Math.ceil((targetDate.getTime() - new Date().getTime()) / DAYS_TO_MILLISECONDS);
    };

    // Add applications as pending tasks
    const pendingApps = await prisma.application.findMany({
      where: { status: { in: ['RECEIVED', 'REVIEWING'] } },
      include: {
        crew: {
          select: {
            fullName: true
          }
        }
      },
      take: ITEMS_PER_QUERY,
      orderBy: {
        createdAt: 'desc'
      }
    });

    pendingApps.forEach(app => {
      pendingTasks.push({
        id: app.id,
        dueDate: app.createdAt.toISOString(),
        type: 'Application Review',
        description: `Review application from ${app.crew.fullName}`,
        status: 'OPEN',
        link: `/crewing/applications/${app.id}`
      });

      recentActivityFeed.push({
        timestamp: app.createdAt.toISOString(),
        user: "Crewing Desk",
        action: `Application from ${app.crew.fullName} entered the review queue.`,
        sortDate: app.createdAt.toISOString(),
      });
    });

    const prepareJoiningCases = await prisma.prepareJoining.findMany({
      where: {
        status: { in: ['PENDING', 'DOCUMENTS', 'MEDICAL', 'TRAINING', 'TRAVEL', 'READY'] },
      },
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
        vessel: {
          select: {
            name: true,
          },
        },
        principal: {
          select: {
            name: true,
          },
        },
      },
      take: ITEMS_PER_QUERY,
      orderBy: [
        { departureDate: 'asc' },
        { updatedAt: 'asc' },
      ],
    });

    prepareJoiningCases.forEach((item) => {
      const referenceDate = item.departureDate ?? item.updatedAt;
      const daysUntil = calculateDaysUntil(referenceDate);
      const vesselLabel = item.vessel?.name || item.principal?.name || 'Unassigned route';
      const statusLabel = item.status === 'READY' ? 'Final release check before dispatch.' : `Stage ${item.status.toLowerCase()} needs follow-up.`;

      pendingTasks.push({
        id: item.id,
        dueDate: referenceDate.toISOString(),
        type: 'Prepare Joining',
        description: `${item.crew.fullName} • ${vesselLabel}. ${statusLabel}`,
        status: getTaskStatusFromDays(daysUntil),
        link: '/crewing/prepare-joining',
      });

      recentActivityFeed.push({
        timestamp: item.updatedAt.toISOString(),
        user: 'Operations Desk',
        action: `${item.crew.fullName} is in ${item.status.toLowerCase()} pre-joining stage for ${vesselLabel}.`,
        sortDate: item.updatedAt.toISOString(),
      });
    });

    // Add scheduled audits as pending tasks
    const upcomingAudits = await prisma.auditSchedule.findMany({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        startDate: {
          lte: new Date(new Date().getTime() + AUDIT_LOOKAHEAD_DAYS * DAYS_TO_MILLISECONDS)
        }
      },
      take: ITEMS_PER_QUERY,
      orderBy: {
        startDate: 'asc'
      }
    });

    upcomingAudits.forEach(audit => {
      const daysUntil = calculateDaysUntil(audit.startDate);
      pendingTasks.push({
        id: audit.id,
        dueDate: audit.startDate.toISOString(),
        type: 'Audit Scheduled',
        description: `${audit.title} - ${audit.auditType}${daysUntil > 0 ? ` (in ${daysUntil} days)` : ' (today)'}`,
        status: audit.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN',
        link: `/audit/${audit.id}`
      });

      recentActivityFeed.push({
        timestamp: audit.startDate.toISOString(),
        user: 'Quality Desk',
        action: `${audit.title} is scheduled as ${audit.auditType.toLowerCase()} audit.`,
        sortDate: audit.startDate.toISOString(),
      });
    });

    // Add open non-conformities as pending tasks
    // DISABLED: NonConformity schema mismatch - will be fixed in schema update
    // try {
    //   const openNonConformities = await prisma.nonConformity.findMany({
    //     where: {
    //       status: { in: ['OPEN', 'IN_PROGRESS'] },
    //       targetDate: {
    //         gte: new Date()
    //       }
    //     },
    //     take: ITEMS_PER_QUERY,
    //     orderBy: {
    //       targetDate: 'asc'
    //     }
    //   });

    //   openNonConformities.forEach(nc => {
    //     const daysUntil = nc.targetDate ? calculateDaysUntil(nc.targetDate) : 0;
    //     const description = nc.description ?? '';
    //     const truncatedDescription = description.length > MAX_DESCRIPTION_LENGTH 
    //       ? `${description.substring(0, MAX_DESCRIPTION_LENGTH)}...` 
    //       : description;
    //     pendingTasks.push({
    //       id: nc.id,
    //       dueDate: nc.targetDate?.toISOString() ?? new Date().toISOString(),
    //       type: 'Non-Conformity',
    //       description: `${truncatedDescription} - Due ${daysUntil > 0 ? `in ${daysUntil} days` : 'today'}`,
    //       status: nc.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN',
    //       link: `/nonconformity/${nc.id}`
    //     });
    //   });
    // } catch (error) {
    //   // NonConformity schema mismatch - skip for now
    //   console.warn('Warning: Could not fetch NonConformities for dashboard:', error instanceof Error ? error.message : 'Unknown error');
    // }

    const recentAssignments = await prisma.assignment.findMany({
      where: {
        status: { in: OPERATIONAL_ASSIGNMENT_STATUSES }
      },
      include: {
        crew: {
          select: {
            fullName: true,
            rank: true
          }
        },
        vessel: {
          select: {
            name: true,
            principal: {
              select: {
                name: true
              }
            }
          }
        },
        principal: {
          select: {
            name: true
          }
        }
      },
      take: 10,
      orderBy: {
        startDate: 'desc'
      }
    });

    const crewMovement = buildCrewMovementItems(recentAssignments);

    recentAssignments.slice(0, ITEMS_PER_QUERY).forEach((assignment) => {
      recentActivityFeed.push({
        timestamp: assignment.startDate.toISOString(),
        user: 'Crew Operations',
        action: `${assignment.crew.fullName} is ${assignment.status.toLowerCase()} for ${assignment.vessel.name}.`,
        sortDate: assignment.startDate.toISOString(),
      });
    });

    const activeApplications = await prisma.application.findMany({
      where: {
        status: {
          in: [...ACTIVE_APPLICATION_STATUSES],
        },
      },
      select: {
        id: true,
        crewId: true,
        principalId: true,
        position: true,
        status: true,
        createdAt: true,
        crew: {
          select: {
            fullName: true,
          },
        },
        principal: {
          select: {
            name: true,
          },
        },
      },
    });

    const duplicateNominationGroups = detectDuplicateApplicationGroups(activeApplications);

    duplicateNominationGroups.slice(0, ITEMS_PER_QUERY).forEach((group) => {
      const daysOpen = calculateDaysUntil(group.oldestCreatedAt);

      pendingTasks.push({
        id: group.key,
        dueDate: group.oldestCreatedAt.toISOString(),
        type: "Workflow Integrity",
        description: `${group.crewName} has ${group.count} active nomination records for ${group.position}${group.principalName !== "No Principal Assigned" ? ` under ${group.principalName}` : ""}. Consolidate the duplicate queue.`,
        status: getTaskStatusFromDays(daysOpen),
        link: "/crewing/applications",
      });

      recentActivityFeed.push({
        timestamp: group.newestCreatedAt.toISOString(),
        user: "System Guardrail",
        action: `Duplicate nomination risk detected for ${group.crewName} in ${group.position}.`,
        sortDate: group.newestCreatedAt.toISOString(),
      });
    });

    const automationSnapshot = await getOfficeAutomationSnapshot(prisma, now);
    const failedEscalationNotifications = automationSnapshot.summary.failedEscalationNotifications;

    if (failedEscalationNotifications > 0) {
      pendingTasks.push({
        dueDate: now.toISOString(),
        type: "Escalation Delivery",
        description: `${failedEscalationNotifications} escalation notification attempt(s) failed and require delivery follow-up.`,
        status: "OVERDUE",
        link: "/compliance/escalations",
      });

      recentActivityFeed.push({
        timestamp: now.toISOString(),
        user: "Notification Engine",
        action: `${failedEscalationNotifications} escalation delivery failure(s) need follow-up.`,
        sortDate: now.toISOString(),
      });
    }

    automationSnapshot.stalledPrepareJoiningItems.slice(0, ITEMS_PER_QUERY).forEach((item) => {
      const routeLabel = item.vessel?.name || item.principal?.name || "Unassigned route";
      pendingTasks.push({
        id: item.id,
        dueDate: item.updatedAt.toISOString(),
        type: "SLA Follow-Up",
        description: `${item.crew.fullName} prepare joining is stalled in ${item.status.toLowerCase()} for ${routeLabel}.`,
        status: "OVERDUE",
        link: "/crewing/prepare-joining",
      });

      recentActivityFeed.push({
        timestamp: item.updatedAt.toISOString(),
        user: "Automation Guard",
        action: `${item.crew.fullName} prepare joining exceeded the ${3}-day follow-up SLA.`,
        sortDate: item.updatedAt.toISOString(),
      });
    });

    automationSnapshot.stalledRecruitmentItems.slice(0, ITEMS_PER_QUERY).forEach((item) => {
      pendingTasks.push({
        id: item.id,
        dueDate: item.updatedAt.toISOString(),
        type: "Recruitment SLA",
        description: `${item.crew.fullName} remains in ${item.status.toLowerCase()} recruitment stage without follow-up.`,
        status: "OVERDUE",
        link: "/hr/recruitment",
      });

      recentActivityFeed.push({
        timestamp: item.updatedAt.toISOString(),
        user: "Automation Guard",
        action: `${item.crew.fullName} recruitment exceeded the ${5}-day follow-up SLA.`,
        sortDate: item.updatedAt.toISOString(),
      });
    });

    contractExpiryAlerts.slice(0, ITEMS_PER_QUERY).forEach((item) => {
      pendingTasks.push({
        id: item.crewId,
        dueDate: item.expiryDate,
        type: 'Contract Review',
        description: `${item.seafarer} on ${item.vessel} reaches contract expiry in ${item.daysLeft} day(s).`,
        status: getTaskStatusFromDays(item.daysLeft),
        link: item.link,
      });
    });

    pendingTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    if (pendingTasks.length > MAX_PENDING_TASKS) {
      pendingTasks.length = MAX_PENDING_TASKS;
    }

    const recentActivity = recentActivityFeed
      .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
      .slice(0, 8)
      .map(({ timestamp, user, action }) => ({
        timestamp,
        user,
        action,
      }));

    // Fleet metrics:
    // `activeVessels` represents the master fleet currently marked ACTIVE.
    // Operational vessel counts are returned separately for dashboard alerts.
    const readinessAlerts = documentsExpiringSoon + contractsExpiringSoon;
    const urgentCrewCases = expiredDocuments + prepareJoiningAlerts;

    return NextResponse.json({
      totalCrew,
      activeVessels,
      operationalVessels,
      onboardVessels,
      pendingApplications,
      expiringDocuments: documentsExpiringSoon,
      expiredDocuments,
      crewReady,
      crewOnboard: crewOnBoard,
      contractsExpiringSoon,
      contractsExpiring45Days,
      contractsExpiring30Days,
      contractsExpiring14Days,
      duplicateNominationAlerts: duplicateNominationGroups.length,
      failedEscalationNotifications,
      stalledPrepareJoiningAlerts: automationSnapshot.summary.stalledPrepareJoiningAlerts,
      stalledRecruitmentAlerts: automationSnapshot.summary.stalledRecruitmentAlerts,
      contractExpiryAlerts,
      prepareJoiningAlerts,
      readinessAlerts,
      urgentCrewCases,
      mlcMedicalAlerts,
      stcwComplianceAlerts,
      travelDocumentAlerts,
      expiringItems,
      crewMovement,
      pendingTasks,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
