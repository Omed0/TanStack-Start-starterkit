import Redis, { type RedisOptions } from "ioredis";
import { getEnv } from "@/lib/env";
import { cache } from "react";

const env = getEnv();
let redis: Redis | null = null;

/**
 * Get or create a singleton Redis client instance
 * @returns Redis client instance
 */
export const getRedisClient = cache((): Redis => {
  if (redis && redis.status === "ready") {
    return redis;
  }

  const options: RedisOptions = {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    //retryStrategy(times) {
    //  const delay = Math.min(times * 50, 2000);
    //  return delay;
    //},
    reconnectOnError(err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true;
      }
      return false;
    },
    //lazyConnect: false,
    //enableReadyCheck: true,
    //enableOfflineQueue: true,
  };

  redis = new Redis(options);

  redis.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redis.on("connect", () => {
    console.log("Redis Client Connected");
  });

  redis.on("ready", () => {
    console.log("Redis Client Ready");
  });

  redis.on("close", () => {
    console.log("Redis Client Connection Closed");
  });

  redis.on("reconnecting", () => {
    console.log("Redis Client Reconnecting");
  });

  return redis;
});

/**
 * Disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Check if Redis is connected and ready
 */
export function isRedisReady(): boolean {
  return redis !== null && redis.status === "ready";
}

/**
 * Flush all Redis data (use with caution!)
 */
export async function flushRedis(): Promise<void> {
  const client = getRedisClient();
  await client.flushall();
}
