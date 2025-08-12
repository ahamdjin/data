import type { PluginManifest, ConnectorSpec, ToolSpec, ConnectorFactory, ToolFactory } from "./types";
import { definePlugin } from "./define";

type LoadedConnector = { pluginId: string; spec: ConnectorSpec; create: ConnectorFactory };
type LoadedTool = { pluginId: string; spec: ToolSpec; create: ToolFactory };

const plugins: PluginManifest[] = [];
const connectors: Map<string, LoadedConnector> = new Map();
const tools: Map<string, LoadedTool> = new Map();

let loaded = false;
let loading: Promise<void> | null = null;

export function listPlugins() {
  return plugins.map(p => ({ id: p.id, displayName: p.displayName, version: p.version }));
}

export function listConnectors() {
  return Array.from(connectors.values()).map(c => ({ pluginId: c.pluginId, spec: c.spec }));
}

export function listTools() {
  return Array.from(tools.values()).map(t => ({ pluginId: t.pluginId, spec: t.spec }));
}

export function getConnector(id: string): LoadedConnector {
  const c = connectors.get(id);
  if (!c) throw new Error(`Connector '${id}' not found`);
  return c;
}

export function getTool(id: string): LoadedTool {
  const t = tools.get(id);
  if (!t) throw new Error(`Tool '${id}' not found`);
  return t;
}

/**
 * Discover manifests at build/runtime. We explicitly enumerate to keep it stable
 * for bundlers; you can add more entries below as you add plugins.
 */
export async function loadPlugins() {
  if (loaded) return;
  if (!loading) {
    loading = (async () => {
      // IMPORTANT: add any new plugin manifests here
      const manifests: PluginManifest[] = [];

      // Postgres basic plugin
      const pg = await import("./src__plugins__postgres-basic__manifest");
      manifests.push(definePlugin(pg.default));

      // Custom HTTP plugin
      const http = await import("./src__plugins__custom-http__manifest");
      manifests.push(definePlugin(http.default));

      const mongo = await import("./src__plugins__mongo__manifest");
      manifests.push(definePlugin(mongo.default));

      const fs = await import("./src__plugins__firestore__manifest");
      manifests.push(definePlugin(fs.default));

      const mysql = await import("./src__plugins__mysql__manifest");
      manifests.push(definePlugin(mysql.default));

      const sqlite = await import("./src__plugins__sqlite__manifest");
      manifests.push(definePlugin(sqlite.default));

      const bq = await import("./src__plugins__bigquery__manifest");
      manifests.push(definePlugin(bq.default));

      const snow = await import("./src__plugins__snowflake__manifest");
      manifests.push(definePlugin(snow.default));

      // Register
      for (const m of manifests) {
        plugins.push(m);
        for (const c of m.connectors) {
          if (connectors.has(c.spec.id)) throw new Error(`Duplicate connector id: ${c.spec.id}`);
          connectors.set(c.spec.id, { pluginId: m.id, spec: c.spec, create: c.create as any });
        }
        for (const t of m.tools) {
          if (tools.has(t.spec.id)) throw new Error(`Duplicate tool id: ${t.spec.id}`);
          tools.set(t.spec.id, { pluginId: m.id, spec: t.spec, create: t.create as any });
        }
      }
      loaded = true;
    })();
  }
  await loading;
}
