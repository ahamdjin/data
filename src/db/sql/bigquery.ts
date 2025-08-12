/**
 * Convert $1,$2,... to BigQuery named params @p1,@p2,... and build params object.
 * We don't infer types; BigQuery infers for strings/numbers/bools. For advanced types,
 * use explicit struct in SQL.
 */
export function toBqNamedParams(sql: string, params: readonly unknown[] = []) {
  let q = sql.replace(/\$(\d{1,2})/g, (_m, n) => `@p${Number(n)}`);
  q = q.replace(/::\w+/g, ""); // strip simple casts from PG-style SQL
  const named: Record<string, unknown> = {};
  params.forEach((v, i) => { named[`p${i + 1}`] = v; });
  return { q, named };
}
