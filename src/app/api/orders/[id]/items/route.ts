import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { hasPaymentsAttached, ORDER_INCLUDE } from "@/lib/orders";
import { decrementMenuStock } from "@/lib/menu/stock";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(request, "add_to_check");
  if (error) return error;

  const { id: orderId } = await params;
  const body = await request.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.checkStatus === "CLOSED" || order.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot modify a closed order" }, { status: 400 });
  }
  if (hasPaymentsAttached(order.payments)) {
    return NextResponse.json(
      { error: "Void payments before adding items to this check" },
      { status: 400 }
    );
  }

  const quantity = body.quantity || 1;
  const linePrice = body.price;
  const fireNow = body.fireToKitchen !== false;
  const now = fireNow ? new Date() : null;

  await prisma.orderItem.create({
    data: {
      orderId,
      menuItemId: body.menuItemId,
      quantity,
      price: linePrice,
      seatNumber: body.seatNumber ?? null,
      modifiers: body.modifiers ? JSON.stringify(body.modifiers) : null,
      modifierSummary: body.modifierSummary ?? null,
      kitchenStatus: fireNow ? "FIRED" : "PENDING",
      firedAt: now,
    },
  });

  if (fireNow) {
    await decrementMenuStock(order.locationId, body.menuItemId, quantity);
  }

  const lineTotal = quantity * linePrice;
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      totalAmount: order.totalAmount + lineTotal,
      status: fireNow && order.status === "PENDING" ? "PREPARING" : order.status,
    },
    include: ORDER_INCLUDE,
  });

  return NextResponse.json(updated);
}
