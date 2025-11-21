//import type { CustomerState } from "@polar-sh/sdk/models/components/customerstate.js";
import type { auth } from "@/lib/auth";
import type { authClient } from "@/lib/auth-client";
import { authMiddleware } from "@/lib/tanstack-utils/middlewares";
import { createServerFn } from "@tanstack/react-start";

import { z } from "zod/v3";

export type AuthSession = typeof authClient.$Infer.Session | null

export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context.session;
  });

//export type PaymentCustomerState = CustomerState;

//export const getPayment = createServerFn({ method: "GET" })
//  .middleware([authMiddleware])
//  .handler(async ({ context }) => {
//    const { getRequestHeaders } = await import("@tanstack/react-start/server");
//    try {
//      // Only fetch payment state if user is authenticated
//      if (!context.session?.user) {
//        return null;
//      }

//      const customerState = await auth.api.state({
//        headers: getRequestHeaders(),
//      });
//      return customerState;
//    } catch (error) {
//      console.error("Error fetching payment state:", error);
//      return null;
//    }
//  });

type AuthApiMethod = typeof auth.api;
type AuthApiMethodKeys = keyof typeof auth.api;

type ExtractParameters<T> = T extends (options: infer P) => any ? P : never;

type ExtractBody<T> = T extends { body?: infer B } ? B : never;
type ExtractParams<T> = T extends { params?: infer P } ? P : never;
type ExtractQuery<T> = T extends { query?: infer Q } ? Q : never;

type ExtractReturnType<T> = T extends (...args: any[]) => infer R
  ? Awaited<R>
  : never;

/**
 * Creates an authenticated server endpoint that wraps a Better Auth API method.
 *
 * This function generates a type-safe server function that automatically handles authentication,
 * request validation, and API method invocation.
 *
 * @template TMethod - The Better Auth API method key to create an endpoint for
 * @param apiMethod - The name of the Better Auth API method to wrap
 * @param options - Optional configuration object
 * @param options.method - HTTP method for the endpoint ("GET" or "POST")
 *
 * @returns A type-safe server function that accepts body, params, and query parameters
 * and returns the response type of the wrapped API method
 *
 * @example
 * ```typescript
 * // Create a POST endpoint for user registration
 * const registerEndpoint = createAuthenticatedEndpoint('signUp', { method: 'POST' });
 *
 * // Use the endpoint
 * const result = await registerEndpoint({
 *   body: { email: 'user@example.com', password: 'password123' }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create a GET endpoint for fetching user profile
 * const getUserEndpoint = createAuthenticatedEndpoint('getUser', { method: 'GET' });
 *
 * // Use the endpoint with query parameters
 * const user = await getUserEndpoint({
 *   query: { userId: '123' }
 * });
 * ```
 */
export const createAuthenticatedEndpoint = <TMethod extends AuthApiMethodKeys>(
  apiMethod: TMethod,
  options?: { method?: "GET" | "POST"; withMiddleware?: boolean }
) => {
  const { withMiddleware = true } = options ?? {};
  z;
  type ApiMethodParams = ExtractParameters<AuthApiMethod[TMethod]>;
  type BodyType = ExtractBody<ApiMethodParams>;
  type ParamsType = ExtractParams<ApiMethodParams>;
  type QueryType = ExtractQuery<ApiMethodParams>;
  type ReturnType = ExtractReturnType<AuthApiMethod[TMethod]>;

  type InputType = {
    body?: BodyType;
    params?: ParamsType;
    query?: QueryType;
  };

  const inputSchema = z.custom<InputType>(() => true);

  const serverFnOptions = options?.method ? { method: options.method } : {};

  return createServerFn(serverFnOptions)
    .middleware([...(withMiddleware ? [authMiddleware] : [])])
    .inputValidator(inputSchema)
    .handler(async ({ data }) => {
      const { getRequestHeaders } = await import(
        "@tanstack/react-start/server"
      );

      const { auth } = await import("@/lib/auth");
      const apiFunction = auth.api[apiMethod] as any;

      const result = await apiFunction({
        headers: getRequestHeaders(),
        ...data,
      });

      return result;
    }) as unknown as (input: InputType) => Promise<ReturnType>;
};

// Usage example:
// export const banUser = createAuthenticatedEndpoint("banUser", { method: "POST" });
//export const getUserProfile = createAuthenticatedEndpoint("getUser", {
//  method: "GET",
//});
