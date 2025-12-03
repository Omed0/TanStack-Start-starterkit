import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { SHARED_ENV_KEYS } from "./src/lib/env";
//import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Automatically expose all shared env vars to client
  const define = SHARED_ENV_KEYS.reduce((acc, key) => {
    acc[`import.meta.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {} as Record<string, string>);

  return {
    server: {
      port: 3000,
    },
    plugins: [
      tsconfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tanstackStart(),
      tailwindcss(),
      viteReact({
        babel: {
          plugins: [
            [
              "babel-plugin-react-compiler",
              {
                target: "19",
              },
            ],
          ],
        },
      }),
      //cloudflare(), // this on development causes issues
    ],
    define,
    //ssr: {
    //  noExternal: ['@prisma/client'],
    //  external: [
    //    '@prisma/client',
    //    '.prisma/client',
    //    '@omed0/infra-kit',
    //    'ioredis',
    //    'bullmq',
    //    'minio'
    //  ],
    //},
    //optimizeDeps: {
    //  exclude: [
    //    '@prisma/client',
    //    '.prisma/client',
    //    '@omed0/infra-kit',
    //    'ioredis',
    //    'bullmq',
    //    'minio'
    //  ],
    //},
  };
});
