import { createServerFn } from "@tanstack/react-start";
import { dbMiddleware } from "@/lib/tanstack-utils/middlewares";
import { z } from "zod/v3";

/**
 * Get all todos
 */
export const getAllTodos = createServerFn({ method: "GET" })
  .middleware([dbMiddleware])
  .handler(async ({ context }) => {
    return await context.db.todo.findMany({
      orderBy: {
        id: "asc",
      },
    });
  });

/**
 * Create a new todo
 */
export const createTodo = createServerFn({ method: "POST" })
  .middleware([dbMiddleware])
  .inputValidator(z.object({ text: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    return await context.db.todo.create({
      data: {
        text: data.text,
      },
    });
  });

/**
 * Toggle todo completion status
 */
export const toggleTodo = createServerFn({ method: "POST" })
  .middleware([dbMiddleware])
  .inputValidator(z.object({ id: z.number(), completed: z.boolean() }))
  .handler(async ({ data, context }) => {
    return await context.db.todo.update({
      where: { id: data.id },
      data: { completed: data.completed },
    });
  });

/**
 * Delete a todo
 */
export const deleteTodo = createServerFn({ method: "POST" })
  .middleware([dbMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    return await context.db.todo.delete({
      where: { id: data.id },
    });
  });
