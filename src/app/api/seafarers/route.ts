import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

interface CreateSeafarerPayload {
  fullName: string;
  rank: string;
  nationality?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  heightCm?: string | number | null;
  weightKg?: string | number | null;
  coverallSize?: string | null;
  shoeSize?: string | null;
  waistSize?: string | null;
}

function optionalString(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseOptionalDate(value?: string | null): Date | null {
  const normalized = optionalString(value);
  if (!normalized) {
    return null;
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOptionalInteger(value?: string | number | null): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  const numeric = Number.parseInt(String(value), 10);
  return Number.isNaN(numeric) ? null : numeric;
}

function isCreateSeafarerPayload(value: unknown): value is CreateSeafarerPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<CreateSeafarerPayload>;
  return (
    typeof payload.fullName === "string" &&
    payload.fullName.trim().length > 0 &&
    typeof payload.rank === "string" &&
    payload.rank.trim().length > 0
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check crew permission
    if (!checkPermission(session, 'crew', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const seafarers = await prisma.crew.findMany({
      include: {
        assignments: {
          where: {
            status: {
              in: ['PLANNED', 'ONBOARD']
            }
          },
          include: {
            vessel: {
              select: {
                name: true,
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(seafarers);
  } catch (error) {
    console.error("Error fetching seafarers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const payload = (await request.json()) as unknown;

    if (!isCreateSeafarerPayload(payload)) {
      return NextResponse.json({ error: "Invalid seafarer payload" }, { status: 400 });
    }

    const combinedAddress = [
      optionalString(payload.address),
      optionalString(payload.city),
      optionalString(payload.country),
    ]
      .filter((segment): segment is string => Boolean(segment))
      .join(", ");

    const formattedEmergencyContact = (() => {
      const contactName = optionalString(payload.emergencyContact);
      const contactPhone = optionalString(payload.emergencyPhone);

      if (contactName && contactPhone) {
        return `${contactName} • ${contactPhone}`;
      }
      return contactName ?? contactPhone ?? null;
    })();

    const seafarer = await prisma.crew.create({
      data: {
        fullName: payload.fullName.trim(),
        rank: payload.rank.trim(),
        nationality: optionalString(payload.nationality),
        placeOfBirth: optionalString(payload.placeOfBirth),
        dateOfBirth: parseOptionalDate(payload.dateOfBirth) ?? undefined,
        phone: optionalString(payload.phone),
        email: optionalString(payload.email),
        address: combinedAddress.length > 0 ? combinedAddress : null,
        emergencyContact: formattedEmergencyContact,
        emergencyContactName: optionalString(payload.emergencyContact),
        emergencyContactPhone: optionalString(payload.emergencyPhone),
        emergencyContactRelation: optionalString(payload.emergencyRelation),
        heightCm: parseOptionalInteger(payload.heightCm),
        weightKg: parseOptionalInteger(payload.weightKg),
        coverallSize: optionalString(payload.coverallSize),
        shoeSize: optionalString(payload.shoeSize),
        waistSize: optionalString(payload.waistSize),
      },
    });

    return NextResponse.json(seafarer, { status: 201 });
  } catch (error) {
    console.error("Error creating seafarer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}