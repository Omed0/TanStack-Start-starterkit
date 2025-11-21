/**
 * Example: File Processing Queue
 *
 * Demonstrates how to handle file upload and processing jobs
 */

import {
  queueManager,
  workerManager,
  createProcessor,
  QueueNameSchema,
} from "@/lib/bullmq";
import type { Job } from "bullmq";

// File processing job data
export interface FileProcessingJobData {
  fileId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  userId: string;
  operations: Array<"resize" | "compress" | "convert" | "thumbnail">;
}

export interface FileProcessingResult {
  success: boolean;
  processedUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Add a file processing job
 */
export async function processFile(fileData: FileProcessingJobData) {
  return await queueManager.addJob(
    QueueNameSchema.enum.FILE_PROCESSING,
    "process-file",
    fileData,
    {
      priority: 2,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
    }
  );
}

/**
 * Add a delayed file processing job (e.g., process after 1 hour)
 */
export async function scheduleFileProcessing(
  fileData: FileProcessingJobData,
  delayMs: number
) {
  return await queueManager.addJob(
    QueueNameSchema.enum.FILE_PROCESSING,
    "process-file",
    fileData,
    {
      delay: delayMs,
      priority: 3,
    }
  );
}

/**
 * Register the file processing worker
 */
export function registerFileProcessingWorker() {
  return workerManager.registerWorker(
    QueueNameSchema.enum.FILE_PROCESSING,
    createProcessor<FileProcessingJobData, FileProcessingResult>(
      async (job: Job<FileProcessingJobData>) => {
        const { fileId, fileName, operations } = job.data;

        console.log(`Processing file ${fileName} (ID: ${fileId})`);

        const totalSteps = operations.length;
        let currentStep = 0;

        try {
          for (const operation of operations) {
            currentStep++;
            const progress = (currentStep / totalSteps) * 100;

            await job.updateProgress(progress);
            await job.log(`Performing operation: ${operation}`);

            // TODO: Implement actual file processing logic
            switch (operation) {
              case "resize":
                console.log("Resizing image...");
                await new Promise((resolve) => setTimeout(resolve, 1000));
                break;
              case "compress":
                console.log("Compressing file...");
                await new Promise((resolve) => setTimeout(resolve, 1500));
                break;
              case "convert":
                console.log("Converting format...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                break;
              case "thumbnail":
                console.log("Generating thumbnail...");
                await new Promise((resolve) => setTimeout(resolve, 800));
                break;
            }
          }

          return {
            success: true,
            processedUrl: `https://cdn.example.com/processed/${fileId}`,
            thumbnailUrl: `https://cdn.example.com/thumbnails/${fileId}`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    ),
    {
      concurrency: 3, // Process 3 files concurrently
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );
}

/**
 * Example usage:
 *
 * // Register worker on startup
 * registerFileProcessingWorker();
 *
 * // Process a file immediately
 * await processFile({
 *   fileId: 'file-123',
 *   fileName: 'image.jpg',
 *   fileType: 'image/jpeg',
 *   fileUrl: 'https://example.com/uploads/image.jpg',
 *   userId: 'user-456',
 *   operations: ['resize', 'compress', 'thumbnail'],
 * });
 *
 * // Schedule processing for later
 * await scheduleFileProcessing(fileData, 3600000); // Process in 1 hour
 */
