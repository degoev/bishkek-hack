import { ITEM_LOOKUP } from "../store/inventoryStore";
import { type CraftingRoute, calculateCraftingRoute } from "./craftingRoutes";
import { ALL_TOKEN_IDS, TOKEN_ID_TO_ITEM, TOKEN_NAMES } from "./itemConfig";
import { RECIPES } from "./recipeConfig";

/**
 * Metadata for a craftable item with route information
 */
export interface CraftableItem {
  tokenId: bigint;
  itemId: string;
  name: string;
  image: string;
  isAggregated: boolean;
  steps: string[];
  route: CraftingRoute;
  requiredMaterials: Array<{
    tokenId: bigint;
    name: string;
    amount: number;
    available: number;
  }>;
}

/**
 * Calculate all items that can be crafted with current balances
 * @param balances User's token balances (in same order as ALL_TOKEN_IDS)
 * @returns Array of craftable items with their routes and metadata
 */
export function getAllCraftableItems(balances: readonly bigint[] | undefined): CraftableItem[] {
  if (!balances || balances.length === 0) {
    return [];
  }

  const craftableItems: CraftableItem[] = [];

  // Convert balances to map for easier lookup
  const balanceMap = new Map<bigint, bigint>();
  ALL_TOKEN_IDS.forEach((tokenId, index) => {
    balanceMap.set(tokenId, balances[index] || 0n);
  });

  // Iterate through all recipes to find what's craftable
  for (const recipe of RECIPES) {
    const { outputTokenId } = recipe;

    // Try to calculate crafting route
    const route = calculateCraftingRoute(outputTokenId, balances);

    if (!route) {
      // Not craftable with current materials
      continue;
    }

    // Get item metadata
    const itemId = TOKEN_ID_TO_ITEM[Number(outputTokenId) as keyof typeof TOKEN_ID_TO_ITEM];
    const item = ITEM_LOOKUP.get(itemId);
    const name = TOKEN_NAMES[Number(outputTokenId)] || `Token ${outputTokenId}`;

    if (!item) {
      console.warn(`Item not found for token ID ${outputTokenId}`);
      continue;
    }

    // Calculate required materials for this recipe
    const requiredMaterials = getRequiredMaterialsForRecipe(outputTokenId, balanceMap);

    craftableItems.push({
      tokenId: outputTokenId,
      itemId,
      name,
      image: item.image,
      isAggregated: route.isAggregated,
      steps: route.steps,
      route,
      requiredMaterials,
    });
  }

  // Sort by token ID for consistent ordering
  return craftableItems.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
}

/**
 * Get the base required materials for a recipe
 * Recursively resolves intermediate materials to base resources
 */
function getRequiredMaterialsForRecipe(
  outputTokenId: bigint,
  balanceMap: Map<bigint, bigint>,
): Array<{
  tokenId: bigint;
  name: string;
  amount: number;
  available: number;
}> {
  // Create a working copy of available materials to track consumption
  const availableMaterials = new Map<bigint, number>(Array.from(balanceMap.entries()).map(([k, v]) => [k, Number(v)]));

  // Track base materials consumed
  const baseMaterialsConsumed = new Map<bigint, number>();

  // Simulate the crafting to track actual base material consumption
  simulateCraftingWithTracking(outputTokenId, 1, availableMaterials, baseMaterialsConsumed);

  // Convert to array format
  return Array.from(baseMaterialsConsumed.entries()).map(([tokenId, amount]) => ({
    tokenId,
    name: TOKEN_NAMES[Number(tokenId)] || `Token ${tokenId}`,
    amount,
    available: Number(balanceMap.get(tokenId) || 0n),
  }));
}

/**
 * Simulates crafting and tracks which base materials are actually consumed
 * This accounts for existing intermediate materials in inventory
 */
function simulateCraftingWithTracking(
  targetTokenId: bigint,
  targetAmount: number,
  availableMaterials: Map<bigint, number>,
  baseMaterialsConsumed: Map<bigint, number>,
): boolean {
  const recipe = RECIPES.find(r => r.outputTokenId === targetTokenId);

  // If no recipe, this is a base resource - check availability and track for consumption
  if (!recipe) {
    const available = availableMaterials.get(targetTokenId) || 0;
    if (available < targetAmount) {
      return false;
    }

    // Track base material consumption (actual deduction happens in parent call)
    const currentConsumed = baseMaterialsConsumed.get(targetTokenId) || 0;
    baseMaterialsConsumed.set(targetTokenId, currentConsumed + targetAmount);

    // Don't deduct here - parent will deduct
    return true;
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
    const success = simulateCraftingWithTracking(
      input.tokenId,
      requiredAmount,
      availableMaterials,
      baseMaterialsConsumed,
    );

    if (!success) {
      return false; // Cannot obtain required input
    }
  }

  // Now consume the inputs (base resources were checked but not deducted, so deduct them here)
  for (const input of recipe.inputs) {
    const requiredAmount = input.amount * craftCount;
    const currentAvailable = availableMaterials.get(input.tokenId) || 0;
    availableMaterials.set(input.tokenId, currentAvailable - requiredAmount);
  }

  // Add the crafted items to available materials
  const newAvailable = currentlyAvailable + totalProduced;
  availableMaterials.set(targetTokenId, newAvailable);

  // Deduct what we needed
  availableMaterials.set(targetTokenId, newAvailable - targetAmount);

  return true;
}
