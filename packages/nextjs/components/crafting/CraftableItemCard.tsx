import React, { useState } from "react";
import type { CraftableItem } from "~~/services/web3/craftingUtils";

interface CraftableItemCardProps {
  item: CraftableItem;
  onCraft: (item: CraftableItem) => void;
  isCrafting: boolean;
  isWalletConnected: boolean;
}

export const CraftableItemCard: React.FC<CraftableItemCardProps> = ({
  item,
  onCraft,
  isCrafting,
  isWalletConnected,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCraft = () => {
    if (!isCrafting && isWalletConnected) {
      onCraft(item);
    }
  };

  return (
    <div className="flex flex-col border-2 border-neutral-700 bg-neutral-800/80 shadow-[3px_3px_0_rgba(0,0,0,0.3)]">
      {/* Header with item icon and name */}
      <div className="flex items-center gap-3 border-b-2 border-neutral-700 bg-neutral-900/60 p-3">
        <div
          className="h-12 w-12 border-2 border-neutral-600 bg-neutral-900"
          style={{
            backgroundImage: `url(${item.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
          }}
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-neutral-100">{item.name}</h3>
          <div className="mt-1">
            {item.isAggregated ? (
              <span className="inline-block border border-amber-700 bg-amber-600/80 px-2 py-0.5 text-xs font-semibold text-neutral-50 uppercase">
                Multi-step ({item.steps.length} steps)
              </span>
            ) : (
              <span className="inline-block border border-emerald-700 bg-emerald-600/80 px-2 py-0.5 text-xs font-semibold text-neutral-50 uppercase">
                Direct
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Materials required */}
      <div className="p-3">
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-neutral-300 uppercase">Required Materials</h4>
        <div className="space-y-1">
          {item.requiredMaterials.map(material => {
            const hasEnough = material.available >= material.amount;
            return (
              <div key={material.tokenId.toString()} className="flex items-center justify-between text-xs">
                <span className={hasEnough ? "text-neutral-200" : "text-red-400"}>{material.name}</span>
                <span className={hasEnough ? "text-emerald-400" : "text-red-400"}>
                  {material.available} / {material.amount}
                </span>
              </div>
            );
          })}
        </div>

        {/* Expandable crafting steps for aggregated recipes */}
        {item.isAggregated && (
          <div className="mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-between border-2 border-neutral-700 bg-neutral-900/60 px-2 py-1 text-xs font-semibold text-neutral-300 uppercase transition-colors hover:bg-neutral-800/60"
            >
              <span>Crafting Steps</span>
              <svg
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isExpanded && (
              <div className="mt-2 space-y-1 border-2 border-neutral-700 bg-neutral-900/40 p-2">
                {item.steps.map((step, index) => (
                  <div key={index} className="text-xs text-neutral-300">
                    <span className="text-emerald-400">{index + 1}.</span> {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Craft button */}
        <button
          onClick={handleCraft}
          disabled={isCrafting || !isWalletConnected}
          className={`mt-3 w-full border-4 px-4 py-2 text-sm font-semibold uppercase shadow-[2px_2px_0_rgba(0,0,0,0.6)] transition-colors ${
            isCrafting || !isWalletConnected
              ? "cursor-not-allowed border-neutral-700 bg-neutral-600/60 text-neutral-400 opacity-60"
              : "border-emerald-800 bg-emerald-600 text-neutral-50 hover:bg-emerald-500 active:translate-y-[1px]"
          }`}
        >
          {isCrafting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Crafting...
            </span>
          ) : !isWalletConnected ? (
            "Connect Wallet"
          ) : (
            "Craft Item"
          )}
        </button>
      </div>
    </div>
  );
};
