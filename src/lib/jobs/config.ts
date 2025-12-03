import type {
  ConnectionOptions,
  QueueOptions,
  WorkerOptions,
} from "@omed0/infra-kit/queue";
import { getEnv } from "@/lib/env";
import * as z from "zod/v3";

const env = getEnv();

/**
 * Redis connection configuration for BullMQ
 */
export const redisConnection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // BullMQ requires this to be null
  enableReadyCheck: false, // BullMQ manages connections internally
  retryStrategy(times) {
    return Math.min(times * 1000, 30000); // Max 30 seconds
  },
};

/**
 * Default queue options with best practices
 */
export const defaultQueueOptions: Omit<QueueOptions, "connection"> = {
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: "exponential", // Exponential backoff between retries
      delay: 1000, // Start with 1 second delay
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep at most 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 5000, // Keep at most 5000 failed jobs
    },
  },
};

/**
 * Default worker options with best practices
 */
export const defaultWorkerOptions: Omit<WorkerOptions, "connection"> = {
  concurrency: 10, // Process up to 10 jobs concurrently
  limiter: {
    max: 100, // Max 100 jobs
    duration: 1000, // Per second
  },
  // Enable auto-run (worker starts processing immediately)
  autorun: true,
  // Graceful shutdown
  lockDuration: 30000, // 30 seconds lock duration
  // Remove completed jobs
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

/**
 * Shared constants for BullMQ queues
 * Safe to import on both client and server
 */

/**
 * Queue names for type safety and validation
 */
export const QueueNameSchema = z.enum([
  "EMAIL",
  "NOTIFICATION",
  "FILE_PROCESSING",
  "DATA_EXPORT",
  "ANALYTICS",
  "WEBHOOK",
  "CLEANUP",
  "DATABASE_BACKUP",
  "DEFAULT",
]);
export type QueueName = z.infer<typeof QueueNameSchema>;

/**
 * Job priorities for type safety and validation
 */
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}
export const JobPrioritySchema = z.nativeEnum(JobPriority);
export type JobPriorityType = z.infer<typeof JobPrioritySchema>;

/**
 * Job statuses for type safety and validation
 */
export const JobStatusSchema = z.enum([
  "completed",
  "failed",
  "delayed",
  "active",
  "wait",
  "paused",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;
