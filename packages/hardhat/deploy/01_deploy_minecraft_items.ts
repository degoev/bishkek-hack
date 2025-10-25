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
    // Recipe for Token ID 2: Wooden Log → Wooden Planks
    // 1 wooden log → 4 wooden planks
    console.log("📜 Adding recipe for Wooden Planks (ID 2): 1 Log → 4 Planks");
    const tx1 = await minecraftItemsContract.addRecipe(
      [1], // input: 1 wooden log
      [1], // amount: 1
      2, // output: wooden plank (token ID 2)
      4, // amount: 4
    );
    await tx1.wait();
    console.log("   ✓ Recipe for token ID 2 added");

    // Recipe for Token ID 3: Wooden Planks → Sticks
    // 2 wooden planks → 4 sticks
    console.log("📜 Adding recipe for Sticks (ID 3): 2 Planks → 4 Sticks");
    const tx2 = await minecraftItemsContract.addRecipe(
      [2], // input: wooden planks
      [2], // amount: 2
      3, // output: sticks (token ID 3)
      4, // amount: 4
    );
    await tx2.wait();
    console.log("   ✓ Recipe for token ID 3 added");

    // Recipe for Token ID 4: Sticks + Wooden Planks → Wooden Pickaxe
    // 2 sticks + 3 wooden planks → 1 wooden pickaxe
    console.log("📜 Adding recipe for Wooden Pickaxe (ID 4): 2 Sticks + 3 Planks → 1 Pickaxe");
    const tx3 = await minecraftItemsContract.addRecipe(
      [3, 2], // inputs: sticks, planks
      [2, 3], // amounts: 2 sticks, 3 planks
      4, // output: wooden pickaxe (token ID 4)
      1, // amount: 1
    );
    await tx3.wait();
    console.log("   ✓ Recipe for token ID 4 added");

    // Recipe for Token ID 6: Sticks + Stone → Stone Pickaxe
    // 2 sticks + 3 stone → 1 stone pickaxe
    console.log("📜 Adding recipe for Stone Pickaxe (ID 6): 2 Sticks + 3 Stone → 1 Pickaxe");
    const tx4 = await minecraftItemsContract.addRecipe(
      [3, 5], // inputs: sticks, stone
      [2, 3], // amounts: 2 sticks, 3 stone
      6, // output: stone pickaxe (token ID 6)
      1, // amount: 1
    );
    await tx4.wait();
    console.log("   ✓ Recipe for token ID 6 added");

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
    console.log("\n📝 Recipe Summary (by token ID):");
    console.log("   Token 2 (Planks):  1 Log → 4 Planks");
    console.log("   Token 3 (Sticks):  2 Planks → 4 Sticks");
    console.log("   Token 4 (Wooden Pickaxe): 2 Sticks + 3 Planks → 1 Pickaxe");
    console.log("   Token 6 (Stone Pickaxe):  2 Sticks + 3 Stone → 1 Pickaxe");

    console.log("\n🔍 Try crafting:");
    console.log("   - await minecraftItems.craft(2, 10) // Craft 10x wooden planks (token ID 2)");
    console.log("   - await minecraftItems.craft(4, 1)  // Craft 1 wooden pickaxe (token ID 4)");
    console.log("   - await minecraftItems.bridge([1], [50]) // Bridge 50 wooden logs to game");
  } catch (error) {
    console.error("\n❌ Error during setup:", error);
    // Contract is still deployed, recipes can be added manually
  }
};

export default deployMinecraftItems;

// Tags are useful for selective deployment
deployMinecraftItems.tags = ["MinecraftItems"];
