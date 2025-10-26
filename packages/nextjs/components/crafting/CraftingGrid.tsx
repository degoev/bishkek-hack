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
      className={`group relative flex h-16 w-16 items-center justify-center border-2 border-neutral-700 bg-neutral-900 transition-colors transition-transform hover:border-emerald-500 hover:bg-neutral-800 ${
        isOver
          ? "scale-[1.03] border-emerald-500 bg-neutral-800 shadow-[0_0_0_3px_rgba(16,185,129,0.2)] ring-2 ring-emerald-500"
          : ""
      }`}
    >
      {slot && <DraggableItem item={slot.item!} quantity={slot.quantity} source="crafting" position={{ row, col }} />}
    </div>
  );
};

export const CraftingGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-1 border-2 border-neutral-700 bg-neutral-900/60 p-2">
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 3 }, (_, col) => <CraftingSlot key={`${row}-${col}`} row={row} col={col} />),
      )}
    </div>
  );
};
