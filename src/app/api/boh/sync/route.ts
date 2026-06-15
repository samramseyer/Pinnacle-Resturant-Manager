import { NextRequest, NextResponse } from "next/server";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission, unauthorizedResponse } from "@/lib/api-auth";
import { getSessionUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Lightweight poll endpoint — POS, tablets, and online channels compare menuRevision. */
export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return unauthorizedResponse();

  const locationId = await getLocationIdFromRequest(request);
  const since = parseInt(request.nextUrl.searchParams.get("since") ?? "0", 10);

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { menuRevision: true },
  });
  const revision = location?.menuRevision ?? 0;

  if (revision === since) {
    return NextResponse.json({ changed: false, menuRevision: revision });
  }

  const items = await prisma.menuItem.findMany({
    where: { locationId },
    select: {
      id: true,
      available: true,
      stockCount: true,
      eightySixedAt: true,
      price: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    changed: true,
    menuRevision: revision,
    items,
  });
}
