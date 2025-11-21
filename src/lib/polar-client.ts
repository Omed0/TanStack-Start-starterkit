import { Polar } from "@polar-sh/sdk";
import { getEnv } from "@/lib/env";

const env = getEnv();

export const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});
