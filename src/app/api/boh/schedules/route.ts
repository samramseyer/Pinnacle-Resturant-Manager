import { NextRequest, NextResponse } from "next/server";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";
import { bumpMenuRevision } from "@/lib/menu/stock";
import { prisma } from "@/lib/prisma";
import type { MenuScheduleMode } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_menu");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const rules = await prisma.menuScheduleRule.findMany({
    where: { locationId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_menu");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const body = await request.json();

  const rule = await prisma.menuScheduleRule.create({
    data: {
      locationId,
      name: body.name,
      mode: body.mode as MenuScheduleMode,
      categories: body.categories,
      daysOfWeek: body.daysOfWeek ?? "0,1,2,3,4,5,6",
      startTime: body.startTime,
      endTime: body.endTime,
      priceMultiplier: body.priceMultiplier ?? 1,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  await bumpMenuRevision(locationId);
  return NextResponse.json(rule);
}
