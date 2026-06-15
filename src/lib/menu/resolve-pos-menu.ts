import { prisma } from "@/lib/prisma";
import { resolveMenuForTime, type ResolvedMenuItem } from "@/lib/menu/dayparts";

export async function getPosMenuBundle(locationId: string) {
  const [location, menuItems, scheduleRules, modifierGroups, categoryStyles, tables, openOrders] =
    await Promise.all([
      prisma.location.findUnique({
        where: { id: locationId },
        select: { menuRevision: true },
      }),
      prisma.menuItem.findMany({
        where: { locationId },
        orderBy: [{ posGridIndex: "asc" }, { name: "asc" }],
      }),
      prisma.menuScheduleRule.findMany({
        where: { locationId, active: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.modifierGroup.findMany({
        where: { locationId },
        include: { options: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.posCategoryStyle.findMany({ where: { locationId } }),
      prisma.table.findMany({ where: { locationId }, orderBy: { number: "asc" } }),
      prisma.order.findMany({
        where: {
          locationId,
          status: { notIn: ["PAID", "CANCELLED"] },
          checkStatus: { not: "CLOSED" },
        },
        include: {
          table: true,
          items: { include: { menuItem: { select: { name: true } } } },
          payments: true,
          checks: { include: { items: { include: { menuItem: { select: { name: true } } } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
    ]);

  const { items: resolved, activeRules } = resolveMenuForTime(menuItems, scheduleRules);

  const posMenuItems = resolved.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.effectivePrice,
    basePrice: item.price,
    category: item.category,
    posColor: menuItems.find((m) => m.id === item.id)?.posColor ?? null,
    posGridIndex: menuItems.find((m) => m.id === item.id)?.posGridIndex ?? null,
    imageUrl: menuItems.find((m) => m.id === item.id)?.imageUrl ?? null,
    available: item.posAvailable,
    stockCount: item.stockRemaining,
    eightySixed: item.eightySixed,
    happyHour: item.happyHour,
  }));

  return {
    menuRevision: location?.menuRevision ?? 0,
    menuItems: posMenuItems,
    resolvedMenu: resolved,
    activeDayparts: activeRules.map((r) => ({ id: r.id, name: r.name, mode: r.mode })),
    modifierGroups,
    categoryStyles,
    tables,
    openOrders,
  };
}

export type PosMenuItemDto = Awaited<ReturnType<typeof getPosMenuBundle>>["menuItems"][number];
