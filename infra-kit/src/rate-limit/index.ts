import { getCacheClient } from '../config.js';

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

export interface RateLimitOptions {
    limit: number;
    window: number;
    key: string;
}

/**
 * Check and consume rate limit using sliding window
 * 
 * @example
 * ```typescript
 * import { checkRateLimit } from '@infra-kit/core/rate-limit';
 * 
 * const result = await checkRateLimit('user:123', {
 *   limit: 100, window: 60, key: 'api'
 * });
 * ```
 */
export async function checkRateLimit(
    identifier: string,
    options: RateLimitOptions
): Promise<RateLimitResult> {
    const redis = getCacheClient();
    const key = `ratelimit:${options.key}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (options.window * 1000);

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, options.window);

    const results = await pipeline.exec();
    const count = (results?.[1]?.[1] as number) || 0;

    const allowed = count < options.limit;
    const remaining = Math.max(0, options.limit - count - 1);
    const resetAt = now + (options.window * 1000);

    if (!allowed) {
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTimestamp = oldestRequest[1] ? parseInt(oldestRequest[1]) : now;
        const retryAfter = Math.max(0, (oldestTimestamp + (options.window * 1000)) - now);

        return { allowed: false, remaining: 0, resetAt, retryAfter };
    }

    return { allowed: true, remaining, resetAt };
}

/**
 * Reset rate limit
 */
export async function resetRateLimit(identifier: string, key: string): Promise<void> {
    const redis = getCacheClient();
    await redis.del(`ratelimit:${key}:${identifier}`);
}

/**
 * Create a rate limiter with preset options
 */
export function createRateLimiter(defaultOptions: RateLimitOptions) {
    return (identifier: string, overrides?: Partial<RateLimitOptions>) => {
        return checkRateLimit(identifier, { ...defaultOptions, ...overrides });
    };
}
