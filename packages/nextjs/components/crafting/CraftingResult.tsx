"use client";

import React from "react";
import { useCraftingStore } from "../../services/store/inventoryStore";

export const CraftingResult: React.FC = () => {
  const { resultSlot } = useCraftingStore();

  return (
    <div className="group relative flex h-20 w-20 items-center justify-center rounded-sm border-2 border-neutral-700 bg-neutral-900">
      {resultSlot ? (
        <div className="relative">
          {/* Item Image */}
          <img src={resultSlot.item!.image} alt={resultSlot.item!.name} className="h-16 w-16 object-contain p-2" />

          {/* Quantity Badge */}
          {resultSlot.quantity > 1 && (
            <span className="pointer-events-none absolute right-1 bottom-1 rounded-sm bg-neutral-800/90 px-1 text-xs text-emerald-300">
              {resultSlot.quantity}
            </span>
          )}

          {/* Item Name Tooltip */}
          <div className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-sm border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] whitespace-pre text-neutral-200 shadow-[2px_2px_0_rgba(0,0,0,0.5)] group-hover:block">
            {resultSlot.item!.name}
            {resultSlot.quantity > 1 && ` (${resultSlot.quantity})`}
          </div>
        </div>
      ) : (
        <div className="text-xs text-neutral-400">No Recipe</div>
      )}
    </div>
  );
};
