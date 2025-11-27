/**
 * Cache utilities using infra-kit
 * 
 * Abstraction layer for caching operations
 */

import { getCacheClient } from '@infra-kit/core';
import type { CacheOptions } from '@infra-kit/core/cache';
import * as infraCache from '@infra-kit/core/cache';


export async function disconnectCache() {
  const { disconnect } = await import('@infra-kit/core');
  return disconnect();
}

export function isCacheReady() {
  try {
    const client = getCacheClient();
    return client.status === 'ready' || client.status === 'connect';
  } catch {
    return false;
  }
}

export async function flushCache() {
  await infraCache.clearCache();
}

// Cache Service wrapper
export class CacheService {
  private namespace: string;

  constructor(options?: { namespace?: string }) {
    this.namespace = options?.namespace || '';
  }

  private getKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await infraCache.setCache(this.getKey(key), value, ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    return infraCache.getCache<T>(this.getKey(key));
  }

  async delete(key: string): Promise<void> {
    await infraCache.deleteCache(this.getKey(key));
  }

  async has(key: string): Promise<boolean> {
    return infraCache.hasCache(this.getKey(key));
  }

  async clear(): Promise<void> {
    if (this.namespace) {
      await infraCache.deletePattern(`${this.namespace}:*`);
    } else {
      await infraCache.clearCache();
    }
  }
}

// Default cache instance
export const cache = new CacheService();

// Health check
export interface HealthCheckResult {
  healthy: boolean;
  latency?: number;
  error?: string;
}

export async function healthCheck(): Promise<HealthCheckResult> {
  try {
    const start = Date.now();
    const client = getCacheClient();
    await client.ping();
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getStats() {
  const client = getCacheClient();
  const info = await client.info();
  return { info };
}

export type { CacheOptions };
