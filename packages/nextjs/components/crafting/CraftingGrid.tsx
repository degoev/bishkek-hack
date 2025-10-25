"use client";

import React from "react";
import { useCraftingStore } from "../../services/store/inventoryStore";
import { DraggableItem } from "./DraggableItem";
import { useDroppable } from "@dnd-kit/core";

interface CraftingSlotProps {
  row: number;
  col: number;
}

const CraftingSlot: React.FC<CraftingSlotProps> = ({ row, col }) => {
  const { craftingGrid } = useCraftingStore();
  const slot = craftingGrid[row][col];

  const { isOver, setNodeRef } = useDroppable({
    id: `crafting-${row}-${col}`,
    data: {
      type: "crafting-slot",
      row,
      col,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group relative flex h-16 w-16 items-center justify-center rounded-sm border-2 border-neutral-700 bg-neutral-900 transition-colors hover:border-emerald-500 hover:bg-neutral-800 ${
        isOver ? "border-emerald-500 bg-neutral-800" : ""
      }`}
    >
      {slot && <DraggableItem item={slot.item!} quantity={slot.quantity} source="crafting" position={{ row, col }} />}
    </div>
  );
};

export const CraftingGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-sm border-2 border-neutral-700 bg-neutral-900/60 p-2">
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 3 }, (_, col) => <CraftingSlot key={`${row}-${col}`} row={row} col={col} />),
      )}
    </div>
  );
};
