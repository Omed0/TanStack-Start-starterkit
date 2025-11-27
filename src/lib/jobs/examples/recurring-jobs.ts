/**
 * Example: Recurring Jobs
 *
 * Demonstrates how to create scheduled and recurring jobs
 */

import { jobManager, JobQueueSchema, type QueueName } from "@/lib/jobs";

/**
 * Add a repeating job (cron-like scheduling)
 */
export async function scheduleCleanupJob() {
  const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);

  // Run cleanup every day at 2 AM
  return await queue.add(
    "daily-cleanup",
    { task: "cleanup-old-data" },
    {
      repeat: {
        pattern: "0 2 * * *", // Cron pattern: minute hour day month weekday
      },
      priority: 5, // Low priority background task
    }
  );
}

/**
 * Schedule analytics aggregation every hour
 */
export async function scheduleAnalyticsAggregation() {
  const queue = jobManager.getQueue(JobQueueSchema.enum.ANALYTICS);

  return await queue.add(
    "hourly-analytics",
    { task: "aggregate-analytics" },
    {
      repeat: {
        pattern: "0 * * * *", // Every hour at minute 0
      },
    }
  );
}

/**
 * Schedule data export every week (Sunday at 1 AM)
 */
export async function scheduleWeeklyExport() {
  const queue = jobManager.getQueue(JobQueueSchema.enum.DATA_EXPORT);

  return await queue.add(
    "weekly-export",
    { task: "export-data" },
    {
      repeat: {
        pattern: "0 1 * * 0", // Sunday at 1 AM
      },
    }
  );
}

/**
 * Schedule a job with interval (every X milliseconds)
 */
export async function schedulePeriodicHealthCheck() {
  const queue = jobManager.getQueue(JobQueueSchema.enum.DEFAULT);

  return await queue.add(
    "health-check",
    { task: "check-system-health" },
    {
      repeat: {
        every: 300000, // Every 5 minutes (in milliseconds)
      },
    }
  );
}

/**
 * Schedule a delayed one-time job
 */
export async function scheduleDelayedNotification(
  userId: string,
  message: string,
  delayMs: number
) {
  return await jobManager.addJob(
    JobQueueSchema.enum.NOTIFICATION,
    "delayed-notification",
    { userId, message },
    {
      delay: delayMs, // Delay in milliseconds
    }
  );
}

/**
 * Remove a repeating job
 */
export async function removeRecurringJob(queueName: QueueName, jobKey: string) {
  const queue = jobManager.getQueue(queueName);
  const repeatableJobs = await queue.getJobSchedulers();

  for (const job of repeatableJobs) {
    if (job.key.includes(jobKey)) {
      await queue.removeJobScheduler(job.key);
    }
  }
}

/**
 * Get all repeating jobs for a queue
 */
export async function getRecurringJobs(queueName: QueueName) {
  const queue = jobManager.getQueue(queueName);
  return await queue.getJobSchedulers();
}

/**
 * Example usage:
 *
 * // Schedule recurring jobs on app startup
 * await scheduleCleanupJob();
 * await scheduleAnalyticsAggregation();
 * await scheduleWeeklyExport();
 *
 * // Schedule a delayed notification
 * await scheduleDelayedNotification(
 *   'user-123',
 *   'Your trial ends in 3 days',
 *   259200000 // 3 days in milliseconds
 * );
 *
 * // Remove a recurring job
 * await removeRecurringJob(QueueName.CLEANUP, 'daily-cleanup');
 */
