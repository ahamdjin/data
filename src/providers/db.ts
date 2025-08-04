import postgres, { Sql } from 'postgres';

// Map of named database connections. The default connection is referenced by
// the key "default". Additional databases can be configured via environment
// variables following the pattern `DATABASE_URL_<NAME>`.
const connections: Record<string, Sql> = {};

function register(name: string, url: string) {
  connections[name] = postgres(url);
}

// Default database used throughout the app and by Prisma
if (process.env.DATABASE_URL) {
  register('default', process.env.DATABASE_URL);
}

// Additional databases, e.g. DATABASE_URL_ANALYTICS, DATABASE_URL_BILLING
for (const [key, value] of Object.entries(process.env)) {
  const match = key.match(/^DATABASE_URL_(.+)$/);
  if (match && typeof value === 'string') {
    register(match[1].toLowerCase(), value);
  }
}

/**
 * Retrieve a postgres client for the specified database. If no name is
 * provided the default connection is returned.
 */
export function getDb(name = 'default'): Sql {
  const db = connections[name];
  if (!db) {
    throw new Error(`Database connection '${name}' is not configured`);
  }
  return db;
}

// Backwards compatibility: export the default connection as `sql`
export const sql: Sql | undefined = connections['default'];

