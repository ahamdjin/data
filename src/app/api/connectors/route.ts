import { NextResponse } from "next/server";
import { loadPlugins, listConnectors } from "@/plugins/registry";

export async function GET() {
  await loadPlugins();
  const connectors = listConnectors();
  return NextResponse.json({ connectors });
}
