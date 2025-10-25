# Minecraft Onchain Items

## Description

This Hardhat project implements the **Minecraft Onchain Items** standard – an ERC1155 smart contract with advanced crafting and bridging features.

**Key Features:**

- **Crafting System:** Burn input items to mint output items using the `craft()` method (e.g., burn 2 sticks + 3 planks → mint 1 pickaxe)
- **Batch Crafting:** Support for crafting multipliers to create multiple items in one transaction
- **Bridge System:** Burn items onchain using `bridge()` to sync with in-game inventory via emitted events
- **Recipe Management:** Flexible recipe system for defining complex crafting chains
- **Gas Optimized:** Efficient batch operations and storage patterns

## Smart Contract Architecture

### MinecraftItems.sol

ERC1155 token contract extending OpenZeppelin's implementations with:

- `Ownable` - Owner-only recipe management
- `ReentrancyGuard` - Protection against reentrancy attacks

### Storage Structure

```solidity
struct CraftingRecipe {
    uint256[] inputTokenIds;    // Required input token IDs
    uint256[] inputAmounts;     // Required amounts for each input
    uint256 outputTokenId;      // The crafted item ID
    uint256 outputAmount;       // Amount produced per craft
    bool exists;                // Recipe existence flag
}
```

**Mappings:**

- `recipes[recipeId]` - Recipe ID to recipe details
- `outputToRecipeId[tokenId]` - Quick lookup from output token to recipe ID
- `recipeCount` - Total number of recipes created

## Usage Examples

### Deployment

```bash
# Deploy with initial recipes
yarn deploy

# Deploy to specific network
yarn deploy --network sepolia
```

### Recipe Management (Owner Only)

```javascript
const minecraftItems = await ethers.getContractAt("MinecraftItems", contractAddress);

// Add recipe: 1 wooden log → 4 wooden planks
await minecraftItems.addRecipe(
  [1], // input token IDs
  [1], // input amounts
  2, // output token ID (wooden plank)
  4, // output amount
);

// Add recipe with multiple inputs: 2 sticks + 3 planks → 1 pickaxe
await minecraftItems.addRecipe([3, 2], [2, 3], 4, 1);

// Remove a recipe
await minecraftItems.removeRecipe(0);
```

### Crafting

```javascript
// Craft using recipe ID (1x)
await minecraftItems.craft(0, 1);

// Craft multiple times (10x wooden planks)
await minecraftItems.craft(0, 10);

// Craft by specifying output token ID
await minecraftItems.craftByOutput(2, 5); // Craft 5x wooden planks
```

### Bridging to Game

```javascript
// Bridge single item to game
await minecraftItems.bridge([1], [50]); // Bridge 50 wooden logs

// Bridge multiple items
await minecraftItems.bridge(
  [1, 2, 3], // wooden logs, planks, sticks
  [10, 20, 15], // amounts
);

// Game backend listens to ItemsBridged events:
// event ItemsBridged(address indexed user, uint256[] tokenIds, uint256[] amounts)
```

### Querying Recipes

```javascript
// Get recipe by ID
const recipe = await minecraftItems.getRecipe(0);
console.log(`Inputs: ${recipe.inputTokenIds}, Amounts: ${recipe.inputAmounts}`);
console.log(`Output: ${recipe.outputTokenId}, Amount: ${recipe.outputAmount}`);

// Get recipe by output token ID
const recipeByOutput = await minecraftItems.getRecipeByOutput(2);
console.log(`Recipe ID: ${recipeByOutput.recipeId}`);

// Check if user can craft
const canCraft = await minecraftItems.canCraft(playerAddress, 0, 10);
console.log(`Can craft 10x: ${canCraft}`);

// Check if recipe exists
const exists = await minecraftItems.recipeExists(0);
```

### Minting Initial Resources (Owner Only)

```javascript
// Mint single resource
await minecraftItems.mintInitial(playerAddress, 1, 100); // 100 wooden logs

// Mint multiple resources
await minecraftItems.mintInitialBatch(
  playerAddress,
  [1, 5], // wooden logs, stone
  [100, 50], // amounts
);
```

## Token ID Schema (Example)

