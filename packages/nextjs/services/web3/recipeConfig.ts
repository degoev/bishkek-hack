import { ITEM_TO_TOKEN_ID } from "./itemConfig";

/**
 * Recipe definition interface
 * Represents a crafting recipe with inputs and outputs
 */
export interface Recipe {
  outputTokenId: bigint;
  outputAmount: number;
  inputs: Array<{
    tokenId: bigint;
    amount: number;
  }>;
}

/**
 * Centralized recipe configuration
 * Single source of truth for all crafting recipes
 * Based on deployment configuration in packages/hardhat/deploy/01_deploy_minecraft_items.ts
 */
export const RECIPES: Recipe[] = [
  // Token 2 (oak_planks): 1 oak_log → 4 oak_planks
  {
    outputTokenId: ITEM_TO_TOKEN_ID.oak_planks,
    outputAmount: 4,
    inputs: [{ tokenId: ITEM_TO_TOKEN_ID.oak_log, amount: 1 }],
  },
  // Token 3 (stick): 2 oak_planks → 4 sticks
  {
    outputTokenId: ITEM_TO_TOKEN_ID.stick,
    outputAmount: 4,
    inputs: [{ tokenId: ITEM_TO_TOKEN_ID.oak_planks, amount: 2 }],
  },
  // Token 4 (wooden_pickaxe): 2 sticks + 3 oak_planks → 1 wooden_pickaxe
  {
    outputTokenId: ITEM_TO_TOKEN_ID.wooden_pickaxe,
    outputAmount: 1,
    inputs: [
      { tokenId: ITEM_TO_TOKEN_ID.stick, amount: 2 },
      { tokenId: ITEM_TO_TOKEN_ID.oak_planks, amount: 3 },
    ],
  },
  // Token 6 (diamond_pickaxe): 2 sticks + 3 diamonds → 1 diamond_pickaxe
  {
    outputTokenId: ITEM_TO_TOKEN_ID.diamond_pickaxe,
    outputAmount: 1,
    inputs: [
      { tokenId: ITEM_TO_TOKEN_ID.stick, amount: 2 },
      { tokenId: ITEM_TO_TOKEN_ID.diamond, amount: 3 },
    ],
  },
  // Token 7 (diamond_sword): 1 stick + 2 diamonds → 1 diamond_sword
  {
    outputTokenId: ITEM_TO_TOKEN_ID.diamond_sword,
    outputAmount: 1,
    inputs: [
      { tokenId: ITEM_TO_TOKEN_ID.stick, amount: 1 },
      { tokenId: ITEM_TO_TOKEN_ID.diamond, amount: 2 },
    ],
  },
];

/**
 * Recipe lookup map for O(1) access by output token ID
 * Lazily constructed on first access
 */
let recipeMapCache: Map<bigint, Recipe> | null = null;

/**
 * Gets the recipe map, constructing it on first access
 */
export function getRecipeMap(): Map<bigint, Recipe> {
  if (!recipeMapCache) {
    recipeMapCache = new Map(RECIPES.map(recipe => [recipe.outputTokenId, recipe]));
  }
  return recipeMapCache;
}

/**
 * Gets a recipe by output token ID
 * @param outputTokenId The token ID to look up
 * @returns Recipe if found, undefined otherwise
 */
export function getRecipe(outputTokenId: bigint): Recipe | undefined {
  return getRecipeMap().get(outputTokenId);
}

/**
 * Gets the output amount for a recipe
 * @param outputTokenId The token ID to look up
 * @returns Output amount, or 1 if recipe not found
 */
export function getRecipeOutputAmount(outputTokenId: bigint): number {
  const recipe = getRecipe(outputTokenId);
  return recipe?.outputAmount ?? 1;
}

/**
 * Gets the input requirements for a recipe
 * @param outputTokenId The token ID to look up
 * @returns Array of inputs, or null if recipe not found
 */
export function getRecipeInputs(outputTokenId: bigint): Array<{ tokenId: bigint; amount: number }> | null {
  const recipe = getRecipe(outputTokenId);
  return recipe ? recipe.inputs : null;
}

/**
 * Checks if a recipe exists for the given output token ID
 * @param outputTokenId The token ID to check
 * @returns true if recipe exists, false otherwise
 */
export function recipeExists(outputTokenId: bigint): boolean {
  return getRecipeMap().has(outputTokenId);
}

/**
 * Base resources that cannot be crafted (have no recipes)
 */
export const BASE_RESOURCES = new Set<bigint>([ITEM_TO_TOKEN_ID.oak_log, ITEM_TO_TOKEN_ID.diamond]);

/**
 * Checks if a token is a base resource (cannot be crafted)
 * @param tokenId The token ID to check
 * @returns true if base resource, false otherwise
 */
export function isBaseResource(tokenId: bigint): boolean {
  return BASE_RESOURCES.has(tokenId);
}
