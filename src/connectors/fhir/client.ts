import { setTimeout as delay } from "node:timers/promises";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export type Auth =
  | { kind: "bearer"; token: string }
  | { kind: "basic"; username: string; password: string }
  | { kind: "none" };

export type FhirMode = "bulk" | "search";

export function authHeaders(a: Auth): Record<string,string> {
  if (a.kind === "bearer") return { Authorization: `Bearer ${a.token}` };
  if (a.kind === "basic") return { Authorization: `Basic ${Buffer.from(`${a.username}:${a.password}`).toString("base64")}` };
  return {};
}

export async function getJSON<T>(url: string, auth: Auth, extra?: Record<string,string>): Promise<T> {
  const r = await fetch(url, { headers: { Accept: "application/fhir+json", ...authHeaders(auth), ...(extra||{}) } });
  if (!r.ok) throw new Error(`GET ${url} ${r.status}`);
  return r.json() as Promise<T>;
}

export async function* ndjsonLines(res: Response): AsyncGenerator<string> {
  // Supports plain ndjson or gzip (content-encoding or .gz)
  let stream: any = res.body as any;
  const enc = res.headers.get("content-encoding");
  if (enc && enc.includes("gzip")) {
    const gunzip = createGunzip();
    await pipeline(Readable.from(stream), gunzip);
    stream = gunzip;
  }
  let buf = "";
  for await (const chunk of (stream as any)) {
    buf += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx+1);
      if (line) yield line;
    }
  }
  if (buf.trim()) yield buf.trim();
}

export async function startBulkExport(baseUrl: string, auth: Auth, scope: { level: "system"|"patient"|"group"; id?: string }, resourceTypes?: string[], since?: string) {
  const params = new URLSearchParams();
  if (resourceTypes?.length) params.set("_type", resourceTypes.join(","));
  if (since) params.set("_since", since);
  const url =
    scope.level === "system" ? `${baseUrl}/$export?${params}` :
    scope.level === "patient" ? `${baseUrl}/Patient/${scope.id}/$export?${params}` :
    `${baseUrl}/Group/${scope.id}/$export?${params}`;

  const r = await fetch(url, {
    method: "GET",
    headers: {
      ...authHeaders(auth),
      Accept: "application/fhir+json",
      Prefer: "respond-async",
    }
  });
  if (r.status !== 202) throw new Error(`$export expected 202, got ${r.status}`);
  const poll = r.headers.get("content-location");
  if (!poll) throw new Error("Missing Content-Location for $export");
  return { pollUrl: poll };
}

export async function pollBulkReady(pollUrl: string, auth: Auth, { maxWaitMs = 5 * 60_000, intervalMs = 2_000 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const r = await fetch(pollUrl, { headers: authHeaders(auth) });
    if (r.status === 200) return (await r.json()) as any; // should contain output urls
    if (r.status !== 202) throw new Error(`$export poll ${r.status}`);
    const ra = parseInt(r.headers.get("retry-after") || "0", 10);
    const wait = Number.isFinite(ra) && ra > 0 ? ra * 1000 : intervalMs;
    await delay(wait);
    if (Date.now() - t0 > maxWaitMs) throw new Error("Bulk export timed out");
  }
}

export async function* downloadBulkFiles(output: Array<{ type: string; url: string }>, auth: Auth) {
  for (const f of output) {
    const r = await fetch(f.url, { headers: authHeaders(auth) });
    if (!r.ok) throw new Error(`download ${f.url} ${r.status}`);
    yield { type: f.type, response: r };
  }
}
