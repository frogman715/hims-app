import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complianceId = parseInt(id);

    if (isNaN(complianceId)) {
      return NextResponse.json(
        { error: 'Invalid compliance ID' },
        { status: 400 }
      );
    }

    // Get the compliance record
    const compliance = await prisma.externalCompliance.findUnique({
      where: { id: complianceId },
      include: {
        crew: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            seamanCode: true,
          },
        },
      },
    });

    if (!compliance) {
      return NextResponse.json(
        { error: 'Compliance record not found' },
        { status: 404 }
      );
    }

    // Simulate verification process based on system type
    let verificationResult = {
      isValid: false,
      message: 'Verification failed',
      details: {},
    };

    switch (compliance.systemType) {
      case 'KOSMA_CERTIFICATE':
        // Simulate KOSMA verification
        verificationResult = {
          isValid: Math.random() > 0.1, // 90% success rate for demo
          message: 'KOSMA certificate verified successfully',
          details: {
            verifiedAt: new Date().toISOString(),
            certificateStatus: 'VALID',
            expiryCheck: compliance.expiryDate
              ? new Date(compliance.expiryDate) > new Date()
              : true,
          },
        };
        break;

      case 'DEPHUB_CERTIFICATE':
        // Simulate Dephub verification
        verificationResult = {
          isValid: Math.random() > 0.15, // 85% success rate for demo
          message: 'Dephub certificate verified successfully',
          details: {
            verifiedAt: new Date().toISOString(),
            seafarerStatus: 'ACTIVE',
            expiryCheck: compliance.expiryDate
              ? new Date(compliance.expiryDate) > new Date()
              : true,
          },
        };
        break;

      case 'SCHENGEN_VISA_NL':
        // Simulate Schengen visa verification
        verificationResult = {
          isValid: Math.random() > 0.05, // 95% success rate for demo
          message: 'Schengen visa verified successfully',
          details: {
            verifiedAt: new Date().toISOString(),
            visaStatus: 'VALID',
            expiryCheck: compliance.expiryDate
              ? new Date(compliance.expiryDate) > new Date()
              : true,
          },
        };
        break;

      default:
        verificationResult = {
          isValid: false,
          message: 'Unknown compliance system type',
          details: {},
        };
    }

    // Update compliance status based on verification
    const newStatus = verificationResult.isValid ? 'VERIFIED' : 'FAILED';

    const updatedCompliance = await prisma.externalCompliance.update({
      where: { id: complianceId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        crew: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            seamanCode: true,
          },
        },
      },
    });

    return NextResponse.json({
      compliance: updatedCompliance,
      verification: verificationResult,
    });
  } catch (error) {
    console.error('Error verifying external compliance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}