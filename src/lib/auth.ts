import { reactStartCookies } from "better-auth/react-start";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
//import { polar, checkout } from "@polar-sh/better-auth";
//import { polarClient } from "@/lib/polar-client";
import { getEnv } from "@/lib/env";
import prisma from "@/prisma";
import { cache as secStorage } from "@/lib/redis";
import {
  admin,
  //organization,
  haveIBeenPwned,
} from "better-auth/plugins";

const env = getEnv();

const authOptions = {
  baseURL: env.AUTH_BASE_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  secondaryStorage: {
    get(key) {
      return secStorage.get(key);
    },
    set(key, value) {
      return secStorage.set(key, value);
    },
    delete(key) {
      secStorage.delete(key);
    },
  },
  rateLimit: {
    window: 10, // time in milliseconds
    max: 100, // max requests per millisecond window
    storage: "secondary-storage",
    //customRules: {
    //  "/sign-in/email": {
    //    window: 60,
    //    max: 4,
    //  },
    //},
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 10, // 10 minutes
    },
    storeSessionInDatabase: true,
  },
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "Strict",
      secure: env.NODE_ENV === "production",
      httpOnly: env.NODE_ENV === "production",
      partitioned: true,
    },
  },
  plugins: [admin(), haveIBeenPwned()],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...authOptions,
  plugins: [
    ...(authOptions.plugins ?? []),
    //polar({
    //  client: polarClient,
    //  createCustomerOnSignUp: true,
    //  enableCustomerPortal: false,
    //  use: [
    //    checkout({
    //      products: [
    //        {
    //          productId: "79d081af-511e-4995-8b09-bcaebeab0263",
    //          slug: "pro",
    //        },
    //      ],
    //      successUrl: env.POLAR_SUCCESS_URL!,
    //      authenticatedUsersOnly: true,
    //    }),
    //    //portal(),
    //  ],
    //}),
    reactStartCookies(),
  ],
});
