/**
 * Example: Webhook Queue
 * 
 * Demonstrates reliable webhook delivery with retries
 */

import {
  jobManager, jobProcessor,
  createProcessor,
  JobQueueSchema
} from "@/lib/jobs";
import type { Job } from "infra-kit/dist/queue";

// Webhook job data
export interface WebhookJobData {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  event: string;
  metadata?: Record<string, any>;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  attempt: number;
}

/**
 * Send a webhook
 */
export async function sendWebhook(webhookData: WebhookJobData) {
  return await jobManager.addJob(
    JobQueueSchema.enum.WEBHOOK,
    "send-webhook",
    webhookData,
    {
      priority: 2,
      attempts: 5, // Retry up to 5 times
      backoff: {
        type: "exponential",
        delay: 5000, // Start with 5 seconds
      },
    }
  );
}

/**
 * Register the webhook worker
 */
export function registerWebhookWorker() {
  return jobProcessor.registerWorker(
    JobQueueSchema.enum.WEBHOOK,
    createProcessor<WebhookJobData, WebhookResult>(
      async (job: Job<WebhookJobData>) => {
        const { url, method, headers, body, event } = job.data;

        await job.log(`Sending ${event} webhook to ${url}`);

        try {
          const response = await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "BullMQ-Webhook/1.0",
              ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(25000), // 25 second timeout
          });

          const responseData = await response.text();

          if (!response.ok) {
            throw new Error(
              `Webhook failed with status ${response.status}: ${responseData}`
            );
          }

          await job.log(`Webhook delivered successfully (${response.status})`);

          return {
            success: true,
            statusCode: response.status,
            response: responseData,
            attempt: job.attemptsMade,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          await job.log(`Webhook failed: ${errorMessage}`);

          // If this isn't the last attempt, throw to trigger retry
          if (job.attemptsMade < (job.opts.attempts || 1)) {
            throw error;
          }

          // Last attempt failed
          return {
            success: false,
            error: errorMessage,
            attempt: job.attemptsMade,
          };
        }
      }
    ),
    {
      concurrency: 10,
    }
  );
}

/**
 * Example usage:
 * 
 * // Register worker on startup
 * registerWebhookWorker();
 * 
 * // Send a webhook
 * await sendWebhook({
 *   url: 'https://api.example.com/webhooks',
 *   method: 'POST',
 *   event: 'user.created',
 *   body: {
 *     userId: '123',
 *     email: 'user@example.com',
 *     timestamp: new Date().toISOString(),
 *   },
 *   headers: {
 *     'X-Webhook-Secret': 'your-secret-key',
 *   },
 * });
 */
