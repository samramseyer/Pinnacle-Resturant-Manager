import { prisma } from "@/lib/prisma";
import { getLocationId } from "@/lib/location";
import { PageHeader } from "@/components/ui";
import { MenuClient } from "@/components/menu/MenuClient";
import { ModifierSetsClient } from "@/components/pos/ModifierSetsClient";

export default async function MenuPage() {
  const locationId = await getLocationId();
  const items = await prisma.menuItem.findMany({
    where: { locationId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Menu"
        description="Menu items plus smart modifier sets — category-wide extras and item-specific forced prompts"
      />
      <MenuClient initialItems={items} />
      <ModifierSetsClient menuItems={items} />
    </div>
  );
}
