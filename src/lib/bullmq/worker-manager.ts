import { Worker, Job, type WorkerOptions, type Processor } from "bullmq";
import {
  redisConnection,
  defaultWorkerOptions,
  type QueueName,
} from "./config";

/**
 * Worker Manager - Manages job processors
 */
class WorkerManager {
  private workers: Map<string, Worker> = new Map();

  /**
   * Register a worker for a queue
   * @param queueName - Queue name
   * @param processor - Job processor function
   * @param options - Worker options
   */
  registerWorker<T = any, R = any>(
    queueName: string | QueueName,
    processor: Processor<T, R>,
    options?: Partial<WorkerOptions>
  ): Worker<T, R> {
    const workerName = String(queueName);

    // Close existing worker if present
    if (this.workers.has(workerName)) {
      console.warn(`Worker ${workerName} already exists. Replacing...`);
      this.workers.get(workerName)?.close();
    }

    const worker = new Worker<T, R>(workerName, processor, {
      connection: redisConnection,
      ...defaultWorkerOptions,
      ...options,
    });

    // Set up event listeners
    worker.on("completed", (job, result) => {
      console.log(
        `Worker ${workerName} completed job ${job.id}:`,
        result
      );
    });

    worker.on("failed", (job, error) => {
      console.error(
        `Worker ${workerName} failed job ${job?.id}:`,
        error
      );
    });

    worker.on("error", (error) => {
      console.error(`Worker ${workerName} error:`, error);
    });

    worker.on("active", (job) => {
      console.log(`Worker ${workerName} processing job ${job.id}`);
    });

    worker.on("stalled", (jobId) => {
      console.warn(`Job ${jobId} stalled in worker ${workerName}`);
    });

    worker.on("progress", (job, progress) => {
      console.log(
        `Worker ${workerName} job ${job.id} progress:`,
        progress
      );
    });

    this.workers.set(workerName, worker);
    return worker;
  }

  /**
   * Get a worker by queue name
   * @param queueName - Queue name
   */
  getWorker(queueName: string | QueueName): Worker | undefined {
    const workerName = String(queueName);
    return this.workers.get(workerName);
  }

  /**
   * Check if a worker is registered
   * @param queueName - Queue name
   */
  hasWorker(queueName: string | QueueName): boolean {
    const workerName = String(queueName);
    return this.workers.has(workerName);
  }

  /**
   * Pause a worker
   * @param queueName - Queue name
   */
  async pauseWorker(queueName: string | QueueName): Promise<void> {
    const worker = this.getWorker(queueName);
    if (worker) {
      await worker.pause();
    }
  }

  /**
   * Resume a paused worker
   * @param queueName - Queue name
   */
  async resumeWorker(queueName: string | QueueName): Promise<void> {
    const worker = this.getWorker(queueName);
    if (worker) {
      await worker.resume();
    }
  }

  /**
   * Close a specific worker
   * @param queueName - Queue name
   */
  async closeWorker(queueName: string | QueueName): Promise<void> {
    const workerName = String(queueName);
    const worker = this.workers.get(workerName);
    if (worker) {
      await worker.close();
      this.workers.delete(workerName);
    }
  }

  /**
   * Close all workers gracefully
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.workers.values()).map((worker) =>
      worker.close()
    );
    await Promise.all(closePromises);
    this.workers.clear();
  }

  /**
   * Get all worker names
   */
  getWorkerNames(): string[] {
    return Array.from(this.workers.keys());
  }

  /**
   * Get metrics for a worker
   * @param queueName - Queue name
   */
  async getWorkerMetrics(queueName: string | QueueName) {
    const worker = this.getWorker(queueName);
    if (!worker) {
      return null;
    }

    return {
      isRunning: worker.isRunning(),
      isPaused: worker.isPaused(),
      name: worker.name,
    };
  }
}

// Singleton instance
export const workerManager = new WorkerManager();

// Export for custom instances if needed
export { WorkerManager };

/**
 * Helper function to create a simple processor with error handling
 */
export function createProcessor<T = any, R = any>(
  handler: (job: Job<T>) => Promise<R>
): Processor<T, R> {
  return async (job: Job<T>) => {
    try {
      console.log(`Processing job ${job.id} of type ${job.name}`);
      const result = await handler(job);
      console.log(`Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error; // Re-throw to mark job as failed
    }
  };
}
