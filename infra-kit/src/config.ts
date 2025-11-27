import { z } from 'zod';
import Redis from 'ioredis';

export const RedisConfigSchema = z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    keyPrefix: z.string().optional(),
    maxRetriesPerRequest: z.number().nullable().default(null),
    enableReadyCheck: z.boolean().default(true),
    lazyConnect: z.boolean().default(false),
});

export const StorageConfigSchema = z.object({
    endPoint: z.string(),
    port: z.number().optional(),
    accessKey: z.string(),
    secretKey: z.string(),
    useSSL: z.boolean().default(false),
    region: z.string().optional(),
    bucket: z.string().optional(),
});

export const ConfigSchema = z.object({
    redis: RedisConfigSchema,
    storage: StorageConfigSchema.optional(),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

let globalConfig: Config | null = null;
let redisClient: Redis | null = null;

export function initConfig(config: Config): void {
    const validated = ConfigSchema.parse(config);
    globalConfig = validated;
    if (redisClient) {
        redisClient.disconnect();
    }
    redisClient = new Redis({ ...validated.redis });
}

export function initFromEnv(): void {
    const config: Config = {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            keyPrefix: process.env.REDIS_KEY_PREFIX,
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false, // BullMQ manages connections
            lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
        },
    };

    if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
        config.storage = {
            endPoint: process.env.S3_ENDPOINT,
            port: process.env.S3_PORT ? parseInt(process.env.S3_PORT) : undefined,
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_KEY,
            useSSL: process.env.S3_USE_SSL === 'true',
            region: process.env.S3_REGION,
            bucket: process.env.S3_BUCKET,
        };
    }

    initConfig(config);
}

export function getConfig(): Config {
    if (!globalConfig) {
        throw new Error('Configuration not initialized. Call initConfig() first.');
    }
    return globalConfig;
}

export function getCacheClient(): Redis {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call initConfig() first.');
    }
    if (redisClient.status === 'wait') {
        redisClient.connect();
    }
    return redisClient;
}

export async function disconnect(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
    globalConfig = null;
}
