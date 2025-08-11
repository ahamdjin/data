import type { PluginManifest } from "./types";
import { PluginManifestZ } from "./types";

export function definePlugin(manifest: PluginManifest): PluginManifest {
  // runtime validation guard
  const parsed = PluginManifestZ.parse(manifest);
  return parsed;
}
