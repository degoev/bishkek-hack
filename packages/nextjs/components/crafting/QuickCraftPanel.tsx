import React, { useMemo } from "react";
import { CraftableItemCard } from "./CraftableItemCard";
import { type CraftableItem, getAllCraftableItems } from "~~/services/web3/craftingUtils";

interface QuickCraftPanelProps {
  balances: readonly bigint[] | undefined;
  isCrafting: boolean;
  isWalletConnected: boolean;
  onCraft: (item: CraftableItem) => Promise<void>;
}

export const QuickCraftPanel: React.FC<QuickCraftPanelProps> = ({
  balances,
  isCrafting,
  isWalletConnected,
  onCraft,
}) => {
  // Calculate craftable items
  const craftableItems = useMemo(() => {
    if (!balances || balances.length === 0) {
      return [];
    }
    return getAllCraftableItems(balances);
  }, [balances]);

  // Loading state
  if (!balances) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-sm text-neutral-300">Loading available recipes...</p>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isWalletConnected) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-lg font-semibold text-neutral-200">Connect Your Wallet</p>
          <p className="mt-2 text-sm text-neutral-400">Connect your wallet to see available recipes</p>
        </div>
      </div>
    );
  }

  // Empty state - no craftable items
  if (craftableItems.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
          </svg>
          <p className="text-lg font-semibold text-neutral-200">No Recipes Available</p>
          <p className="mt-2 text-sm text-neutral-400">Gather materials to unlock crafting recipes</p>
          <div className="mt-4 text-xs text-neutral-500">
            <p>Try collecting:</p>
            <p>• Oak Logs (base resource)</p>
            <p>• Diamonds (base resource)</p>
          </div>
        </div>
      </div>
    );
  }

  // Display craftable items grid
  return (
    <div className="min-h-[400px]">
      <div className="mb-3 text-xs text-neutral-400">
        {craftableItems.length} {craftableItems.length === 1 ? "recipe" : "recipes"} available
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {craftableItems.map(item => (
          <CraftableItemCard
            key={item.tokenId.toString()}
            item={item}
            onCraft={onCraft}
            isCrafting={isCrafting}
            isWalletConnected={isWalletConnected}
          />
        ))}
      </div>
    </div>
  );
};
