import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';
import { principalUpdateSchema } from '@/lib/crewing-ops-schemas';
import { handleApiError, ApiError } from '@/lib/error-handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/principals', 'PUT');
    if (authError) {
      return authError;
    }

    const { id } = await params;
    if (!session.user?.id) {
      throw new ApiError(401, 'Unauthorized', 'AUTHENTICATION_ERROR');
    }

    const parsedBody = principalUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid principal payload', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    const principal = await prisma.principal.update({
      where: { id: id },
      data: {
        name: body.name,
        country: body.country ?? undefined,
        address: body.address ?? undefined,
        contactPerson: body.contactPerson ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email ?? undefined,
        taxId: body.taxId ?? undefined,
        registrationNumber: body.registrationNumber ?? undefined,
        agreementDate:
          body.agreementDate === undefined
            ? undefined
            : body.agreementDate
              ? new Date(body.agreementDate)
              : null,
        agreementExpiry:
          body.agreementExpiry === undefined
            ? undefined
            : body.agreementExpiry
              ? new Date(body.agreementExpiry)
              : null,
        status: body.status ?? undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'PRINCIPAL_UPDATED',
        entityType: 'Principal',
        entityId: principal.id,
        metadataJson: {
          name: principal.name,
          status: principal.status,
          country: principal.country,
        },
      },
    });

    return NextResponse.json(principal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/principals', 'DELETE');
    if (authError) {
      return authError;
    }

    const { id } = await params;
    if (!session.user?.id) {
      throw new ApiError(401, 'Unauthorized', 'AUTHENTICATION_ERROR');
    }

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

    const principal = await prisma.principal.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });

    if (!principal) {
      throw new ApiError(404, 'Principal not found', 'NOT_FOUND');
    }

    await prisma.principal.delete({
      where: { id: id },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'PRINCIPAL_DELETED',
        entityType: 'Principal',
        entityId: principal.id,
        metadataJson: {
          name: principal.name,
          status: principal.status,
        },
      },
    });

    return NextResponse.json({ message: 'Principal deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
