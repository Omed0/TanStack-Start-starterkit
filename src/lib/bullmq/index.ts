/**
 * BullMQ Integration
 *
 * Comprehensive job queue management using BullMQ and Redis
 *
 * Features:
 * - Queue management (create, monitor, clean)
 * - Worker management (register processors, handle jobs)
 * - Scheduler (delayed and recurring jobs)
 * - Flow producer (parent-child job relationships)
 * - Event monitoring and metrics
 *
 * @example Basic Usage
 * ```typescript
 * import { queueManager, workerManager, QueueName } from '@/lib/bullmq';
 *
 * // Add a job
 * await queueManager.addJob(QueueName.EMAIL, 'send-welcome-email', {
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 * });
 *
 * // Register a worker
 * workerManager.registerWorker(QueueName.EMAIL, async (job) => {
 *   console.log('Processing email:', job.data);
 *   // Send email logic here
 *   return { sent: true };
 * });
 * ```
 */

import { flowProducerManager } from "./flow-producer";
import { queueManager } from "./queue-manager";
import { workerManager } from "./worker-manager";

// Configuration
export {
  redisConnection,
  defaultQueueOptions,
  defaultWorkerOptions,
  QueueNameSchema,
  JobPrioritySchema,
  JobStatusSchema,
  JobPriority,
  type QueueName,
  type JobStatus,
  type JobPriorityType
} from "./config";

// Queue Management
export { queueManager, QueueManager } from "./queue-manager";

// Worker Management
export {
  workerManager,
  WorkerManager,
  createProcessor,
} from "./worker-manager";

// Flow Producer
export {
  flowProducerManager,
  FlowProducerManager,
  createFlow,
} from "./flow-producer";

// Re-export BullMQ types for convenience
export type {
  Job,
  Queue,
  Worker,
  FlowProducer,
  JobsOptions,
  QueueOptions,
  WorkerOptions,
  FlowJob,
  Processor,
} from "bullmq";

/**
 * Graceful shutdown helper
 * Call this when your application is shutting down
 */
export async function gracefulShutdown(): Promise<void> {
  console.log("Starting graceful shutdown of BullMQ...");

  try {
    await Promise.all([
      workerManager.closeAll(),
      queueManager.closeAll(),
      flowProducerManager.close(),
    ]);

    console.log("BullMQ gracefully shut down");
  } catch (error) {
    console.error("Error during BullMQ shutdown:", error);
    throw error;
  }
}