| ID  | Item           | Type    | Description              |
| --- | -------------- | ------- | ------------------------ |
| 1   | Wooden Log     | Base    | Base resource            |
| 2   | Wooden Plank   | Crafted | From 1 log               |
| 3   | Stick          | Crafted | From 2 planks            |
| 4   | Wooden Pickaxe | Tool    | From 2 sticks + 3 planks |
| 5   | Stone          | Base    | Base resource            |
| 6   | Stone Pickaxe  | Tool    | From 2 sticks + 3 stone  |

## Crafting Chain Example

```
Wooden Log (1)
    ↓ craft(0, 1)
Wooden Planks (4)
    ↓ craft(1, 1) [use 2 planks]
Sticks (4)
    ↓ craft(2, 1) [use 2 sticks + 3 planks]
Wooden Pickaxe (1)
    ↓ bridge([4], [1])
In-Game Inventory
```

## Testing

```bash
# Run all tests
yarn test

# Run with gas reporting
REPORT_GAS=true yarn test

# Run specific test file
yarn test test/MinecraftItems.ts
```

### Test Coverage

- ✅ Recipe management (add, remove, validation)
- ✅ Single and batch crafting
- ✅ Crafting multipliers
- ✅ Complex crafting chains
- ✅ Bridge system
- ✅ View functions
- ✅ Access control
- ✅ Error cases and edge conditions
- ✅ Integration scenarios

## Events

### RecipeAdded

```solidity
event RecipeAdded(
    uint256 indexed recipeId,
    uint256 indexed outputTokenId,
    uint256 outputAmount,
    uint256[] inputTokenIds,
    uint256[] inputAmounts
);
```

### RecipeRemoved

```solidity
event RecipeRemoved(
    uint256 indexed recipeId,
    uint256 indexed outputTokenId
);
```

### ItemsCrafted

```solidity
event ItemsCrafted(
    address indexed crafter,
    uint256 indexed recipeId,
    uint256 times,
    uint256 outputTokenId,
    uint256 totalOutput
);
```

### ItemsBridged

```solidity
event ItemsBridged(
    address indexed user,
    uint256[] tokenIds,
    uint256[] amounts
);
```

**Game Backend Integration:** Listen to `ItemsBridged` events to add items to player's in-game inventory.

## Security Features

- ✅ **ReentrancyGuard:** Protects `craft()` and `bridge()` functions
- ✅ **Ownable:** Restricts recipe management to owner
- ✅ **Input Validation:** Comprehensive checks on all parameters
- ✅ **Balance Checks:** Ensures sufficient materials before crafting
- ✅ **Overflow Protection:** Solidity 0.8.20+ built-in protection

## Gas Optimization

- Uses `calldata` for array parameters
- Batch operations in crafting with multipliers
- Efficient storage layout with mappings
- Early validation before expensive operations

## Development

### Project Structure

```
contracts/
  └── MinecraftItems.sol      # Main ERC1155 contract
deploy/
  └── 01_deploy_minecraft_items.ts  # Deployment script with initial recipes
test/
  └── MinecraftItems.ts       # Comprehensive test suite
```

### Commands

```bash
# Compile contracts
yarn compile

# Deploy locally
yarn chain          # Terminal 1
yarn deploy         # Terminal 2

# Run tests
yarn test

# Deploy to testnet
yarn deploy --network sepolia

# Verify contract
yarn verify --network sepolia
```

## Frontend Integration

The contract ABIs are auto-generated to `../nextjs/contracts/deployedContracts.ts` after deployment. Use Scaffold-ETH hooks:

```typescript
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// Read recipe
const { data: recipe } = useScaffoldReadContract({
  contractName: "MinecraftItems",
  functionName: "getRecipe",
  args: [BigInt(0)],
});

// Craft items
const { writeContractAsync } = useScaffoldWriteContract("MinecraftItems");
await writeContractAsync({
  functionName: "craft",
  args: [BigInt(0), BigInt(10)],
});
```

## Future Enhancements

- [ ] NFT support for unique items (ERC721)
- [ ] Durability system for tools
- [ ] Recipe discovery/unlocking system
- [ ] Governance for recipe management
- [ ] Cross-chain bridging
- [ ] Staking/farming mechanics

## License

MIT
