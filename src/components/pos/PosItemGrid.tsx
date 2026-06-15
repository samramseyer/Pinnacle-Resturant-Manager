"use client";

import { cn } from "@/lib/utils";
import { resolveItemColor } from "@/lib/pos/colors";
import { formatCurrency } from "@/lib/utils";

export interface PosMenuItem {
  id: string;
  name: string;
  price: number;
  basePrice?: number;
  category: string;
  posColor?: string | null;
  posGridIndex?: number | null;
  imageUrl?: string | null;
  available?: boolean;
  stockCount?: number | null;
  eightySixed?: boolean;
  happyHour?: boolean;
}

interface PosItemGridProps {
  items: PosMenuItem[];
  categoryStyles: Record<string, { color: string; icon?: string | null }>;
  activeCategory: string | null;
  onSelect: (item: PosMenuItem) => void;
  selectedId?: string | null;
  layoutEdit?: boolean;
  onReorder?: (items: PosMenuItem[]) => void;
}

export function PosItemGrid({
  items,
  categoryStyles,
  activeCategory,
  onSelect,
  selectedId,
  layoutEdit,
  onReorder,
}: PosItemGridProps) {
  const filtered =
    activeCategory && activeCategory !== "All"
      ? items.filter((i) => i.category === activeCategory)
      : items;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!layoutEdit || !onReorder) return;
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(from) || from === targetIndex) return;
    const next = [...filtered];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    const reindexed = next.map((item, idx) => ({ ...item, posGridIndex: idx }));
    onReorder(reindexed);
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {filtered.map((item, index) => {
        const soldOut = item.available === false;
        const { color, icon } = resolveItemColor(item.category, item.posColor, categoryStyles);
        const displayColor = soldOut ? "#94a3b8" : color;

        return (
          <button
            key={item.id}
            type="button"
            disabled={soldOut && !layoutEdit}
            draggable={layoutEdit}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => layoutEdit && e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => !layoutEdit && !soldOut && onSelect(item)}
            className={cn(
              "relative flex min-h-[88px] flex-col justify-between rounded-xl border-2 p-2 text-left shadow-sm transition-transform",
              layoutEdit && "cursor-grab ring-2 ring-dashed ring-slate-300",
              soldOut && "cursor-not-allowed opacity-45 grayscale",
              !soldOut && !layoutEdit && "active:scale-95",
              selectedId === item.id && "ring-2 ring-offset-2 ring-orange-500"
            )}
            style={{
              backgroundColor: soldOut ? "#f1f5f9" : `${displayColor}18`,
              borderColor: soldOut ? "#cbd5e1" : displayColor,
            }}
          >
            {item.stockCount !== null && item.stockCount !== undefined && (
              <span
                className={cn(
                  "absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  item.stockCount <= 2
                    ? "bg-red-500 text-white"
                    : "bg-slate-800/80 text-white"
                )}
              >
                {item.stockCount} left
              </span>
            )}
            {soldOut && item.eightySixed && (
              <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                86
              </span>
            )}
            {soldOut && !item.eightySixed && item.stockCount === 0 && (
              <span className="absolute left-1 top-1 rounded bg-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                OUT
              </span>
            )}
            <div className="flex items-start justify-between gap-1">
              <span className="text-lg leading-none" aria-hidden>
                {icon}
              </span>
              <span className="text-right text-[10px] font-bold" style={{ color: displayColor }}>
                {formatCurrency(item.price)}
                {item.happyHour && item.basePrice && item.basePrice > item.price && (
                  <span className="block text-[9px] font-normal text-emerald-600 line-through opacity-80">
                    {formatCurrency(item.basePrice)}
                  </span>
                )}
              </span>
            </div>
            <span
              className={cn(
                "line-clamp-2 text-sm font-bold leading-tight",
                soldOut ? "text-slate-400" : "text-slate-900"
              )}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
