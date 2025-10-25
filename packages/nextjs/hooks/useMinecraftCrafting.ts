import { useEffect } from "react";
import { useScaffoldReadContract, useScaffoldWatchContractEvent, useScaffoldWriteContract } from "./scaffold-eth";
import { zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { useCraftingStore } from "~~/services/store/inventoryStore";
import { ALL_TOKEN_IDS } from "~~/services/web3/itemConfig";
import { notification } from "~~/utils/scaffold-eth";

/**
 * Unified hook for MinecraftItems contract interactions
 * Provides read, write, and event listening capabilities
 */
export const useMinecraftCrafting = () => {
  const { address } = useAccount();

  const { setTxStatus, syncInventoryFromChain } = useCraftingStore();

  // ============ Read Operations ============

  /**
   * Fetch player's inventory for all tokens
   * Uses balanceOfBatch for efficient batch reading
   */
  const { data: balances, refetch: refetchBalances } = useScaffoldReadContract({
    contractName: "MinecraftItems",
    functionName: "balanceOfBatch",
    args: address ? [Array(ALL_TOKEN_IDS.length).fill(address), ALL_TOKEN_IDS] : [[], []],
    watch: true, // Auto-update on new blocks
    query: { enabled: Boolean(address) },
  });

  /**
   * Get recipe details for a specific output token ID
   */
  const useRecipe = (outputTokenId: bigint | undefined) => {
    const enabled = outputTokenId !== undefined;
    return useScaffoldReadContract({
      contractName: "MinecraftItems",
      functionName: "getRecipe",
      args: enabled ? [outputTokenId] : [0n],
      query: { enabled },
    });
  };

  /**
   * Check if player can craft a specific recipe
   */
  const useCanCraft = (outputTokenId: bigint | undefined, times: bigint = 1n) => {
    const enabled = Boolean(address && outputTokenId !== undefined);
    return useScaffoldReadContract({
      contractName: "MinecraftItems",
      functionName: "canCraft",
      args: enabled ? [address, outputTokenId, times] : [zeroAddress, 0n, 0n],
      query: { enabled },
    });
  };

  /**
   * Check if a recipe exists
   */
  const useRecipeExists = (outputTokenId: bigint | undefined) => {
    const enabled = outputTokenId !== undefined;
    return useScaffoldReadContract({
      contractName: "MinecraftItems",
      functionName: "recipeExists",
      args: enabled ? [outputTokenId] : [0n],
      query: { enabled },
    });
  };

  // ============ Write Operations ============

  const {
    writeContractAsync: writeCraft,
    isMining: isCrafting,
    isPending: isCraftPending,
  } = useScaffoldWriteContract({
    contractName: "MinecraftItems",
  });

  /**
   * Execute crafting transaction
   * @param outputTokenId The token ID of the item to craft
   * @param times Number of times to craft (multiplier)
   */
  const craftOnChain = async (outputTokenId: bigint, times: bigint = 1n) => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      setTxStatus("pending", null, null);

      const txHash = await writeCraft({
        functionName: "craft",
        args: [outputTokenId, times],
      });

      if (txHash) {
        setTxStatus("success", txHash, null);
        notification.success("Crafting successful!");
        // Refetch balances after successful craft
        await refetchBalances();
      }

      return txHash;
    } catch (error: any) {
      const errorMsg = parseContractError(error);
      setTxStatus("error", null, errorMsg);
      notification.error(errorMsg);
      throw error;
    }
  };

  /**
   * Execute aggregated multi-step crafting
   * @param proxyIds Array of token IDs to craft in sequence
   * @param proxyAmounts Array of craft multipliers for each step
   */
  const aggrCraftOnChain = async (proxyIds: bigint[], proxyAmounts: bigint[]) => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      setTxStatus("pending", null, null);

      const txHash = await writeCraft({
        functionName: "aggrCraft",
        args: [proxyIds, proxyAmounts],
      });

      if (txHash) {
        setTxStatus("success", txHash, null);
        notification.success("Multi-step crafting successful!");
        await refetchBalances();
      }

      return txHash;
    } catch (error: any) {
      const errorMsg = parseContractError(error);
      setTxStatus("error", null, errorMsg);
      notification.error(errorMsg);
      throw error;
    }
  };

  /**
   * Bridge items to in-game inventory
   * Burns tokens on-chain and emits event for game backend
   */
  const bridgeToGame = async (tokenIds: bigint[], amounts: bigint[]) => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      setTxStatus("pending", null, null);

      const txHash = await writeCraft({
        functionName: "bridge",
        args: [tokenIds, amounts],
      });

      if (txHash) {
        setTxStatus("success", txHash, null);
        notification.success("Items bridged to game!");
        await refetchBalances();
      }

      return txHash;
    } catch (error: any) {
      const errorMsg = parseContractError(error);
      setTxStatus("error", null, errorMsg);
      notification.error(errorMsg);
      throw error;
    }
  };

  // ============ Event Listeners ============

  /**
   * Listen for ItemsCrafted events
   * Auto-refresh inventory when player crafts items
   */
  useScaffoldWatchContractEvent({
    contractName: "MinecraftItems",
    eventName: "ItemsCrafted",
    onLogs: logs => {
      logs.forEach(log => {
        const { crafter } = log.args;
        if (crafter?.toLowerCase() === address?.toLowerCase()) {
          // Player crafted something, refresh inventory
          refetchBalances();
        }
      });
    },
  });

  /**
   * Listen for ItemsBridged events
   */
  useScaffoldWatchContractEvent({
    contractName: "MinecraftItems",
    eventName: "ItemsBridged",
    onLogs: logs => {
      logs.forEach(log => {
        const { user } = log.args;
        if (user?.toLowerCase() === address?.toLowerCase()) {
          // Player bridged items, refresh inventory
          refetchBalances();
        }
      });
    },
  });

  // ============ Sync Inventory to Zustand ============

  useEffect(() => {
    if (balances && balances.length === ALL_TOKEN_IDS.length) {
      syncInventoryFromChain(balances);
    }
  }, [balances, syncInventoryFromChain]);

  return {
    // State
    address,
    balances,
    isCrafting: isCrafting || isCraftPending,

    // Read functions
    useRecipe,
    useCanCraft,
    useRecipeExists,

    // Write functions
    craftOnChain,
    aggrCraftOnChain,
    bridgeToGame,

    // Utilities
    refetchBalances,
  };
};

/**
 * Parse contract error messages into user-friendly text
 */
function parseContractError(error: any): string {
  const errorMessage = error?.message || error?.toString() || "Unknown error";

  if (errorMessage.includes("insufficient input balance")) {
    return "Not enough materials to craft this item!";
  }
  if (errorMessage.includes("recipe does not exist")) {
    return "Invalid recipe pattern";
  }
  if (errorMessage.includes("times must be > 0")) {
    return "Invalid craft amount";
  }
  if (errorMessage.includes("insufficient balance")) {
    return "Insufficient balance";
  }
  if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
    return "Transaction cancelled";
  }
  if (errorMessage.includes("network")) {
    return "Network error - please try again";
  }

  return "Transaction failed - please try again";
}
