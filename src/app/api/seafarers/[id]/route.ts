import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface UpdateSeafarerPayload {
  fullName: string;
  nationality?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  rank?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
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

function buildEmergencySummary(name: string | null, phone: string | null) {
  if (name && phone) {
    return `${name} • ${phone}`;
  }
  return name ?? phone ?? null;
}

function isUpdateSeafarerPayload(value: unknown): value is UpdateSeafarerPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<UpdateSeafarerPayload>;
  return typeof payload.fullName === "string" && payload.fullName.trim().length > 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const crewId = id;

    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
    });

    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    return NextResponse.json(crew);
  } catch (error) {
    console.error("Error fetching seafarer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const crewId = id;

    const payload = (await request.json()) as unknown;

    if (!isUpdateSeafarerPayload(payload)) {
      return NextResponse.json({ error: "Invalid seafarer payload" }, { status: 400 });
    }

    const crew = await prisma.crew.update({
      where: { id: crewId },
      data: {
        fullName: payload.fullName.trim(),
        nationality: optionalString(payload.nationality),
        dateOfBirth: parseOptionalDate(payload.dateOfBirth),
        placeOfBirth: optionalString(payload.placeOfBirth),
        phone: optionalString(payload.phone),
        email: optionalString(payload.email),
        rank: optionalString(payload.rank) ?? undefined,
        emergencyContactName: optionalString(payload.emergencyContactName),
        emergencyContactRelation: optionalString(payload.emergencyContactRelation),
        emergencyContactPhone: optionalString(payload.emergencyContactPhone),
        emergencyContact: buildEmergencySummary(
          optionalString(payload.emergencyContactName),
          optionalString(payload.emergencyContactPhone)
        ),
        heightCm: parseOptionalInteger(payload.heightCm),
        weightKg: parseOptionalInteger(payload.weightKg),
        coverallSize: optionalString(payload.coverallSize),
        shoeSize: optionalString(payload.shoeSize),
        waistSize: optionalString(payload.waistSize),
      },
    });

    return NextResponse.json(crew);
  } catch (error) {
    console.error("Error updating seafarer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}