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
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    // Documents Expiring Soon: 15 months threshold
    // Shows documents approaching 15-month expiry mark
    const fifteenMonthsFromNow = new Date();
    fifteenMonthsFromNow.setMonth(fifteenMonthsFromNow.getMonth() + 15);

    // Documents Expiring Soon: CrewDocuments expired or expiring within 15 months
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
    const crewWithExpiringDocumentsGrouped = crewWithExpiringDocuments.reduce((acc: Record<string, CrewWithDocuments>, doc) => {
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

    const crewWithExpiringDocumentsArray = Object.values(crewWithExpiringDocumentsGrouped);

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
    const crewWithExpiringContractsGrouped = crewWithExpiringContracts.reduce((acc: Record<string, CrewWithContracts>, assignment) => {
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

    const crewWithExpiringContractsArray = Object.values(crewWithExpiringContractsGrouped);

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

    const pendingTasks = pendingApplications + complaints;

    return NextResponse.json({
      crewReady,
      crewOnboard: crewOnBoard,
      documentsExpiringSoon,
      expiringItems,
      contractsExpiringSoon,
      pendingTasks,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}