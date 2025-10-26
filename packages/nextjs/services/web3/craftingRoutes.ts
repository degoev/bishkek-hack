import { ITEM_TO_TOKEN_ID } from "./itemConfig";

/**
 * Recipe dependency tree
 * Maps output token ID to its recipe requirements
 */
interface RecipeNode {
  outputTokenId: bigint;
  outputAmount: number;
  inputs: Array<{
    tokenId: bigint;
    amount: number;
  }>;
}

/**
 * Complete recipe tree based on deployment configuration
 * Base resources (oak_log: 1, diamond: 5) have no recipes
 */
const RECIPE_TREE: Map<bigint, RecipeNode> = new Map([
  // Token 2 (oak_planks): 1 oak_log → 4 oak_planks
  [
    ITEM_TO_TOKEN_ID.oak_planks,
    {
      outputTokenId: ITEM_TO_TOKEN_ID.oak_planks,
      outputAmount: 4,
      inputs: [{ tokenId: ITEM_TO_TOKEN_ID.oak_log, amount: 1 }],
    },
  ],
  // Token 3 (stick): 2 oak_planks → 4 sticks
  [
    ITEM_TO_TOKEN_ID.stick,
    {
      outputTokenId: ITEM_TO_TOKEN_ID.stick,
      outputAmount: 4,
      inputs: [{ tokenId: ITEM_TO_TOKEN_ID.oak_planks, amount: 2 }],
    },
  ],
  // Token 4 (wooden_pickaxe): 2 sticks + 3 oak_planks → 1 wooden_pickaxe
  [
    ITEM_TO_TOKEN_ID.wooden_pickaxe,
    {
      outputTokenId: ITEM_TO_TOKEN_ID.wooden_pickaxe,
      outputAmount: 1,
      inputs: [
        { tokenId: ITEM_TO_TOKEN_ID.stick, amount: 2 },
        { tokenId: ITEM_TO_TOKEN_ID.oak_planks, amount: 3 },
      ],
    },
  ],
  // Token 6 (diamond_pickaxe): 2 sticks + 3 diamonds → 1 diamond_pickaxe
  [
    ITEM_TO_TOKEN_ID.diamond_pickaxe,
    {
      outputTokenId: ITEM_TO_TOKEN_ID.diamond_pickaxe,
      outputAmount: 1,
      inputs: [
        { tokenId: ITEM_TO_TOKEN_ID.stick, amount: 2 },
        { tokenId: ITEM_TO_TOKEN_ID.diamond, amount: 3 },
      ],
    },
  ],
  // Token 7 (diamond_sword): 1 stick + 2 diamonds → 1 diamond_sword
  [
    ITEM_TO_TOKEN_ID.diamond_sword,
    {
      outputTokenId: ITEM_TO_TOKEN_ID.diamond_sword,
      outputAmount: 1,
      inputs: [
        { tokenId: ITEM_TO_TOKEN_ID.stick, amount: 1 },
        { tokenId: ITEM_TO_TOKEN_ID.diamond, amount: 2 },
      ],
    },
  ],
]);

/**
 * Base resources that cannot be crafted
 */
const BASE_RESOURCES = new Set<bigint>([ITEM_TO_TOKEN_ID.oak_log, ITEM_TO_TOKEN_ID.diamond]);

/**
 * Result of crafting route calculation
 */
export interface CraftingRoute {
  proxyIds: bigint[];
  proxyAmounts: bigint[];
  isAggregated: boolean; // true if multi-step, false if single-step
  steps: string[]; // Human-readable description of steps
}

/**
 * Material requirements accumulated during route calculation
 */
interface MaterialRequirements {
  [tokenId: string]: number;
}

/**
 * Crafting step in the execution order
 */
interface CraftingStep {
  tokenId: bigint;
  craftCount: number;
  description: string;
}

/**
 * Calculates the optimal crafting route from available materials to desired output
 * @param outputTokenId The final item to craft
 * @param userBalances Array of user balances matching ALL_TOKEN_IDS order
 * @returns CraftingRoute if possible, null if insufficient materials or no recipe exists
 */
