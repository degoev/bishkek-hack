"use client";

import React from "react";
import { useCraftingStore } from "../../services/store/inventoryStore";

export const CraftingResult: React.FC = () => {
  const { resultSlot } = useCraftingStore();

  return (
    <div className="relative flex h-20 w-20 items-center justify-center rounded-lg border-2 border-stone-500 bg-stone-300">
      {resultSlot ? (
        <div className="relative">
          {/* Item Image */}
          <img
            src={resultSlot.item!.image}
            alt={resultSlot.item!.name}
            className="pixelated h-16 w-16 object-contain"
          />

          {/* Quantity Badge */}
          {resultSlot.quantity > 1 && (
            <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border border-yellow-600 bg-yellow-500 text-xs font-bold text-black">
              {resultSlot.quantity}
            </div>
          )}

          {/* Item Name Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 hover:opacity-100">
            {resultSlot.item!.name}
            {resultSlot.quantity > 1 && ` (${resultSlot.quantity})`}
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-stone-500">No Recipe</div>
      )}
    </div>
  );
};
