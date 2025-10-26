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
    <div>
      {/* Inventory Grid */}
      <div
        ref={setNodeRef}
        className={`grid grid-cols-6 gap-0 border-2 border-neutral-700 bg-neutral-900/60 ${
          isOver ? "border-emerald-500 bg-neutral-800" : ""
        }`}
      >
        {inventory.map((inventoryItem, index) => (
          <div
            key={`${inventoryItem.item.id}-${index}`}
            className="group relative aspect-square border-2 border-neutral-700 bg-neutral-900 transition-colors hover:border-emerald-500 hover:bg-neutral-800"
          >
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
            className="group relative aspect-square border-2 border-neutral-700 bg-neutral-900 transition-colors hover:border-emerald-500 hover:bg-neutral-800"
          />
        ))}
      </div>

      {/* Inventory Info */}
      <div className="mt-4 text-xs text-neutral-400">
        <p>Items: {inventory.length}/24</p>
        <p className="mt-1 opacity-75">Drag items to the crafting grid to create new items</p>
      </div>
    </div>
  );
};
