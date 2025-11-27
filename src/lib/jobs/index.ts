/**
 * Job Management using infra-kit
 * 
 * Abstraction layer for background job processing
 */

import { getCacheClient } from '@infra-kit/core';
import {
  Queue,
  Worker,
  type JobOptions as JobsOptions,
  type JobProcessor as Processor,
  type Job
} from '@infra-kit/core/queue';

// Re-export from config (project-specific)
export {
  redisConnection,
  defaultQueueOptions,
  defaultWorkerOptions,
  QueueNameSchema as JobQueueSchema, // Renamed
  JobPrioritySchema,
  JobStatusSchema,
  JobPriority,
  type QueueName,
  type JobStatus,
  type JobPriorityType
} from "./config";

// Internal queue and worker storage
const queues = new Map<string, Queue>();
const workers = new Map<string, Worker>();

/**
 * Job Manager implementation
 */
export class JobManager {
  private getOrCreateQueue(queueName: string): Queue {
    if (!queues.has(queueName)) {
      const connection = getCacheClient();
      const queue = new Queue(queueName, { connection });
      queues.set(queueName, queue);
    }
    return queues.get(queueName)!;
  }

  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    const queue = this.getOrCreateQueue(queueName);
    return await queue.add(jobName, data, options);
  }

  async addBulk<T = any>(
    queueName: string,
    jobs: Array<{ name: string; data: T; opts?: JobsOptions }>
  ): Promise<Job<T>[]> {
    const queue = this.getOrCreateQueue(queueName);
    return await queue.addBulk(jobs);
  }

  async getJob<T = any>(queueName: string, jobId: string): Promise<Job<T> | undefined> {
    const queue = this.getOrCreateQueue(queueName);
    const job = await queue.getJob(jobId);
    return job || undefined;
  }

  async getMetrics(queueName: string) {
    const queue = this.getOrCreateQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.pause();
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.resume();
  }

  async cleanQueue(
    queueName: string,
    grace: number = 86400000,
    limit: number = 1000,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<string[]> {
    const queue = this.getOrCreateQueue(queueName);
    return await queue.clean(grace, limit, status);
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async getJobs(queueName: string, statuses: any[]): Promise<Job[]> {
    const queue = this.getOrCreateQueue(queueName);
    return await queue.getJobs(statuses);
  }

  async drainQueue(queueName: string, delayed?: boolean): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.drain(delayed);
  }

  async closeAll(): Promise<void> {
    await Promise.all([
      ...Array.from(queues.values()).map(q => q.close()),
      ...Array.from(workers.values()).map(w => w.close()),
    ]);
    queues.clear();
    workers.clear();
  }

  getQueue(name: string): Queue {
    return this.getOrCreateQueue(name);
  }

  getQueueInstance(name: string): Queue {
    return this.getOrCreateQueue(name);
  }
}

/**
 * Job Processor implementation
 */
export class JobProcessor {
  registerWorker<T = any, R = any>(
    queueName: string,
    processor: Processor<T, R>,
    options?: any
  ): Worker<T, R> {
    const connection = getCacheClient();

    const worker = new Worker<T, R>(queueName, processor, {
      connection,
      ...options,
    });

    workers.set(queueName, worker);
    return worker;
  }

  async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(workers.values()).map(w => w.close())
    );
    workers.clear();
  }
}

/**
 * Flow Producer Manager (placeholder)
 */
export class FlowProducerManager {
  async close(): Promise<void> {
    console.log('Flow producer closed');
  }
}

export function createProcessor<T, R>(processor: Processor<T, R>): Processor<T, R> {
  return processor;
}

export function createFlow() {
  console.warn('createFlow() not yet implemented in infra-kit wrapper');
  return null;
}

// Singleton instances
export const jobManager = new JobManager();
export const jobProcessor = new JobProcessor();
export const flowProducerManager = new FlowProducerManager();

// Graceful shutdown
export async function gracefulShutdown(): Promise<void> {
  console.log("Starting graceful shutdown of Jobs...");
  try {
    await Promise.all([
      jobProcessor.closeAll(),
      jobManager.closeAll(),
      flowProducerManager.close(),
    ]);
    console.log("Jobs gracefully shut down");
  } catch (error) {
    console.error("Error during Jobs shutdown:", error);
    throw error;
  }
}
