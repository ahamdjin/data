import type { DbAdapter } from './Adapter';
import { createPostgresAdapter } from './adapters/postgres';

const adapters = new Map<string, DbAdapter>();

export function registerAdapter(name: string, adapter: DbAdapter) {
  adapters.set(name, adapter);
}

export function getAdapter(name: string = 'default'): DbAdapter {
  const adapter = adapters.get(name);
  if (!adapter) throw new Error(`Adapter '${name}' not found`);
  return adapter;
}

function bootstrap() {
  const { DATABASE_URL, ...env } = process.env as Record<string, string | undefined>;
  if (DATABASE_URL) {
    registerAdapter('default', createPostgresAdapter(DATABASE_URL));
  }
  // Load additional databases from DATABASE_URL_<NAME>
  for (const key in env) {
    const match = key.match(/^DATABASE_URL_(.+)$/);
    const url = env[key];
    if (match && url) {
      registerAdapter(match[1].toLowerCase(), createPostgresAdapter(url));
    }
  }
}

bootstrap();
