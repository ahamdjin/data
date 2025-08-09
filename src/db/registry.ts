// src/db/registry.ts
import type { DbAdapter } from './Adapter';
import { createPostgresAdapter } from './adapters/postgres';

const adapters = new Map<string, DbAdapter>();

export function registerAdapter(name: string, adapter: DbAdapter) {
  adapters.set(name, adapter);
}

export function getAdapter(name = 'default'): DbAdapter {
  const a = adapters.get(name);
  if (!a) throw new Error(`DB adapter '${name}' not registered`);
  return a;
}

function bootstrapFromEnv() {
  // Default
  const main = process.env.DATABASE_URL;
  if (main) registerAdapter('default', createPostgresAdapter(main));

  // Additional: DATABASE_URL_<NAME>=...
  for (const [k, v] of Object.entries(process.env)) {
    const m = /^DATABASE_URL_(.+)$/.exec(k);
    if (m && v) registerAdapter(m[1].toLowerCase(), createPostgresAdapter(v));
  }
}

bootstrapFromEnv();
