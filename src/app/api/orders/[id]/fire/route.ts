import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { ORDER_INCLUDE } from "@/lib/orders";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(_request, "add_to_check");
  if (error) return error;

  const { id: orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const now = new Date();
  await prisma.orderItem.updateMany({
    where: { orderId, kitchenStatus: "PENDING" },
    data: { kitchenStatus: "FIRED", firedAt: now },
  });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: order.status === "PENDING" ? "PREPARING" : order.status,
    },
    include: ORDER_INCLUDE,
  });

  return NextResponse.json(updated);
}
