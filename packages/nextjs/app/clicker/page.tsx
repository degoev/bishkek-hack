"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getItemBalanceAction, increaseItemBalanceAction } from "~~/services/backend/actions";
import { cn } from "~~/utils/cn";

const tabs = {
  forest: { name: "Forest", button: "Get wood", item: "oak_log" },
  cave: { name: "Cave", button: "Find diamonds", item: "diamond" },
} as const;

const items = {
  oak_log: { id: 0, name: "Oak log", stackSize: 64, itemsPerClick: 1 },
  diamond: { id: 0, name: "Diamond", stackSize: 64, itemsPerClick: 1 },
  oak_planks: { id: 0, name: "Oak planks", stackSize: 64, itemsPerClick: 1 },
  diamond_pickaxe: { id: 0, name: "Diamond pickaxe", stackSize: 1, itemsPerClick: 1 },
  diamond_sword: { id: 0, name: "Diamond sword", stackSize: 1, itemsPerClick: 1 },
} as const;

type TItemKey = keyof typeof items;
type TTabKey = keyof typeof tabs;

type Store = {
  tab: TTabKey;
  items: Record<TItemKey, number>;
  isInitialized: boolean;
};

const useStore = create<Store>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_set, _get) => ({
      tab: "forest",
      isInitialized: false,
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

const initialize = async (address: string) => {
  const itemKeys = Object.keys(items) as TItemKey[];
  const balances = await Promise.all(itemKeys.map(itemKey => getItemBalanceAction(address, itemKey)));

  balances.forEach((balance, idx) => {
    const itemKey = itemKeys[idx];
    useStore.setState(state => ({
      items: {
        ...state.items,
        [itemKey]: balance,
      },
    }));
  });

  useStore.setState({ isInitialized: true });
};

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
  const { address } = useAccount();

  useEffect(() => {
    if (!address) return;
    initialize(address);
  }, [address]);

  const activeTabKey = useStore(state => state.tab);
  const isInitialized = useStore(state => state.isInitialized);
  const activeTab = getTab(activeTabKey);

  const itemCounts = useStore(state => state.items);
  const stacks = computeStacks(itemCounts);
  const slots: (TStack | null)[] = Array.from({ length: Math.max(stacks.length, 36) }, (_, idx) => stacks[idx] ?? null);

  const onClick = useCallback(() => {
    if (!address) return;
    if (!activeTab) return;

    increaseItemBalanceAction(address, activeTab.item, items[activeTab.item].itemsPerClick);

    useStore.setState(state => ({
      items: {
        ...state.items,
        [activeTab.item]: state.items[activeTab.item] + items[activeTab.item].itemsPerClick,
      },
    }));
  }, [activeTab, address]);

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
  if (!isInitialized) return <div>Loading...</div>;

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
                      src={`/items/${slot.itemKey}.png`}
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
