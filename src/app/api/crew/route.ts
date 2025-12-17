import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, crewGuard, PermissionLevel } from "@/lib/permission-middleware";
import { Prisma, CrewStatus } from "@prisma/client";

interface CreateCrewPayload {
  fullName: string;
  rank: string;
  phone?: string | null;
  email?: string | null;
}

function isCreateCrewPayload(value: unknown): value is CreateCrewPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<CreateCrewPayload>;
  return (
    typeof payload.fullName === "string" &&
    payload.fullName.trim().length > 0 &&
    typeof payload.rank === "string" &&
    payload.rank.trim().length > 0 &&
    (payload.phone === undefined || payload.phone === null || typeof payload.phone === "string") &&
    (payload.email === undefined || payload.email === null || typeof payload.email === "string")
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check crew permission
    if (!crewGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Prisma.CrewWhereInput = {};

    // Filter by status if provided
    if (status && status !== 'all' && Object.values(CrewStatus).includes(status as CrewStatus)) {
      where.status = status as CrewStatus;
    }

    // Filter by search term if provided
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { rank: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const crews = await prisma.crew.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        documents: {
          select: {
            id: true,
            docType: true,
            docNumber: true,
            issueDate: true,
            expiryDate: true,
            remarks: true,
            fileUrl: true
          }
        },
        contracts: {
          where: { contractKind: "SEA" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.crew.count({ where });

    return NextResponse.json({
      crews,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching crews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check crew permission for editing
    if (!checkPermission(session, 'crew', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create crew records" }, { status: 403 });
    }

    const payload = (await req.json()) as unknown;

    if (!isCreateCrewPayload(payload)) {
      return NextResponse.json({ error: "Invalid crew payload" }, { status: 400 });
    }

    const crew = await prisma.crew.create({
      data: {
        fullName: payload.fullName,
        rank: payload.rank,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
      },
    });

    return NextResponse.json(crew, { status: 201 });
  } catch (error) {
    console.error("Error creating crew:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}