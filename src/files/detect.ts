export type FileKind = "csv" | "parquet" | "text";

export function detectKindFromPath(path: string, fallback: FileKind = "text"): FileKind {
  const p = path.toLowerCase();
  if (p.endsWith(".csv")) return "csv";
  if (p.endsWith(".parquet") || p.endsWith(".pq")) return "parquet";
  if (p.endsWith(".txt") || p.endsWith(".log") || p.endsWith(".md")) return "text";
  return fallback;
}
