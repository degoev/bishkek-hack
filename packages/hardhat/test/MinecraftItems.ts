import { expect } from "chai";
import { ethers } from "hardhat";
import { MinecraftItems } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MinecraftItems", function () {
  let minecraftItems: MinecraftItems;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;

  // Token IDs
  const WOODEN_LOG = 1n;
  const WOODEN_PLANK = 2n;
  const STICK = 3n;
  const WOODEN_PICKAXE = 4n;
  const STONE = 5n;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const MinecraftItemsFactory = await ethers.getContractFactory("MinecraftItems");
    minecraftItems = await MinecraftItemsFactory.deploy("https://game.example/api/item/");
    await minecraftItems.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await minecraftItems.owner()).to.equal(owner.address);
    });

    it("Should have correct URI", async function () {
      // Check URI for token ID 1 (wooden log)
      expect(await minecraftItems.uri(WOODEN_LOG)).to.equal("https://game.example/api/item/1.json");

      // Check URI for token ID 5 (stone)
      expect(await minecraftItems.uri(STONE)).to.equal("https://game.example/api/item/5.json");
    });
  });

  describe("Recipe Management", function () {
    describe("Adding Recipes", function () {
      it("Should allow owner to add a recipe", async function () {
        await expect(minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n)).to.emit(
          minecraftItems,
          "RecipeAdded",
        );

        const recipe = await minecraftItems.getRecipe(WOODEN_PLANK);
        expect(recipe.exists).to.be.true;
        expect(recipe.outputTokenId).to.equal(WOODEN_PLANK);
        expect(recipe.outputAmount).to.equal(4n);
      });

      it("Should allow adding recipe with multiple inputs", async function () {
        await minecraftItems.addRecipe([STICK, WOODEN_PLANK], [2n, 3n], WOODEN_PICKAXE, 1n);

        const recipe = await minecraftItems.getRecipe(WOODEN_PICKAXE);
        expect(recipe.inputTokenIds).to.deep.equal([STICK, WOODEN_PLANK]);
        expect(recipe.inputAmounts).to.deep.equal([2n, 3n]);
      });

      it("Should store recipe directly by output token ID", async function () {
        await minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n);

        expect(await minecraftItems.recipeExists(WOODEN_PLANK)).to.be.true;

        const recipe = await minecraftItems.getRecipe(WOODEN_PLANK);
        expect(recipe.exists).to.be.true;
        expect(recipe.outputTokenId).to.equal(WOODEN_PLANK);
      });

      it("Should prevent non-owner from adding recipes", async function () {
        await expect(
          minecraftItems.connect(player1).addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n),
        ).to.be.revertedWithCustomError(minecraftItems, "OwnableUnauthorizedAccount");
      });

      it("Should reject empty input arrays", async function () {
        await expect(minecraftItems.addRecipe([], [], WOODEN_PLANK, 4n)).to.be.revertedWith(
          "MinecraftItems: empty inputs",
        );
      });

      it("Should reject mismatched array lengths", async function () {
        await expect(minecraftItems.addRecipe([WOODEN_LOG, STICK], [1n], WOODEN_PLANK, 4n)).to.be.revertedWith(
          "MinecraftItems: length mismatch",
        );
      });

      it("Should reject zero output amount", async function () {
        await expect(minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 0n)).to.be.revertedWith(
          "MinecraftItems: zero output amount",
        );
      });

      it("Should reject zero input amount", async function () {
        await expect(minecraftItems.addRecipe([WOODEN_LOG], [0n], WOODEN_PLANK, 4n)).to.be.revertedWith(
          "MinecraftItems: zero input amount",
        );
      });

      it("Should prevent duplicate recipes for same output", async function () {
        await minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n);

        await expect(minecraftItems.addRecipe([WOODEN_LOG], [2n], WOODEN_PLANK, 2n)).to.be.revertedWith(
          "MinecraftItems: recipe for output already exists",
        );
      });
    });

    describe("Removing Recipes", function () {
      beforeEach(async function () {
        await minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n);
      });

      it("Should allow owner to remove a recipe", async function () {
        await expect(minecraftItems.removeRecipe(WOODEN_PLANK))
          .to.emit(minecraftItems, "RecipeRemoved")
          .withArgs(WOODEN_PLANK);

        const recipe = await minecraftItems.getRecipe(WOODEN_PLANK);
        expect(recipe.exists).to.be.false;
      });

      it("Should prevent non-owner from removing recipes", async function () {
        await expect(minecraftItems.connect(player1).removeRecipe(WOODEN_PLANK)).to.be.revertedWithCustomError(
          minecraftItems,
          "OwnableUnauthorizedAccount",
        );
      });

      it("Should reject removing non-existent recipe", async function () {
        await expect(minecraftItems.removeRecipe(999)).to.be.revertedWith("MinecraftItems: recipe does not exist");
      });
    });
  });

  describe("Crafting", function () {
    beforeEach(async function () {
      // Setup recipes: Log → Planks → Sticks, Pickaxe
      await minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n); // Recipe 0
      await minecraftItems.addRecipe([WOODEN_PLANK], [2n], STICK, 4n); // Recipe 1
      await minecraftItems.addRecipe([STICK, WOODEN_PLANK], [2n, 3n], WOODEN_PICKAXE, 1n); // Recipe 2

      // Mint initial resources to player1
      await minecraftItems.mintInitial(player1.address, WOODEN_LOG, 100n);
    });

    describe("Basic Crafting", function () {
      it("Should allow crafting with sufficient materials", async function () {
        await expect(minecraftItems.connect(player1).craft(WOODEN_PLANK, 1))
          .to.emit(minecraftItems, "ItemsCrafted")
          .withArgs(player1.address, WOODEN_PLANK, 4n);

        expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(99n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(4n);
      });

      it("Should support crafting multiple times (multiplier)", async function () {
        await minecraftItems.connect(player1).craft(WOODEN_PLANK, 10);

        expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(90n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(40n);
      });

      it("Should allow direct crafting using token ID", async function () {
        await minecraftItems.connect(player1).craft(WOODEN_PLANK, 5);

        expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(95n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(20n);
      });

      it("Should reject crafting with insufficient materials", async function () {
        await expect(minecraftItems.connect(player1).craft(WOODEN_PLANK, 101)).to.be.revertedWith(
          "MinecraftItems: insufficient input balance",
        );
      });

      it("Should reject crafting with zero times", async function () {
        await expect(minecraftItems.connect(player1).craft(WOODEN_PLANK, 0)).to.be.revertedWith(
          "MinecraftItems: times must be > 0",
        );
      });

      it("Should reject crafting non-existent recipe", async function () {
        await expect(minecraftItems.connect(player1).craft(999, 1)).to.be.revertedWith(
          "MinecraftItems: recipe does not exist",
        );
      });
    });

    describe("Complex Crafting Chains", function () {
      it("Should allow full crafting chain: Log → Planks → Sticks → Pickaxe", async function () {
        // Step 1: Log → Planks (1 log → 4 planks)
        await minecraftItems.connect(player1).craft(WOODEN_PLANK, 1);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(4n);

        // Step 2: Planks → Sticks (2 planks → 4 sticks)
        await minecraftItems.connect(player1).craft(STICK, 1);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(2n);
        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(4n);

        // Step 3: Sticks + Planks → Pickaxe (2 sticks + 3 planks → 1 pickaxe)
        // Need 1 more plank
        await minecraftItems.connect(player1).craft(WOODEN_PLANK, 1);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(6n);

        // Now craft pickaxe
        await minecraftItems.connect(player1).craft(WOODEN_PICKAXE, 1);
        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(2n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(3n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(1n);
      });

      it("Should handle crafting multiple pickaxes", async function () {
        // Craft 20 logs into 80 planks
        await minecraftItems.connect(player1).craft(WOODEN_PLANK, 20);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(80n);

        // Craft 40 planks into 80 sticks
        await minecraftItems.connect(player1).craft(STICK, 10);
        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(40n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(60n);

        // Craft 10 pickaxes (need 20 sticks + 30 planks)
        await minecraftItems.connect(player1).craft(WOODEN_PICKAXE, 10);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(10n);
        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(20n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(30n);
      });

      it("Should prevent crafting pickaxe without sufficient materials", async function () {
        // Only have logs, no planks or sticks
        await expect(minecraftItems.connect(player1).craft(WOODEN_PICKAXE, 1)).to.be.revertedWith(
          "MinecraftItems: insufficient input balance",
        );
      });
    });

    describe("Aggregated Crafting", function () {
      // Recipes and initial logs are already set up in parent beforeEach

      it("Should craft through complete chain: logs → planks → sticks → pickaxe", async function () {
        // Craft pickaxe from logs in one transaction
        // Need: 2 sticks + 3 planks = 5 planks total
        // 1 stick craft needs 2 planks → gives 4 sticks (we use 2)
        // Total planks needed: 2 (for sticks) + 3 (for pickaxe) = 5 planks
        // Craft planks 2x: 2 logs → 8 planks
        await expect(
          minecraftItems.connect(player1).aggrCraft(
            [WOODEN_PLANK, STICK, WOODEN_PICKAXE], // All steps including final output
            [2n, 1n, 1n], // Craft amounts for each step
          ),
        )
          .to.emit(minecraftItems, "ItemsCrafted")
          .withArgs(player1.address, WOODEN_PICKAXE, 1n);

        // Verify balances
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(98n); // 100 - 2
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(3n); // 8 - 2 - 3
        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(2n); // 4 - 2
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(1n);
      });

      it("Should handle single item array (acts like regular craft)", async function () {
        // First craft some planks
        await minecraftItems.connect(player1).craft(WOODEN_PLANK, 10n); // 10 logs → 40 planks

        // Use aggrCraft with single item (should act like regular craft)
        await expect(minecraftItems.connect(player1).aggrCraft([STICK], [5n]))
          .to.emit(minecraftItems, "ItemsCrafted")
          .withArgs(player1.address, STICK, 20n); // 5 crafts × 4 sticks each

        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(20n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(30n); // 40 - 10
      });

      it("Should craft multiple final outputs with times parameter", async function () {
        // Craft 3 pickaxes at once
        // Per pickaxe: 2 sticks + 3 planks = 5 planks total
        // For 3 pickaxes: need 15 planks total
        // Craft planks 4x: 4 logs → 16 planks
        await minecraftItems.connect(player1).aggrCraft(
          [WOODEN_PLANK, STICK, WOODEN_PICKAXE],
          [4n, 3n, 3n], // 4x planks (16 planks), 3x sticks (12 sticks from 6 planks), 3x pickaxes
        );

        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(3n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(96n); // 100 - 4
        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(6n); // 12 - 6
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(1n); // 16 - 6 - 9
      });

      it("Should revert if insufficient base materials", async function () {
        // Try to craft but don't have enough logs (player has 100, need 101)
        await expect(
          minecraftItems.connect(player1).aggrCraft([WOODEN_PLANK, STICK, WOODEN_PICKAXE], [101n, 1n, 1n]),
        ).to.be.revertedWith("MinecraftItems: insufficient input balance");
      });

      it("Should revert if intermediate craft produces insufficient materials", async function () {
        // Craft only 1 plank (not enough for subsequent crafts)
        await expect(
          minecraftItems.connect(player1).aggrCraft(
            [WOODEN_PLANK, STICK, WOODEN_PICKAXE],
            [1n, 2n, 1n], // 1x plank gives 4 planks, but 2x stick needs 4 planks (leaves 0 for pickaxe)
          ),
        ).to.be.revertedWith("MinecraftItems: insufficient input balance");
      });

      it("Should revert on array length mismatch", async function () {
        await expect(minecraftItems.connect(player1).aggrCraft([WOODEN_PLANK], [2n, 1n])).to.be.revertedWith(
          "MinecraftItems: length mismatch",
        );

        await expect(minecraftItems.connect(player1).aggrCraft([WOODEN_PLANK, STICK], [2n])).to.be.revertedWith(
          "MinecraftItems: length mismatch",
        );
      });

      it("Should revert on empty arrays", async function () {
        await expect(minecraftItems.connect(player1).aggrCraft([], [])).to.be.revertedWith(
          "MinecraftItems: empty arrays",
        );
      });

      it("Should revert if any recipe in chain doesn't exist", async function () {
        const NON_EXISTENT_TOKEN = 999n;

        await expect(
          minecraftItems.connect(player1).aggrCraft([NON_EXISTENT_TOKEN, WOODEN_PICKAXE], [1n, 1n]),
        ).to.be.revertedWith("MinecraftItems: recipe does not exist");

        await expect(
          minecraftItems.connect(player1).aggrCraft([WOODEN_PLANK, STICK, NON_EXISTENT_TOKEN], [2n, 1n, 1n]),
        ).to.be.revertedWith("MinecraftItems: recipe does not exist");
      });

      it("Should emit only one ItemsCrafted event for final output", async function () {
        const tx = await minecraftItems.connect(player1).aggrCraft([WOODEN_PLANK, STICK, WOODEN_PICKAXE], [2n, 1n, 1n]);

        const receipt = await tx.wait();
        const craftedEvents = receipt?.logs.filter(
          log => log.topics[0] === minecraftItems.interface.getEvent("ItemsCrafted").topicHash,
        );

        // Should only have 1 ItemsCrafted event (for final output)
        expect(craftedEvents?.length).to.equal(1);
      });

      it("Should handle complex chains with multiple intermediates", async function () {
        // Setup a longer chain: logs → planks → sticks → pickaxe
        // This test verifies the iteration works correctly
        await minecraftItems.connect(player1).aggrCraft(
          [WOODEN_PLANK, STICK, WOODEN_PICKAXE],
          [5n, 2n, 2n], // 5x planks (20 planks), 2x sticks (8 sticks), 2x pickaxes
        );

        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(2n);
        // 5 logs used, 20 planks created, 4 used for sticks, 6 used for pickaxes, 10 remaining
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(10n);
        // 8 sticks created, 4 used for pickaxes, 4 remaining
        expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(4n);
      });
    });
  });

  describe("Bridge System", function () {
    beforeEach(async function () {
      // Mint various items to player1
      await minecraftItems.mintInitialBatch(player1.address, [WOODEN_LOG, STICK, WOODEN_PICKAXE], [100n, 50n, 10n]);
    });

    it("Should allow bridging single item", async function () {
      await expect(minecraftItems.connect(player1).bridge([WOODEN_LOG], [75n]))
        .to.emit(minecraftItems, "ItemsBridged")
        .withArgs(player1.address, [WOODEN_LOG], [75n]);

      expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(25n);
    });

    it("Should allow bridging multiple items", async function () {
      const tokenIds = [WOODEN_LOG, STICK, WOODEN_PICKAXE];
      const amounts = [25n, 10n, 5n];

      await expect(minecraftItems.connect(player1).bridge(tokenIds, amounts))
        .to.emit(minecraftItems, "ItemsBridged")
        .withArgs(player1.address, tokenIds, amounts);

      expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(75n);
      expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(40n);
      expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(5n);
    });

    it("Should reject bridging with empty arrays", async function () {
      await expect(minecraftItems.connect(player1).bridge([], [])).to.be.revertedWith("MinecraftItems: empty arrays");
    });

    it("Should reject bridging with mismatched arrays", async function () {
      await expect(minecraftItems.connect(player1).bridge([WOODEN_LOG, STICK], [50n])).to.be.revertedWith(
        "MinecraftItems: length mismatch",
      );
    });

    it("Should reject bridging with zero amount", async function () {
      await expect(minecraftItems.connect(player1).bridge([WOODEN_LOG], [0n])).to.be.revertedWith(
        "MinecraftItems: zero amount",
      );
    });

    it("Should reject bridging with insufficient balance", async function () {
      await expect(minecraftItems.connect(player1).bridge([WOODEN_LOG], [150n])).to.be.revertedWith(
        "MinecraftItems: insufficient balance",
      );
    });

    it("Should allow bridging all items", async function () {
      await minecraftItems.connect(player1).bridge([WOODEN_LOG, STICK, WOODEN_PICKAXE], [100n, 50n, 10n]);

      expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(0n);
      expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(0n);
      expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(0n);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n);
      await minecraftItems.addRecipe([WOODEN_PLANK], [2n], STICK, 4n);
      await minecraftItems.addRecipe([STICK, WOODEN_PLANK], [2n, 3n], WOODEN_PICKAXE, 1n);
      await minecraftItems.mintInitialBatch(player1.address, [WOODEN_LOG, STICK, WOODEN_PLANK], [100n, 50n, 60n]);
    });

    describe("getRecipe", function () {
      it("Should return complete recipe details", async function () {
        const recipe = await minecraftItems.getRecipe(WOODEN_PICKAXE);

        expect(recipe.inputTokenIds).to.deep.equal([STICK, WOODEN_PLANK]);
        expect(recipe.inputAmounts).to.deep.equal([2n, 3n]);
        expect(recipe.outputTokenId).to.equal(WOODEN_PICKAXE);
        expect(recipe.outputAmount).to.equal(1n);
        expect(recipe.exists).to.be.true;
      });

      it("Should return false for non-existent recipe", async function () {
        const recipe = await minecraftItems.getRecipe(999);
        expect(recipe.exists).to.be.false;
      });
    });

    describe("recipeExists", function () {
      it("Should return true for existing recipe", async function () {
        expect(await minecraftItems.recipeExists(WOODEN_PLANK)).to.be.true;
        expect(await minecraftItems.recipeExists(STICK)).to.be.true;
      });

      it("Should return false for non-existent recipe", async function () {
        expect(await minecraftItems.recipeExists(999)).to.be.false;
      });
    });

    describe("canCraft", function () {
      it("Should return true when user has sufficient materials", async function () {
        expect(await minecraftItems.canCraft(player1.address, WOODEN_PLANK, 1)).to.be.true;
        expect(await minecraftItems.canCraft(player1.address, WOODEN_PICKAXE, 1)).to.be.true;
      });

      it("Should return false when user has insufficient materials", async function () {
        expect(await minecraftItems.canCraft(player1.address, WOODEN_PLANK, 101)).to.be.false;
      });

      it("Should calculate correctly for multiple crafts", async function () {
        // Recipe for WOODEN_PICKAXE needs 2 sticks + 3 planks per craft
        // Player has 50 sticks, 60 planks
        // Max crafts limited by planks: min(50/2, 60/3) = min(25, 20) = 20
        expect(await minecraftItems.canCraft(player1.address, WOODEN_PICKAXE, 15)).to.be.true;
        expect(await minecraftItems.canCraft(player1.address, WOODEN_PICKAXE, 20)).to.be.true;
        expect(await minecraftItems.canCraft(player1.address, WOODEN_PICKAXE, 21)).to.be.false;
      });

      it("Should return false for non-existent recipe", async function () {
        expect(await minecraftItems.canCraft(player1.address, 999, 1)).to.be.false;
      });

      it("Should return false for zero times", async function () {
        expect(await minecraftItems.canCraft(player1.address, WOODEN_PLANK, 0)).to.be.false;
      });
    });
  });

  describe("Admin Functions", function () {
    describe("mintInitial", function () {
      it("Should allow owner to mint initial resources", async function () {
        await minecraftItems.mintInitial(player1.address, WOODEN_LOG, 100n);
        expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(100n);
      });

      it("Should prevent non-owner from minting", async function () {
        await expect(
          minecraftItems.connect(player1).mintInitial(player1.address, WOODEN_LOG, 100n),
        ).to.be.revertedWithCustomError(minecraftItems, "OwnableUnauthorizedAccount");
      });

      it("Should reject minting to zero address", async function () {
        await expect(minecraftItems.mintInitial(ethers.ZeroAddress, WOODEN_LOG, 100n)).to.be.revertedWith(
          "MinecraftItems: mint to zero address",
        );
      });

      it("Should reject minting zero amount", async function () {
        await expect(minecraftItems.mintInitial(player1.address, WOODEN_LOG, 0n)).to.be.revertedWith(
          "MinecraftItems: zero amount",
        );
      });
    });

    describe("mintInitialBatch", function () {
      it("Should allow owner to batch mint resources", async function () {
        await minecraftItems.mintInitialBatch(player1.address, [WOODEN_LOG, STONE], [100n, 200n]);

        expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(100n);
        expect(await minecraftItems.balanceOf(player1.address, STONE)).to.equal(200n);
      });

      it("Should prevent non-owner from batch minting", async function () {
        await expect(
          minecraftItems.connect(player1).mintInitialBatch(player1.address, [WOODEN_LOG], [100n]),
        ).to.be.revertedWithCustomError(minecraftItems, "OwnableUnauthorizedAccount");
      });

      it("Should reject batch mint with mismatched arrays", async function () {
        await expect(minecraftItems.mintInitialBatch(player1.address, [WOODEN_LOG, STONE], [100n])).to.be.revertedWith(
          "MinecraftItems: length mismatch",
        );
      });
    });

    describe("setURI", function () {
      it("Should allow owner to update URI", async function () {
        await minecraftItems.setURI("https://newuri.example/item/");

        // Check that URI is updated for different token IDs
        expect(await minecraftItems.uri(WOODEN_LOG)).to.equal("https://newuri.example/item/1.json");
        expect(await minecraftItems.uri(STONE)).to.equal("https://newuri.example/item/5.json");
      });

      it("Should prevent non-owner from updating URI", async function () {
        await expect(
          minecraftItems.connect(player1).setURI("https://newuri.example/item/"),
        ).to.be.revertedWithCustomError(minecraftItems, "OwnableUnauthorizedAccount");
      });
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete game scenario", async function () {
      // Setup: Add all recipes
      await minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n);
      await minecraftItems.addRecipe([WOODEN_PLANK], [2n], STICK, 4n);
      await minecraftItems.addRecipe([STICK, WOODEN_PLANK], [2n, 3n], WOODEN_PICKAXE, 1n);

      // Player starts with 20 logs
      await minecraftItems.mintInitial(player1.address, WOODEN_LOG, 20n);

      // Player crafts materials and tools
      await minecraftItems.connect(player1).craft(WOODEN_PLANK, 10); // 10 logs → 40 planks
      await minecraftItems.connect(player1).craft(STICK, 5); // 10 planks → 20 sticks
      await minecraftItems.connect(player1).craft(WOODEN_PICKAXE, 5); // 10 sticks + 15 planks → 5 pickaxes

      // Verify final balances
      expect(await minecraftItems.balanceOf(player1.address, WOODEN_LOG)).to.equal(10n);
      expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(15n);
      expect(await minecraftItems.balanceOf(player1.address, STICK)).to.equal(10n);
      expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(5n);

      // Bridge 2 pickaxes to game
      await minecraftItems.connect(player1).bridge([WOODEN_PICKAXE], [2n]);
      expect(await minecraftItems.balanceOf(player1.address, WOODEN_PICKAXE)).to.equal(3n);
    });

    it("Should handle multiple players independently", async function () {
      await minecraftItems.addRecipe([WOODEN_LOG], [1n], WOODEN_PLANK, 4n);

      await minecraftItems.mintInitial(player1.address, WOODEN_LOG, 100n);
      await minecraftItems.mintInitial(player2.address, WOODEN_LOG, 50n);

      await minecraftItems.connect(player1).craft(WOODEN_PLANK, 10);
      await minecraftItems.connect(player2).craft(WOODEN_PLANK, 5);

      expect(await minecraftItems.balanceOf(player1.address, WOODEN_PLANK)).to.equal(40n);
      expect(await minecraftItems.balanceOf(player2.address, WOODEN_PLANK)).to.equal(20n);
    });
  });
});
