import { Queue, type QueueOptions, type JobsOptions, Job } from "bullmq";
import { redisConnection, defaultQueueOptions, type QueueName } from "./config";

/**
 * Queue Manager - Manages multiple queues
 */
class QueueManager {
  private queues: Map<string, Queue> = new Map();

  /**
   * Get or create a queue
   * @param name - Queue name
   * @param options - Optional queue configuration
   */
  getQueue(name: string | QueueName, options?: Partial<QueueOptions>): Queue {
    const queueName = typeof name === "string" ? name : String(name);

    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: redisConnection,
        ...defaultQueueOptions,
        ...options,
      });

      // Set up event listeners
      queue.on("error", (error) => {
        console.error(`Queue ${queueName} error:`, error);
      });

      queue.on("waiting", (job) => {
        console.log(`Job ${job.id} is waiting in queue ${queueName}`);
      });

      queue.on("resumed", () => {
        console.log(`Job is resumed in queue ${queueName}`);
      });

      queue.on("cleaned", (job) => {
        console.log(`Job ${job} cleaned from queue ${queueName}`);
      });

      queue.on("error", (error) => {
        console.error(`Queue ${queueName} error:`, error);
      });

      this.queues.set(queueName, queue);
    }

    return this.queues.get(queueName)!;
  }

  /**
   * Add a job to a queue
   * @param queueName - Queue name
   * @param jobName - Job name/type
   * @param data - Job data
   * @param options - Job options
   */
  async addJob<T = any>(
    queueName: string | QueueName,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    return await queue.add(jobName, data, options);
  }

  /**
   * Add multiple jobs to a queue in bulk
   * @param queueName - Queue name
   * @param jobs - Array of jobs to add
   */
  async addBulk<T = any>(
    queueName: string | QueueName,
    jobs: Array<{ name: string; data: T; opts?: JobsOptions }>
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    return await queue.addBulk(jobs);
  }

  /**
   * Remove a job from a queue
   * @param queueName - Queue name
   * @param jobId - Job ID
   */
  async removeJob(queueName: string | QueueName, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Get job by ID
   * @param queueName - Queue name
   * @param jobId - Job ID
   */
  async getJob<T = any>(
    queueName: string | QueueName,
    jobId: string
  ): Promise<Job<T> | undefined> {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  /**
   * Get all jobs in a specific state
   * @param queueName - Queue name
   * @param status - Job status
   */
  async getJobs(
    queueName: QueueName,
    status:
      | "completed"
      | "failed"
      | "delayed"
      | "active"
      | "wait"
      | "paused" = "wait"
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    return await queue.getJobs([status]);
  }

  /**
   * Get queue metrics
   * @param queueName - Queue name
   */
  async getMetrics(queueName: string | QueueName) {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: 0,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Pause a queue
   * @param queueName - Queue name
   */
  async pauseQueue(queueName: string | QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
  }

  /**
   * Resume a paused queue
   * @param queueName - Queue name
   */
  async resumeQueue(queueName: string | QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
  }

  /**
   * Clean old jobs from a queue
   * @param queueName - Queue name
   * @param grace - Grace period in milliseconds
   * @param limit - Maximum number of jobs to clean
   * @param status - Job status to clean
   */
  async cleanQueue(
    queueName: string | QueueName,
    grace: number = 86400000, // 24 hours
    limit: number = 1000,
    status: "completed" | "failed" = "completed"
  ): Promise<string[]> {
    const queue = this.getQueue(queueName);
    return await queue.clean(grace, limit, status);
  }

  /**
   * Obliterate (delete) a queue completely
   * @param queueName - Queue name
   */
  async obliterateQueue(
    queueName: string | QueueName,
    options?: { force?: boolean }
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.obliterate(options);
    const name = String(queueName);
    this.queues.delete(name);
  }

  /**
   * Drain a queue (remove all waiting jobs)
   * @param queueName - Queue name
   */
  async drainQueue(
    queueName: string | QueueName,
    delayed?: boolean
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain(delayed);
  }

  /**
   * Get all queue names
   */
  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Close all queues
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close()
    );
    await Promise.all(closePromises);
    this.queues.clear();
  }

  /**
   * Get a specific queue instance
   * @param queueName - Queue name
   */
  getQueueInstance(queueName: string | QueueName): Queue | undefined {
    const name = String(queueName);
    return this.queues.get(name);
  }
}

// Singleton instance
export const queueManager = new QueueManager();

// Export for custom instances if needed
export { QueueManager };
