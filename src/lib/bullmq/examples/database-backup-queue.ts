/**
 * Example: Database Backup Queue
 *
 * Demonstrates how to create database backup jobs that upload to MinIO
 *
 * OPTIMIZATION FOR DOCKER:
 * - Uses `docker exec` to run pg_dump inside the PostgreSQL container
 * - Minimal performance impact on database (non-blocking reads)
 * - Runs during off-peak hours (default: 2 AM) to minimize impact
 * - Uses Node.js zlib for efficient cross-platform compression
 * - Automatic cleanup of old backups based on retention policy
 *
 * PERFORMANCE TIPS:
 * - For large databases (>10GB), consider using --jobs flag for parallel dump
 * - Monitor Docker container resources during first backup
 * - Adjust retention days based on storage capacity
 * - Use schema-only backups for faster structure-only exports
 */

import {
  queueManager,
  workerManager,
  createProcessor,
  QueueNameSchema
} from "@/lib/bullmq";
import type { Job } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
import { s3Client } from "@/lib/file-management/s3-file-client"; // Still needed for listObjects
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { bucketName } from "@/lib/file-management/constant";

const execAsync = promisify(exec);

// Backup job data type
export interface BackupJobData {
  type: "full" | "schema-only";
  scheduledBy?: string;
  retentionDays?: number;
  compress?: boolean;
  parallelJobs?: number; // For large databases, use parallel dump (e.g., 4)
  maxBackupsToKeep?: number; // Maximum number of backups to keep (overrides retentionDays if set)
}

export interface BackupResult {
  success: boolean;
  path: string;
  size: number;
  checksum: string;
  timestamp: string;
}

/**
 * Trigger a manual database backup
 */
