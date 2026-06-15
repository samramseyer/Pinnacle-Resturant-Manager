import { NextRequest, NextResponse } from "next/server";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";
import { getPosMenuBundle } from "@/lib/menu/resolve-pos-menu";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(request, "place_orders");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const bundle = await getPosMenuBundle(locationId);

  return NextResponse.json({
    menuRevision: bundle.menuRevision,
    menuItems: bundle.menuItems,
    activeDayparts: bundle.activeDayparts,
    modifierGroups: bundle.modifierGroups,
    categoryStyles: bundle.categoryStyles,
    tables: bundle.tables,
    openOrders: bundle.openOrders,
  });
}
