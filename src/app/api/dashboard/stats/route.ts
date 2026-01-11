import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

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
    expiryDate: Date;
    daysUntilExpiry: number;
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

    // Crew Ready: Assignments with status PLANNED
    const crewReady = await prisma.assignment.count({
      where: { status: 'PLANNED' }
    });

    // Crew On Board: Assignments with status ONBOARD
    const crewOnBoard = await prisma.assignment.count({
      where: { status: 'ONBOARD' }
    });

    // Calculate dates for warnings
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const fifteenMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 15, now.getDate());

    // Documents Expiring Soon: 15 months threshold
    // Count documents where expiryDate is on or before 15 months from now
    const documentsExpiringSoon = await prisma.crewDocument.count({
      where: {
        expiryDate: {
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

    // Group documents by crew
    const crewWithExpiringDocumentsGrouped: Record<string, CrewWithDocuments> = crewWithExpiringDocuments.reduce((acc: Record<string, CrewWithDocuments>, doc) => {
      const crewName = doc.crew.fullName;
      if (!acc[crewName]) {
        acc[crewName] = {
          name: crewName,
          crewId: doc.crew.id,
          documents: []
        };
      }
      acc[crewName].documents.push({
        type: doc.docType || 'Unknown',
        expiryDate: doc.expiryDate,
        daysUntilExpiry: doc.expiryDate ? Math.ceil((doc.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
      });
      return acc;
    }, {});

    const crewWithExpiringDocumentsArray: CrewWithDocuments[] = Object.values(crewWithExpiringDocumentsGrouped);

    // Contracts Expiring Soon: Assignments with endDate within 90 days and status ONBOARD
    // For 8-9 month contracts, 90 days notice catches crew with 1-3 months remaining
    const contractsExpiringSoon = await prisma.assignment.count({
      where: {
        status: 'ONBOARD',
        endDate: {
          gte: new Date(),
          lte: ninetyDaysFromNow
        }
      }
    });

    // Get detailed info of crew with contracts expiring soon
    const crewWithExpiringContracts = await prisma.assignment.findMany({
      where: {
        status: 'ONBOARD',
        endDate: {
          gte: new Date(),
          lte: ninetyDaysFromNow
        }
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
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    });

    // Group contracts by crew
    const crewWithExpiringContractsGrouped: Record<string, CrewWithContracts> = crewWithExpiringContracts.reduce((acc: Record<string, CrewWithContracts>, assignment) => {
      const crewName = assignment.crew.fullName;
      if (!acc[crewName]) {
        acc[crewName] = {
          name: crewName,
          crewId: assignment.crew.id,
          contracts: []
        };
      }
      if (assignment.endDate) {
        acc[crewName].contracts.push({
          vesselName: assignment.vessel.name,
          expiryDate: assignment.endDate,
          daysUntilExpiry: Math.ceil((assignment.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          assignmentId: assignment.id
        });
      }
      return acc;
    }, {});

    const crewWithExpiringContractsArray: CrewWithContracts[] = Object.values(crewWithExpiringContractsGrouped);

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
    const expiringItems: Array<{
      seafarer: string;
      type: string;
      name: string;
      expiryDate: string;
      daysLeft: number;
    }> = [];

    crewWithIssuesArray.forEach((crew) => {
      // Add documents
      crew.documents.forEach((doc) => {
        if (doc.expiryDate) {
          expiringItems.push({
            seafarer: crew.name,
            type: doc.type,
            name: doc.type,
            expiryDate: doc.expiryDate.toISOString(),
            daysLeft: doc.daysUntilExpiry,
          });
        }
      });
      
      // Add contracts
      crew.contracts.forEach((contract) => {
        if (contract.expiryDate) {
          expiringItems.push({
            seafarer: crew.name,
            type: 'CONTRACT',
            name: `${contract.vesselName} Contract`,
            expiryDate: contract.expiryDate.toISOString(),
            daysLeft: contract.daysUntilExpiry,
          });
        }
      });
    });

    // Sort by days left (most urgent first)
    expiringItems.sort((a, b) => a.daysLeft - b.daysLeft);
    // Limit to 10 most urgent items
    expiringItems.splice(10);

    // Pending Tasks: Applications with RECEIVED or REVIEWING status
    const pendingApplications = await prisma.application.count({
      where: { status: { in: ['RECEIVED', 'REVIEWING'] } }
    });

    // TODO: Add Complaint model when needed
    // const complaints = await prisma.complaint.count();
    const complaints = 0;

    // Transform pending tasks into array format expected by frontend
    const pendingTasks: Array<{
      dueDate: string;
      type: string;
      description: string;
      status: string;
    }> = [];

    // Helper function to calculate days until a date
    const calculateDaysUntil = (targetDate: Date): number => {
      return Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
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
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    pendingApps.forEach(app => {
      pendingTasks.push({
        dueDate: app.createdAt.toISOString(),
        type: 'Application Review',
        description: `Review application from ${app.crew.fullName}`,
        status: 'OPEN'
      });
    });

    // Add scheduled audits as pending tasks
    const upcomingAudits = await prisma.auditSchedule.findMany({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        startDate: {
          lte: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // Within 30 days
        }
      },
      take: 5,
      orderBy: {
        startDate: 'asc'
      }
    });

    upcomingAudits.forEach(audit => {
      const daysUntil = calculateDaysUntil(audit.startDate);
      pendingTasks.push({
        dueDate: audit.startDate.toISOString(),
        type: 'Audit Scheduled',
        description: `${audit.title} - ${audit.auditType}${daysUntil > 0 ? ` (in ${daysUntil} days)` : ' (today)'}`,
        status: audit.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN'
      });
    });

    // Add open non-conformities as pending tasks
    const openNonConformities = await prisma.nonConformity.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        targetDate: {
          gte: new Date()
        }
      },
      include: {
        assignedTo: {
          select: {
            name: true
          }
        }
      },
      take: 5,
      orderBy: {
        targetDate: 'asc'
      }
    });

    openNonConformities.forEach(nc => {
      const daysUntil = calculateDaysUntil(nc.targetDate);
      const assignedToName = nc.assignedTo?.name ?? 'Unassigned';
      pendingTasks.push({
        dueDate: nc.targetDate.toISOString(),
        type: 'Non-Conformity',
        description: `${nc.ncNumber}: ${nc.description.substring(0, 80)}${nc.description.length > 80 ? '...' : ''} (Assigned: ${assignedToName})`,
        status: nc.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN'
      });
    });

    // Sort all pending tasks by due date (most urgent first)
    pendingTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Limit to 10 most urgent tasks
    pendingTasks.splice(10);

    // Crew Movement: Get recent assignments
    const crewMovement: Array<{
      seafarer: string;
      rank: string;
      principal: string;
      vessel: string;
      status: string;
      nextAction: string;
    }> = [];

    const recentAssignments = await prisma.assignment.findMany({
      where: {
        status: { in: ['PLANNED', 'ONBOARD'] }
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
        }
      },
      take: 10,
      orderBy: {
        startDate: 'asc'
      }
    });

    recentAssignments.forEach(assignment => {
      crewMovement.push({
        seafarer: assignment.crew.fullName,
        rank: assignment.crew.rank || 'N/A',
        principal: assignment.vessel.principal.name,
        vessel: assignment.vessel.name,
        status: assignment.status,
        nextAction: assignment.status === 'PLANNED' ? 'Prepare for sign-on' : 'Onboard'
      });
    });

    // Recent Activity: Placeholder for now
    const recentActivity: Array<{
      timestamp: string;
      user: string;
      action: string;
    }> = [];

    // Count total crew and active vessels
    const totalCrew = await prisma.crew.count();
    const activeVessels = await prisma.vessel.count({
      where: { 
        assignments: {
          some: {
            status: 'ONBOARD'
          }
        }
      }
    });

    return NextResponse.json({
      totalCrew,
      activeVessels,
      pendingApplications,
      expiringDocuments: documentsExpiringSoon,
      crewReady,
      crewOnboard: crewOnBoard,
      contractsExpiringSoon,
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