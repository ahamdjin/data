"use client";
import * as React from "react";
import { apiFetch } from "@/lib/fetch";

export default function IngestDemo() {
  const [connectorId, setConnectorId] = React.useState("postgres-basic");
  const [config, setConfig] = React.useState<any>({ databaseName: "default" });
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<any>(null);

  async function start() {
    const r = await apiFetch("/api/jobs/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectorId, config, source: "default" }),
    });
    const j = await r.json();
    if (j.ok) setJobId(j.id);
    else alert(j.error);
  }

  React.useEffect(() => {
    let t: any;
    async function poll() {
      if (!jobId) return;
      const r = await apiFetch(`/api/jobs/${jobId}`);
      const j = await r.json();
      if (j.ok) setStatus(j.job);
      if (j.ok && (j.job.status === "completed" || j.job.status === "failed")) return;
      t = setTimeout(poll, 1000);
    }
    poll();
    return () => clearTimeout(t);
  }, [jobId]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Ingest Demo</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Connector ID</label>
        <input className="w-full rounded border px-2 py-1 text-sm" value={connectorId} onChange={(e)=>setConnectorId(e.target.value)} />
      </div>

      <button onClick={start} className="rounded bg-black text-white px-3 py-2 text-sm">Start ingest</button>

      {jobId && (
        <div className="rounded border p-3 text-sm">
          <div>Job: <code>{jobId}</code></div>
          <div>Status: <b>{status?.status ?? "…"}</b> ({status?.progress ?? 0}%)</div>
          {status?.error && <div className="text-red-600">Error: {status.error}</div>}
          {status?.result && <pre className="bg-gray-50 rounded p-2 mt-2">{JSON.stringify(status.result, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}
