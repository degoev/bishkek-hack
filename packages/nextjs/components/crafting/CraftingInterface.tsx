"use client";

import React from "react";
import { useCraftingStore } from "../../services/store/inventoryStore";
import type { MinecraftItem } from "../../services/store/inventoryStore";
import { CraftingGrid } from "./CraftingGrid";
import { CraftingResult } from "./CraftingResult";
import { DraggableItem } from "./DraggableItem";
import { InventoryPanel } from "./InventoryPanel";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";

export const CraftingInterface: React.FC = () => {
  const [activeItem, setActiveItem] = React.useState<MinecraftItem | null>(null);
  const { craftItem, clearCraftingGrid } = useCraftingStore();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const itemData = active.data.current;
    if (itemData?.item) {
      setActiveItem(itemData.item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || !active.data.current) return;

    const { item, source, position } = active.data.current;
    const { setCraftingSlot, removeFromInventory, addToInventory, craftingGrid } = useCraftingStore.getState();

    // Handle dropping on crafting grid
    if (over.id.toString().startsWith("crafting-")) {
      const [, row, col] = over.id.toString().split("-").map(Number);

      if (source === "inventory") {
        // Moving from inventory to crafting grid
        if (removeFromInventory(item.id, 1)) {
          setCraftingSlot(row, col, { item, quantity: 1 });
        }
      } else if (source === "crafting" && position) {
        // Moving within crafting grid
        const sourceSlot = craftingGrid[position.row][position.col];
        if (sourceSlot) {
          setCraftingSlot(position.row, position.col, null);
          setCraftingSlot(row, col, sourceSlot);
        }
      }
    }

    // Handle dropping back to inventory (from crafting grid)
    if (over.id === "inventory" && source === "crafting" && position) {
      const sourceSlot = craftingGrid[position.row][position.col];
      if (sourceSlot) {
        setCraftingSlot(position.row, position.col, null);
        addToInventory(sourceSlot.item!, sourceSlot.quantity);
      }
    }
  };

  const handleCraft = () => {
    craftItem();
  };

  const handleClear = () => {
    clearCraftingGrid();
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex min-h-screen flex-col gap-8 bg-gradient-to-b from-amber-50 to-amber-100 p-6 lg:flex-row">
        {/* Crafting Table Section */}
        <div className="flex flex-col items-center space-y-6">
          <h1 className="mb-4 text-3xl font-bold text-amber-900">Minecraft Crafting Table</h1>

          <div className="rounded-lg border-4 border-amber-900 bg-amber-800 p-6 shadow-2xl">
            <div className="flex items-center gap-6">
              {/* 3x3 Crafting Grid */}
              <div className="flex flex-col items-center">
                <h2 className="mb-2 text-lg font-semibold text-amber-100">Crafting Grid</h2>
                <CraftingGrid />
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <svg className="h-8 w-8 text-amber-200" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Result Slot */}
              <div className="flex flex-col items-center">
                <h2 className="mb-2 text-lg font-semibold text-amber-100">Result</h2>
                <CraftingResult />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={handleCraft}
                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-green-700"
              >
                Craft Item
              </button>
              <button
                onClick={handleClear}
                className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-red-700"
              >
                Clear Grid
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="flex-1">
          <InventoryPanel />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>{activeItem ? <DraggableItem item={activeItem} quantity={1} isDragging /> : null}</DragOverlay>
    </DndContext>
  );
};
