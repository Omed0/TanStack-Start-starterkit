import { getEnv } from "@/lib/env";
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = getEnv().DATABASE_URL;
let prisma: PrismaClient;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });

prisma = new PrismaClient({ adapter });

export default prisma;
