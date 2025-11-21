import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/tanstack-utils/middlewares";
import { z } from "zod/v3";
import { getEnv } from "@/lib/env";

const envs = getEnv();

// PostHog API configuration
const POSTHOG_PROJECT_ID = envs.POSTHOG_PROJECT_ID;
const POSTHOG_PERSONAL_API_KEY = envs.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_API_HOST = envs.POSTHOG_API_HOST;

// Helper function to make PostHog API requests with retry logic
async function makePostHogRequest(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<any> {
  const url = `${POSTHOG_API_HOST}/api/projects/${POSTHOG_PROJECT_ID}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.text();

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          if (attempt < retries) {
            const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.warn(
              `PostHog API rate limited. Retrying in ${backoffMs}ms... (attempt ${attempt}/${retries})`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
          throw new Error(
            `PostHog API rate limit exceeded. Please try again later. Free plans have query limits - consider upgrading.`
          );
        }

        throw new Error(`PostHog API error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Wait before retrying on network errors
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error("PostHog API request failed after all retries");
}

// Date range schema for analytics queries
const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

/**
 * Get overview metrics (total events, users, sessions)
 */
export const getOverviewMetrics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    dateRangeSchema.extend({
      days: z.number().min(1).max(365).optional(),
    })
  )
  .handler(async ({ data }) => {
    const dateFilter = data.days
      ? `AND timestamp >= now() - INTERVAL ${data.days} DAY`
      : data.from
      ? `AND timestamp >= toDateTime('${data.from}') AND timestamp <= ${
          data.to ? `toDateTime('${data.to}')` : "now()"
        }`
      : "";

    // Query for total events
    const eventsQuery = {
      query: {
        kind: "HogQLQuery",
        query: `SELECT count() as total_events FROM events WHERE 1=1 ${dateFilter}`,
      },
      name: "Get total events count",
      refresh: "blocking" as const,
    };

    // Query for unique users
    const usersQuery = {
      query: {
        kind: "HogQLQuery",
        query: `SELECT count(DISTINCT person_id) as total_users FROM events WHERE 1=1 ${dateFilter}`,
      },
      name: "Get unique users count",
      refresh: "blocking" as const,
    };

    // Query for pageviews
    const pageviewsQuery = {
      query: {
        kind: "HogQLQuery",
        query: `SELECT count() as total_pageviews FROM events WHERE event = '$pageview' ${dateFilter}`,
      },
      name: "Get total pageviews",
      refresh: "blocking" as const,
    };

    // Query for sessions
    const sessionsQuery = {
      query: {
        kind: "HogQLQuery",
        query: `SELECT count(DISTINCT properties.$session_id) as total_sessions FROM events WHERE properties.$session_id IS NOT NULL ${dateFilter}`,
      },
      name: "Get total sessions",
      refresh: "blocking" as const,
    };

    try {
      const [eventsResult, usersResult, pageviewsResult, sessionsResult] =
        await Promise.all([
          makePostHogRequest("/query/", {
            method: "POST",
            body: JSON.stringify(eventsQuery),
          }),
          makePostHogRequest("/query/", {
            method: "POST",
            body: JSON.stringify(usersQuery),
          }),
          makePostHogRequest("/query/", {
            method: "POST",
            body: JSON.stringify(pageviewsQuery),
          }),
          makePostHogRequest("/query/", {
            method: "POST",
            body: JSON.stringify(sessionsQuery),
          }),
        ]);

      return {
        totalEvents: eventsResult.results?.[0]?.[0] || 0,
        totalUsers: usersResult.results?.[0]?.[0] || 0,
        totalPageviews: pageviewsResult.results?.[0]?.[0] || 0,
        totalSessions: sessionsResult.results?.[0]?.[0] || 0,
      };
    } catch (error) {
      console.error("Failed to fetch overview metrics:", error);
      throw new Error("Failed to fetch analytics overview");
    }
  });

/**
 * Get top events
 */
