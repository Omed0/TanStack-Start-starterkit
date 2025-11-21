/**
 * Redis utilities for the application
 *
 * This module provides a comprehensive Redis integration including:
 * - Client connection management
 * - Cache management with namespaces
 * - Session management
 * - Rate limiting
 *
 * @example
 * ```typescript
 * import { cache, sessionManager, rateLimiters } from '@/lib/redis';
 *
 * // Cache usage
 * await cache.set('key', { data: 'value' }, 3600);
 * const data = await cache.get('key');
 *
 * // Session usage
 * await sessionManager.set('sessionId', { userId: '123', email: 'user@example.com' });
 *
 * // Rate limiting
 * const result = await rateLimiters.api.check('user-ip');
 * if (!result.allowed) {
 *   throw new Error('Rate limit exceeded');
 * }
 * ```
 */

export {
  getRedisClient,
  disconnectRedis,
  isRedisReady,
  flushRedis,
} from "./client";

export { RedisCache, cache, type CacheOptions } from "./cache";

export { healthCheck, getStats, type HealthCheckResult } from "./health";
