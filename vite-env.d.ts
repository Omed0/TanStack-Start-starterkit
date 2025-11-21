/// <reference types="vite/client" />

import type { Env } from "./src/lib/env";

interface ImportMetaEnv extends Partial<Env> {}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
