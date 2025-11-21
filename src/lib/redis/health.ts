import { getRedisClient, isRedisReady } from "./client";

export type HealthCheckResult = {
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
  details: {
    connected: boolean;
    uptime?: number;
    usedMemory?: string;
    connectedClients?: number;
  };
};

/**
 * Perform a health check on the Redis connection
 * @returns Health check result
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  try {
    if (!isRedisReady()) {
      return {
        status: "unhealthy",
        error: "Redis client is not ready",
        details: {
          connected: false,
        },
      };
    }

    const redis = getRedisClient();
    const start = Date.now();

    // Test ping
    await redis.ping();
    const latency = Date.now() - start;

    // Get Redis info
    const info = await redis.info("server");
    const stats = await redis.info("stats");
    const memory = await redis.info("memory");

    // Parse info
    const uptime = parseInt(info.match(/uptime_in_seconds:(\d+)/)?.[1] || "0");
    const connectedClients = parseInt(
      stats.match(/connected_clients:(\d+)/)?.[1] || "0"
    );
    const usedMemory = memory.match(/used_memory_human:([^\r\n]+)/)?.[1];

    return {
      status: "healthy",
      latency,
      details: {
        connected: true,
        uptime,
        usedMemory,
        connectedClients,
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        connected: false,
      },
    };
  }
}

/**
 * Get detailed Redis statistics
 */
export async function getStats() {
  const redis = getRedisClient();

  try {
    const [info, memory, stats, keyspace] = await Promise.all([
      redis.info("server"),
      redis.info("memory"),
      redis.info("stats"),
      redis.info("keyspace"),
    ]);

    const parseInfo = (text: string, key: string): string | undefined => {
      return text.match(new RegExp(`${key}:([^\r\n]+)`))?.[1];
    };

    return {
      server: {
        version: parseInfo(info, "redis_version"),
        mode: parseInfo(info, "redis_mode"),
        os: parseInfo(info, "os"),
        uptime: parseInt(parseInfo(info, "uptime_in_seconds") || "0"),
      },
      memory: {
        used: parseInfo(memory, "used_memory_human"),
        peak: parseInfo(memory, "used_memory_peak_human"),
        fragmentation: parseInfo(memory, "mem_fragmentation_ratio"),
      },
      stats: {
        connections: parseInt(
          parseInfo(stats, "total_connections_received") || "0"
        ),
        commands: parseInt(parseInfo(stats, "total_commands_processed") || "0"),
        rejectedConnections: parseInt(
          parseInfo(stats, "rejected_connections") || "0"
        ),
        evictedKeys: parseInt(parseInfo(stats, "evicted_keys") || "0"),
      },
      keyspace: parseInfo(keyspace, "db0"),
    };
  } catch (error) {
    throw new Error(
      `Failed to get Redis stats: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
