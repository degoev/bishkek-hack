"use server";

import type { ItemUid } from "../web3/itemConfig";
import { RKEYS, redis } from "./redis";
import { Address } from "viem";

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
