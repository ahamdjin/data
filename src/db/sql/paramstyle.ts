/**
 * Translate Postgres-style $1, $2, ... placeholders to '?' for drivers like mysql2/libsql.
 * Keeps order of params and strips casts like '::text' safely (basic pass).
 */
export function toQuestionParams(sql: string, params: readonly unknown[] = []): { q: string; args: unknown[] } {
  // Replace $1..$99 with '?'
  const q = sql.replace(/\$(\d{1,2})/g, (_m, n) => {
    const idx = Number(n);
    if (!Number.isInteger(idx) || idx < 1 || idx > params.length) return "?";
    return "?";
  }).replace(/::\w+/g, ""); // best-effort cast removal
  return { q, args: [...params] };
}
