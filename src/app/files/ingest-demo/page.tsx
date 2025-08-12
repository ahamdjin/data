"use client";
import * as React from "react";
import { apiFetch } from "@/lib/fetch";

export default function FilesIngestDemo() {
  const [connectorId, setConnectorId] = React.useState<"s3"|"gcs"|"azure-blob">("s3");
  const [datasetId, setDatasetId] = React.useState("");
  const [source, setSource] = React.useState("prefix/or/key.ext");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<any>(null);

  async function start() {
    const r = await apiFetch("/api/files/ingest", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectorId,
        config: {},
        source,
        datasetId,
        options: { bucket: "<your-bucket>", prefix: source, format: undefined },
        enqueueEmbed: true
      })
    });
    const j = await r.json();
    if (j.ok) setJobId(j.id); else alert(j.error);
  }

  React.useEffect(() => {
    let t: any;
    async function poll() {
      if (!jobId) return;
      const r = await apiFetch(`/api/jobs/${jobId}`);
      const j = await r.json();
      if (j.ok) setStatus(j.job);
      if (j.ok && (j.job.status === "completed" || j.job.status === "failed")) return;
      t = setTimeout(poll, 1200);
    }
    poll(); return () => clearTimeout(t);
  }, [jobId]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">File Ingest Demo</h1>
      <div className="space-y-2">
        <label className="text-sm">Connector</label>
        <select className="border rounded px-2 py-1 text-sm" value={connectorId} onChange={e => setConnectorId(e.target.value as any)}>
          <option value="s3">S3</option>
          <option value="gcs">GCS</option>
          <option value="azure-blob">Azure Blob</option>
        </select>
        <label className="text-sm">Dataset ID</label>
        <input className="w-full border rounded px-2 py-1 text-sm" value={datasetId} onChange={e => setDatasetId(e.target.value)} />
        <label className="text-sm">Source (prefix or object path)</label>
        <input className="w-full border rounded px-2 py-1 text-sm" value={source} onChange={e => setSource(e.target.value)} />
      </div>
      <button onClick={start} className="rounded bg-black text-white px-3 py-2 text-sm">Start</button>
      {jobId && (
        <div className="rounded border p-3 text-sm">
          <div>Job: <code>{jobId}</code></div>
          <div>Status: <b>{status?.status ?? "…"}</b> ({status?.progress ?? 0}%)</div>
          {status?.error && <div className="text-red-600">Error: {status.error}</div>}
        </div>
      )}
    </div>
  );
}
