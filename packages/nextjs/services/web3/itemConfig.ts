/**
 * Mapping between UI item IDs and smart contract token IDs
 * Based on MinecraftItems contract deployment configuration
 */

export const ITEM_TO_TOKEN_ID = {
  oak_log: 1n,
  oak_planks: 2n,
  stick: 3n,
  wooden_pickaxe: 4n,
  diamond: 5n,
  diamond_pickaxe: 6n,
  diamond_sword: 7n,
} as const;

export const TOKEN_ID_TO_ITEM = {
  1: "oak_log",
  2: "oak_planks",
  3: "stick",
  4: "wooden_pickaxe",
  5: "diamond",
  6: "diamond_pickaxe",
  7: "diamond_sword",
} as const;

// All available token IDs for batch operations
export const ALL_TOKEN_IDS = [1n, 2n, 3n, 4n, 5n, 6n, 7n] as const;

// Item display names matching contract
export const TOKEN_NAMES: Record<number, string> = {
  1: "Wooden Log",
  2: "Wooden Plank",
  3: "Stick",
  4: "Wooden Pickaxe",
  5: "Diamond",
  6: "Diamond Pickaxe",
  7: "Diamond Sword",
};

// Type helpers
export type ItemId = keyof typeof ITEM_TO_TOKEN_ID;
export type TokenId = (typeof ALL_TOKEN_IDS)[number];
