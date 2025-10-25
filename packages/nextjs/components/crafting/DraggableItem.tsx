"use client";

import React from "react";
import type { MinecraftItem } from "../../services/store/inventoryStore";
import { useDraggable } from "@dnd-kit/core";

interface DraggableItemProps {
  item: MinecraftItem;
  quantity: number;
  id?: string;
  isDragging?: boolean;
  source?: "inventory" | "crafting";
  position?: { row: number; col: number };
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  quantity,
  id,
  isDragging = false,
  source = "inventory",
  position,
}) => {
  const dragId = id || `${source}-${item.id}-${position?.row ?? 0}-${position?.col ?? 0}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: dragId,
    data: {
      item,
      quantity,
      source,
      position,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex h-16 w-16 cursor-grab items-center justify-center rounded-lg border-2 border-stone-600 bg-stone-700 transition-all duration-200 hover:border-stone-400 active:cursor-grabbing ${isCurrentlyDragging || isDragging ? "z-50 scale-110 opacity-50" : ""} ${isDragging ? "shadow-2xl" : "shadow-lg"} `}
    >
      {/* Item Image */}
      <img src={item.image} alt={item.name} className="pixelated h-12 w-12 object-contain" draggable={false} />

      {/* Quantity Badge */}
      {quantity > 1 && (
        <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border border-yellow-600 bg-yellow-500 text-xs font-bold text-black">
          {quantity}
        </div>
      )}

      {/* Item Name Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 hover:opacity-100">
        {item.name}
        {quantity > 1 && ` (${quantity})`}
      </div>
    </div>
  );
};
