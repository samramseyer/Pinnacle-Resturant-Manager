import { prisma } from "@/lib/prisma";
import { getLocationId } from "@/lib/location";
import { ORDER_INCLUDE } from "@/lib/orders";
import { PageHeader } from "@/components/ui";
import { OrdersClient } from "@/components/orders/OrdersClient";

import { getPosMenuBundle } from "@/lib/menu/resolve-pos-menu";

export default async function OrdersPage() {
  const locationId = await getLocationId();
  const [orders, menuBundle, tables] = await Promise.all([
    prisma.order.findMany({
      where: { locationId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getPosMenuBundle(locationId),
    prisma.table.findMany({ where: { locationId }, orderBy: { number: "asc" } }),
  ]);

  const menuItems = menuBundle.menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    available: item.available ?? true,
    posColor: item.posColor,
    posGridIndex: item.posGridIndex,
    stockCount: item.stockCount,
    eightySixed: item.eightySixed,
  }));

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Color-coded menu buttons for new orders and add-to-check — or use Server POS for rush service"
      />
      <OrdersClient
        initialOrders={orders}
        menuItems={menuItems}
        tables={tables}
        initialMenuRevision={menuBundle.menuRevision}
      />
    </div>
  );
}
