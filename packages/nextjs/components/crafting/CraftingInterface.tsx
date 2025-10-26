"use client";

import React, { useEffect } from "react";
import { useCraftingStore } from "../../services/store/inventoryStore";
import type { MinecraftItem } from "../../services/store/inventoryStore";
import { CraftingGrid } from "./CraftingGrid";
import { CraftingResult } from "./CraftingResult";
import { DraggableItem } from "./DraggableItem";
import { InventoryPanel } from "./InventoryPanel";
import { TransactionStatus } from "./TransactionStatus";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useMinecraftCrafting } from "~~/hooks/useMinecraftCrafting";
import { getRecipeFromPattern } from "~~/services/web3/recipeMapper";

export const CraftingInterface: React.FC = () => {
  const [activeItem, setActiveItem] = React.useState<MinecraftItem | null>(null);
  const { craftingGrid, clearCraftingGrid, inventory } = useCraftingStore();
  const { address, isConnected, connector } = useAccount();

  const { writeContractAsync: bridge } = useScaffoldWriteContract({ contractName: "MinecraftItems" });

  const bridgeItemsToGame = async () => {
    if (!address) {
      alert("Please connect your wallet to bridge items");
      return;
    }

    const swordsCount = inventory.find(({ item }) => item.id === "diamond_sword")?.quantity || 0;
    const pickaxesCount = inventory.find(({ item }) => item.id === "diamond_pickaxe")?.quantity || 0;

    const txHash = await bridge({
      functionName: "bridge",
      args: [
        [6n, 7n],
        [BigInt(swordsCount), BigInt(pickaxesCount)],
      ],
    });
  };

  useEffect(() => {
    if (isConnected) {
      console.log(`Connected to wallet with address: ${address} via ${connector?.name}`, connector);
    } else {
      console.log("Wallet not connected");
    }
  }, [isConnected, address, connector]);

  const { craftOnChain, isCrafting } = useMinecraftCrafting();

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

  const handleCraft = async () => {
    if (!address) {
      alert("Please connect your wallet to craft items");
      return;
    }

    // Get the output token ID from the crafting grid pattern
    const outputTokenId = getRecipeFromPattern(craftingGrid);

    if (!outputTokenId) {
      alert("Invalid recipe pattern - try a different arrangement");
      return;
    }

    try {
      // Call the smart contract to craft the item
      await craftOnChain(outputTokenId, 1n);
      // Clear the grid on success (handled by event listener)
      clearCraftingGrid();
    } catch (error) {
      console.error("Crafting failed:", error);
      // Error already handled by useMinecraftCrafting hook
    }
  };

  const handleClear = () => {
    const { craftingGrid, setCraftingSlot, addToInventory } = useCraftingStore.getState();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const slot = craftingGrid[i][j];
        if (slot && slot.item) {
          addToInventory(slot.item, slot.quantity);
          setCraftingSlot(i, j, null);
        }
      }
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex min-h-svh flex-col bg-gradient-to-b p-8">
        <h1 className="mx-4 border-2 border-neutral-700 bg-neutral-800/80 p-6 px-4 text-3xl shadow-[4px_4px_0_rgba(0,0,0,0.25)]">
          Onchain craft
        </h1>

        <div className="mx-auto flex w-full max-w-7xl grow gap-4 p-4 max-md:flex-col">
          {/* Left panel: Crafting table */}
          <div className="flex h-fit grow flex-col gap-4 border-2 border-neutral-700 bg-neutral-800/80 p-3 shadow-[4px_4px_0_rgba(0,0,0,0.25)]">
            <h2 className="text-sm tracking-wide text-emerald-300 uppercase">Crafting Table</h2>
            <div className="flex items-center gap-6 border-2 border-neutral-700 bg-neutral-900/60 p-3">
              {/* 3x3 Crafting Grid */}
              <div className="flex flex-col items-center">
                <h3 className="mb-2 text-xs font-semibold text-neutral-200 uppercase">Crafting Grid</h3>
                <CraftingGrid />
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <svg className="h-8 w-8 text-neutral-200" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Result Slot */}
              <div className="flex flex-col items-center">
                <h3 className="mb-2 text-xs font-semibold text-neutral-200 uppercase">Result</h3>
                <CraftingResult />
              </div>
            </div>
            {/* Action Buttons */}
            <button
              onClick={handleCraft}
              disabled={isCrafting || !address}
              className={`border-4 p-3 px-4 text-neutral-50 shadow-[3px_3px_0_rgba(0,0,0,0.6)] transition-colors ${
                isCrafting || !address
                  ? "cursor-not-allowed border-neutral-700 bg-neutral-600/60 opacity-60"
                  : "border-emerald-800 bg-emerald-600 hover:bg-emerald-500 active:translate-y-[1px]"
              }`}
            >
              {isCrafting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Crafting...
                </span>
              ) : !address ? (
                "Connect Wallet"
              ) : (
                "Craft Item"
              )}
            </button>

            <button onClick={bridgeItemsToGame}>BRIDGE</button>

            <button
              onClick={handleClear}
              disabled={isCrafting}
              className={`border-4 p-3 px-4 text-neutral-200 shadow-[3px_3px_0_rgba(0,0,0,0.6)] transition-colors ${
                isCrafting
                  ? "cursor-not-allowed border-neutral-700 bg-neutral-800 opacity-60"
                  : "border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
              }`}
            >
              Clear Grid
            </button>
          </div>

          {/* Right panel: Inventory */}
          <div className="flex h-fit grow flex-col gap-2 border-2 border-neutral-700 bg-neutral-800/80 p-4 shadow-[4px_4px_0_rgba(0,0,0,0.25)]">
            <h2 className="text-sm tracking-wide text-emerald-300 uppercase">Your inventory</h2>
            <InventoryPanel />
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>{activeItem ? <DraggableItem item={activeItem} quantity={1} isDragging /> : null}</DragOverlay>

      {/* Transaction Status Toast */}
      <TransactionStatus />
    </DndContext>
  );
};
