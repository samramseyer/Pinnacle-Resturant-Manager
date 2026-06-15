import { prisma } from "@/lib/prisma";

export async function bumpMenuRevision(locationId: string) {
  await prisma.location.update({
    where: { id: locationId },
    data: { menuRevision: { increment: 1 } },
  });
}

export async function eightySixItem(locationId: string, menuItemId: string, restore = false) {
  const item = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: restore
      ? { available: true, eightySixedAt: null }
      : { available: false, eightySixedAt: new Date() },
  });
  await bumpMenuRevision(locationId);
  return item;
}

export async function setItemStockCount(
  locationId: string,
  menuItemId: string,
  stockCount: number | null
) {
  const existing = await prisma.menuItem.findFirst({
    where: { id: menuItemId, locationId },
  });
  if (!existing) return null;

  const count = stockCount === null ? null : Math.max(0, Math.floor(stockCount));
  const data: { stockCount: number | null; available?: boolean } = { stockCount: count };
  if (count === 0) {
    data.available = false;
  } else if (count !== null && count > 0 && !existing.eightySixedAt) {
    data.available = true;
  }

  const item = await prisma.menuItem.update({
    where: { id: menuItemId },
    data,
  });
  await bumpMenuRevision(locationId);
  return item;
}

export async function decrementMenuStock(
  locationId: string,
  menuItemId: string,
  quantity: number
) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, locationId },
  });
  if (!item || item.stockCount === null) return item;

  const next = Math.max(0, item.stockCount - quantity);
  const updated = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: {
      stockCount: next,
      ...(next === 0 ? { available: false } : {}),
    },
  });
  await bumpMenuRevision(locationId);
  return updated;
}
