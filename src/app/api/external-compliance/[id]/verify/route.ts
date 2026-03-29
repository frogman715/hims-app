import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isExpiryValid(expiryDate: Date | string | null) {
  if (!expiryDate) {
    return true;
  }

  return new Date(expiryDate) >= new Date();
}

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

    const complianceId = id;

    // Get the compliance record
    const compliance = await prisma.externalCompliance.findUnique({
      where: { id: complianceId },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
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

    const expiryCheck = isExpiryValid(compliance.expiryDate);

    // Deterministic verification result based on stored record state.
    let verificationResult = {
      isValid: false,
      message: 'Verification failed',
      details: {},
    };

    switch (compliance.systemType) {
      case 'KOSMA_CERTIFICATE':
        verificationResult = {
          isValid: expiryCheck,
          message: expiryCheck ? 'KOSMA certificate verified successfully' : 'KOSMA certificate is expired',
          details: {
            verifiedAt: new Date().toISOString(),
            certificateStatus: expiryCheck ? 'VALID' : 'EXPIRED',
            expiryCheck,
          },
        };
        break;

      case 'DEPHUB_CERTIFICATE':
        verificationResult = {
          isValid: expiryCheck,
          message: expiryCheck ? 'Dephub certificate verified successfully' : 'Dephub certificate is expired',
          details: {
            verifiedAt: new Date().toISOString(),
            seafarerStatus: expiryCheck ? 'ACTIVE' : 'EXPIRED',
            expiryCheck,
          },
        };
        break;

      case 'SCHENGEN_VISA_NL':
        verificationResult = {
          isValid: expiryCheck,
          message: expiryCheck ? 'Schengen visa verified successfully' : 'Schengen visa is expired',
          details: {
            verifiedAt: new Date().toISOString(),
            visaStatus: expiryCheck ? 'VALID' : 'EXPIRED',
            expiryCheck,
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
    const newStatus = verificationResult.isValid ? 'VERIFIED' : 'REJECTED';

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
            fullName: true,
            rank: true,
            status: true,
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
