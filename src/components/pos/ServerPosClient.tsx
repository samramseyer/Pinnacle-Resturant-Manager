"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, GripVertical, LayoutGrid, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiPost } from "@/lib/api";
import { PosItemGrid, type PosMenuItem } from "@/components/pos/PosItemGrid";
import { ModifierWizard } from "@/components/pos/ModifierWizard";
import {
  resolveModifierGroupsForItem,
  shouldOpenModifierWizard,
  type ModifierGroupConfig,
} from "@/lib/pos/modifiers";
import { useMenuSync } from "@/hooks/useMenuSync";

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  tableId?: string | null;
  table?: { number: number } | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    modifierSummary?: string | null;
    kitchenStatus?: string;
    menuItem: { name: string };
  }[];
};

interface PosConfig {
  menuRevision: number;
  menuItems: PosMenuItem[];
  activeDayparts: { id: string; name: string; mode: string }[];
  modifierGroups: (ModifierGroupConfig & { categories: string | null; menuItemId: string | null })[];
  categoryStyles: { category: string; color: string; icon: string | null }[];
  tables: { id: string; number: number }[];
  openOrders: Order[];
}

export function ServerPosClient() {
  const { can } = useAuth();
  const canLayout = can("manage_menu");

  const [config, setConfig] = useState<PosConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [layoutEdit, setLayoutEdit] = useState(false);
  const [pendingItem, setPendingItem] = useState<PosMenuItem | null>(null);
  const [pendingGroups, setPendingGroups] = useState<ModifierGroupConfig[]>([]);
  const [tapCount, setTapCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/config");
      const data = await res.json();
      setConfig(data);
      if (!activeOrderId && data.openOrders?.length > 0) {
        setActiveOrderId(data.openOrders[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [activeOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  useMenuSync(config?.menuRevision, load, true);

  const daypartLabel =
    config?.activeDayparts?.map((d) => d.name).join(" · ") || null;

  const categoryStyleMap = useMemo(() => {
    const map: Record<string, { color: string; icon?: string | null }> = {};
    config?.categoryStyles.forEach((s) => {
      map[s.category] = { color: s.color, icon: s.icon };
    });
    return map;
  }, [config]);

  const categories = useMemo(() => {
    const cats = new Set(config?.menuItems.map((m) => m.category) ?? []);
    return ["All", ...Array.from(cats).sort()];
  }, [config]);

  const activeOrder = config?.openOrders.find((o) => o.id === activeOrderId) ?? null;

  const openOrCreateCheck = async (tableId: string | null) => {
    const existing = config?.openOrders.find((o) =>
      tableId ? o.tableId === tableId : !o.tableId
    );
    if (existing) {
      setActiveOrderId(existing.id);
      return existing.id;
    }
    const item = config?.menuItems[0];
    const order = await apiPost<Order>("/api/orders", {
      tableId,
      totalAmount: 0,
      guestCount: 2,
      channel: "dine-in",
      items: [],
    });
    setConfig((prev) =>
      prev
        ? { ...prev, openOrders: [order as Order, ...prev.openOrders] }
        : prev
    );
    setActiveOrderId(order.id);
    return order.id;
  };

  const addItemToCheck = async (
    item: PosMenuItem,
    extras?: { modifiers?: unknown[]; modifierSummary?: string; priceDelta?: number }
  ) => {
    let orderId = activeOrderId;
    if (!orderId) {
      orderId = await openOrCreateCheck(null);
    }
    const linePrice = item.price + (extras?.priceDelta ?? 0);
    const updated = await apiPost<Order>(`/api/orders/${orderId}/items`, {
      menuItemId: item.id,
      quantity: 1,
      price: linePrice,
      modifiers: extras?.modifiers,
      modifierSummary: extras?.modifierSummary,
      fireToKitchen: true,
    });
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        openOrders: prev.openOrders.map((o) => (o.id === orderId ? (updated as Order) : o)),
      };
    });
    setTapCount((c) => c + 1);
  };

  const handleItemTap = (item: PosMenuItem) => {
    const groups = resolveModifierGroupsForItem(item, config?.modifierGroups ?? []);
    if (shouldOpenModifierWizard(groups)) {
      setPendingItem(item);
      setPendingGroups(groups);
      setTapCount(1);
      return;
    }
    void addItemToCheck(item);
  };

  const handleModifierFire = (payload: {
    modifiers: unknown[];
    modifierSummary: string;
    price: number;
  }) => {
    if (!pendingItem) return;
    void addItemToCheck(pendingItem, payload);
    setPendingItem(null);
    setPendingGroups([]);
  };

  const handleFireAll = async () => {
    if (!activeOrderId) return;
    const updated = await apiPost<Order>(`/api/orders/${activeOrderId}/fire`, {});
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        openOrders: prev.openOrders.map((o) => (o.id === activeOrderId ? (updated as Order) : o)),
      };
    });
  };

  const saveLayout = async (items: PosMenuItem[]) => {
    await fetch("/api/pos/layout", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item, idx) => ({ id: item.id, posGridIndex: idx })),
      }),
    });
    setConfig((prev) => {
      if (!prev) return prev;
      const byId = Object.fromEntries(items.map((i, idx) => [i.id, idx]));
      return {
        ...prev,
        menuItems: [...prev.menuItems]
          .map((m) => ({ ...m, posGridIndex: byId[m.id] ?? m.posGridIndex }))
          .sort((a, b) => (a.posGridIndex ?? 0) - (b.posGridIndex ?? 0)),
      };
    });
  };

  if (loading && !config) {
    return <p className="py-12 text-center text-slate-500">Loading POS…</p>;
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      {/* Ticket column */}
      <aside className="w-full shrink-0 rounded-xl border bg-white lg:w-72">
        <div className="border-b px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active check</p>
          <p className="font-bold text-slate-900">
            {activeOrder?.table ? `Table ${activeOrder.table.number}` : "Walk-in / Bar"}
          </p>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b p-2">
          {config?.tables.map((t) => {
            const order = config.openOrders.find((o) => o.tableId === t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (order) setActiveOrderId(order.id);
                  else void openOrCreateCheck(t.id);
                }}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold",
                  activeOrder?.table?.number === t.number
                    ? "bg-orange-500 text-white"
                    : order
                      ? "bg-amber-100 text-amber-900"
                      : "bg-slate-100 text-slate-600"
                )}
              >
                T{t.number}
              </button>
            );
          })}
        </div>
        <ul className="max-h-64 space-y-2 overflow-y-auto p-3 lg:max-h-[50vh]">
          {activeOrder?.items.length ? (
            activeOrder.items.map((line) => (
              <li key={line.id} className="rounded-lg bg-slate-50 px-2 py-1.5 text-sm">
                <div className="flex justify-between font-medium">
                  <span>{line.menuItem.name}</span>
                  <span>{formatCurrency(line.price)}</span>
                </div>
                {line.modifierSummary && (
                  <p className="text-xs text-slate-500">{line.modifierSummary}</p>
                )}
                <p className="text-[10px] uppercase text-slate-400">
                  {line.kitchenStatus === "FIRED" ? "✓ Kitchen" : "Pending fire"}
                </p>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-400">Tap an item to start — 3-tap rule enabled</li>
          )}
        </ul>
        {activeOrder && (
          <div className="border-t p-3">
            <p className="text-lg font-bold">{formatCurrency(activeOrder.totalAmount)}</p>
            <Button size="sm" className="mt-2 w-full" onClick={handleFireAll}>
              <Flame className="h-4 w-4" />
              Fire pending
            </Button>
          </div>
        )}
        <div className="border-t p-2 text-center">
          <Link href="/orders" className="text-xs text-slate-500 hover:text-orange-600">
            Full order list →
          </Link>
        </div>
      </aside>

      {/* Menu grid */}
      <div className="flex-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            {daypartLabel && (
              <p className="mb-1 text-xs font-medium text-orange-700">{daypartLabel}</p>
            )}
            <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  activeCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {cat}
              </button>
            ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {canLayout && (
              <Button
                variant={layoutEdit ? "primary" : "secondary"}
                size="sm"
                onClick={() => setLayoutEdit(!layoutEdit)}
              >
                <GripVertical className="h-4 w-4" />
                {layoutEdit ? "Done layout" : "Edit layout"}
              </Button>
            )}
          </div>
        </div>

        {layoutEdit && (
          <p className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <LayoutGrid className="h-3 w-3" />
            Drag buttons to reorder. Colors follow category styles (beer = green, cocktails = pink).
          </p>
        )}

        <PosItemGrid
          items={config?.menuItems ?? []}
          categoryStyles={categoryStyleMap}
          activeCategory={activeCategory}
          onSelect={handleItemTap}
          layoutEdit={layoutEdit}
          onReorder={saveLayout}
        />

        <p className="mt-4 text-center text-xs text-slate-400">
          Forced modifiers open step-by-step (cook temp → sides). Category extras apply to all burgers.
          {tapCount > 0 && ` · Last send: ${tapCount} tap${tapCount > 1 ? "s" : ""}`}
        </p>
      </div>

      <ModifierWizard
        open={!!pendingItem}
        itemName={pendingItem?.name ?? ""}
        groups={pendingGroups}
        onClose={() => {
          setPendingItem(null);
          setPendingGroups([]);
        }}
        onFire={handleModifierFire}
      />
    </div>
  );
}
