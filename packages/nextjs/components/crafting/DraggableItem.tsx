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
      {...(isDragging ? {} : listeners)}
      {...(isDragging ? {} : attributes)}
      className={`group relative flex h-16 w-16 items-center justify-center rounded-sm transition-colors hover:border-emerald-500 ${
        isDragging ? "pointer-events-none z-50 scale-110" : "cursor-grab active:cursor-grabbing"
      } ${isCurrentlyDragging ? "opacity-0" : ""}`}
    >
      {/* Item Image */}
      <img src={item.image} alt={item.name} className="h-12 w-12 object-contain p-2" draggable={false} />

      {/* Quantity Badge */}
      {quantity > 1 && (
        <span className="pointer-events-none absolute right-1 bottom-1 rounded-sm bg-neutral-800/90 px-1 text-xs text-emerald-300">
          {quantity}
        </span>
      )}

      {/* Item Name Tooltip */}
      <div className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-sm border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] whitespace-pre text-neutral-200 shadow-[2px_2px_0_rgba(0,0,0,0.5)] group-hover:block">
        {item.name}
        {quantity > 1 && ` (${quantity})`}
      </div>
    </div>
  );
};
