import { useEffect, useState } from "react";

export function useConnectors() {
  const [data, setData] = useState<{ pluginId: string; spec: any }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/connectors");
        const j = await r.json();
        setData(j.connectors);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load connectors");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}
