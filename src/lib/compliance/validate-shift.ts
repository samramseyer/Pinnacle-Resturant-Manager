import { prisma } from "@/lib/prisma";
import {
  checkMinorShiftCompliance,
  shiftDurationHours,
  weekBoundsForDate,
  type ComplianceSettingsLike,
  type MinorViolation,
} from "./minor-labor";

export async function getOrCreateComplianceSettings(locationId: string) {
  return prisma.complianceSettings.upsert({
    where: { locationId },
    create: { locationId },
    update: {},
  });
}

export async function minorWeekHours(
  locationId: string,
  staffMemberId: string,
  shiftDate: Date,
  excludeShiftId?: string
): Promise<number> {
  const { start, end } = weekBoundsForDate(shiftDate);
  const shifts = await prisma.shift.findMany({
    where: {
      locationId,
      staffMemberId,
      date: { gte: start, lte: end },
      ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
    },
  });
  return shifts.reduce((sum, s) => sum + shiftDurationHours(s.startTime, s.endTime), 0);
}

export async function validateShiftForMinor(params: {
  locationId: string;
  staffMemberId: string;
  shiftDate: Date;
  startTime: string;
  endTime: string;
  excludeShiftId?: string;
  complianceOverride?: boolean;
}): Promise<{ violations: MinorViolation[]; blocked: boolean }> {
  const settings = await getOrCreateComplianceSettings(params.locationId);
  const staff = await prisma.staffMember.findFirst({
    where: { id: params.staffMemberId, locationId: params.locationId },
  });
  if (!staff) {
    return { violations: [], blocked: false };
  }

  const existingWeekHours = await minorWeekHours(
    params.locationId,
    params.staffMemberId,
    params.shiftDate,
    params.excludeShiftId
  );

  const violations = checkMinorShiftCompliance({
    dateOfBirth: staff.dateOfBirth,
    shiftDate: params.shiftDate,
    startTime: params.startTime,
    endTime: params.endTime,
    settings: settings as ComplianceSettingsLike,
    existingWeekHours,
  });

  if (params.complianceOverride) {
    return { violations, blocked: false };
  }

  const blocked = violations.some((v) => v.severity === "block");
  return { violations, blocked };
}

export function violationsToError(violations: MinorViolation[]): string {
  return violations.map((v) => v.message).join(" ");
}
