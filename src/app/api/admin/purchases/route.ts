import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission("admin", PermissionLevel.VIEW_ACCESS, async () => {
  const purchases = await prisma.purchaseOrder.findMany({
    orderBy: { requestDate: "desc" },
    take: 50
  });
  return NextResponse.json({ purchases, total: purchases.length });
});

export const POST = withPermission("admin", PermissionLevel.EDIT_ACCESS, async (req, session) => {
  const body = await req.json();
  const { department, supplierName, items, purpose, totalAmount } = body;

  const count = await prisma.purchaseOrder.count();
  const formNumber = `HCF-AD-15-${String(count + 1).padStart(4, "0")}`;
  const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const purchase = await prisma.purchaseOrder.create({
    data: {
      formNumber,
      poNumber,
      department,
      supplierName,
      items,
      purpose,
      totalAmount,
      requestedBy: session?.user?.id || "system",
      status: "DRAFT",
      paymentStatus: "DRAFT"
    }
  });

  return NextResponse.json(purchase, { status: 201 });
});
