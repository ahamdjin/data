import { NextResponse } from "next/server";
import { loadPlugins, listConnectors } from "@/plugins/registry";

let loaded = false;

async function ensureLoaded() {
  if (!loaded) {
    await loadPlugins();
    loaded = true;
  }
}

export async function GET() {
  await ensureLoaded();
  const connectors = listConnectors();
  return NextResponse.json({ connectors });
}
