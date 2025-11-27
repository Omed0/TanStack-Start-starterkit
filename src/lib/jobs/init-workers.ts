/**
 * Initialize all BullMQ workers
 *
 * Call this function during application startup to register all job processors
 */

import { registerEmailWorker } from "./examples/email-queue";
import { registerFileProcessingWorker } from "./examples/file-processing-queue";
import { registerWebhookWorker } from "./examples/webhook-queue";
import { registerBackupWorker } from "./examples/database-backup-queue";


/**
 * Initialize all workers
 * This should be called once when the application starts
 */
export async function initializeWorkers(): Promise<void> {
  console.log("🚀 Initializing BullMQ workers...");

  try {
    // Register all workers
    registerEmailWorker();
    registerFileProcessingWorker();
    registerWebhookWorker();
    registerBackupWorker();

    console.log("✅ All BullMQ workers initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing BullMQ workers:", error);
    throw error;
  }
}

/**
 * Example: Add this to your app initialization
 *
 * In TanStack React Start, you can call this in a server function:
 * ```ts
 * import { createServerFn } from "@tanstack/react-start";
 * import { initializeWorkers } from "@/lib/jobs/init-workers";
 *
 * export const initWorkers = createServerFn({ method: "GET" }).handler(() => {
 *   initializeWorkers();
 * });
 *
 * // Then call initWorkers() early in your app lifecycle
 *
 * ```
 */
