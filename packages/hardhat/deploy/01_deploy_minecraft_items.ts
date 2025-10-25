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
    // Using a placeholder that supports the {id} format for ERC1155
    args: ["https://game.example/api/item/{id}.json"],
    log: true,
    autoMine: true,
  });

  console.log("✅ MinecraftItems deployed to:", minecraftItems.address);

  // Get contract instance for initial setup
  const minecraftItemsContract = await ethers.getContractAt("MinecraftItems", minecraftItems.address);

  console.log("\n⚙️  Setting up initial crafting recipes...");

  /*
   * Token ID Schema (example):
   * 1 = Wooden Log (base resource)
   * 2 = Wooden Plank
   * 3 = Stick
   * 4 = Wooden Pickaxe
   * 5 = Stone
   * 6 = Stone Pickaxe
   * ... add more as needed
   */

  try {
    // Recipe 1: Wooden Log → Wooden Planks
    // 1 wooden log → 4 wooden planks
    console.log("📜 Adding recipe: Wooden Log → Wooden Planks (1 → 4)");
    const tx1 = await minecraftItemsContract.addRecipe(
      [1], // input: 1 wooden log
      [1], // amount: 1
      2, // output: wooden plank
      4, // amount: 4
    );
    await tx1.wait();
    console.log("   ✓ Recipe 0 added");

    // Recipe 2: Wooden Planks → Sticks
    // 2 wooden planks → 4 sticks
    console.log("📜 Adding recipe: Wooden Planks → Sticks (2 → 4)");
    const tx2 = await minecraftItemsContract.addRecipe(
      [2], // input: wooden planks
      [2], // amount: 2
      3, // output: sticks
      4, // amount: 4
    );
    await tx2.wait();
    console.log("   ✓ Recipe 1 added");

    // Recipe 3: Sticks + Wooden Planks → Wooden Pickaxe
    // 2 sticks + 3 wooden planks → 1 wooden pickaxe
    console.log("📜 Adding recipe: Sticks + Planks → Wooden Pickaxe (2 + 3 → 1)");
    const tx3 = await minecraftItemsContract.addRecipe(
      [3, 2], // inputs: sticks, planks
      [2, 3], // amounts: 2 sticks, 3 planks
      4, // output: wooden pickaxe
      1, // amount: 1
    );
    await tx3.wait();
    console.log("   ✓ Recipe 2 added");

    // Recipe 4: Sticks + Stone → Stone Pickaxe (example with stone)
    // 2 sticks + 3 stone → 1 stone pickaxe
    console.log("📜 Adding recipe: Sticks + Stone → Stone Pickaxe (2 + 3 → 1)");
    const tx4 = await minecraftItemsContract.addRecipe(
      [3, 5], // inputs: sticks, stone
      [2, 3], // amounts: 2 sticks, 3 stone
      6, // output: stone pickaxe
      1, // amount: 1
    );
    await tx4.wait();
    console.log("   ✓ Recipe 3 added");

    console.log("\n✅ All recipes added successfully!");

    // Optional: Mint some initial base resources to deployer for testing
    console.log("\n🎁 Minting initial base resources to deployer...");

    const mintTx = await minecraftItemsContract.mintInitialBatch(
      deployer,
      [1, 5], // Wooden logs and stone
      [100, 100], // 100 of each
    );
    await mintTx.wait();

    console.log("   ✓ Minted 100 wooden logs (ID: 1)");
    console.log("   ✓ Minted 100 stone (ID: 5)");

    // Display balances
    const logBalance = await minecraftItemsContract.balanceOf(deployer, 1);
    const stoneBalance = await minecraftItemsContract.balanceOf(deployer, 5);

    console.log("\n📊 Deployer balances:");
    console.log(`   - Wooden Logs: ${logBalance}`);
    console.log(`   - Stone: ${stoneBalance}`);

    console.log("\n🎉 MinecraftItems deployment and setup complete!");
    console.log("\n📝 Recipe Summary:");
    console.log("   0: 1 Wooden Log → 4 Wooden Planks");
    console.log("   1: 2 Wooden Planks → 4 Sticks");
    console.log("   2: 2 Sticks + 3 Planks → 1 Wooden Pickaxe");
    console.log("   3: 2 Sticks + 3 Stone → 1 Stone Pickaxe");

    console.log("\n🔍 Try crafting:");
    console.log("   - await minecraftItems.craft(0, 10) // Craft 10x wooden planks");
    console.log("   - await minecraftItems.craftByOutput(4, 1) // Craft 1 wooden pickaxe by output ID");
    console.log("   - await minecraftItems.bridge([1], [50]) // Bridge 50 wooden logs to game");
  } catch (error) {
    console.error("\n❌ Error during setup:", error);
    // Contract is still deployed, recipes can be added manually
  }
};

export default deployMinecraftItems;

// Tags are useful for selective deployment
deployMinecraftItems.tags = ["MinecraftItems"];
