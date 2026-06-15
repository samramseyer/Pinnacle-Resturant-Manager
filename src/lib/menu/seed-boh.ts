import { prisma } from "@/lib/prisma";

export async function seedBohSample(locationId: string) {
  const existing = await prisma.menuScheduleRule.count({ where: { locationId } });
  if (existing > 0) return;

  let salmon = await prisma.menuItem.findFirst({
    where: { locationId, name: { contains: "Salmon" } },
  });
  if (!salmon) {
    salmon = await prisma.menuItem.create({
      data: {
        locationId,
        name: "Grilled Salmon",
        description: "Daily catch",
        price: 28.99,
        category: "Entrees",
        posGridIndex: 3,
      },
    });
  }

  let primeRib = await prisma.menuItem.findFirst({
    where: { locationId, name: { contains: "Prime Rib" } },
  });
  if (!primeRib) {
    primeRib = await prisma.menuItem.create({
      data: {
        locationId,
        name: "Prime Rib",
        description: "12oz slow-roasted",
        price: 42.99,
        category: "Entrees",
        stockCount: 6,
        posGridIndex: 4,
      },
    });
  } else if (primeRib.stockCount === null) {
    await prisma.menuItem.update({
      where: { id: primeRib.id },
      data: { stockCount: 6 },
    });
  }

  const breakfastItems = ["Buttermilk Pancakes", "Avocado Toast", "Breakfast Burrito"];
  for (const [idx, name] of breakfastItems.entries()) {
    const found = await prisma.menuItem.findFirst({ where: { locationId, name } });
    if (!found) {
      await prisma.menuItem.create({
        data: {
          locationId,
          name,
          price: 12.99 + idx * 2,
          category: "Breakfast",
          posGridIndex: 30 + idx,
        },
      });
    }
  }

  await prisma.menuScheduleRule.createMany({
    data: [
      {
        locationId,
        name: "Breakfast",
        mode: "SHOW_CATEGORIES",
        categories: "Breakfast",
        daysOfWeek: "0,1,2,3,4,5,6",
        startTime: "07:00",
        endTime: "11:00",
        sortOrder: 0,
      },
      {
        locationId,
        name: "Lunch & Dinner",
        mode: "HIDE_CATEGORIES",
        categories: "Breakfast",
        daysOfWeek: "0,1,2,3,4,5,6",
        startTime: "11:00",
        endTime: "22:00",
        sortOrder: 1,
      },
      {
        locationId,
        name: "Happy Hour",
        mode: "HAPPY_HOUR",
        categories: "Cocktails,Beer",
        daysOfWeek: "1,2,3,4,5",
        startTime: "16:00",
        endTime: "18:00",
        priceMultiplier: 0.8,
        sortOrder: 2,
      },
    ],
  });

  await prisma.location.update({
    where: { id: locationId },
    data: { menuRevision: { increment: 1 } },
  });
}
