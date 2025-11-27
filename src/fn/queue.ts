import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/tanstack-utils/middlewares";
import { JobStatusSchema, jobManager, JobQueueSchema } from "@/lib/jobs";
import { z } from "zod/v3";


/**
 * Get all queues status with metrics
 */
export const getQueuesStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const queueNames = JobQueueSchema.options;

    const queuesStatus = await Promise.all(
      queueNames.map(async (queueName) => {
        try {
          const metrics = await jobManager.getMetrics(queueName);
          const queue = jobManager.getQueueInstance(queueName);

          return {
            name: queueName,
            isPaused: queue ? await queue.isPaused() : false,
            metrics,
          };
        } catch (error) {
          return {
            name: queueName,
            error: error instanceof Error ? error.message : "Unknown error",
            metrics: null,
          };
        }
      })
    );

    const totalMetrics = queuesStatus.reduce(
      (acc, queue) => {
        if (queue.metrics) {
          acc.waiting += queue.metrics.waiting;
          acc.active += queue.metrics.active;
          acc.completed += queue.metrics.completed;
          acc.failed += queue.metrics.failed;
          acc.delayed += queue.metrics.delayed;
        }
        return acc;
      },
      { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
    );

    return {
      queues: queuesStatus,
      total: totalMetrics,
      timestamp: new Date().toISOString(),
    };
  });

/**
 * Pause a queue
 */
export const pauseQueue = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ queueName: JobQueueSchema }))
  .handler(async ({ data }) => {
    await jobManager.pauseQueue(data.queueName);
    return {
      success: true,
      message: `Queue ${data.queueName} paused`,
    };
  });

/**
 * Resume a queue
 */
export const resumeQueue = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ queueName: JobQueueSchema }))
  .handler(async ({ data }) => {
    await jobManager.resumeQueue(data.queueName);
    return {
      success: true,
      message: `Queue ${data.queueName} resumed`,
    };
  });

/**
 * Clean a queue
 */
export const cleanQueue = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      queueName: JobQueueSchema,
      grace: z.number().default(86400000), // 24 hours default
      limit: z.number().default(1000),
      status: z.enum(["completed", "failed"]).default("completed"),
    })
  )
  .handler(async ({ data }) => {
    const cleaned = await jobManager.cleanQueue(
      data.queueName,
      data.grace,
      data.limit,
      data.status
    );

    return {
      success: true,
      queueName: data.queueName,
      cleaned: cleaned.length,
      jobIds: cleaned,
    };
  });

/**
 * Drain a queue (remove all waiting jobs)
 */
export const drainQueue = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      queueName: JobQueueSchema,
      delayed: z.boolean().default(false),
    })
  )
  .handler(async ({ data }) => {
    await jobManager.drainQueue(data.queueName, data.delayed);
    return {
      success: true,
      message: `Queue ${data.queueName} drained`,
    };
  });

/**
 * Get job details
 */
export const getJob = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      queueName: JobQueueSchema,
      jobId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const job = await jobManager.getJob(data.queueName, data.jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  });

/**
 * Remove a job
 */
export const removeJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      queueName: JobQueueSchema,
      jobId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    await jobManager.removeJob(data.queueName, data.jobId);
    return {
      success: true,
      message: `Job ${data.jobId} removed`,
    };
  });

/**
 * Get jobs by status
 */
export const getJobsByStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      queueName: JobQueueSchema,
      status: JobStatusSchema.default("wait"),
      limit: z.number().default(50),
    })
  )
  .handler(async ({ data }) => {
    const jobs = await jobManager.getJobs(data.queueName, [data.status]);

    // Limit the results
    const limitedJobs = jobs.slice(0, data.limit);

    return {
      queueName: data.queueName,
      status: data.status,
      total: jobs.length,
      jobs: await Promise.all(
        limitedJobs.map(async (job) => ({
          id: job.id,
          name: job.name,
          data: job.data,
          state: await job.getState(),
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
        }))
      ),
    };
  });
