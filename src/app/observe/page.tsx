"use client";
import * as React from "react";

export default function Observe() {
  const [logs, setLogs] = React.useState<string[]>([]);
  const [traces, setTraces] = React.useState<any[]>([]);
  const [audits, setAudits] = React.useState<any[]>([]);

  async function loadAudits() {
    const r = await fetch("/api/audit/recent");
    const j = await r.json();
    if (j.ok) setAudits(j.items);
  }

  React.useEffect(() => {
    loadAudits();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">Observe (dev)</h1>
      <p className="text-sm text-gray-600">Wire your log shipper/OTEL backend in prod.</p>

      <div className="space-y-2">
        <h2 className="font-medium">Recent audits</h2>
        <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto">{JSON.stringify(audits, null, 2)}</pre>
      </div>
    </div>
  );
}
