import type { CraftingSlot } from "../store/inventoryStore";
import { ITEM_TO_TOKEN_ID } from "./itemConfig";

/**
 * Contract recipes (from deployment script):
 * - Token 2 (oak_planks): 1 oak_log → 4 oak_planks
 * - Token 3 (stick): 2 oak_planks → 4 sticks
 * - Token 4 (wooden_pickaxe): 2 sticks + 3 oak_planks → 1 wooden_pickaxe
 * - Token 6 (diamond_pickaxe): 2 sticks + 3 diamonds → 1 diamond_pickaxe
 * - Token 7 (diamond_sword): 1 stick + 2 diamonds → 1 diamond_sword (currently same as pickaxe)
 */

interface MaterialCount {
  [itemId: string]: number;
}

/**
 * Converts 3x3 crafting grid to material counts
 */
function getMaterialCounts(grid: (CraftingSlot | null)[][]): MaterialCount {
  const counts: MaterialCount = {};

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const slot = grid[row][col];
      if (slot?.item) {
        const itemId = slot.item.id;
        counts[itemId] = (counts[itemId] || 0) + slot.quantity;
      }
    }
  }

  return counts;
}

/**
 * Maps UI crafting grid pattern to contract outputTokenId
 * Returns null if no matching recipe found
 */
export function getRecipeFromPattern(grid: (CraftingSlot | null)[][]): bigint | null {
  const materials = getMaterialCounts(grid);
  const materialKeys = Object.keys(materials).sort();

  // Recipe: 1 oak_log → oak_planks (token 2)
  if (materialKeys.length === 1 && materials.oak_log === 1) {
    return ITEM_TO_TOKEN_ID.oak_planks;
  }

  // Recipe: 2 oak_planks → stick (token 3)
  if (materialKeys.length === 1 && materials.oak_planks === 2) {
    return ITEM_TO_TOKEN_ID.stick;
  }

  // Recipe: 2 sticks + 3 oak_planks → wooden_pickaxe (token 4)
  if (materialKeys.length === 2 && materials.stick === 2 && materials.oak_planks === 3) {
    return ITEM_TO_TOKEN_ID.wooden_pickaxe;
  }

  // Recipe: 2 sticks + 3 diamonds → diamond_pickaxe (token 6)
  if (materialKeys.length === 2 && materials.stick === 2 && materials.diamond === 3) {
    // Check pattern to differentiate between pickaxe and sword
    return detectDiamondToolPattern(grid);
  }
  // Recipe: 1 stick + 2 diamonds → diamond_sword (token 7)
  if (materialKeys.length === 2 && materials.stick === 1 && materials.diamond === 2) {
    // Check pattern to differentiate between pickaxe and sword
    return detectDiamondToolPattern(grid);
  }

  return null;
}

/**
 * Detects whether a diamond tool pattern is for pickaxe or sword
 * based on the 3x3 grid layout
 */
function detectDiamondToolPattern(grid: (CraftingSlot | null)[][]): bigint {
  // Diamond Pickaxe pattern (from UI inventoryStore.ts):
  // [diamond, diamond, diamond]
  // [null,    stick,   null   ]
  // [null,    stick,   null   ]

  // Diamond Sword pattern:
  // [null,    diamond, null]
  // [null,    diamond, null]
  // [null,    stick,   null]

  // Check top row for pickaxe pattern (3 diamonds across)
  const topRowDiamonds =
    grid[0][0]?.item?.id === "diamond" && grid[0][1]?.item?.id === "diamond" && grid[0][2]?.item?.id === "diamond";

  if (topRowDiamonds) {
    return ITEM_TO_TOKEN_ID.diamond_pickaxe;
  }

  // Check middle column for sword pattern (2 diamonds stacked vertically)
  const middleColumnDiamonds = grid[0][1]?.item?.id === "diamond" && grid[1][1]?.item?.id === "diamond";

  if (middleColumnDiamonds) {
    return ITEM_TO_TOKEN_ID.diamond_sword;
  }

  // Default to pickaxe if can't determine
  return ITEM_TO_TOKEN_ID.diamond_pickaxe;
}

/**
 * Gets the expected output amount for a given recipe
 * Based on contract recipe configuration
 */
export function getRecipeOutputAmount(outputTokenId: bigint): number {
  switch (outputTokenId) {
    case ITEM_TO_TOKEN_ID.oak_planks:
      return 4;
    case ITEM_TO_TOKEN_ID.stick:
      return 4;
    case ITEM_TO_TOKEN_ID.wooden_pickaxe:
    case ITEM_TO_TOKEN_ID.diamond_pickaxe:
    case ITEM_TO_TOKEN_ID.diamond_sword:
      return 1;
    default:
      return 1;
  }
}
