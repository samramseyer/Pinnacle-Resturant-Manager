import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocationIdFromRequest } from "@/lib/location";
import { getWeekStart, getWeekEnd } from "@/lib/schedule";
import { requirePermission } from "@/lib/api-auth";
import { enrichShiftsWithCompliance } from "@/lib/compliance/enrich-shifts";
import { validateShiftForMinor, violationsToError } from "@/lib/compliance/validate-shift";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_schedule");
  if (error) return error;
  const locationId = await getLocationIdFromRequest(request);
  const weekParam = request.nextUrl.searchParams.get("weekStart");

  const weekStart = weekParam ? new Date(weekParam) : getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  const shifts = await prisma.shift.findMany({
    where: {
      locationId,
      date: { gte: weekStart, lte: weekEnd },
    },
    include: { staffMember: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const compliance = await enrichShiftsWithCompliance(locationId, shifts);

  return NextResponse.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    shifts: shifts.map((s) => ({
      ...s,
      date: s.date.toISOString(),
      complianceWarnings: compliance[s.id]?.violations ?? [],
    })),
    minorViolations: Object.entries(compliance).flatMap(([shiftId, data]) =>
      data.violations.map((v) => ({ shiftId, ...v }))
    ),
  });
}

export async function POST(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_schedule");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const body = await request.json();

  const staff = await prisma.staffMember.findFirst({
    where: { id: body.staffMemberId, locationId },
  });
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  const shiftDate = new Date(body.date);
  const { violations, blocked } = await validateShiftForMinor({
    locationId,
    staffMemberId: body.staffMemberId,
    shiftDate,
    startTime: body.startTime,
    endTime: body.endTime,
    complianceOverride: Boolean(body.complianceOverride),
  });

  if (blocked) {
    return NextResponse.json(
      { error: violationsToError(violations), violations, code: "MINOR_LABOR_BLOCK" },
      { status: 422 }
    );
  }

  const shift = await prisma.shift.create({
    data: {
      locationId,
      staffMemberId: body.staffMemberId,
      date: shiftDate,
      startTime: body.startTime,
      endTime: body.endTime,
      workRole: body.workRole || null,
      notes: body.notes || null,
    },
    include: { staffMember: true },
  });

  await prisma.activityLog.create({
    data: {
      locationId,
      action: "CREATE",
      entity: "shift",
      entityId: shift.id,
      details: `Scheduled ${staff.name}: ${body.startTime}–${body.endTime}${
        violations.length ? ` (compliance warning: ${violationsToError(violations)})` : ""
      }`,
    },
  });

  return NextResponse.json({
    ...shift,
    date: shift.date.toISOString(),
    complianceWarnings: violations,
  });
}