export const getTopEvents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    dateRangeSchema.extend({
      limit: z.number().min(1).max(100).default(10),
      days: z.number().min(1).max(365).optional(),
    })
  )
  .handler(async ({ data }) => {
    const dateFilter = data.days
      ? `AND timestamp >= now() - INTERVAL ${data.days} DAY`
      : data.from
      ? `AND timestamp >= toDateTime('${data.from}') AND timestamp <= ${
          data.to ? `toDateTime('${data.to}')` : "now()"
        }`
      : "AND timestamp >= now() - INTERVAL 7 DAY";

    const query = {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT 
            event as name,
            count() as count
          FROM events 
          WHERE 1=1 ${dateFilter}
          GROUP BY event 
          ORDER BY count DESC 
          LIMIT ${data.limit}
        `,
      },
      name: "Get top events",
      refresh: "blocking" as const,
    };

    try {
      const result = await makePostHogRequest("/query/", {
        method: "POST",
        body: JSON.stringify(query),
      });

      const events = (result.results || []).map((row: any[]) => ({
        name: row[0],
        count: row[1],
      }));

      return { events };
    } catch (error) {
      console.error("Failed to fetch top events:", error);
      throw new Error("Failed to fetch top events");
    }
  });

/**
 * Get top pages
 */
export const getTopPages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    dateRangeSchema.extend({
      limit: z.number().min(1).max(100).default(10),
      days: z.number().min(1).max(365).optional(),
    })
  )
  .handler(async ({ data }) => {
    const dateFilter = data.days
      ? `AND timestamp >= now() - INTERVAL ${data.days} DAY`
      : data.from
      ? `AND timestamp >= toDateTime('${data.from}') AND timestamp <= ${
          data.to ? `toDateTime('${data.to}')` : "now()"
        }`
      : "AND timestamp >= now() - INTERVAL 7 DAY";

    const query = {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT 
            properties.$current_url as url,
            count() as views,
            count(DISTINCT person_id) as unique_visitors
          FROM events 
          WHERE event = '$pageview' 
            AND properties.$current_url IS NOT NULL 
            ${dateFilter}
          GROUP BY properties.$current_url 
          ORDER BY views DESC 
          LIMIT ${data.limit}
        `,
      },
      name: "Get top pages",
      refresh: "blocking" as const,
    };

    try {
      const result = await makePostHogRequest("/query/", {
        method: "POST",
        body: JSON.stringify(query),
      });

      const pages = (result.results || []).map((row: any[]) => ({
        url: row[0],
        views: row[1],
        uniqueVisitors: row[2],
      }));

      return { pages };
    } catch (error) {
      console.error("Failed to fetch top pages:", error);
      throw new Error("Failed to fetch top pages");
    }
  });

/**
 * Get events over time (trend data)
 */
export const getEventsTrend = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    dateRangeSchema.extend({
      interval: z.enum(["hour", "day", "week", "month"]).default("day"),
      eventName: z.string().optional(),
      days: z.number().min(1).max(365).optional(),
    })
  )
  .handler(async ({ data }) => {
    const dateFilter = data.days
      ? `AND timestamp >= now() - INTERVAL ${data.days} DAY`
      : data.from
      ? `AND timestamp >= toDateTime('${data.from}') AND timestamp <= ${
          data.to ? `toDateTime('${data.to}')` : "now()"
        }`
      : "AND timestamp >= now() - INTERVAL 30 DAY";

    const eventFilter = data.eventName ? `AND event = '${data.eventName}'` : "";

    const intervalFormat = {
      hour: "toStartOfHour(timestamp)",
      day: "toStartOfDay(timestamp)",
      week: "toStartOfWeek(timestamp)",
      month: "toStartOfMonth(timestamp)",
    };

    const query = {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT 
            ${intervalFormat[data.interval]} as date,
            count() as count
          FROM events 
          WHERE 1=1 ${dateFilter} ${eventFilter}
          GROUP BY date 
          ORDER BY date ASC
        `,
      },
      name: "Get events trend",
      refresh: "blocking" as const,
    };

    try {
      const result = await makePostHogRequest("/query/", {
        method: "POST",
        body: JSON.stringify(query),
      });

      const trend = (result.results || []).map((row: any[]) => ({
        date: row[0],
        count: row[1],
      }));

      return { trend };
    } catch (error) {
      console.error("Failed to fetch events trend:", error);
      throw new Error("Failed to fetch events trend");
    }
  });

/**
 * Get user activity (recent events)
 */
export const getRecentEvents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).optional(),
    })
  )
  .handler(async ({ data }) => {
    const offsetClause = data.offset ? `OFFSET ${data.offset}` : "";

    const query = {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT 
            timestamp,
            event,
            person_id,
            properties.$current_url as url,
            properties.$browser as browser,
            properties.$os as os
          FROM events 
          WHERE timestamp >= now() - INTERVAL 1 DAY
          ORDER BY timestamp DESC 
          LIMIT ${data.limit}
          ${offsetClause}
        `,
      },
      name: "Get recent events",
      refresh: "lazy_async" as const,
    };

    try {
      const result = await makePostHogRequest("/query/", {
        method: "POST",
        body: JSON.stringify(query),
      });

      const events = (result.results || []).map((row: any[]) => ({
        timestamp: row[0],
        event: row[1],
        personId: row[2],
        url: row[3],
        browser: row[4],
        os: row[5],
      }));

      return { events };
    } catch (error) {
      console.error("Failed to fetch recent events:", error);
      throw new Error("Failed to fetch recent events");
    }
  });

