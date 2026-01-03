import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as complianceService from '@/lib/compliance/service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '90');

    const certs = await complianceService.listExpiringCertifications(days);
    return NextResponse.json(certs);
  } catch (error) {
    console.error('Error listing expiring certifications:', error);
    return NextResponse.json(
      { error: 'Failed to list certifications' },
      { status: 500 }
    );
  }
}
