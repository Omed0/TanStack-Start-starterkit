// Todo functions
export * from "./todos";

// Queue functions
export * from "./queue";

// Backup functions
export * from "./backup";

// Analytics functions
export * from "./analytics";

// File functions
export * from "./files";

/**
 * Main API object with all server functions
 */
import { createAPIUtils } from "@/lib/tanstack-utils/query-helpers";
import * as todoFns from "@/fn/todos";
import * as queueFns from "@/fn/queue";
import * as backupFns from "@/fn/backup";
import * as analyticsFns from "@/fn/analytics";
import * as fileFns from "@/fn/files";
import { cache } from "react";

export const api = cache(() =>
  createAPIUtils({
    todo: todoFns,
    queue: queueFns,
    backup: backupFns,
    analytics: analyticsFns,
    file: fileFns,
  })
)();

/**
 * Type exports for advanced usage
 */
export type API = typeof api;
export type APIModule = keyof typeof api;
export type APIFunction<M extends APIModule> = keyof (typeof api)[M];