export function calculateCraftingRoute(outputTokenId: bigint, userBalances: readonly bigint[]): CraftingRoute | null {
  const recipe = RECIPE_TREE.get(outputTokenId);

  // No recipe exists for this output (e.g., trying to craft base resources)
  if (!recipe) {
    return null;
  }

  // Convert user balances array to map for easier lookup
  const balanceMap = new Map<bigint, bigint>();
  const tokenIds = [
    ITEM_TO_TOKEN_ID.oak_log,
    ITEM_TO_TOKEN_ID.oak_planks,
    ITEM_TO_TOKEN_ID.stick,
    ITEM_TO_TOKEN_ID.wooden_pickaxe,
    ITEM_TO_TOKEN_ID.diamond,
    ITEM_TO_TOKEN_ID.diamond_pickaxe,
    ITEM_TO_TOKEN_ID.diamond_sword,
  ];

  tokenIds.forEach((tokenId, index) => {
    balanceMap.set(tokenId, userBalances[index] || 0n);
  });

  // Calculate required materials and crafting steps
  const craftingSteps: CraftingStep[] = [];
  const availableMaterials = new Map<bigint, number>(Array.from(balanceMap.entries()).map(([k, v]) => [k, Number(v)]));

  // Try to build the crafting route
  const success = buildCraftingRoute(outputTokenId, 1, availableMaterials, craftingSteps);

  if (!success) {
    return null;
  }

  // If only one step, it's a direct craft (not aggregated)
  const isAggregated = craftingSteps.length > 1;

  return {
    proxyIds: craftingSteps.map(step => step.tokenId),
    proxyAmounts: craftingSteps.map(step => BigInt(step.craftCount)),
    isAggregated,
    steps: craftingSteps.map(step => step.description),
  };
}

/**
 * Recursively builds the crafting route by resolving dependencies
 * @param targetTokenId The item we want to craft
 * @param targetAmount How many we need
 * @param availableMaterials Current available materials (modified in-place)
 * @param craftingSteps Accumulated crafting steps (modified in-place)
 * @returns true if route is possible, false otherwise
 */
function buildCraftingRoute(
  targetTokenId: bigint,
  targetAmount: number,
  availableMaterials: Map<bigint, number>,
  craftingSteps: CraftingStep[],
): boolean {
  const recipe = RECIPE_TREE.get(targetTokenId);

  // If no recipe, this must be a base resource - check if we have enough
  if (!recipe) {
    const available = availableMaterials.get(targetTokenId) || 0;
    return available >= targetAmount;
  }

  // Check if we already have enough of this item in inventory
  const currentlyAvailable = availableMaterials.get(targetTokenId) || 0;
  if (currentlyAvailable >= targetAmount) {
    // We have enough, deduct from available and return
    availableMaterials.set(targetTokenId, currentlyAvailable - targetAmount);
    return true;
  }

  // We need to craft some. Calculate how many times to craft.
  const deficit = targetAmount - currentlyAvailable;
  const craftCount = Math.ceil(deficit / recipe.outputAmount);
  const totalProduced = craftCount * recipe.outputAmount;

  // First, recursively ensure we have all input materials
  for (const input of recipe.inputs) {
    const requiredAmount = input.amount * craftCount;
    const success = buildCraftingRoute(input.tokenId, requiredAmount, availableMaterials, craftingSteps);

    if (!success) {
      return false; // Cannot obtain required input
    }
  }

  // Now consume the inputs and perform the craft
  for (const input of recipe.inputs) {
    const requiredAmount = input.amount * craftCount;
    const currentAvailable = availableMaterials.get(input.tokenId) || 0;
    availableMaterials.set(input.tokenId, currentAvailable - requiredAmount);
  }

  // Add this crafting step
  craftingSteps.push({
    tokenId: targetTokenId,
    craftCount,
    description: `Craft ${totalProduced} ${getTokenName(targetTokenId)} (${craftCount}x)`,
  });

  // Add the crafted items to available materials
  const newAvailable = currentlyAvailable + totalProduced;
  availableMaterials.set(targetTokenId, newAvailable);

  // Deduct what we needed
  availableMaterials.set(targetTokenId, newAvailable - targetAmount);

  return true;
}

/**
 * Helper to get human-readable token name
 */
function getTokenName(tokenId: bigint): string {
  const names: Record<string, string> = {
    "1": "Oak Log",
    "2": "Oak Planks",
    "3": "Sticks",
    "4": "Wooden Pickaxe",
    "5": "Diamond",
    "6": "Diamond Pickaxe",
    "7": "Diamond Sword",
  };
  return names[tokenId.toString()] || `Token ${tokenId}`;
}

/**
 * Gets recipe information for a given output token ID
 * Used by UI to display recipe requirements
 */
export function getRecipeInfo(outputTokenId: bigint): RecipeNode | undefined {
  return RECIPE_TREE.get(outputTokenId);
}

/**
 * Checks if a token is a base resource (cannot be crafted)
 */
export function isBaseResource(tokenId: bigint): boolean {
  return BASE_RESOURCES.has(tokenId);
}
