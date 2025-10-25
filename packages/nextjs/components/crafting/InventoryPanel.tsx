"use client";

import React from "react";
import { useCraftingStore } from "../../services/store/inventoryStore";
import { DraggableItem } from "./DraggableItem";
import { useDroppable } from "@dnd-kit/core";

export const InventoryPanel: React.FC = () => {
  const { inventory } = useCraftingStore();

  const { isOver, setNodeRef } = useDroppable({
    id: "inventory",
    data: {
      type: "inventory",
    },
  });

  return (
    <div className="rounded-lg border-4 border-amber-900 bg-amber-800 p-6 shadow-2xl">
      <h2 className="mb-4 text-2xl font-bold text-amber-100">Inventory</h2>

      <div
        ref={setNodeRef}
        className={`grid max-h-96 grid-cols-4 gap-3 overflow-y-auto rounded-lg border-2 border-stone-700 bg-stone-800 p-4 transition-all duration-200 sm:grid-cols-6 md:grid-cols-8 ${
          isOver ? "border-yellow-400 bg-stone-700" : ""
        }`}
      >
        {inventory.map((inventoryItem, index) => (
          <div key={`${inventoryItem.item.id}-${index}`} className="flex justify-center">
            <DraggableItem
              item={inventoryItem.item}
              quantity={inventoryItem.quantity}
              id={`inventory-${inventoryItem.item.id}-${index}`}
              source="inventory"
            />
          </div>
        ))}

        {/* Empty slots for visual consistency */}
        {Array.from({ length: Math.max(0, 24 - inventory.length) }, (_, index) => (
          <div
            key={`empty-${index}`}
            className="h-16 w-16 rounded-lg border-2 border-stone-600 bg-stone-700 opacity-50"
          />
        ))}
      </div>

      {/* Inventory Info */}
      <div className="mt-4 text-sm text-amber-200">
        <p>Items: {inventory.length}/24</p>
        <p className="mt-1 text-xs opacity-75">Drag items to the crafting grid to create new items</p>
      </div>
    </div>
  );
};
