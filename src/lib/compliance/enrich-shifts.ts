import { prisma } from "@/lib/prisma";
import { getOrCreateComplianceSettings } from "./validate-shift";
import {
  checkMinorShiftCompliance,
  shiftDurationHours,
  weekBoundsForDate,
  type ComplianceSettingsLike,
} from "./minor-labor";

type ShiftRow = {
  id: string;
  staffMemberId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  staffMember?: { dateOfBirth: Date | null; name: string } | null;
};

export async function enrichShiftsWithCompliance(
  locationId: string,
  shifts: ShiftRow[]
) {
  const settings = await getOrCreateComplianceSettings(locationId);
  const settingsLike = settings as ComplianceSettingsLike;

  const weekHoursCache = new Map<string, number>();

  const getWeekHours = async (staffId: string, date: Date, excludeId: string) => {
    const key = `${staffId}:${date.toISOString().slice(0, 10)}`;
    if (!weekHoursCache.has(key)) {
      const { start, end } = weekBoundsForDate(date);
      const weekShifts = await prisma.shift.findMany({
        where: {
          locationId,
          staffMemberId: staffId,
          date: { gte: start, lte: end },
          id: { not: excludeId },
        },
      });
      weekHoursCache.set(
        key,
        weekShifts.reduce((sum, s) => sum + shiftDurationHours(s.startTime, s.endTime), 0)
      );
    }
    return weekHoursCache.get(key) ?? 0;
  };

  const results: Record<string, { violations: ReturnType<typeof checkMinorShiftCompliance> }> = {};

  for (const shift of shifts) {
    if (!shift.staffMemberId) continue;
    const staff =
      shift.staffMember ??
      (await prisma.staffMember.findUnique({
        where: { id: shift.staffMemberId },
        select: { dateOfBirth: true, name: true },
      }));
    if (!staff) continue;

    const existingWeekHours = await getWeekHours(shift.staffMemberId, shift.date, shift.id);
    const violations = checkMinorShiftCompliance({
      dateOfBirth: staff.dateOfBirth,
      shiftDate: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      settings: settingsLike,
      existingWeekHours,
    });
    if (violations.length) {
      results[shift.id] = { violations };
    }
  }

  return results;
}
