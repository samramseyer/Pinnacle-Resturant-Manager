import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { validateShiftForMinor, violationsToError } from "@/lib/compliance/validate-shift";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(request, "manage_schedule");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.shift.findUnique({
    where: { id },
    include: { staffMember: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Shift not found" }, { status: 404 });
  }

  const staffMemberId = body.staffMemberId ?? existing.staffMemberId;
  const shiftDate = body.date ? new Date(body.date) : existing.date;
  const startTime = body.startTime ?? existing.startTime;
  const endTime = body.endTime ?? existing.endTime;

  if (staffMemberId) {
    const { violations, blocked } = await validateShiftForMinor({
      locationId: existing.locationId,
      staffMemberId,
      shiftDate,
      startTime,
      endTime,
      excludeShiftId: id,
      complianceOverride: Boolean(body.complianceOverride),
    });

    if (blocked) {
      return NextResponse.json(
        { error: violationsToError(violations), violations, code: "MINOR_LABOR_BLOCK" },
        { status: 422 }
      );
    }
  }

  const shift = await prisma.shift.update({
    where: { id },
    data: {
      staffMemberId: body.staffMemberId,
      date: body.date ? new Date(body.date) : undefined,
      startTime: body.startTime,
      endTime: body.endTime,
      workRole: body.workRole !== undefined ? body.workRole || null : undefined,
      notes: body.notes,
    },
    include: { staffMember: true },
  });

  return NextResponse.json({ ...shift, date: shift.date.toISOString() });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission(request, "manage_schedule");
  if (error) return error;

  const { id } = await params;
  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
