import type { MenuScheduleMode } from "@prisma/client";

export type MenuScheduleRuleInput = {
  id: string;
  name: string;
  mode: MenuScheduleMode;
  categories: string;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  priceMultiplier: number;
  active: boolean;
  sortOrder: number;
};

export type MenuItemForDaypart = {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  stockCount: number | null;
};

export type ResolvedMenuItem = MenuItemForDaypart & {
  effectivePrice: number;
  posAvailable: boolean;
  eightySixed: boolean;
  stockRemaining: number | null;
  happyHour: boolean;
};

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseDays(value: string): Set<number> {
  return new Set(
    value
      .split(",")
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !Number.isNaN(d) && d >= 0 && d <= 6)
  );
}

function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(":").map((p) => parseInt(p, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function isScheduleRuleActive(
  rule: Pick<MenuScheduleRuleInput, "daysOfWeek" | "startTime" | "endTime" | "active">,
  now: Date = new Date()
): boolean {
  if (!rule.active) return false;
  const days = parseDays(rule.daysOfWeek);
  if (!days.has(now.getDay())) return false;

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(rule.startTime);
  const end = parseTimeToMinutes(rule.endTime);

  if (start === end) return true;
  if (start < end) return nowMins >= start && nowMins < end;
  return nowMins >= start || nowMins < end;
}

export function getActiveScheduleRules(
  rules: MenuScheduleRuleInput[],
  now: Date = new Date()
): MenuScheduleRuleInput[] {
  return rules
    .filter((r) => isScheduleRuleActive(r, now))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isItemPosAvailable(item: MenuItemForDaypart): boolean {
  if (!item.available) return false;
  if (item.stockCount !== null && item.stockCount <= 0) return false;
  return true;
}

export function resolveMenuForTime(
  items: MenuItemForDaypart[],
  rules: MenuScheduleRuleInput[],
  now: Date = new Date()
): { items: ResolvedMenuItem[]; activeRules: MenuScheduleRuleInput[] } {
  const activeRules = getActiveScheduleRules(rules, now);
  const showRules = activeRules.filter((r) => r.mode === "SHOW_CATEGORIES");
  const hideRules = activeRules.filter((r) => r.mode === "HIDE_CATEGORIES");
  const happyRules = activeRules.filter((r) => r.mode === "HAPPY_HOUR");

  const hidden = new Set(hideRules.flatMap((r) => parseList(r.categories)));
  const showOnly =
    showRules.length > 0
      ? new Set(showRules.flatMap((r) => parseList(r.categories)))
      : null;

  const happyCats = new Set(happyRules.flatMap((r) => parseList(r.categories)));
  const happyMultiplier =
    happyRules.length > 0
      ? happyRules.reduce((m, r) => Math.min(m, r.priceMultiplier), 1)
      : 1;

  const resolved = items.map((item) => {
    let visible = true;
    if (showOnly && !showOnly.has(item.category)) visible = false;
    if (hidden.has(item.category)) visible = false;

    const inHappyHour =
      happyRules.length > 0 &&
      (happyCats.size === 0 || happyCats.has(item.category));
    const effectivePrice =
      inHappyHour && happyMultiplier < 1
        ? Math.round(item.price * happyMultiplier * 100) / 100
        : item.price;

    const posAvailable = visible && isItemPosAvailable(item);

    return {
      ...item,
      effectivePrice,
      posAvailable,
      eightySixed: !item.available,
      stockRemaining: item.stockCount,
      happyHour: inHappyHour && happyMultiplier < 1,
    };
  });

  return { items: resolved, activeRules };
}

export function formatActiveDaypartLabel(rules: MenuScheduleRuleInput[]): string | null {
  if (rules.length === 0) return null;
  return rules.map((r) => r.name).join(" · ");
}
