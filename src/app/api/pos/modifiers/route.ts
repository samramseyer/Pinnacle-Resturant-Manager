import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_menu");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const groups = await prisma.modifierGroup.findMany({
    where: { locationId },
    include: { options: { orderBy: { sortOrder: "asc" } }, menuItem: { select: { id: true, name: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_menu");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const optionNames: string[] = Array.isArray(body.options)
    ? body.options.map((o: string | { name: string }) => (typeof o === "string" ? o : o.name).trim()).filter(Boolean)
    : [];
  if (optionNames.length === 0) {
    return NextResponse.json({ error: "Add at least one option" }, { status: 400 });
  }

  const group = await prisma.modifierGroup.create({
    data: {
      locationId,
      name,
      slug,
      categories: body.categories ?? null,
      menuItemId: body.menuItemId ?? null,
      required: Boolean(body.required),
      minSelect: body.minSelect ?? (body.required ? 1 : 0),
      maxSelect: body.maxSelect ?? 1,
      sortOrder: body.sortOrder ?? 0,
      options: {
        create: optionNames.map((optionName, idx) => ({
          name: optionName,
          sortOrder: idx,
          priceDelta: 0,
        })),
      },
    },
    include: { options: true, menuItem: { select: { id: true, name: true } } },
  });

  return NextResponse.json(group);
}
