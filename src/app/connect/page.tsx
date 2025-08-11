import { loadPlugins, listConnectors } from "@/plugins/registry";
import { ConnectorConfigForm } from "@/components/plugins/ConnectorConfigForm";

let loaded = false;
async function fetchConnectors() {
  if (!loaded) {
    await loadPlugins();
    loaded = true;
  }
  // server-side fetch of list
  const connectors = listConnectors();
  return connectors.map(c => c.spec);
}

export default async function ConnectPage() {
  const specs = await fetchConnectors();

  async function testConnector(id: string, values: Record<string, any>) {
    "use server";
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/connectors/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, config: values }),
      cache: "no-store",
    });
    const json = await res.json();
    return json as { ok: boolean; error?: string };
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Connect a data source</h1>

      <div className="space-y-10">
        {specs.map((spec) => (
          <div key={spec.id} className="rounded-2xl border p-5">
            <ConnectorConfigForm
              spec={spec as any}
              onTest={testConnector.bind(null, spec.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
