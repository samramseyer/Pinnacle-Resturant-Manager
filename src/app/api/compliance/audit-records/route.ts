import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_compliance");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 90 * 86400000);
  const to = toParam ? new Date(toParam) : new Date();
  to.setHours(23, 59, 59, 999);

  const [shifts, timeEntries, payrollRuns, activityLogs] = await Promise.all([
    prisma.shift.findMany({
      where: { locationId, date: { gte: from, lte: to } },
      include: { staffMember: { select: { name: true, role: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.timeEntry.findMany({
      where: { locationId, clockInAt: { gte: from, lte: to } },
      include: { staffMember: { select: { name: true } } },
      orderBy: { clockInAt: "asc" },
    }),
    prisma.payrollRun.findMany({
      where: {
        locationId,
        createdAt: { gte: from, lte: to },
      },
      include: {
        payPeriod: true,
        lineItems: { include: { staffMember: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.findMany({
      where: {
        locationId,
        createdAt: { gte: from, lte: to },
        entity: { in: ["shift", "incident", "payroll"] },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    summary: {
      shifts: shifts.length,
      timecards: timeEntries.length,
      payrollRuns: payrollRuns.length,
      activityLogs: activityLogs.length,
    },
    shifts: shifts.map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      startTime: s.startTime,
      endTime: s.endTime,
      staffName: s.staffMember?.name,
      staffRole: s.staffMember?.role,
      workRole: s.workRole,
      createdAt: s.createdAt.toISOString(),
    })),
    timecards: timeEntries.map((t) => ({
      id: t.id,
      staffName: t.staffMember.name,
      clockInAt: t.clockInAt.toISOString(),
      clockOutAt: t.clockOutAt?.toISOString() ?? null,
      geoVerifiedIn: t.geoVerifiedIn,
      geoVerifiedOut: t.geoVerifiedOut,
      mealBreakTaken: t.mealBreakTaken,
      restBreakTaken: t.restBreakTaken,
      breakAttestedAt: t.breakAttestedAt?.toISOString() ?? null,
    })),
    payrollRuns: payrollRuns.map((r) => ({
      id: r.id,
      status: r.status,
      periodStart: r.payPeriod.startDate.toISOString(),
      periodEnd: r.payPeriod.endDate.toISOString(),
      finalizedAt: r.finalizedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      lineItems: r.lineItems.map((li) => ({
        staffName: li.staffMember.name,
        regularHours: li.regularHours,
        overtimeHours: li.overtimeHours,
        grossPay: li.grossPay,
        netPay: li.netPay,
      })),
    })),
    activityLogs: activityLogs.map((a) => ({
      action: a.action,
      entity: a.entity,
      details: a.details,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
