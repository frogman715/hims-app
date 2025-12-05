import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check quality permission for checklist access
    if (!checkPermission(session, 'quality', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of month

    // Also get crew whose contracts expire within 1 month from now
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    // Get assignments that have sign-on or sign-off dates in this month OR contracts expiring soon
    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          // Include crew whose contracts expire within 1 month
          {
            endDate: {
              lte: oneMonthFromNow,
              gte: new Date() // From today onwards
            },
            status: 'ONBOARD' // Only active crew
          }
        ]
      },
      include: {
        crew: {
          select: {
            fullName: true,
            nationality: true,
            documents: {
              select: {
                docType: true,
                docNumber: true,
                expiryDate: true
              }
            }
          }
        },
        vessel: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Transform assignments into checklist items
    const checklistItems = assignments.map(assignment => {
      const signOnInMonth = assignment.startDate && assignment.startDate >= startDate && assignment.startDate <= endDate;
      const signOffInMonth = assignment.endDate && assignment.endDate >= startDate && assignment.endDate <= endDate;

      // Check if contract expires within 1 month
      const contractExpiresSoon = assignment.endDate && assignment.endDate <= oneMonthFromNow && assignment.endDate >= new Date() && assignment.status === 'ONBOARD';

      let status: 'ON' | 'OFF' | 'CONTRACT_EXPIRING' = 'ON';

      if (contractExpiresSoon) {
        status = 'CONTRACT_EXPIRING';
      } else if (signOffInMonth) {
        status = 'OFF';
      } else if (signOnInMonth) {
        status = 'ON';
      }

      // Check document completeness
      const documents = assignment.crew.documents || [];
      const hasValidPassport = documents.some(doc =>
        doc.docType?.toLowerCase().includes('passport') &&
        doc.expiryDate && doc.expiryDate > new Date()
      );
      const hasValidMedical = documents.some(doc =>
        doc.docType?.toLowerCase().includes('medical') &&
        doc.expiryDate && doc.expiryDate > new Date()
      );
      const hasValidCertificates = documents.some(doc =>
        ['STCW_BST', 'STCW_AFF', 'STCW_MEFA', 'STCW_SCRB', 'COP_TANKER'].some(cert =>
          doc.docType?.includes(cert)
        ) &&
        doc.expiryDate && doc.expiryDate > new Date()
      );

      // Check if training is complete (mock for now - would need training model)
      const trainingComplete = Math.random() > 0.3; // Mock data

      return {
        id: assignment.id,
        crewId: assignment.crewId,
        month: new Date(startDate).toLocaleString('default', { month: 'long' }),
        year: yearNum,
        crewName: assignment.crew.fullName,
        vessel: assignment.vessel.name,
        rank: assignment.rank,
        signOnDate: signOnInMonth && assignment.startDate ? assignment.startDate.toISOString().split('T')[0] : null,
        signOffDate: (signOffInMonth || contractExpiresSoon) && assignment.endDate ? assignment.endDate.toISOString().split('T')[0] : null,
        status,
        documentsComplete: hasValidPassport && hasValidCertificates,
        medicalCheck: hasValidMedical,
        trainingComplete,
        notes: contractExpiresSoon && assignment.endDate ? `Contract expires in ${Math.ceil((assignment.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` : null
      };
    });

    return NextResponse.json(checklistItems);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}