export async function triggerBackup(
  options: Partial<BackupJobData> & { maxBackupsToKeep?: number } = {}
) {
  return await queueManager.addJob(
    QueueNameSchema.enum.CLEANUP,
    "database-backup",
    {
      type: options.type || "full",
      scheduledBy: options.scheduledBy || "manual",
      retentionDays: options.retentionDays || 30,
      compress: options.compress !== false,
      maxBackupsToKeep: options.maxBackupsToKeep,
    },
    {
      priority: 1, // High priority
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );
}

/**
 * Schedule automatic daily backups at 2 AM
 */
export async function scheduleAutomaticBackup() {
  const queue = queueManager.getQueue(QueueNameSchema.enum.CLEANUP);

  return await queue.add(
    "database-backup",
    {
      type: "full",
      scheduledBy: "scheduled",
      retentionDays: 30,
      compress: true,
    } as BackupJobData,
    {
      repeat: {
        pattern: "0 2 * * *", // 2 AM every day
      },
      priority: 2,
    }
  );
}

/**
 * Schedule weekly full backup (Sunday at 3 AM)
 */
export async function scheduleWeeklyBackup() {
  const queue = queueManager.getQueue(QueueNameSchema.enum.CLEANUP);

  return await queue.add(
    "database-backup",
    {
      type: "full",
      scheduledBy: "weekly-schedule",
      retentionDays: 90,
      compress: true,
    } as BackupJobData,
    {
      repeat: {
        pattern: "0 3 * * 0", // Sunday at 3 AM
      },
      priority: 1,
    }
  );
}

/**
 * Register the backup worker
 * Call this once during application startup
 */
export function registerBackupWorker() {
  return workerManager.registerWorker(
    QueueNameSchema.enum.CLEANUP,
    createProcessor<BackupJobData, BackupResult>(
      async (job: Job<BackupJobData>) => {
        // Use platform-appropriate backup directory
        const backupDir =
          process.platform === "win32"
            ? path.join("C:\\Temp", "backups")
            : "/tmp/backups";

        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const { type, retentionDays, compress, parallelJobs } = job.data;

        try {
          // Step 1: Create database dump (20%)
          await job.updateProgress(20);
          const dumpFile = await createDatabaseDump(
            type,
            backupDir,
            parallelJobs
          );

          // Step 2: Compress if needed (40%)
          await job.updateProgress(40);
          let finalFile = dumpFile;
          if (compress) {
            finalFile = await compressFile(dumpFile);
            fs.unlinkSync(dumpFile);
          }

          // Step 3: Calculate checksum (60%)
          await job.updateProgress(60);
          const checksum = await calculateChecksum(finalFile);

          // Step 4: Upload to MinIO (80%)
          await job.updateProgress(80);
          const uploadedPath = await uploadToMinIO(finalFile, checksum);
          const fileSize = fs.statSync(finalFile).size;

          // Step 5: Cleanup old backups (90%)
          await job.updateProgress(90);
          await cleanupOldBackups(
            retentionDays || 30,
            job.data.maxBackupsToKeep
          );

          // Step 6: Cleanup local file
          fs.unlinkSync(finalFile);

          await job.updateProgress(100);

          return {
            success: true,
            path: uploadedPath,
            size: fileSize,
            checksum,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error("Backup process failed:", error);
          throw error;
        } finally {
          fs.rmSync(backupDir, { recursive: true, force: true }); // Clean up backup directory
        }
      }
    ),
    {
      concurrency: 1, // Process one backup at a time
    }
  );
}

/**
 * Helper: Create database dump using pg_dump
 *
 * This uses docker exec to run pg_dump inside the PostgreSQL container
 * Benefits:
 * - No need to install pg_dump on host machine (especially useful on Windows)
 * - Guaranteed version compatibility (pg_dump matches PostgreSQL version)
 * - Faster (no network overhead, runs locally inside container)
 * - Minimal impact on Docker PostgreSQL instance
 *
 * Performance options:
 * - parallelJobs: For large databases, use parallel dump (e.g., 4 jobs)
 *   Note: Parallel dump requires -F d (directory format) instead of plain SQL
 */
async function createDatabaseDump(
  type: "full" | "schema-only",
  backupDir: string,
  parallelJobs?: number
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${type}-${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);
  const env = (await import("@/lib/env")).getEnv();
  // Parse DATABASE_URL
  const dbUrl = new URL(env.DATABASE_URL);
  const dbName = dbUrl.pathname.slice(1);
  const dbUser = dbUrl.username;
  const dbPassword = dbUrl.password;

  // Build pg_dump command
  const schemaOnly = type === "schema-only" ? "--schema-only" : "";

  // Docker container name from docker-compose.yml (dynamic based on APP_NAME)
  const containerName = `${env.APP_NAME}-postgres`;

  // Optional: Use parallel dump for better performance on large databases
  // Note: Parallel dump uses more CPU but is much faster for large databases
  const parallelFlag =
    parallelJobs && parallelJobs > 1 ? `--jobs=${parallelJobs}` : "";

  // Use docker exec to run pg_dump inside the container
  // This avoids network overhead and ensures pg_dump version matches PostgreSQL version
  // The dump is piped to stdout and redirected to file on host
  const command = `docker exec -e PGPASSWORD=${dbPassword} ${containerName} pg_dump -U ${dbUser} ${schemaOnly} ${parallelFlag} -F p ${dbName} > "${filepath}"`;

  try {
    await execAsync(command);
    console.log(
      `Database backup created: ${filepath} ${parallelJobs ? `(${parallelJobs} parallel jobs)` : ""
      }`
    );
    return filepath;
  } catch (error) {
    console.error("Failed to create database backup:", error);
    throw new Error(
      `Database backup failed: ${error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Helper: Compress file using gzip
 *
 * Uses Node.js built-in zlib for cross-platform compatibility
 * Works on Windows, Linux, and macOS without external dependencies
 */
async function compressFile(filepath: string): Promise<string> {
  const compressedPath = `${filepath}.gz`;

  try {
    // Use Node.js zlib for cross-platform gzip compression
    const zlib = await import("zlib");
    const { pipeline } = await import("stream/promises");
    const fsModule = await import("fs");

    const source = fsModule.createReadStream(filepath);
    const destination = fsModule.createWriteStream(compressedPath);
    const gzip = zlib.createGzip({ level: 9 }); // Maximum compression

    await pipeline(source, gzip, destination);

    console.log(`File compressed: ${compressedPath}`);
    return compressedPath;
  } catch (error) {
    console.error("Failed to compress file:", error);
    throw new Error(
      `Compression failed: ${error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Helper: Calculate SHA256 checksum
 */
async function calculateChecksum(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filepath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Helper: Upload backup to MinIO using the uploadFileToBucket utility
 */
async function uploadToMinIO(
  filepath: string,
  checksum: string
): Promise<string> {
  const filename = path.basename(filepath);
  const objectName = `backups/database/${filename}`;

  // Use the uploadFileToBucket utility from s3-file-client.ts
  const { uploadFileToBucket } = await import(
    "@/lib/file-management/s3-file-client"
  );

  await uploadFileToBucket({
    bucketName,
    objectName,
    filePath: filepath,
    metadata: {
      "Content-Type": filepath.endsWith(".gz")
        ? "application/gzip"
        : "application/sql",
      "x-amz-meta-checksum": checksum,
      "x-amz-meta-timestamp": new Date().toISOString(),
    },
  });

  return objectName;
}

/**
 * Helper: Cleanup old backups based on retention policy
 * Supports two modes:
 * 1. maxBackupsToKeep: Keep only N latest backups (count-based)
 * 2. retentionDays: Keep backups newer than N days (time-based)
 */
async function cleanupOldBackups(
  retentionDays?: number,
  maxBackupsToKeep?: number
): Promise<void> {
  const prefix = "backups/database/";

  // Import utilities from s3-file-client.ts
  const { createBucketIfNotExists, deleteFileFromBucket, keepLatestBackups } =
    await import("@/lib/file-management/s3-file-client");

  // Ensure bucket exists before listing
  await createBucketIfNotExists(bucketName);

  // If maxBackupsToKeep is specified, use count-based retention
  if (maxBackupsToKeep && maxBackupsToKeep > 0) {
    const deletedCount = await keepLatestBackups({
      bucketName,
      prefix,
      maxBackupsToKeep,
    });

    console.log(
      `Retention policy: Kept ${maxBackupsToKeep} latest backups, deleted ${deletedCount} old backups`
    );
    return;
  }

  // Otherwise, use time-based retention (legacy behavior)
  const objects: any[] = [];

  const stream = s3Client.listObjects(bucketName, prefix, true);

  for await (const obj of stream) {
    objects.push(obj);
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (retentionDays || 30));

  const toDelete = objects.filter(
    (obj) => obj.lastModified && obj.lastModified < cutoffDate
  );

  for (const obj of toDelete) {
    const deleted = await deleteFileFromBucket({
      bucketName,
      fileName: obj.name,
    });

    if (deleted) {
      console.log(`Deleted old backup: ${obj.name}`);
    } else {
      console.error(`Failed to delete backup ${obj.name}`);
    }
  }
}

/**
 * Example usage:
 *
 * // In your app initialization (src/instrumentation.ts):
 * registerBackupWorker();
 *
 * // Trigger manual backup:
 * await triggerBackup({ type: "full", compress: true });
 *
 * // Schedule automatic backups:
 * await scheduleAutomaticBackup(); // Daily at 2 AM
 * await scheduleWeeklyBackup(); // Weekly on Sunday at 3 AM
 */
