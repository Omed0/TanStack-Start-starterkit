import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const { auth } = await import("@/lib/auth");

    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return next({
      context: { session },
    });
  }
);


export const dbMiddleware = createMiddleware().server(async ({ next }) => {
  const prisma = (await import("@/prisma")).default;
  const db = prisma;
  return next({
    context: { db },
  });
})
