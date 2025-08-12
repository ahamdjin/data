export type FileKind = "csv" | "parquet" | "text" | "pdf" | "docx" | "html" | "image";

export function detectKindFromPath(path: string, fallback: FileKind = "text"): FileKind {
  const p = path.toLowerCase();
  if (p.endsWith(".csv")) return "csv";
  if (p.endsWith(".parquet") || p.endsWith(".pq")) return "parquet";
  if (p.endsWith(".pdf")) return "pdf";
  if (p.endsWith(".docx")) return "docx";
  if (p.endsWith(".htm") || p.endsWith(".html")) return "html";
  if (/\.(png|jpg|jpeg|webp|tif|tiff)$/.test(p)) return "image";
  if (p.endsWith(".txt") || p.endsWith(".log") || p.endsWith(".md")) return "text";
  return fallback;
}
