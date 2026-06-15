import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(_request, "manage_menu");
  if (error) return error;

  const { id } = await params;
  await prisma.modifierGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(request, "manage_menu");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const group = await prisma.modifierGroup.update({
    where: { id },
    data: {
      name: body.name,
      categories: body.categories,
      required: body.required,
      minSelect: body.minSelect,
      maxSelect: body.maxSelect,
      sortOrder: body.sortOrder,
    },
    include: { options: true, menuItem: { select: { id: true, name: true } } },
  });

  return NextResponse.json(group);
}
