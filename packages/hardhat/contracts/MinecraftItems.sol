// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MinecraftItems
 * @dev ERC1155 token contract for Minecraft Onchain Items with crafting and bridging features
 * @notice This contract implements a crafting system where users can burn input items to mint output items
 * and a bridging system to sync items with in-game inventory
 */
contract MinecraftItems is ERC1155, Ownable, ReentrancyGuard {
    // ============ Structures ============

    /**
     * @dev Structure representing a crafting recipe
     * @param inputTokenIds Array of token IDs required as inputs
     * @param inputAmounts Array of amounts required for each input token
     * @param outputTokenId The token ID of the crafted item
     * @param outputAmount Amount of output tokens produced per craft
     * @param exists Flag indicating if the recipe exists
     */
    struct CraftingRecipe {
        uint256[] inputTokenIds;
        uint256[] inputAmounts;
        uint256 outputTokenId;
        uint256 outputAmount;
        bool exists;
    }

    // ============ Storage ============

    /// @dev Mapping from recipe ID to CraftingRecipe
    mapping(uint256 => CraftingRecipe) private recipes;

    /// @dev Mapping from output token ID to recipe ID for quick lookup
    mapping(uint256 => uint256) public outputToRecipeId;

    /// @dev Counter for total recipes created
    uint256 public recipeCount;

    // ============ Events ============

    /**
     * @dev Emitted when a new crafting recipe is added
     */
    event RecipeAdded(
        uint256 indexed recipeId,
        uint256 indexed outputTokenId,
        uint256 outputAmount,
        uint256[] inputTokenIds,
        uint256[] inputAmounts
    );

    /**
     * @dev Emitted when a crafting recipe is removed
     */
    event RecipeRemoved(uint256 indexed recipeId, uint256 indexed outputTokenId);

    /**
     * @dev Emitted when items are crafted
     */
    event ItemsCrafted(
        address indexed crafter,
        uint256 indexed recipeId,
        uint256 times,
        uint256 outputTokenId,
        uint256 totalOutput
    );

    /**
     * @dev Emitted when items are bridged (burned for in-game use)
     * Game backend should listen to this event to add items to player's in-game inventory
     */
    event ItemsBridged(address indexed user, uint256[] tokenIds, uint256[] amounts);

    // ============ Constructor ============

    /**
     * @dev Constructor sets the metadata URI and initializes ownership
     * @param uri Base URI for token metadata (supports {id} placeholder)
     */
    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    // ============ Recipe Management Functions (Owner Only) ============

    /**
     * @dev Adds a new crafting recipe
     * @param inputTokenIds Array of required input token IDs
     * @param inputAmounts Array of required amounts for each input
     * @param outputTokenId The token ID of the output item
     * @param outputAmount Amount of output produced per craft
     *
     * Requirements:
     * - Caller must be the owner
     * - Input arrays must have the same length and not be empty
     * - Output token ID must not already have a recipe
     * - All amounts must be greater than zero
     */
    function addRecipe(
        uint256[] calldata inputTokenIds,
        uint256[] calldata inputAmounts,
        uint256 outputTokenId,
        uint256 outputAmount
    ) external onlyOwner {
        require(inputTokenIds.length > 0, "MinecraftItems: empty inputs");
        require(inputTokenIds.length == inputAmounts.length, "MinecraftItems: length mismatch");
        require(outputAmount > 0, "MinecraftItems: zero output amount");
        require(
            outputToRecipeId[outputTokenId] == 0 &&
            (recipeCount == 0 || recipes[outputToRecipeId[outputTokenId]].outputTokenId != outputTokenId),
            "MinecraftItems: recipe for output already exists"
        );

        // Validate all input amounts are greater than zero
        for (uint256 i = 0; i < inputAmounts.length; i++) {
            require(inputAmounts[i] > 0, "MinecraftItems: zero input amount");
        }

        uint256 recipeId = recipeCount++;

        // Store recipe
        recipes[recipeId] = CraftingRecipe({
            inputTokenIds: inputTokenIds,
            inputAmounts: inputAmounts,
            outputTokenId: outputTokenId,
            outputAmount: outputAmount,
            exists: true
        });

        // Map output token to recipe ID for quick lookup
        outputToRecipeId[outputTokenId] = recipeId;

        emit RecipeAdded(recipeId, outputTokenId, outputAmount, inputTokenIds, inputAmounts);
    }

    /**
     * @dev Removes an existing crafting recipe
     * @param recipeId The ID of the recipe to remove
     *
     * Requirements:
     * - Caller must be the owner
     * - Recipe must exist
     */
    function removeRecipe(uint256 recipeId) external onlyOwner {
        require(recipes[recipeId].exists, "MinecraftItems: recipe does not exist");

        uint256 outputTokenId = recipes[recipeId].outputTokenId;

        // Remove mapping
        delete outputToRecipeId[outputTokenId];
        delete recipes[recipeId];

        emit RecipeRemoved(recipeId, outputTokenId);
    }

    // ============ Crafting Functions (Public) ============

    /**
     * @dev Crafts items using a specific recipe ID with a multiplier
     * @param recipeId The ID of the recipe to use
     * @param times Number of times to craft (multiplier for inputs/outputs)
     *
     * Requirements:
     * - Recipe must exist
     * - Caller must have sufficient balance of all input items
     * - times must be greater than zero
     *
     * Effects:
     * - Burns input items (amounts * times)
     * - Mints output items (amount * times)
     */
    function craft(uint256 recipeId, uint256 times) external nonReentrant {
        require(times > 0, "MinecraftItems: times must be > 0");
        require(recipes[recipeId].exists, "MinecraftItems: recipe does not exist");

        CraftingRecipe storage recipe = recipes[recipeId];

        // Check balances and prepare arrays for batch burning
        uint256 inputCount = recipe.inputTokenIds.length;
        for (uint256 i = 0; i < inputCount; i++) {
            uint256 requiredAmount = recipe.inputAmounts[i] * times;
            require(
                balanceOf(msg.sender, recipe.inputTokenIds[i]) >= requiredAmount,
                "MinecraftItems: insufficient input balance"
            );
        }

        // Burn input items
        for (uint256 i = 0; i < inputCount; i++) {
            _burn(msg.sender, recipe.inputTokenIds[i], recipe.inputAmounts[i] * times);
        }

        // Mint output item
        uint256 totalOutput = recipe.outputAmount * times;
        _mint(msg.sender, recipe.outputTokenId, totalOutput, "");

        emit ItemsCrafted(msg.sender, recipeId, times, recipe.outputTokenId, totalOutput);
    }

    /**
     * @dev Convenience function to craft by specifying the desired output token ID
     * @param outputTokenId The token ID of the item to craft
     * @param times Number of times to craft
     *
     * Requirements:
     * - A recipe must exist for the output token ID
     * - Same requirements as craft()
     */
    function craftByOutput(uint256 outputTokenId, uint256 times) external nonReentrant {
        uint256 recipeId = outputToRecipeId[outputTokenId];
        require(recipes[recipeId].exists, "MinecraftItems: no recipe for output");
        require(recipes[recipeId].outputTokenId == outputTokenId, "MinecraftItems: invalid recipe mapping");

        require(times > 0, "MinecraftItems: times must be > 0");

        CraftingRecipe storage recipe = recipes[recipeId];

        // Check balances
        uint256 inputCount = recipe.inputTokenIds.length;
        for (uint256 i = 0; i < inputCount; i++) {
            uint256 requiredAmount = recipe.inputAmounts[i] * times;
            require(
                balanceOf(msg.sender, recipe.inputTokenIds[i]) >= requiredAmount,
                "MinecraftItems: insufficient input balance"
            );
        }

        // Burn input items
        for (uint256 i = 0; i < inputCount; i++) {
            _burn(msg.sender, recipe.inputTokenIds[i], recipe.inputAmounts[i] * times);
        }

        // Mint output item
        uint256 totalOutput = recipe.outputAmount * times;
        _mint(msg.sender, recipe.outputTokenId, totalOutput, "");

        emit ItemsCrafted(msg.sender, recipeId, times, recipe.outputTokenId, totalOutput);
    }

    // ============ Bridge Functions (Public) ============

    /**
     * @dev Burns tokens onchain and emits event for game backend to sync with in-game inventory
     * @param tokenIds Array of token IDs to bridge
     * @param amounts Array of amounts to bridge for each token ID
     *
     * Requirements:
     * - Arrays must have the same length and not be empty
     * - Caller must have sufficient balance of all tokens
     * - All amounts must be greater than zero
     *
     * Effects:
     * - Burns specified tokens
     * - Emits ItemsBridged event for game backend to process
     */
    function bridge(uint256[] calldata tokenIds, uint256[] calldata amounts) external nonReentrant {
        require(tokenIds.length > 0, "MinecraftItems: empty arrays");
        require(tokenIds.length == amounts.length, "MinecraftItems: length mismatch");

        // Validate amounts and balances
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(amounts[i] > 0, "MinecraftItems: zero amount");
            require(
                balanceOf(msg.sender, tokenIds[i]) >= amounts[i],
                "MinecraftItems: insufficient balance"
            );
        }

        // Burn tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _burn(msg.sender, tokenIds[i], amounts[i]);
        }

        emit ItemsBridged(msg.sender, tokenIds, amounts);
    }

    // ============ View Functions ============

    /**
     * @dev Returns the complete recipe for a given recipe ID
     * @param recipeId The ID of the recipe to query
     * @return inputTokenIds Array of input token IDs
     * @return inputAmounts Array of input amounts
     * @return outputTokenId The output token ID
     * @return outputAmount The output amount
     * @return exists Whether the recipe exists
     */
    function getRecipe(uint256 recipeId)
        external
        view
        returns (
            uint256[] memory inputTokenIds,
            uint256[] memory inputAmounts,
            uint256 outputTokenId,
            uint256 outputAmount,
            bool exists
        )
    {
        CraftingRecipe storage recipe = recipes[recipeId];
        return (
            recipe.inputTokenIds,
            recipe.inputAmounts,
            recipe.outputTokenId,
            recipe.outputAmount,
            recipe.exists
        );
    }

    /**
     * @dev Returns the recipe ID and details for a given output token ID
     * @param outputTokenId The token ID to query
     * @return recipeId The recipe ID for this output
     * @return inputTokenIds Array of input token IDs
     * @return inputAmounts Array of input amounts
     * @return outputAmount The output amount
     * @return exists Whether the recipe exists
     */
    function getRecipeByOutput(uint256 outputTokenId)
        external
        view
        returns (
            uint256 recipeId,
            uint256[] memory inputTokenIds,
            uint256[] memory inputAmounts,
            uint256 outputAmount,
            bool exists
        )
    {
        recipeId = outputToRecipeId[outputTokenId];
        CraftingRecipe storage recipe = recipes[recipeId];

        // Verify the mapping is correct
        if (recipe.exists && recipe.outputTokenId == outputTokenId) {
            return (recipeId, recipe.inputTokenIds, recipe.inputAmounts, recipe.outputAmount, true);
        }

        return (0, new uint256[](0), new uint256[](0), 0, false);
    }

    /**
     * @dev Checks if a recipe exists
     * @param recipeId The recipe ID to check
     * @return exists Whether the recipe exists
     */
    function recipeExists(uint256 recipeId) external view returns (bool) {
        return recipes[recipeId].exists;
    }

    /**
     * @dev Checks if a user can craft a specific recipe a certain number of times
     * @param user The address to check
     * @param recipeId The recipe ID to check
     * @param times Number of times to craft
     * @return canCraft Whether the user has sufficient materials
     */
    function canCraft(address user, uint256 recipeId, uint256 times) external view returns (bool) {
        if (!recipes[recipeId].exists || times == 0) {
            return false;
        }

        CraftingRecipe storage recipe = recipes[recipeId];
        uint256 inputCount = recipe.inputTokenIds.length;

        for (uint256 i = 0; i < inputCount; i++) {
            uint256 requiredAmount = recipe.inputAmounts[i] * times;
            if (balanceOf(user, recipe.inputTokenIds[i]) < requiredAmount) {
                return false;
            }
        }

        return true;
    }

    // ============ Admin Functions ============

    /**
     * @dev Mints initial/base resources to an address (owner only)
     * @param to Address to mint to
     * @param tokenId Token ID to mint
     * @param amount Amount to mint
     *
     * Requirements:
     * - Caller must be the owner
     */
    function mintInitial(address to, uint256 tokenId, uint256 amount) external onlyOwner {
        require(to != address(0), "MinecraftItems: mint to zero address");
        require(amount > 0, "MinecraftItems: zero amount");
        _mint(to, tokenId, amount, "");
    }

    /**
     * @dev Mints initial/base resources in batch (owner only)
     * @param to Address to mint to
     * @param tokenIds Array of token IDs to mint
     * @param amounts Array of amounts to mint
     *
     * Requirements:
     * - Caller must be the owner
     * - Arrays must have the same length
     */
    function mintInitialBatch(
        address to,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(to != address(0), "MinecraftItems: mint to zero address");
        require(tokenIds.length == amounts.length, "MinecraftItems: length mismatch");
        _mintBatch(to, tokenIds, amounts, "");
    }

    /**
     * @dev Updates the metadata URI (owner only)
     * @param newuri New base URI for token metadata
     *
     * Requirements:
     * - Caller must be the owner
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
