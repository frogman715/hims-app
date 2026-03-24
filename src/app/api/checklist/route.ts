import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { handleApiError } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, "/api/checklist", "GET");
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
    }

    const monthNum = Number.parseInt(month, 10);
    const yearNum = Number.parseInt(year, 10);
    if (
      Number.isNaN(monthNum) ||
      Number.isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      yearNum < 2000 ||
      yearNum > 2100
    ) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

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

      // Use valid competency certificates as the current training readiness signal.
      const trainingComplete = hasValidCertificates;

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
    return handleApiError(error);
  }
}
