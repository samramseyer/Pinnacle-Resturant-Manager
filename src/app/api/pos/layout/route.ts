import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_menu");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const body = await request.json();

  if (Array.isArray(body.items)) {
    for (const row of body.items as { id: string; posGridIndex?: number; posColor?: string | null }[]) {
      await prisma.menuItem.updateMany({
        where: { id: row.id, locationId },
        data: {
          posGridIndex: row.posGridIndex,
          posColor: row.posColor ?? undefined,
        },
      });
    }
  }

  if (Array.isArray(body.categoryStyles)) {
    for (const row of body.categoryStyles as { category: string; color: string; icon?: string }[]) {
      await prisma.posCategoryStyle.upsert({
        where: { locationId_category: { locationId, category: row.category } },
        create: { locationId, category: row.category, color: row.color, icon: row.icon },
        update: { color: row.color, icon: row.icon },
      });
    }
  }

  return NextResponse.json({ success: true });
}
