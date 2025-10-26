import React from "react";

export type CraftingTab = "manual" | "quick";

interface CraftingTabsProps {
  activeTab: CraftingTab;
  onTabChange: (tab: CraftingTab) => void;
}

export const CraftingTabs: React.FC<CraftingTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-3 flex gap-1 border-2 border-neutral-700 bg-neutral-900/60 p-1">
      <button
        onClick={() => onTabChange("manual")}
        className={`flex-1 border-2 px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-colors ${
          activeTab === "manual"
            ? "border-emerald-700 bg-emerald-600 text-neutral-50 shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
            : "border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:bg-neutral-700/60"
        }`}
      >
        Manual Craft
      </button>
      <button
        onClick={() => onTabChange("quick")}
        className={`flex-1 border-2 px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-colors ${
          activeTab === "quick"
            ? "border-emerald-700 bg-emerald-600 text-neutral-50 shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
            : "border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:bg-neutral-700/60"
        }`}
      >
        Quick Craft
      </button>
    </div>
  );
};
