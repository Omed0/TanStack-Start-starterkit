/**
 * Example: Email Queue
 *
 * Demonstrates how to create and process email jobs
 */

import {
  queueManager,
  workerManager,
  createProcessor,
  QueueNameSchema,
} from "@/lib/bullmq";
import type { Job } from "bullmq";

// Email job data type
export interface EmailJobData {
  to: string;
  from?: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

/**
 * Add an email job to the queue
 */
export async function sendEmail(emailData: EmailJobData) {
  return await queueManager.addJob(QueueNameSchema.enum.EMAIL, "send-email", emailData, {
    priority: 2, // High priority
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}

/**
 * Add multiple emails in bulk
 */
export async function sendBulkEmails(emails: EmailJobData[]) {
  return await queueManager.addBulk(
    QueueNameSchema.enum.EMAIL,
    emails.map((email) => ({
      name: "send-email",
      data: email,
      opts: {
        priority: 3,
        attempts: 2,
      },
    }))
  );
}

/**
 * Register the email worker
 * Call this once during application startup
 */
export function registerEmailWorker() {
  return workerManager.registerWorker(
    QueueNameSchema.enum.EMAIL,
    createProcessor<EmailJobData, { sent: boolean; messageId?: string }>(
      async (job: Job<EmailJobData>) => {
        const { to, subject, body } = job.data;

        // Update job progress
        await job.updateProgress(10);

        // TODO: Replace with your actual email sending logic
        console.log(`Sending email to ${to}...`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body.substring(0, 50)}...`);

        // Simulate email sending
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await job.updateProgress(100);

        return {
          sent: true,
          messageId: `msg-${Date.now()}`,
        };
      }
    ),
    {
      concurrency: 5, // Process 5 emails at a time
    }
  );
}

/**
 * Example usage:
 *
 * // In your app initialization:
 * registerEmailWorker();
 *
 * // In your API route:
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   body: 'Welcome to our service',
 *   html: '<h1>Welcome!</h1><p>Welcome to our service</p>',
 * });
 */
