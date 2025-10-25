"use server";

import { ITEM_TO_TOKEN_ID, type ItemUid } from "../web3/itemConfig";
import { RKEYS, redis } from "./redis";
import { Address, Hex, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import deployedContractsData from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

export const increaseItemBalanceAction = async (userAddress: Address, item: ItemUid, amount: number) => {
  const key = RKEYS.BALANCES[item];
  if (!key) throw new Error(`Unknown item: ${item}`);
  if (amount <= 0) throw new Error(`Amount must be positive: ${amount}`);

  const newBalance = await redis.hIncrBy(key, userAddress, amount);
  return newBalance;
};

export const getItemBalanceAction = async (userAddress: Address, item: ItemUid) => {
  const key = RKEYS.BALANCES[item];
  if (!key) throw new Error(`Unknown item: ${item}`);

  const balance = await redis.hGet(key, userAddress);
  return balance ? parseInt(balance, 10) : 0;
};

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
const chain = scaffoldConfig.targetNetworks[0];
const contract = deployedContractsData[chain.id]["MinecraftItems"];

export const bridgeItemsToChainAction = async (userAddress: Address, items: ItemUid[]) => {
  if (!DEPLOYER_PRIVATE_KEY) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY in environment variables");
  }
  items = new Array(...new Set(items)); // remove duplicates

  const keys = items.map(item => RKEYS.BALANCES[item]).filter(Boolean);
  if (keys.length === 0) throw new Error(`Invalid items: ${items.join(", ")}`);

  const bigintAmounts = [];
  // Read & validate balances
  for (let index = 0; index < keys.length; index++) {
    const item = items[index];

    const currentBalance = await getItemBalanceAction(userAddress, item);
    if (currentBalance <= 0) {
      throw new Error(`Insufficient balance of ${item}. Current: ${currentBalance}`);
    }
    bigintAmounts.push(BigInt(currentBalance));
  }
  const itemIds = items.map(item => ITEM_TO_TOKEN_ID[item]);

  const deployerClient = createWalletClient({
    chain: scaffoldConfig.targetNetworks[0],
    transport: http(),
    account: privateKeyToAccount(DEPLOYER_PRIVATE_KEY),
  });

  const tx = await writeContract(deployerClient, {
    abi: contract.abi,
    address: contract.address,
    functionName: "mintInitialBatch",
    args: [userAddress, itemIds, bigintAmounts],
  });
  const receipt = await waitForTransactionReceipt(deployerClient, { hash: tx });
  if (receipt && receipt.status !== "success") {
    throw new Error(`Transaction failed: ${tx}`);
  }

  //  Deduct all items from Redis balances
  for (let index = 0; index < keys.length; index++) {
    const item = items[index];
    const key = RKEYS.BALANCES[item];
    await redis.hDel(key, userAddress);
  }

  return receipt;
};
