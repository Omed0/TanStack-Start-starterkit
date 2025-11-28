import { z } from "zod/v3";
import { createIsomorphicFn } from "@tanstack/react-start";
import { cache } from "react";

/**
 * Shared environment variables used on both client and server
 */
const sharedEnvSchema = z.object({
  AUTH_BASE_URL: z.string().url().min(1),
  APP_NAME: z.string().default("tanstack-start-starterkit"),
  bucketName: z.string().min(1).default("tanstack-start-starterkit"),
  POSTHOG_PROJECT_ID: z.string().min(1),
  POSTHOG_API_HOST: z.string().url().default("https://eu.posthog.com"),
});

/**
 * Server-only environment variables
 */
const serverOnlySchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().min(1),

  // Polar (Payment)
  POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
  POLAR_SUCCESS_URL: z.string().optional(),

  // S3/MinIO
  S3_ENDPOINT: z.string().min(1),
  S3_PORT: z.string().optional(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_USE_SSL: z.enum(["true", "false"]).default("false"),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().optional(),

  // PostHog
  POSTHOG_PERSONAL_API_KEY: z.string().min(1),
  POSTHOG_KEY: z.string().min(1),
  POSTHOG_HOST: z.string().url().default("https://eu.i.posthog.com"),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Complete server schema (shared + server-only)
 */
const serverSchema = sharedEnvSchema.extend(serverOnlySchema.shape);

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof sharedEnvSchema>;
type SharedEnvKeys = keyof z.infer<typeof sharedEnvSchema>;

/**
 * Export shared keys for use in vite.config.ts
 */
export const SHARED_ENV_KEYS: SharedEnvKeys[] = Object.keys(
  sharedEnvSchema.shape
) as SharedEnvKeys[];

/**
 * Validate server environment variables (runs only on server)
 */
function validateServerEnv(): ServerEnv {
  const serverEnv = serverSchema.safeParse(process.env);

  if (!serverEnv.success) {
    console.error(
      "❌ Invalid server environment variables:",
      serverEnv.error.flatten().formErrors
    );
    throw new Error("Invalid server environment variables");
  }

  return serverEnv.data;
}

function validateClientEnv(): ClientEnv {
  const clientEnv = sharedEnvSchema.safeParse(import.meta.env);

  if (!clientEnv.success) {
    console.error(
      "❌ Invalid client environment variables:",
      clientEnv.error.flatten().formErrors
    );
    throw new Error("Invalid client environment variables");
  }

  return clientEnv.data;
}

/**
 * Isomorphic environment access
 * Returns server env on server, client env on client
 */
export const getEnv = cache(
  createIsomorphicFn()
    .server(() => validateServerEnv())
    .client(() => validateClientEnv()) as unknown as () => Env
);

/**
 * Type exports
 */
export type Env = ServerEnv & ClientEnv;
