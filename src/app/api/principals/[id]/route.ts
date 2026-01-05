import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const {
      name,
      country,
      address,
      contactPerson,
      phone,
      email,
      taxId,
      registrationNumber,
      agreementDate,
      agreementExpiry,
      status,
    } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const principal = await prisma.principal.update({
      where: { id: id },
      data: {
        name,
        country: country || undefined,
        address: address || undefined,
        contactPerson: contactPerson || undefined,
        phone: phone || undefined,
        email: email || undefined,
        taxId: taxId || undefined,
        registrationNumber: registrationNumber || undefined,
        agreementDate: agreementDate ? new Date(agreementDate) : undefined,
        agreementExpiry: agreementExpiry ? new Date(agreementExpiry) : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json(principal);
  } catch (error) {
    console.error('Error updating principal:', error);
    return NextResponse.json(
      { error: 'Failed to update principal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if principal has associated assignments
    const assignmentCount = await prisma.assignment.count({
      where: { principalId: id },
    });

    if (assignmentCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete principal with associated assignments" },
        { status: 400 }
      );
    }

    await prisma.principal.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Principal deleted successfully' });
  } catch (error) {
    console.error('Error deleting principal:', error);
    return NextResponse.json(
      { error: 'Failed to delete principal' },
      { status: 500 }
    );
  }
}