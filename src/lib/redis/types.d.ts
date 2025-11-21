/**
 * Redis Type Definitions
 *
 * This file provides type definitions and interfaces for Redis operations
 */

declare module "@/lib/redis" {
  import type { Redis } from "ioredis";

  // Client exports
  export function getRedisClient(): Redis;
  export function disconnectRedis(): Promise<void>;
  export function isRedisReady(): boolean;
  export function flushRedis(): Promise<void>;

  // Cache exports
  export interface CacheOptions {
    ttl?: number;
    namespace?: string;
  }

  export class RedisCache {
    constructor(namespace?: string);
    set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
    delete(key: string | string[]): Promise<number>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    increment(key: string, amount?: number): Promise<number>;
    decrement(key: string, amount?: number): Promise<number>;
    getOrSet<T = any>(
      key: string,
      fetcher: () => Promise<T>,
      ttl?: number
    ): Promise<T>;
    setMany(entries: Record<string, any>, ttl?: number): Promise<void>;
    getMany<T = any>(keys: string[]): Promise<Record<string, T | null>>;
    deletePattern(pattern: string): Promise<number>;
    keys(pattern?: string): Promise<string[]>;
    clear(): Promise<number>;
  }

  export const cache: RedisCache;

  // Health check exports
  export interface HealthCheckResult {
    status: "healthy" | "unhealthy";
    latency?: number;
    error?: string;
    details: {
      connected: boolean;
      uptime?: number;
      usedMemory?: string;
      connectedClients?: number;
    };
  }

  export function healthCheck(): Promise<HealthCheckResult>;
  export function getStats(): Promise<{
    server: {
      version?: string;
      mode?: string;
      os?: string;
      uptime: number;
    };
    memory: {
      used?: string;
      peak?: string;
      fragmentation?: string;
    };
    stats: {
      connections: number;
      commands: number;
      rejectedConnections: number;
      evictedKeys: number;
    };
    keyspace?: string;
  }>;
}
