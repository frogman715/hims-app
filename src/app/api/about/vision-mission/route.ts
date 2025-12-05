import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active vision & mission
    const visionMission = await prisma.companyVisionMission.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    if (!visionMission) {
      // Return default values
      return NextResponse.json({
        vision: "To be the leading maritime crew management company in Indonesia, recognized globally for excellence, integrity, and commitment to seafarers' welfare and international maritime standards.",
        mission: "To provide professional maritime crew management services that comply with MLC 2006 and STCW standards, ensuring quality seafarers, excellent service to ship owners, and fostering a safe, respectful working environment for all maritime professionals.",
        coreValues: [
          "Integrity & Transparency",
          "Excellence & Professionalism",
          "Seafarer Welfare First",
          "Compliance & Safety",
          "Continuous Improvement",
          "Customer Satisfaction"
        ],
        objectives: "Our quality management system is designed to:\n\n• Ensure 100% compliance with MLC 2006, STCW 2010, and ISM Code requirements\n• Maintain seafarer satisfaction rating above 90%\n• Achieve zero major non-conformities in external audits\n• Provide timely crew replacement services within 48 hours of notification\n• Maintain accurate documentation with 99.9% accuracy rate\n• Foster continuous professional development for all crew members\n• Establish long-term partnerships with reputable ship owners and principals"
      });
    }

    return NextResponse.json(visionMission);
  } catch (error) {
    console.error("Error fetching vision & mission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { vision, mission, coreValues, objectives } = body;

    // Deactivate previous entries
    await prisma.companyVisionMission.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new entry
    const newVisionMission = await prisma.companyVisionMission.create({
      data: {
        vision,
        mission,
        coreValues,
        objectives,
        isActive: true
      }
    });

    return NextResponse.json(newVisionMission, { status: 201 });
  } catch (error) {
    console.error("Error creating vision & mission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
