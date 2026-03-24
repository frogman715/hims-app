import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { z } from "zod";

const signOffCreateSchema = z.object({
  crewId: z.string().min(1, "Crew ID is required"),
  assignmentId: z.string().min(1, "Assignment ID is required"),
  signOffDate: z.string().datetime({ offset: true }).or(z.string().date()),
  arrivalDate: z.string().datetime({ offset: true }).or(z.string().date()).nullable().optional(),
  passportReceived: z.boolean().optional().default(false),
  seamanBookReceived: z.boolean().optional().default(false),
}).strict();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const authError = ensureOfficeApiPathAccess(session, "/api/crewing/sign-off", "GET");
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;

  const signOffs = await prisma.crewSignOff.findMany({
    where,
    include: {
      crew: {
        select: {
          fullName: true,
          rank: true,
          phone: true
        }
      },
      assignment: {
        select: {
          vessel: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { signOffDate: "desc" }
  });

  return NextResponse.json({ signOffs, total: signOffs.length });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const authError = ensureOfficeApiPathAccess(session, "/api/crewing/sign-off", "POST");
  if (authError) return authError;

  const parsedBody = signOffCreateSchema.safeParse(await req.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid sign-off payload", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsedBody.data;
  const {
    crewId,
    assignmentId,
    signOffDate,
    arrivalDate,
    passportReceived = false,
    seamanBookReceived = false
  } = body;

  const signOff = await prisma.crewSignOff.create({
    data: {
      crewId,
      assignmentId,
      signOffDate: new Date(signOffDate),
      arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
      passportReceived,
      seamanBookReceived,
      status: "PENDING"
    }
  });

  // Update crew status to OFF_SIGNED
  await prisma.crew.update({
    where: { id: crewId },
    data: { status: "OFF_SIGNED" }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "CREW_SIGN_OFF_CREATED",
      entityType: "CrewSignOff",
      entityId: signOff.id,
      metadataJson: {
        crewId,
        assignmentId,
        status: signOff.status,
      },
    },
  });

  return NextResponse.json(signOff, { status: 201 });
}
