import type { ItemUid } from "../web3/itemConfig";
import { type RedisClientType, createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Initialize Redis client
const redis: RedisClientType = createClient({
  url: REDIS_URL,
});

redis.on("error", err => {
  console.error("[Redis] Connection error:", err);
});

redis.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

// Connect to Redis
redis.connect().catch(err => {
  console.error("[Redis] Failed to connect:", err);
});

const prefix = "bkhck" as const;
const item_balance_prefix = "balance" as const;

/**
 * Redis keys for item balances. Item balance is redis map where
 * key is user address and value is item count.
 */
const ITEM_BALANCES_KEYS: {
  [key in ItemUid]: `${typeof prefix}:${typeof item_balance_prefix}:${key}`;
} = {
  oak_log: `${prefix}:${item_balance_prefix}:oak_log`,
  oak_planks: `${prefix}:${item_balance_prefix}:oak_planks`,
  stick: `${prefix}:${item_balance_prefix}:stick`,
  wooden_pickaxe: `${prefix}:${item_balance_prefix}:wooden_pickaxe`,
  diamond: `${prefix}:${item_balance_prefix}:diamond`,
  diamond_pickaxe: `${prefix}:${item_balance_prefix}:diamond_pickaxe`,
  diamond_sword: `${prefix}:${item_balance_prefix}:diamond_sword`,
};

const REDIS_KEYS = {
  BALANCES: ITEM_BALANCES_KEYS,
  PROCESSED_BRIDGE_TXS: `${prefix}:processed_bridge_txs`,
} as const;

export { redis, REDIS_KEYS as RKEYS };
