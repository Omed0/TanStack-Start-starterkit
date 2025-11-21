import "dotenv/config";
import { defineConfig, env, type PrismaConfig } from "prisma/config";
import path from "node:path";

export default defineConfig({
  schema: path.join("src", "prisma", "schema"),
  migrations: {
    path: path.join("src", "prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
}) satisfies PrismaConfig;
