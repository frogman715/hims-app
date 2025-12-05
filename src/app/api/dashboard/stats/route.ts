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
    const fortyFiveDaysFromNow = new Date();
    fortyFiveDaysFromNow.setDate(fortyFiveDaysFromNow.getDate() + 45);

    const oneYearFromNow = new Date();
    oneYearFromNow.setDate(oneYearFromNow.getDate() + 365);

    // Documents Expiring Soon: CrewDocuments expiring within 1 year
    const documentsExpiringSoon = await prisma.crewDocument.count({
      where: {
        expiryDate: {
          gte: new Date(),
          lte: oneYearFromNow
        }
      }
    });

    // Get detailed info of crew with documents expiring soon
    const crewWithExpiringDocuments = await prisma.crewDocument.findMany({
      where: {
        expiryDate: {
          gte: new Date(),
          lte: oneYearFromNow
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

    // Contracts Expiring Soon: Assignments with endDate within 45 days and status ONBOARD
    const contractsExpiringSoon = await prisma.assignment.count({
      where: {
        status: 'ONBOARD',
        endDate: {
          gte: new Date(),
          lte: fortyFiveDaysFromNow
        }
      }
    });

    // Get detailed info of crew with contracts expiring soon
    const crewWithExpiringContracts = await prisma.assignment.findMany({
      where: {
        status: 'ONBOARD',
        endDate: {
          gte: new Date(),
          lte: fortyFiveDaysFromNow
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
      crewWithIssues: crewWithIssuesArray,
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