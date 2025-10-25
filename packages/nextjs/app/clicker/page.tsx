"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bridgeItemsToChainAction, getItemBalanceAction, increaseItemBalanceAction } from "~~/services/backend/actions";
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
    <main
      style={{
        background: "url(/textures/stone.png)",
        backgroundPosition: "center",
        backgroundSize: 48,
      }}
      className="flex min-h-svh flex-col p-8"
    >
      <div className="mx-auto flex w-full max-w-4xl grow gap-4 rounded-sm p-4 max-md:flex-col">
        <div className="flex h-fit flex-col gap-4 rounded-sm border-2 border-neutral-700 bg-neutral-800/80 p-3 shadow-[4px_4px_0_rgba(0,0,0,0.5)] md:grow">
          <ul className="flex w-fit gap-2 rounded-sm border-2 border-neutral-700 bg-neutral-900/70 p-1">
            {Object.keys(tabs).map(key => {
              const tab = getTab(key);
              if (!tab) return null;

              const isActive = activeTabKey === key;

              const onClick = () => useStore.setState({ tab: key as TTabKey });

              return (
                <li key={key}>
                  <button
                    className={cn(
                      "flex gap-1 rounded-sm border-2 px-3 py-1 text-xs tracking-wide uppercase shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-colors",
                      isActive
                        ? "border-emerald-500 bg-emerald-700 text-white"
                        : "border-neutral-700 bg-neutral-800 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-700",
                    )}
                    onClick={onClick}
                  >
                    <span className="relative size-4">
                      <Image
                        src={`/items/${tab.item}.png`}
                        alt={items[tab.item].name}
                        fill
                        className="object-contain"
                      />
                    </span>
                    {tab.name}
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            className="rounded-sm border-4 border-emerald-800 bg-emerald-600 p-3 px-4 text-neutral-50 shadow-[3px_3px_0_rgba(0,0,0,0.6)] transition-colors hover:bg-emerald-500 active:translate-y-[1px]"
            onClick={onClick}
          >
            {activeTab.button} (space)
          </button>
        </div>

        <div className="flex h-fit grow flex-col gap-2 rounded-sm border-2 border-neutral-700 bg-neutral-800/80 p-4 shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
          <h2 className="text-sm tracking-wide text-emerald-300 uppercase">Your inventory</h2>

          <div className="grid grid-cols-6 gap-0 border-2 border-neutral-700 bg-neutral-900/60">
            {slots.map((slot, index) => (
              <div
                key={index}
                className="group relative aspect-square border-2 border-neutral-700 bg-neutral-900 transition-colors hover:border-emerald-500 hover:bg-neutral-800"
              >
                {slot ? (
                  <>
                    <div className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-sm border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] whitespace-pre text-neutral-200 shadow-[2px_2px_0_rgba(0,0,0,0.5)] group-hover:block">
                      {items[slot.itemKey].name}
                    </div>
                    <Image
                      src={`/items/${slot.itemKey}.png`}
                      alt={items[slot.itemKey].name}
                      fill
                      className="object-contain p-2"
                    />
                    <span className="pointer-events-none absolute right-1 bottom-1 rounded-sm bg-neutral-800/90 px-1 text-xs text-emerald-300">
                      {slot.count}
                    </span>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <button
            onClick={async () => {
              if (!address) return;

              await bridgeItemsToChainAction(
                address,
                stacks.map(s => s.itemKey),
              );
              initialize(address);
            }}
            className="rounded-sm border-4 border-neutral-700 bg-neutral-900 p-3 px-4 text-neutral-200 shadow-[3px_3px_0_rgba(0,0,0,0.6)] transition-colors hover:bg-neutral-800"
          >
            Move resources onchain
          </button>
        </div>
      </div>
    </main>
  );
}) as React.FC;
