import { getRedisClient } from "./client";

export type CacheOptions = {
  /** Time to live in seconds */
  ttl?: number;
  /** Namespace prefix for keys */
  namespace?: string;
};

/**
 * Redis Cache Manager with utility methods
 */
export class RedisCache {
  private redis = getRedisClient();
  private namespace: string;

  constructor(namespace: string = "app") {
    this.namespace = namespace;
  }

  /**
   * Generate a namespaced key
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache (will be JSON stringified)
   * @param ttl - Time to live in seconds (optional)
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const namespacedKey = this.getKey(key);
    const serialized = JSON.stringify(value);

    if (ttl) {
      await this.redis.setex(namespacedKey, ttl, serialized);
    } else {
      await this.redis.set(namespacedKey, serialized);
    }
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Parsed value or null if not found
   */
  async get<T = any>(key: string): Promise<T | null> {
    const namespacedKey = this.getKey(key);
    const value = await this.redis.get(namespacedKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Delete a key from cache
   * @param key - Cache key or array of keys
   */
  async delete(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    const namespacedKeys = keys.map((k) => this.getKey(k));
    return await this.redis.del(...namespacedKeys);
  }

  /**
   * Check if a key exists
   * @param key - Cache key
   */
  async exists(key: string): Promise<boolean> {
    const namespacedKey = this.getKey(key);
    const result = await this.redis.exists(namespacedKey);
    return result === 1;
  }

  /**
   * Set expiration time for a key
   * @param key - Cache key
   * @param ttl - Time to live in seconds
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const namespacedKey = this.getKey(key);
    const result = await this.redis.expire(namespacedKey, ttl);
    return result === 1;
  }

  /**
   * Get remaining TTL for a key
   * @param key - Cache key
   * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    const namespacedKey = this.getKey(key);
    return await this.redis.ttl(namespacedKey);
  }

  /**
   * Increment a numeric value
   * @param key - Cache key
   * @param amount - Amount to increment (default: 1)
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    const namespacedKey = this.getKey(key);
    return await this.redis.incrby(namespacedKey, amount);
  }

  /**
   * Decrement a numeric value
   * @param key - Cache key
   * @param amount - Amount to decrement (default: 1)
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    const namespacedKey = this.getKey(key);
    return await this.redis.decrby(namespacedKey, amount);
  }

  /**
   * Get or set a value (fetch from source if not cached)
   * @param key - Cache key
   * @param fetcher - Function to fetch value if not cached
   * @param ttl - Time to live in seconds (optional)
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Set multiple key-value pairs
   * @param entries - Object with key-value pairs
   * @param ttl - Time to live in seconds (optional)
   */
  async setMany(entries: Record<string, any>, ttl?: number): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const [key, value] of Object.entries(entries)) {
      const namespacedKey = this.getKey(key);
      const serialized = JSON.stringify(value);

      if (ttl) {
        pipeline.setex(namespacedKey, ttl, serialized);
      } else {
        pipeline.set(namespacedKey, serialized);
      }
    }

    await pipeline.exec();
  }

  /**
   * Get multiple values by keys
   * @param keys - Array of cache keys
   * @returns Object with key-value pairs (missing keys will be null)
   */
  async getMany<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    const namespacedKeys = keys.map((k) => this.getKey(k));
    const values = await this.redis.mget(...namespacedKeys);

    const result: Record<string, T | null> = {};

    keys.forEach((key, index) => {
      const value = values[index];
      if (value) {
        try {
          result[key] = JSON.parse(value) as T;
        } catch {
          result[key] = value as T;
        }
      } else {
        result[key] = null;
      }
    });

    return result;
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern - Pattern to match (e.g., "user:*")
   */
  async deletePattern(pattern: string): Promise<number> {
    const namespacedPattern = this.getKey(pattern);
    const keys = await this.redis.keys(namespacedPattern);

    if (keys.length === 0) {
      return 0;
    }

    return await this.redis.del(...keys);
  }

  /**
   * Get all keys matching a pattern
   * @param pattern - Pattern to match (e.g., "user:*")
   */
  async keys(pattern: string = "*"): Promise<string[]> {
    const namespacedPattern = this.getKey(pattern);
    const keys = await this.redis.keys(namespacedPattern);
    // Remove namespace prefix from returned keys
    return keys.map((key) => key.replace(`${this.namespace}:`, ""));
  }

  /**
   * Clear all keys in this namespace
   */
  async clear(): Promise<number> {
    return await this.deletePattern("*");
  }
}

// Default cache instance
export const cache = new RedisCache("app");
