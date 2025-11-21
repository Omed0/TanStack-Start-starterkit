/**
 * Advanced TanStack Query Utilities for TanStack Start Server Functions
 *
 * Provides automatic query and mutation options generation with full TypeScript support
 *
 * @example
 * import { api } from "@/fn";
 *
 * // Query with full types
 * const todos = useQuery(api.todo.getAll.queryOptions());
 *
 * // Mutation with full types
 * const createMutation = useMutation(api.todo.create.mutationOptions());
 * await createMutation.mutateAsync({ data: { text: "hello" } });
 */

import type {
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";

/**
 * Create query options for a server function
 */
function createQueryOptions<TFn extends (...args: any[]) => any>(
  queryKey: QueryKey,
  fn: TFn
) {
  type Input = Parameters<TFn>[0];
  type Output = Awaited<ReturnType<TFn>>;

  return (input?: Input): UseQueryOptions<Output, Error, Output, QueryKey> => ({
    queryKey: input ? [...queryKey, input] : queryKey,
    queryFn: () => fn(input),
  });
}

/**
 * Create mutation options for a server function
 */
function createMutationOptions<TFn extends (...args: any[]) => any>(fn: TFn) {
  type Input = Parameters<TFn>[0];
  type Output = Awaited<ReturnType<TFn>>;

  return (): UseMutationOptions<Output, Error, Input> => ({
    mutationFn: (input: Input) => fn(input),
  });
}

/**
 * Wrap a server function module with query utilities
 */
type QueryUtilsForFn<TFn extends (...args: any[]) => any> =
  Parameters<TFn>[0] extends undefined | void
    ? {
        queryOptions: () => UseQueryOptions<
          Awaited<ReturnType<TFn>>,
          Error,
          Awaited<ReturnType<TFn>>,
          QueryKey
        >;
      }
    : {
        queryOptions: (
          input?: Parameters<TFn>[0]
        ) => UseQueryOptions<
          Awaited<ReturnType<TFn>>,
          Error,
          Awaited<ReturnType<TFn>>,
          QueryKey
        >;
      };

type MutationUtilsForFn<TFn extends (...args: any[]) => any> = {
  mutationOptions: () => UseMutationOptions<
    Awaited<ReturnType<TFn>>,
    Error,
    Parameters<TFn>[0]
  >;
};

/**
 * Create API utilities for a collection of server functions
 */
export function createAPIUtils<
  T extends Record<string, Record<string, (...args: any[]) => any>>
>(modules: T) {
  const api = {} as any;

  for (const [moduleName, fns] of Object.entries(modules)) {
    api[moduleName] = {};

    for (const [fnName, fn] of Object.entries(fns)) {
      const queryKey = [moduleName, fnName];

      api[moduleName][fnName] = {
        queryOptions: (input?: any) => createQueryOptions(queryKey, fn)(input),
        mutationOptions: () => createMutationOptions(fn)(),
      };
    }
  }

  return api as {
    [K in keyof T]: {
      [F in keyof T[K]]: QueryUtilsForFn<T[K][F]> & MutationUtilsForFn<T[K][F]>;
    };
  };
}
