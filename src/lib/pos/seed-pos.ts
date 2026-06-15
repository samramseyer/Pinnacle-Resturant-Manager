import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORY_COLORS } from "@/lib/pos/colors";

export async function seedPosSample(locationId: string) {
  const existing = await prisma.modifierGroup.count({ where: { locationId } });
  if (existing > 0) return;

  for (const [category, style] of Object.entries(DEFAULT_CATEGORY_COLORS)) {
    await prisma.posCategoryStyle.upsert({
      where: { locationId_category: { locationId, category } },
      create: { locationId, category, color: style.color, icon: style.icon },
      update: { color: style.color, icon: style.icon },
    });
  }

  let ribeye = await prisma.menuItem.findFirst({
    where: { locationId, name: "Ribeye Steak" },
  });
  if (!ribeye) {
    ribeye = await prisma.menuItem.create({
      data: {
        locationId,
        name: "Ribeye Steak",
        description: "12oz USDA Choice",
        price: 38.99,
        category: "Entrees",
        posColor: "#b45309",
        posGridIndex: 0,
      },
    });
  }

  let burger = await prisma.menuItem.findFirst({
    where: { locationId, name: "Classic Burger" },
  });
  if (!burger) {
    burger = await prisma.menuItem.create({
      data: {
        locationId,
        name: "Classic Burger",
        description: "Angus patty, brioche bun",
        price: 17.99,
        category: "Burgers",
        posGridIndex: 1,
      },
    });
  }

  const baconBurger = await prisma.menuItem.findFirst({
    where: { locationId, name: "Bacon BBQ Burger" },
  });
  if (!baconBurger) {
    await prisma.menuItem.create({
      data: {
        locationId,
        name: "Bacon BBQ Burger",
        description: "Smoked bacon, BBQ sauce",
        price: 19.99,
        category: "Burgers",
        posGridIndex: 2,
      },
    });
  }

  const beerExisting = await prisma.menuItem.findFirst({ where: { locationId, name: "Draft Beer" } });
  if (!beerExisting) {
    await prisma.menuItem.create({
      data: {
        locationId,
        name: "Draft Beer",
        description: "Rotating tap",
        price: 7.99,
        category: "Beer",
        posGridIndex: 20,
      },
    });
  }

  const cocktail = await prisma.menuItem.findFirst({ where: { locationId, name: "House Cocktail" } });
  if (!cocktail) {
    await prisma.menuItem.create({
      data: {
        locationId,
        name: "House Cocktail",
        price: 13.99,
        category: "Cocktails",
        posGridIndex: 21,
      },
    });
  }

  const cookGroup = await prisma.modifierGroup.create({
    data: {
      locationId,
      name: "How would they like it cooked?",
      slug: "cook-temp",
      menuItemId: ribeye.id,
      required: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 0,
      options: {
        create: [
          { name: "Rare", sortOrder: 0, isDefault: false },
          { name: "Medium Rare", sortOrder: 1, isDefault: false },
          { name: "Medium", sortOrder: 2, isDefault: true },
          { name: "Medium Well", sortOrder: 3 },
          { name: "Well Done", sortOrder: 4 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      locationId,
      name: "Choose two sides",
      slug: "steak-sides",
      menuItemId: ribeye.id,
      required: true,
      minSelect: 2,
      maxSelect: 2,
      sortOrder: 1,
      options: {
        create: [
          { name: "Mashed Potatoes", sortOrder: 0, isDefault: true },
          { name: "Grilled Asparagus", sortOrder: 1, isDefault: true },
          { name: "Fries", sortOrder: 2 },
          { name: "Side Salad", sortOrder: 3 },
          { name: "Mac & Cheese", sortOrder: 4 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      locationId,
      name: "Burger extras",
      slug: "burger-extras",
      categories: "Burgers",
      required: false,
      minSelect: 0,
      maxSelect: 4,
      sortOrder: 0,
      options: {
        create: [
          { name: "No Onions", sortOrder: 0 },
          { name: "Extra Cheese", sortOrder: 1, priceDelta: 1.5 },
          { name: "Add Bacon", sortOrder: 2, priceDelta: 2.5 },
          { name: "Gluten-Free Bun", sortOrder: 3, priceDelta: 2 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      locationId,
      name: "Protein temp (global)",
      slug: "protein-temp",
      categories: "Entrees",
      required: false,
      minSelect: 0,
      maxSelect: 1,
      sortOrder: 10,
      options: {
        create: [
          { name: "Medium", sortOrder: 0, isDefault: true },
          { name: "Medium Well", sortOrder: 1 },
          { name: "Well Done", sortOrder: 2 },
        ],
      },
    },
  });

  void cookGroup;

  const items = await prisma.menuItem.findMany({ where: { locationId, posGridIndex: null } });
  let idx = 10;
  for (const item of items) {
    await prisma.menuItem.update({
      where: { id: item.id },
      data: { posGridIndex: idx++ },
    });
  }
}
