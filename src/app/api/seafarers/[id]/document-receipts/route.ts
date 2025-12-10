import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

type DocumentReceiptCrewStatus = "NEW" | "EX_CREW";

type DocumentReceiptItemPayload = {
  certificateName: string;
  certificateNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  remarks?: string | null;
  orderIndex?: number;
};

type CreateDocumentReceiptPayload = {
  crewName: string;
  crewRank?: string | null;
  phone?: string | null;
  email?: string | null;
  vesselName?: string | null;
  crewStatus: DocumentReceiptCrewStatus;
  lastSignOffDate?: string | null;
  lastSignOffPort?: string | null;
  wearpackSize?: string | null;
  shoeSize?: string | null;
  waistSize?: string | null;
  notes?: string | null;
  deliveryLocation?: string | null;
  deliveryDate?: string | null;
  handedOverByName?: string | null;
  receivedByName?: string | null;
  items: DocumentReceiptItemPayload[];
};

function optionalString(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalDate(value?: string | null): Date | null {
  const normalized = optionalString(value);
  if (!normalized) {
    return null;
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeItems(items: unknown): DocumentReceiptItemPayload[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const candidate = item as Partial<DocumentReceiptItemPayload>;
      if (!candidate.certificateName || typeof candidate.certificateName !== "string") {
        return null;
      }
      return {
        certificateName: candidate.certificateName.trim(),
        certificateNumber: optionalString(candidate.certificateNumber ?? null),
        issueDate: candidate.issueDate ?? null,
        expiryDate: candidate.expiryDate ?? null,
        remarks: optionalString(candidate.remarks ?? null),
        orderIndex: typeof candidate.orderIndex === "number" ? candidate.orderIndex : index,
      } satisfies DocumentReceiptItemPayload;
    })
    .filter((item): item is DocumentReceiptItemPayload => Boolean(item));
}

function isValidCrewStatus(status: unknown): status is DocumentReceiptCrewStatus {
  return status === "NEW" || status === "EX_CREW";
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

    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;

    const receipts = await prisma.documentReceipt.findMany({
      where: { crewId: id },
      include: {
        items: {
          orderBy: {
            orderIndex: "asc",
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Error fetching document receipts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id: crewId } = await params;
    const payload = (await request.json()) as Partial<CreateDocumentReceiptPayload>;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (typeof payload.crewName !== "string" || payload.crewName.trim().length === 0) {
      return NextResponse.json({ error: "Crew name is required" }, { status: 400 });
    }

    if (!isValidCrewStatus(payload.crewStatus)) {
      return NextResponse.json({ error: "Invalid crew status" }, { status: 400 });
    }

    const normalizedItems = normalizeItems(payload.items);
    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: "At least one document item is required" }, { status: 400 });
    }

    const receipt = await prisma.documentReceipt.create({
      data: {
        crewId,
        crewName: payload.crewName.trim(),
        crewRank: optionalString(payload.crewRank ?? null),
        phone: optionalString(payload.phone ?? null),
        email: optionalString(payload.email ?? null),
        vesselName: optionalString(payload.vesselName ?? null),
        crewStatus: payload.crewStatus,
        lastSignOffDate: parseOptionalDate(payload.lastSignOffDate ?? null) ?? undefined,
        lastSignOffPort: optionalString(payload.lastSignOffPort ?? null),
        wearpackSize: optionalString(payload.wearpackSize ?? null),
        shoeSize: optionalString(payload.shoeSize ?? null),
        waistSize: optionalString(payload.waistSize ?? null),
        notes: optionalString(payload.notes ?? null),
        deliveryLocation: optionalString(payload.deliveryLocation ?? null),
        deliveryDate: parseOptionalDate(payload.deliveryDate ?? null) ?? undefined,
        handedOverByName: optionalString(payload.handedOverByName ?? null),
        receivedByName: optionalString(payload.receivedByName ?? null),
        createdById: session.user.id,
        items: {
          create: normalizedItems.map((item) => ({
            certificateName: item.certificateName,
            certificateNumber: optionalString(item.certificateNumber ?? null),
            issueDate: parseOptionalDate(item.issueDate ?? null) ?? undefined,
            expiryDate: parseOptionalDate(item.expiryDate ?? null) ?? undefined,
            remarks: optionalString(item.remarks ?? null),
            orderIndex: item.orderIndex ?? 0,
          })),
        },
      },
      include: {
        items: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Error creating document receipt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
