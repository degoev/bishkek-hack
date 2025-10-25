import { create } from "zustand";

export const MINECRAFT_ITEMS = [
  { id: "oak_log", name: "Oak Log", image: "/items/oak_log.png" },
  { id: "oak_planks", name: "Oak Planks", image: "/items/oak_planks.png" },
  { id: "stick", name: "Stick", image: "/items/stick.png" },
  { id: "wooden_pickaxe", name: "Wooden Pickaxe", image: "/items/wooden_pickaxe.png" },
  { id: "diamond", name: "Diamond", image: "/items/diamond.png" },
  { id: "diamond_pickaxe", name: "Diamond Pickaxe", image: "/items/diamond_pickaxe.png" },
  { id: "diamond_sword", name: "Diamond Sword", image: "/items/diamond_sword.png" },
] as const;

export const ITEM_LOOKUP = new Map<string, (typeof MINECRAFT_ITEMS)[number]>(
  MINECRAFT_ITEMS.map(item => [item.id, item]),
);

export const BASE_RECIPES = [
  {
    pattern: [["oak_log"]],
    result: ITEM_LOOKUP.get("oak_planks")!,
    quantity: 4,
  },
  {
    pattern: [["oak_planks"], ["oak_planks"]],
    result: ITEM_LOOKUP.get("stick")!,
    quantity: 4,
  },
  {
    pattern: [
      ["diamond", "diamond", "diamond"],
      [null, "stick", null],
      [null, "stick", null],
    ],
    result: ITEM_LOOKUP.get("diamond_pickaxe")!,
    quantity: 1,
  },
  {
    pattern: [
      [null, "diamond", null],
      [null, "diamond", null],
      [null, "stick", null],
    ],
    result: ITEM_LOOKUP.get("diamond_sword")!,
    quantity: 1,
  },
];

export type MinecraftItem = (typeof MINECRAFT_ITEMS)[number];
export type ItemId = MinecraftItem["id"];

export interface InventoryItem {
  item: MinecraftItem;
  quantity: number;
}

export interface CraftingSlot {
  item: MinecraftItem | null;
  quantity: number;
}

export type TxStatus = "idle" | "pending" | "success" | "error";

export interface CraftingState {
  // 3x3 crafting grid
  craftingGrid: (CraftingSlot | null)[][];
  // Result slot
  resultSlot: CraftingSlot | null;
  // Player inventory (local UI state)
  inventory: InventoryItem[];
  // Blockchain state
  onchainInventory: InventoryItem[];
  txStatus: TxStatus;
  txHash: string | null;
  errorMessage: string | null;
  // Actions
  setCraftingSlot: (row: number, col: number, slot: CraftingSlot | null) => void;
  clearCraftingGrid: () => void;
  addToInventory: (item: MinecraftItem, quantity: number) => void;
  removeFromInventory: (itemId: ItemId, quantity: number) => boolean;
  craftItem: () => void;
  checkRecipe: () => void;
  // Blockchain actions
  syncInventoryFromChain: (balances: readonly bigint[]) => void;
  setTxStatus: (status: TxStatus, hash: string | null, error: string | null) => void;
}

// Helper function to match recipes
const matchesPattern = (grid: (CraftingSlot | null)[][], pattern: (string | null)[][]): boolean => {
  // Find the bounding box of the pattern
  let minRow = pattern.length,
    maxRow = -1,
    minCol = pattern[0].length,
    maxCol = -1;

  for (let i = 0; i < pattern.length; i++) {
    for (let j = 0; j < pattern[i].length; j++) {
      if (pattern[i][j] !== null) {
        minRow = Math.min(minRow, i);
        maxRow = Math.max(maxRow, i);
        minCol = Math.min(minCol, j);
        maxCol = Math.max(maxCol, j);
      }
    }
  }

  if (maxRow === -1) return false; // Empty pattern

  const patternHeight = maxRow - minRow + 1;
  const patternWidth = maxCol - minCol + 1;

  // Try to match the pattern at each position in the grid
  for (let startRow = 0; startRow <= 3 - patternHeight; startRow++) {
    for (let startCol = 0; startCol <= 3 - patternWidth; startCol++) {
      let matches = true;

      // Check if pattern matches at this position
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const patternRow = i - startRow + minRow;
          const patternCol = j - startCol + minCol;

          let expectedItem: string | null = null;
          if (
            patternRow >= 0 &&
            patternRow < pattern.length &&
            patternCol >= 0 &&
            patternCol < pattern[patternRow].length
          ) {
            expectedItem = pattern[patternRow][patternCol];
          }

          const actualItem = grid[i][j]?.item?.id || null;

          if (expectedItem !== actualItem) {
            matches = false;
            break;
          }
        }
        if (!matches) break;
      }

      if (matches) return true;
    }
  }

  return false;
};

