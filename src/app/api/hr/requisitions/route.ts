import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission("hr", PermissionLevel.VIEW_ACCESS, async () => {
  const requisitions = await prisma.manpowerRequisition.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ requisitions, total: requisitions.length });
});

export const POST = withPermission("hr", PermissionLevel.EDIT_ACCESS, async (req, session) => {
  const body = await req.json();
  const { department, position, numberOfVacancy, reason, jobDescription, qualifications, budget } = body;

  // Generate form number
  const count = await prisma.manpowerRequisition.count();
  const formNumber = `HCF-AD-25-${String(count + 1).padStart(4, "0")}`;

  const requisition = await prisma.manpowerRequisition.create({
    data: {
      formNumber,
      department,
      position,
      numberOfVacancy,
      reason,
      jobDescription,
      qualifications,
      requestedBy: session?.user?.id || "system",
      budget,
      status: "PENDING"
    }
  });

  return NextResponse.json(requisition, { status: 201 });
});