/**
 * Get browser stats
 */
export const getBrowserStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    dateRangeSchema.extend({
      days: z.number().min(1).max(365).optional(),
    })
  )
  .handler(async ({ data }) => {
    const dateFilter = data.days
      ? `AND timestamp >= now() - INTERVAL ${data.days} DAY`
      : data.from
      ? `AND timestamp >= toDateTime('${data.from}') AND timestamp <= ${
          data.to ? `toDateTime('${data.to}')` : "now()"
        }`
      : "AND timestamp >= now() - INTERVAL 7 DAY";

    const query = {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT 
            properties.$browser as browser,
            count() as count,
            count(DISTINCT person_id) as unique_users
          FROM events 
          WHERE properties.$browser IS NOT NULL ${dateFilter}
          GROUP BY properties.$browser 
          ORDER BY count DESC 
          LIMIT 10
        `,
      },
      name: "Get browser statistics",
      refresh: "blocking" as const,
    };

    try {
      const result = await makePostHogRequest("/query/", {
        method: "POST",
        body: JSON.stringify(query),
      });

      const browsers = (result.results || []).map((row: any[]) => ({
        browser: row[0],
        count: row[1],
        uniqueUsers: row[2],
      }));

      return { browsers };
    } catch (error) {
      console.error("Failed to fetch browser stats:", error);
      throw new Error("Failed to fetch browser statistics");
    }
  });

/**
 * Get device stats
 */
export const getDeviceStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    dateRangeSchema.extend({
      days: z.number().min(1).max(365).optional(),
    })
  )
  .handler(async ({ data }) => {
    const dateFilter = data.days
      ? `AND timestamp >= now() - INTERVAL ${data.days} DAY`
      : data.from
      ? `AND timestamp >= toDateTime('${data.from}') AND timestamp <= ${
          data.to ? `toDateTime('${data.to}')` : "now()"
        }`
      : "AND timestamp >= now() - INTERVAL 7 DAY";

    const query = {
      query: {
        kind: "HogQLQuery",
        query: `
          SELECT 
            properties.$device_type as device,
            count() as count,
            count(DISTINCT person_id) as unique_users
          FROM events 
          WHERE properties.$device_type IS NOT NULL ${dateFilter}
          GROUP BY properties.$device_type 
          ORDER BY count DESC
        `,
      },
      name: "Get device statistics",
      refresh: "blocking" as const,
    };

    try {
      const result = await makePostHogRequest("/query/", {
        method: "POST",
        body: JSON.stringify(query),
      });

      const devices = (result.results || []).map((row: any[]) => ({
        device: row[0],
        count: row[1],
        uniqueUsers: row[2],
      }));

      return { devices };
    } catch (error) {
      console.error("Failed to fetch device stats:", error);
      throw new Error("Failed to fetch device statistics");
    }
  });
