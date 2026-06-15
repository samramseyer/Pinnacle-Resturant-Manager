import { differenceInYears, getDay, startOfWeek, endOfWeek } from "date-fns";

export type ComplianceSettingsLike = {
  minorBlockScheduling: boolean;
  minorSchoolNightEndHour: number;
  minorSchoolNightDays: string;
  minorMaxWeeklyHoursSchool: number;
  minorMaxDailyHoursSchool: number;
  schoolCalendarActive: boolean;
};

export type MinorViolation = {
  code: string;
  message: string;
  severity: "block" | "warn";
};

export function parseSchoolNightDays(value: string): number[] {
  return value
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !Number.isNaN(d));
}

export function getAge(dateOfBirth: Date, onDate = new Date()): number {
  return differenceInYears(onDate, dateOfBirth);
}

export function isMinor(dateOfBirth: Date | null | undefined, onDate = new Date()): boolean {
  if (!dateOfBirth) return false;
  return getAge(dateOfBirth, onDate) < 18;
}

export function isSchoolNight(shiftDate: Date, settings: ComplianceSettingsLike): boolean {
  if (!settings.schoolCalendarActive) return false;
  const days = parseSchoolNightDays(settings.minorSchoolNightDays);
  return days.includes(getDay(shiftDate));
}

export function shiftDurationHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
}

export function checkMinorShiftCompliance(params: {
  dateOfBirth: Date | null | undefined;
  shiftDate: Date;
  startTime: string;
  endTime: string;
  settings: ComplianceSettingsLike;
  existingWeekHours?: number;
}): MinorViolation[] {
  const { dateOfBirth, shiftDate, startTime, endTime, settings, existingWeekHours = 0 } = params;
  if (!isMinor(dateOfBirth, shiftDate)) return [];

  const violations: MinorViolation[] = [];
  const duration = shiftDurationHours(startTime, endTime);
  const schoolNight = isSchoolNight(shiftDate, settings);

  if (schoolNight) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60;
    const curfewMins = settings.minorSchoolNightEndHour * 60;

    if (endMins > curfewMins) {
      violations.push({
        code: "SCHOOL_NIGHT_CURFEW",
        severity: settings.minorBlockScheduling ? "block" : "warn",
        message: `Minor cannot work past ${formatHour(settings.minorSchoolNightEndHour)} on school nights (shift ends ${endTime}).`,
      });
    }

    if (duration > settings.minorMaxDailyHoursSchool) {
      violations.push({
        code: "DAILY_HOURS",
        severity: settings.minorBlockScheduling ? "block" : "warn",
        message: `Shift is ${duration.toFixed(1)}h — max ${settings.minorMaxDailyHoursSchool}h per day during school weeks.`,
      });
    }

    const weekTotal = existingWeekHours + duration;
    if (weekTotal > settings.minorMaxWeeklyHoursSchool) {
      violations.push({
        code: "WEEKLY_HOURS",
        severity: settings.minorBlockScheduling ? "block" : "warn",
        message: `Would total ${weekTotal.toFixed(1)}h this week — max ${settings.minorMaxWeeklyHoursSchool}h for minors during school.`,
      });
    }
  }

  return violations;
}

function formatHour(h: number): string {
  const hour = h % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

export function weekBoundsForDate(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export const INCIDENT_CATEGORIES = {
  WORKPLACE_INJURY: [
    { value: "burn", label: "Burn / scald" },
    { value: "cut", label: "Cut / laceration" },
    { value: "slip_fall", label: "Slip or fall" },
    { value: "strain", label: "Strain / sprain" },
    { value: "chemical", label: "Chemical exposure" },
    { value: "other_injury", label: "Other injury" },
  ],
  GUEST_INCIDENT: [
    { value: "slip_fall", label: "Guest slip or fall" },
    { value: "allergen", label: "Allergen reaction" },
    { value: "illness", label: "Illness" },
    { value: "altercation", label: "Altercation" },
    { value: "property", label: "Property damage" },
    { value: "other_guest", label: "Other guest incident" },
  ],
  NEAR_MISS: [
    { value: "near_miss", label: "Near miss" },
    { value: "unsafe_condition", label: "Unsafe condition" },
  ],
} as const;
