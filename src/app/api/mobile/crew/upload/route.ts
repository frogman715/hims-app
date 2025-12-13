import { NextRequest, NextResponse } from "next/server";
import { requireUserApi } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireUserApi(["CREW", "CREW_PORTAL"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const rawType = formData.get("type");

  if (!(file instanceof File) || typeof rawType !== "string" || !rawType.trim()) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const uploadType = rawType.trim();

  try {
    const sessionEmail = auth.session.user.email ?? null;

    let crew = await prisma.crew.findUnique({
      where: { id: auth.user.id },
      select: { id: true },
    });

    if (!crew && sessionEmail) {
      crew = await prisma.crew.findFirst({
        where: { email: sessionEmail },
        select: { id: true },
      });
    }

    if (!crew) {
      console.warn("Mobile upload: crew record not found", {
        userId: auth.user.id,
        email: sessionEmail,
        uploadType,
      });
    } else {
      console.info("Mobile upload received", {
        crewId: crew.id,
        userId: auth.user.id,
        uploadType,
        fileName: file.name,
        fileSize: file.size,
      });
      // Storage backend not yet implemented. Persisting metadata can be added here in future releases.
    }
  } catch (error) {
    console.error("Mobile upload metadata handling failed", error);
  }

  return NextResponse.json({ ok: true });
}
