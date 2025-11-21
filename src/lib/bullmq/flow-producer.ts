import { FlowProducer, type FlowJob, type FlowOpts } from "bullmq";
import { redisConnection } from "./config";

/**
 * Flow Producer Manager - Manages job flows (parent-child relationships)
 */
class FlowProducerManager {
  private producer: FlowProducer | null = null;

  /**
   * Get or create the flow producer
   */
  getProducer(): FlowProducer {
    if (!this.producer) {
      this.producer = new FlowProducer({
        connection: redisConnection,
      });

      this.producer.on("error", (error) => {
        console.error("Flow producer error:", error);
      });
    }

    return this.producer;
  }

  /**
   * Add a job flow
   * @param flow - Flow definition
   * @param opts - Flow options
   */
  async addFlow(flow: FlowJob, opts?: FlowOpts) {
    const producer = this.getProducer();
    return await producer.add(flow, opts);
  }

  /**
   * Add multiple job flows in bulk
   * @param flows - Array of flow definitions
   */
  async addBulkFlows(flows: FlowJob[]) {
    const producer = this.getProducer();
    return await producer.addBulk(flows);
  }

  /**
   * Close the flow producer
   */
  async close(): Promise<void> {
    if (this.producer) {
      await this.producer.close();
      this.producer = null;
    }
  }
}

// Singleton instance
export const flowProducerManager = new FlowProducerManager();

// Export for custom instances if needed
export { FlowProducerManager };

/**
 * Helper function to create a simple flow
 * @example
 * ```typescript
 * const flow = createFlow({
 *   name: 'parent-job',
 *   queueName: 'main-queue',
 *   data: { id: 1 },
 *   children: [
 *     {
 *       name: 'child-job-1',
 *       queueName: 'child-queue',
 *       data: { parentId: 1 },
 *     },
 *     {
 *       name: 'child-job-2',
 *       queueName: 'child-queue',
 *       data: { parentId: 1 },
 *     },
 *   ],
 * });
 * ```
 */
export function createFlow(flow: FlowJob): FlowJob {
  return flow;
}
