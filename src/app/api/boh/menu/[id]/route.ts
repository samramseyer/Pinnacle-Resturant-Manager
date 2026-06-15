import { NextRequest, NextResponse } from "next/server";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";
import { eightySixItem, setItemStockCount } from "@/lib/menu/stock";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(request, "manage_boh");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const { id } = await params;
  const body = await request.json();

  if (typeof body.eightySix === "boolean") {
    const item = await eightySixItem(locationId, id, !body.eightySix);
    return NextResponse.json(item);
  }

  if (body.stockCount !== undefined) {
    const count =
      body.stockCount === null || body.stockCount === ""
        ? null
        : Number(body.stockCount);
    const item = await setItemStockCount(locationId, id, count);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "No supported update" }, { status: 400 });
}
