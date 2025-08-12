"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/fetch";

export default function EmbedDatasetPage() {
  const params = useParams<{ id: string }>();
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<any>(null);

  async function start() {
    const r = await apiFetch(`/api/datasets/${params.id}/embed`, { method: "POST" });
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
    poll();
    return () => clearTimeout(t);
  }, [jobId]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Embed dataset</h1>
      <button onClick={start} className="rounded bg-black text-white px-3 py-2 text-sm">Start embedding</button>
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