export const useCraftingStore = create<CraftingState>((set, get) => ({
  craftingGrid: Array(3)
    .fill(null)
    .map(() => Array(3).fill(null)),
  resultSlot: null,
  inventory: [],
  onchainInventory: [],
  txStatus: "idle",
  txHash: null,
  errorMessage: null,

  setCraftingSlot: (row: number, col: number, slot: CraftingSlot | null) => {
    set(state => {
      const newGrid = state.craftingGrid.map((r, i) => r.map((c, j) => (i === row && j === col ? slot : c)));
      return { craftingGrid: newGrid };
    });
    get().checkRecipe();
  },

  clearCraftingGrid: () => {
    set({
      craftingGrid: Array(3)
        .fill(null)
        .map(() => Array(3).fill(null)),
      resultSlot: null,
    });
  },

  addToInventory: (item: MinecraftItem, quantity: number) => {
    set(state => {
      const existingItem = state.inventory.find(inv => inv.item.id === item.id);
      if (existingItem) {
        return {
          inventory: state.inventory.map(inv =>
            inv.item.id === item.id ? { ...inv, quantity: inv.quantity + quantity } : inv,
          ),
        };
      } else {
        return {
          inventory: [...state.inventory, { item, quantity }],
        };
      }
    });
  },

  removeFromInventory: (itemId: ItemId, quantity: number): boolean => {
    const state = get();
    const item = state.inventory.find(inv => inv.item.id === itemId);

    if (!item || item.quantity < quantity) {
      return false;
    }

    set(state => ({
      inventory: state.inventory
        .map(inv => (inv.item.id === itemId ? { ...inv, quantity: inv.quantity - quantity } : inv))
        .filter(inv => inv.quantity > 0),
    }));

    return true;
  },

  craftItem: () => {
    const state = get();
    if (!state.resultSlot) return;

    // Add result to inventory
    get().addToInventory(state.resultSlot.item!, state.resultSlot.quantity);

    // Remove items from crafting grid and inventory
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const slot = state.craftingGrid[i][j];
        if (slot && slot.item) {
          get().removeFromInventory(slot.item.id, 1);
        }
      }
    }

    // Clear crafting grid
    get().clearCraftingGrid();
  },

  checkRecipe: () => {
    const state = get();

    for (const recipe of BASE_RECIPES) {
      if (matchesPattern(state.craftingGrid, recipe.pattern)) {
        set({
          resultSlot: {
            item: recipe.result,
            quantity: recipe.quantity,
          },
        });
        return;
      }
    }

    set({ resultSlot: null });
  },

  // Blockchain actions
  syncInventoryFromChain: (balances: readonly bigint[]) => {
    console.info(`🚀 ~ balances:`, balances);
    const TOKEN_ID_TO_ITEM_MAP: Record<number, string> = {
      1: "oak_log",
      2: "oak_planks",
      3: "stick",
      4: "wooden_pickaxe",
      5: "diamond",
      6: "diamond_pickaxe",
      7: "diamond_sword",
    };

    const onchainInventory: InventoryItem[] = [];

    balances.forEach((balance, index) => {
      const tokenId = index + 1;
      const itemId = TOKEN_ID_TO_ITEM_MAP[tokenId];
      const item = ITEM_LOOKUP.get(itemId);

      if (item && balance > 0n) {
        onchainInventory.push({
          item,
          quantity: Number(balance),
        });
      }
    });

    // Sync onchain inventory to local inventory for display
    set({ onchainInventory, inventory: onchainInventory });
  },

  setTxStatus: (status: TxStatus, hash: string | null, error: string | null) => {
    set({ txStatus: status, txHash: hash, errorMessage: error });

    // Auto-reset success/error status after 5 seconds
    if (status === "success" || status === "error") {
      setTimeout(() => {
        const currentState = get();
        if (currentState.txStatus === status) {
          set({ txStatus: "idle", txHash: null, errorMessage: null });
        }
      }, 5000);
    }
  },
}));
