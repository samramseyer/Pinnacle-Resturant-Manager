import { NextRequest, NextResponse } from "next/server";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";
import { getPosMenuBundle } from "@/lib/menu/resolve-pos-menu";
import { prisma } from "@/lib/prisma";
import { resolveMenuForTime } from "@/lib/menu/dayparts";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_boh");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const bundle = await getPosMenuBundle(locationId);
  const rawItems = await prisma.menuItem.findMany({
    where: { locationId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const schedules = await prisma.menuScheduleRule.findMany({
    where: { locationId },
    orderBy: { sortOrder: "asc" },
  });
  const { activeRules } = resolveMenuForTime(rawItems, schedules);

  return NextResponse.json({
    menuRevision: bundle.menuRevision,
    items: rawItems,
    resolved: bundle.resolvedMenu,
    activeDayparts: activeRules,
    schedules,
  });
}
