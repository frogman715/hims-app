import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission("hr", PermissionLevel.VIEW_ACCESS, async () => {
  const appraisals = await prisma.performanceAppraisal.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json({ appraisals, total: appraisals.length });
});

export const POST = withPermission("hr", PermissionLevel.EDIT_ACCESS, async (req, session) => {
  const body = await req.json();

  const count = await prisma.performanceAppraisal.count();
  const formNumber = `HCF-AD-06-${String(count + 1).padStart(4, "0")}`;

  // Calculate overall score
  const scores = [
    body.qualityOfWork,
    body.productivity,
    body.jobKnowledge,
    body.reliability,
    body.initiative,
    body.teamwork,
    body.communication
  ];
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const appraisal = await prisma.performanceAppraisal.create({
    data: {
      ...body,
      formNumber,
      overallScore,
      evaluatorId: session?.user?.id || "system"
    }
  });

  return NextResponse.json(appraisal, { status: 201 });
});
