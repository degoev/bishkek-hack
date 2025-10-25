"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cn } from "~~/utils/cn";

const tabs = {
  forest: { name: "Forest", button: "Get wood", item: "oak_log" },
  cave: { name: "Cave", button: "Find diamonds", item: "diamond" },
} as const;

const items = {
  oak_log: { name: "Oak log", image: "/items/oak_log.png", stackSize: 64 },
  diamond: { name: "Diamond", image: "/items/diamond.png", stackSize: 64 },
  oak_planks: { name: "Oak planks", image: "/items/oak_planks.png", stackSize: 64 },
  diamond_pickaxe: { name: "Diamond pickaxe", image: "/items/diamond_pickaxe.png", stackSize: 1 },
  diamond_sword: { name: "Diamond sword", image: "/items/diamond_sword.png", stackSize: 1 },
} as const;

type TItemKey = keyof typeof items;
type TTabKey = keyof typeof tabs;

type Store = {
  tab: TTabKey;
  items: Record<TItemKey, number>;
};

const useStore = create<Store>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set, _get) => ({
      tab: "forest",
      items: {
        oak_log: 0,
        diamond: 0,
        oak_planks: 0,
        diamond_pickaxe: 0,
        diamond_sword: 0,
      },
    }),
    { name: "clicker-store", partialize: ({ tab }) => ({ tab }) },
  ),
);

const getTab = (key: string) => {
  if (!(key in tabs)) return null;
  return tabs[key as TTabKey] as (typeof tabs)[TTabKey];
};

type TStack = { itemKey: TItemKey; count: number };

const computeStacks = (counts: Record<TItemKey, number>): TStack[] => {
  const result: TStack[] = [];
  (Object.keys(items) as TItemKey[]).forEach(key => {
    const count = counts[key] ?? 0;
    const size = items[key].stackSize;
    if (count > 0) {
      const full = Math.floor(count / size);
      const rest = count % size;
      for (let i = 0; i < full; i++) {
        result.push({ itemKey: key, count: size });
      }
      if (rest) {
        result.push({ itemKey: key, count: rest });
      }
    }
  });
  return result;
};

export default (() => {
  const activeTabKey = useStore(state => state.tab);
  const activeTab = getTab(activeTabKey);

  const itemCounts = useStore(state => state.items);
  const stacks = computeStacks(itemCounts);
  const slots: (TStack | null)[] = Array.from({ length: Math.max(stacks.length, 36) }, (_, idx) => stacks[idx] ?? null);

  const onClick = useCallback(() => {
    if (!activeTab) return;

    useStore.setState(state => ({
      items: {
        ...state.items,
        [activeTab.item]: state.items[activeTab.item] + 32,
      },
    }));
  }, [activeTab]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    document.addEventListener(
      "keydown",
      e => {
        if (e.key !== " ") return;
        e.preventDefault();
        onClick();
      },
      { signal },
    );

    return () => controller.abort();
  }, [onClick]);

  if (!activeTab) return null;

  return (
    <main className="bg-neutral-900">
      <div className="mx-auto flex min-h-svh w-full max-w-4xl gap-4 p-4">
        <div className="flex w-xs shrink-0 flex-col gap-4">
          <ul className="flex w-fit bg-neutral-800 p-1">
            {Object.keys(tabs).map(key => {
              const tab = getTab(key);
              if (!tab) return null;

              const isActive = activeTabKey === key;

              const onClick = () => useStore.setState({ tab: key as TTabKey });

              return (
                <li key={key}>
                  <button className={cn(isActive && "bg-neutral-700", "p-1 px-3")} onClick={onClick}>
                    {tab.name}
                  </button>
                </li>
              );
            })}
          </ul>

          <button className="bg-neutral-300 p-3 px-4 text-neutral-800" onClick={onClick}>
            {activeTab.button} (space)
          </button>
        </div>

        <div className="flex grow flex-col gap-2 bg-neutral-800 p-4">
          <h2>Your inventory</h2>

          <div className="grid grid-cols-6 border-[.5px] border-neutral-500">
            {slots.map((slot, index) => (
              <div key={index} className="relative aspect-square border-[.5px] border-neutral-500 bg-neutral-900">
                {slot ? (
                  <>
                    <Image
                      src={items[slot.itemKey].image}
                      alt={items[slot.itemKey].name}
                      fill
                      className="object-contain p-2"
                    />
                    <span className="pointer-events-none absolute right-1 bottom-1 rounded bg-neutral-700/80 px-1 text-xs text-white">
                      {slot.count}
                    </span>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <button className="bg-neutral-300 p-3 px-4 text-neutral-800">Move resources onchain</button>
        </div>
      </div>
    </main>
  );
}) as React.FC;
