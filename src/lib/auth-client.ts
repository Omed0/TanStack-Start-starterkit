import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/client";
import { polarClient } from "@polar-sh/better-auth";
import type { auth } from "@/lib/auth";
import { getEnv } from "@/lib/env";

const env = getEnv();

export const authClient = createAuthClient({
  baseURL: env.AUTH_BASE_URL,
  plugins: [inferAdditionalFields<typeof auth>(), polarClient(), adminClient()],
});
