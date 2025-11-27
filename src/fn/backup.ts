import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/tanstack-utils/middlewares";
import { z } from "zod";
import {
  triggerBackup,
  scheduleAutomaticBackup,
  scheduleWeeklyBackup,
} from "@/lib/jobs/examples/database-backup-queue";
import { jobManager, JobQueueSchema } from "@/lib/jobs";
import { restoreBackup } from "@/lib/storage/helper";
import { bucketName } from "@/lib/storage/constant";

/**
 * Trigger a manual backup
 */
export const triggerManualBackup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      type: z.enum(["full", "schema-only"]).default("full"),
      scheduledBy: z.string().optional(),
      retentionDays: z.number().min(1).max(365).default(30),
      compress: z.boolean().default(true),
      maxBackupsToKeep: z.number().min(1).optional(),
    })
  )
  .handler(async ({ data }) => {
    const job = await triggerBackup(data);
    return {
      success: true,
      jobId: job.id,
      message: "Backup job queued successfully",
    };
  });

/**
 * Schedule automatic backup (daily at 2 AM)
 */
export const scheduleDailyBackup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const job = await scheduleAutomaticBackup();
    return {
      success: true,
      jobId: job.id,
      message: "Daily backup scheduled at 2 AM",
    };
  });

/**
 * Schedule weekly backup (Sunday at 3 AM)
 */
export const scheduleWeeklyBackupFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const job = await scheduleWeeklyBackup();
    return {
      success: true,
      jobId: job.id,
      message: "Weekly backup scheduled for Sunday at 3 AM",
    };
  });

/**
 * Schedule custom backup
 */
export const scheduleCustomBackup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      pattern: z.string(), // Cron pattern
      type: z.enum(["full", "schema-only"]).default("full"),
      retentionDays: z.number().min(1).max(365).default(30),
      compress: z.boolean().default(true),
    })
  )
  .handler(async ({ data }) => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);

    const job = await queue.add(
      "database-backup",
      {
        type: data.type,
        scheduledBy: "custom-schedule",
        retentionDays: data.retentionDays,
        compress: data.compress,
      },
      {
        repeat: {
          pattern: data.pattern,
        },
        priority: 2,
      }
    );

    return {
      success: true,
      jobId: job.id,
      pattern: data.pattern,
      message: "Custom backup schedule created",
    };
  });

/**
 * Get scheduled backups
 */
export const getScheduledBackups = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);
    const repeatableJobs = await queue.getJobSchedulers();

    return repeatableJobs.map((job: any) => ({
      id: job.id,
      name: job.name,
      pattern: job.pattern,
      next: job.next,
      key: job.key,
    }));
  });

/**
 * Remove scheduled backup
 */
export const removeScheduledBackup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }) => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);
    await queue.removeJobScheduler(data.key);

    return {
      success: true,
      message: "Scheduled backup removed",
    };
  });

/**
 * Get backup job status
 */
export const getBackupJobStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ jobId: z.string() }))
  .handler(async ({ data }) => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);
    const job = await queue.getJob(data.jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
    };
  });

/**
 * Get recent backup jobs
 */
export const getRecentBackupJobs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ limit: z.number().default(10) }))
  .handler(async ({ data }) => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);

    const [completed, failed, active, waiting] = await Promise.all([
      queue.getCompleted(0, data.limit),
      queue.getFailed(0, data.limit),
      queue.getActive(0, data.limit),
      queue.getWaiting(0, data.limit),
    ]);

    const jobs = [...active, ...waiting, ...completed, ...failed]
      .filter((job) => job.name === "database-backup")
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, data.limit);

    return Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        state: await job.getState(),
        progress: job.progress,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      }))
    );
  });

/**
 * Get backup statistics
 */
export const getBackupStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);

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
      total: waiting + active + completed + failed + delayed,
    };
  });

/**
 * Retry a failed backup
 */
export const retryBackupJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ jobId: z.string() }))
  .handler(async ({ data }) => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);
    const job = await queue.getJob(data.jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    await job.retry();

    return {
      success: true,
      message: "Backup job queued for retry",
    };
  });

/**
 * Remove a backup job
 */
export const removeBackupJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ jobId: z.string() }))
  .handler(async ({ data }) => {
    const queue = jobManager.getQueue(JobQueueSchema.enum.CLEANUP);
    const job = await queue.getJob(data.jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    await job.remove();

    return {
      success: true,
      message: "Backup job removed",
    };
  });

/**
 * List all backups from S3/MinIO
 */
export const listBackups = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { listObjectsInBucket } = await import(
      "@/lib/storage"
    );

    const backups = await listObjectsInBucket({
      bucketName,
      prefix: "backups/database/",
    });

    // Sort by lastModified (newest first)
    backups.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    return backups.map((backup) => ({
      name: backup.name,
      filename: backup.name.split("/").pop() || backup.name,
      size: backup.size,
      lastModified: backup.lastModified.toISOString(),
      etag: backup.etag,
    }));
  });

/**
 * Get detailed metadata for a specific backup
 */
export const getBackupDetails = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ objectName: z.string() }))
  .handler(async ({ data }) => {
    const { getObjectMetadata } = await import(
      "@/lib/storage"
    );

    try {
      const metadata = await getObjectMetadata({
        bucketName,
        objectName: data.objectName,
      });

      return {
        name: data.objectName,
        filename: data.objectName.split("/").pop() || data.objectName,
        size: metadata.size,
        lastModified: metadata.lastModified.toISOString(),
        etag: metadata.etag,
        contentType: metadata.metaData?.["content-type"],
        checksum: metadata.metaData?.["x-amz-meta-checksum"],
        timestamp: metadata.metaData?.["x-amz-meta-timestamp"],
      };
    } catch (error) {
      throw new Error("Backup not found");
    }
  });

/**
 * Restore a backup from S3/MinIO
 */
export const restoreBackupFromStorage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ objectName: z.string() }))
  .handler(async ({ data }) => {
    try {
      const filename = await restoreBackup(data.objectName);

      return {
        success: true,
        message: "Backup restored successfully",
        filename,
      };
    } catch (error) {
      console.error("Restore failed:", error);
      throw new Error(
        `Restore failed: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  });

/**
 * Delete a backup from S3/MinIO
 */
export const deleteBackupFromStorage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ objectName: z.string() }))
  .handler(async ({ data }) => {
    const { deleteFileFromBucket } = await import(
      "@/lib/storage"
    );

    const deleted = await deleteFileFromBucket({
      bucketName,
      fileName: data.objectName,
    });

    if (!deleted) {
      throw new Error("Failed to delete backup");
    }

    return {
      success: true,
      message: "Backup deleted successfully",
    };
  });
