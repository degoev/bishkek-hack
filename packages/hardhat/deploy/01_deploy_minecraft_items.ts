import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

/**
 * Deploys the MinecraftItems ERC1155 contract with initial crafting recipes
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMinecraftItems: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🎮 Deploying MinecraftItems contract...");

  // Deploy MinecraftItems contract
  const minecraftItems = await deploy("MinecraftItems", {
    from: deployer,
    // Metadata URI - can be updated later with setURI()
    // Base URI (contract will append tokenId + ".json" automatically)
    args: ["https://game.example/api/item/"],
    log: true,
    autoMine: true,
  });

  console.log("✅ MinecraftItems deployed to:", minecraftItems.address);

  // Get contract instance for initial setup
  const minecraftItemsContract = await ethers.getContractAt("MinecraftItems", minecraftItems.address);

  console.log("\n⚙️  Setting up initial crafting recipes...");

  // Token ID to name mapping
  const itemNames: Record<number, string> = {
    1: "Wooden Log",
    2: "Wooden Plank",
    3: "Stick",
    4: "Wooden Pickaxe",
    5: "Diamond",
    6: "Diamond Pickaxe",
    7: "Diamond Sword",
  };

  // Recipe configurations
  interface RecipeConfig {
    outputTokenId: number;
    outputName: string;
    outputAmount: number;
    inputs: Array<{
      tokenId: number;
      name: string;
      amount: number;
    }>;
  }

  const recipes: RecipeConfig[] = [
    {
      outputTokenId: 2,
      outputName: itemNames[2],
      outputAmount: 4,
      inputs: [{ tokenId: 1, name: itemNames[1], amount: 1 }],
    },
    {
      outputTokenId: 3,
      outputName: itemNames[3],
      outputAmount: 4,
      inputs: [{ tokenId: 2, name: itemNames[2], amount: 2 }],
    },
    {
      outputTokenId: 4,
      outputName: itemNames[4],
      outputAmount: 1,
      inputs: [
        { tokenId: 3, name: itemNames[3], amount: 2 },
        { tokenId: 2, name: itemNames[2], amount: 3 },
      ],
    },
    {
      outputTokenId: 6,
      outputName: itemNames[6],
      outputAmount: 1,
      inputs: [
        { tokenId: 3, name: itemNames[3], amount: 2 },
        { tokenId: 5, name: itemNames[5], amount: 3 },
      ],
    },
    {
      outputTokenId: 7,
      outputName: itemNames[7],
      outputAmount: 1,
      inputs: [
        { tokenId: 3, name: itemNames[3], amount: 2 },
        { tokenId: 5, name: itemNames[5], amount: 3 },
      ],
    },
  ];

  try {
    // Add all recipes
    for (const recipe of recipes) {
      // Build input description for logging
      const inputDesc = recipe.inputs.map(input => `${input.amount} ${input.name}`).join(" + ");
      const outputDesc = `${recipe.outputAmount} ${recipe.outputName}`;

      console.log(
        `📜 Adding recipe for ${recipe.outputName} (ID ${recipe.outputTokenId}): ${inputDesc} → ${outputDesc}`,
      );

      const tx = await minecraftItemsContract.addRecipe(
        recipe.inputs.map(input => input.tokenId),
        recipe.inputs.map(input => input.amount),
        recipe.outputTokenId,
        recipe.outputAmount,
      );
      await tx.wait();

      console.log(`   ✓ Recipe for token ID ${recipe.outputTokenId} added`);
    }

    console.log("\n✅ All recipes added successfully!");

    // Optional: Mint some initial base resources to deployer for testing
    console.log("\n🎁 Minting initial base resources to deployer...");

    const baseResourceIds = [1, 5]; // Wooden Log, Diamond
    const baseResourceAmounts = [100, 100];

    const mintTx = await minecraftItemsContract.mintInitialBatch(deployer, baseResourceIds, baseResourceAmounts);
    await mintTx.wait();

    baseResourceIds.forEach((id, index) => {
      console.log(`   ✓ Minted ${baseResourceAmounts[index]} ${itemNames[id]} (ID: ${id})`);
    });

    // Display balances
    console.log("\n📊 Deployer balances:");
    for (const id of baseResourceIds) {
      const balance = await minecraftItemsContract.balanceOf(deployer, id);
      console.log(`   - ${itemNames[id]}: ${balance}`);
    }

    console.log("\n🎉 MinecraftItems deployment and setup complete!");
    console.log("\n📝 Recipe Summary (by token ID):");
    recipes.forEach(recipe => {
      const inputDesc = recipe.inputs.map(input => `${input.amount} ${input.name}`).join(" + ");
      const outputDesc = `${recipe.outputAmount} ${recipe.outputName}`;
      console.log(`   Token ${recipe.outputTokenId} (${recipe.outputName}): ${inputDesc} → ${outputDesc}`);
    });

    console.log("\n🔍 Try crafting:");
    console.log(`   - await minecraftItems.craft(2, 10) // Craft 10x ${itemNames[2]}`);
    console.log(`   - await minecraftItems.craft(4, 1)  // Craft 1 ${itemNames[4]}`);
    console.log(`   - await minecraftItems.bridge([1], [50]) // Bridge 50 ${itemNames[1]} to game`);
  } catch (error) {
    console.error("\n❌ Error during setup:", error);
    // Contract is still deployed, recipes can be added manually
  }
};

export default deployMinecraftItems;

// Tags are useful for selective deployment
deployMinecraftItems.tags = ["MinecraftItems"];
